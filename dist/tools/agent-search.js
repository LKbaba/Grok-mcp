/**
 * grok_agent_search Tool Implementation
 *
 * Intelligent search using Grok AI, supports Web search, X search, or mixed search
 */
import { createResponse, extractContent, extractCitations, extractUsage, calculateCost, extractSearchQueries, extractSources, } from '../utils/grok-client.js';
import { buildWebSearchTool, buildXSearchTool, } from '../utils/tool-builder.js';
import { xaiConfig, debugMode, SUPPORTED_MODELS } from '../config/index.js';
/**
 * Validate model name is supported
 */
function resolveModel(model) {
    if (!model)
        return xaiConfig.defaultModel;
    if (SUPPORTED_MODELS.includes(model))
        return model;
    // Unsupported model, fall back to default with warning
    console.error(`[Agent Search] Unsupported model "${model}", falling back to default ${xaiConfig.defaultModel}`);
    return xaiConfig.defaultModel;
}
/**
 * grok_agent_search main function
 *
 * @param input - Search input parameters
 * @returns Search result
 */
export async function grokAgentSearch(input) {
    try {
        // search_type defaults to mixed (search both Web and X)
        const searchType = input.search_type || 'mixed';
        const model = resolveModel(input.model);
        const outputFormat = input.output_format || 'text';
        if (debugMode) {
            console.error('[Agent Search] Starting search:', input.query);
            console.error('[Agent Search] Search type:', searchType);
            console.error('[Agent Search] Model:', model);
            console.error('[Agent Search] Output format:', outputFormat);
        }
        // 1. Build tool list based on search_type
        const tools = [];
        if (searchType === 'web' || searchType === 'mixed') {
            // Build Web Search tool
            const webTool = buildWebSearchTool({
                allowedDomains: input.web_search_config?.allowed_domains,
                excludedDomains: input.web_search_config?.excluded_domains,
                enableImageUnderstanding: input.web_search_config?.enable_image_understanding,
            });
            tools.push(webTool);
            if (debugMode) {
                console.error('[Agent Search] Added Web Search tool');
            }
        }
        if (searchType === 'x' || searchType === 'mixed') {
            // Build X Search tool
            const xTool = buildXSearchTool({
                fromDate: input.x_search_config?.from_date,
                toDate: input.x_search_config?.to_date,
                allowedXHandles: input.x_search_config?.allowed_x_handles,
                excludedXHandles: input.x_search_config?.excluded_x_handles,
                enableImageUnderstanding: input.x_search_config?.enable_image_understanding,
                enableVideoUnderstanding: input.x_search_config?.enable_video_understanding,
            });
            tools.push(xTool);
            if (debugMode) {
                console.error('[Agent Search] Added X Search tool');
            }
        }
        if (tools.length === 0) {
            throw new Error('At least one search type must be specified (web, x, or mixed)');
        }
        // 2. Build messages with system prompt for citation guidance
        const messages = [
            {
                role: 'system',
                content: 'You are a research assistant with access to web and X (Twitter) search. ' +
                    'When answering: 1. Cite sources with inline links ' +
                    '2. Clearly distinguish facts from analysis ' +
                    '3. Synthesize information from multiple sources when relevant',
            },
            { role: 'user', content: input.query },
        ];
        // 3. Build JSON Schema for structured output (if requested)
        const textFormat = outputFormat === 'json' ? {
            type: 'json_schema',
            name: 'search_result',
            schema: {
                type: 'object',
                properties: {
                    summary: { type: 'string' },
                    results: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                title: { type: 'string' },
                                content: { type: 'string' },
                                source: { type: 'string' },
                            },
                            required: ['title', 'content', 'source'],
                            additionalProperties: false,
                        },
                    },
                    key_findings: { type: 'array', items: { type: 'string' } },
                },
                required: ['summary', 'results', 'key_findings'],
                additionalProperties: false,
            },
            strict: true,
        } : undefined;
        // 4. Call Grok API
        if (debugMode) {
            console.error('[Agent Search] Calling Grok API...');
        }
        const response = await createResponse({
            model,
            messages,
            server_side_tools: tools,
            temperature: 0.6, // Fixed: search needs factual accuracy
            ...(textFormat ? { text: { format: textFormat } } : {}),
        });
        // 5. Extract results
        const content = extractContent(response);
        const searchQueries = extractSearchQueries(response);
        const sources = extractSources(response);
        const citations = extractCitations(content);
        const usage = extractUsage(response);
        const cost = calculateCost(response);
        if (debugMode) {
            console.error('[Agent Search] Search completed');
            console.error('[Agent Search] Model:', model);
            console.error('[Agent Search] Search queries:', searchQueries);
            console.error('[Agent Search] Sources:', sources.length);
            console.error('[Agent Search] Citations (fallback):', citations.length);
            console.error('[Agent Search] Token usage:', usage.total_tokens);
            console.error('[Agent Search] Cost:', `$${cost.toFixed(6)}`);
        }
        // 6. Return result
        return {
            content,
            searchQueries,
            sources,
            citations,
            usage,
        };
    }
    catch (error) {
        // Error handling
        if (error instanceof Error) {
            console.error('[Agent Search] Search failed:', error.message);
            // Timeout error
            if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
                throw new Error(`Search timed out. Suggestions:\n` +
                    `1. Simplify the query\n` +
                    `2. Narrow the search scope\n` +
                    `3. Try again later\n` +
                    `Original error: ${error.message}`);
            }
            // API error
            if (error.message.includes('API') || error.message.includes('401')) {
                throw new Error(`API call failed. Please check:\n` +
                    `1. Is XAI_API_KEY configured correctly?\n` +
                    `2. Is the API key valid?\n` +
                    `3. Is the network connection working?\n` +
                    `Original error: ${error.message}`);
            }
            // Parameter validation error
            if (error.message.includes('validation failed')) {
                throw new Error(`Parameter validation failed: ${error.message}`);
            }
            // Other errors
            throw new Error(`Search failed: ${error.message}`);
        }
        throw error;
    }
}
//# sourceMappingURL=agent-search.js.map