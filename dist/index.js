#!/usr/bin/env node
/**
 * Grok-MCP Entry Point
 * MCP protocol-based Grok API service
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { mcpConfig } from './config/index.js';
import { TOOL_DEFINITIONS } from './tools/definitions.js';
import { grokAgentSearch } from './tools/agent-search.js';
import { grokBrainstorm } from './tools/brainstorm.js';
import { logger, startPerformanceMonitor } from './utils/logger.js';
// ============================================================================
// MCP Server Initialization
// ============================================================================
/**
 * Create MCP server instance
 */
const server = new Server({
    name: mcpConfig.name,
    version: mcpConfig.version,
}, {
    capabilities: {
        tools: {},
    },
});
// ============================================================================
// Request Handlers
// ============================================================================
/**
 * Handle tools/list request
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.debug('Received tools/list request');
    return { tools: TOOL_DEFINITIONS };
});
/**
 * Handle tools/call request
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    logger.info(`Received tool call: ${name}`);
    logger.debug('Tool arguments', args);
    // Start performance monitoring
    const monitor = startPerformanceMonitor(`Tool call: ${name}`);
    try {
        switch (name) {
            case 'grok_agent_search': {
                // Call grok_agent_search tool
                const input = args;
                const result = await grokAgentSearch(input);
                // Record performance and usage stats
                const duration = monitor.end({
                    tokens: result.usage.total_tokens,
                    citations: result.citations.length,
                });
                // Format output
                let output = `# Search Results\n\n${result.content}\n\n`;
                // Search queries (what Grok actually searched)
                if (result.searchQueries.length > 0) {
                    output += `## Search Queries\n\n`;
                    result.searchQueries.forEach((q) => {
                        output += `- ${q}\n`;
                    });
                    output += `\n`;
                }
                // Sources with titles (from annotations), fallback to raw citation URLs
                if (result.sources.length > 0) {
                    output += `## Sources\n\n`;
                    result.sources.forEach((source, index) => {
                        output += `${index + 1}. [${source.title}](${source.url})\n`;
                    });
                    output += `\n`;
                }
                else if (result.citations.length > 0) {
                    output += `## Citations\n\n`;
                    result.citations.forEach((url, index) => {
                        output += `${index + 1}. ${url}\n`;
                    });
                    output += `\n`;
                }
                output += `## Usage Statistics\n\n`;
                output += `- Model: ${input.model || 'grok-4.20-multi-agent-beta-0309'}\n`;
                output += `- Input Tokens: ${result.usage.input_tokens}\n`;
                output += `- Output Tokens: ${result.usage.output_tokens}\n`;
                output += `- Reasoning Tokens: ${result.usage.reasoning_tokens}\n`;
                output += `- Total Tokens: ${result.usage.total_tokens}\n`;
                output += `- Web Search Calls: ${result.usage.web_search_calls}\n`;
                output += `- X Search Calls: ${result.usage.x_search_calls}\n`;
                output += `- Duration: ${duration}ms\n`;
                logger.info(`Search completed in ${duration}ms`);
                return {
                    content: [
                        {
                            type: 'text',
                            text: output,
                        },
                    ],
                };
            }
            case 'grok_brainstorm': {
                // Call grok_brainstorm tool
                const input = args;
                const result = await grokBrainstorm(input);
                // Record performance and usage stats
                const duration = monitor.end({
                    tokens: result.usage.total_tokens,
                });
                // Format output
                let output = `# Brainstorm Results\n\n`;
                output += `**Topic**: ${input.topic}\n`;
                output += `**Style**: ${input.style || 'balanced'} | **Count**: ${input.count || 5}\n\n`;
                if (input.context) {
                    output += `**Context**: ${input.context}\n\n`;
                }
                if (input.context_files && input.context_files.length > 0) {
                    output += `**Reference Files**: ${input.context_files.join(', ')}\n\n`;
                }
                output += `---\n\n${result.content}\n\n`;
                output += `---\n\n## Usage Statistics\n\n`;
                output += `- Model: ${input.model || 'grok-4.20-multi-agent-beta-0309'}\n`;
                output += `- Input Tokens: ${result.usage.input_tokens}\n`;
                output += `- Output Tokens: ${result.usage.output_tokens}\n`;
                output += `- Reasoning Tokens: ${result.usage.reasoning_tokens}\n`;
                output += `- Total Tokens: ${result.usage.total_tokens}\n`;
                output += `- Duration: ${duration}ms\n`;
                logger.info(`Brainstorm completed in ${duration}ms`);
                return {
                    content: [
                        {
                            type: 'text',
                            text: output,
                        },
                    ],
                };
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
        logger.error(`Tool call failed: ${name}`, error);
        throw error;
    }
});
// ============================================================================
// Server Startup
// ============================================================================
/**
 * Start MCP server
 */
async function main() {
    try {
        // Setup proxy for Node.js fetch (required for users behind proxy/VPN)
        const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.https_proxy || process.env.http_proxy;
        if (proxyUrl) {
            try {
                // @ts-ignore -- undici is bundled with Node.js, no need for explicit dependency
                const undici = await import('undici');
                undici.setGlobalDispatcher(new undici.ProxyAgent(proxyUrl));
                logger.info(`Proxy configured: ${proxyUrl}`);
            }
            catch {
                logger.error('Failed to configure proxy. Install undici if needed: npm install undici');
            }
        }
        logger.info('Starting Grok-MCP server...');
        logger.info(`Service name: ${mcpConfig.name}`);
        logger.info(`Service version: ${mcpConfig.version}`);
        const transport = new StdioServerTransport();
        await server.connect(transport);
        logger.info('Grok-MCP server started');
        logger.info('Waiting for client connection...');
    }
    catch (error) {
        logger.error('Server startup failed', error);
        process.exit(1);
    }
}
// ============================================================================
// Error Handling
// ============================================================================
/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', error);
    process.exit(1);
});
/**
 * Handle unhandled promise rejections
 * Only log the error, do not exit — a single request failure should not terminate the MCP server
 */
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled promise rejection', reason);
});
/**
 * Handle process termination signals
 */
process.on('SIGINT', () => {
    logger.info('Received SIGINT, shutting down server...');
    process.exit(0);
});
process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, shutting down server...');
    process.exit(0);
});
// Start server
main();
//# sourceMappingURL=index.js.map