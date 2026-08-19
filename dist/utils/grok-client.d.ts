/**
 * Grok API Client
 *
 * Uses native fetch to call xAI Responses API
 * Proxy support is configured globally in index.ts via undici ProxyAgent
 */
import type { XAIResponsesRequest, XAIResponsesResponse } from '../types/index.js';
/**
 * Call xAI Responses API
 *
 * @param request - API request parameters
 * @returns API response
 */
export declare function createResponse(request: Omit<XAIResponsesRequest, 'stream'>): Promise<XAIResponsesResponse>;
/**
 * Extract text content from response
 *
 * @param response - API response
 * @returns Text content
 */
export declare function extractContent(response: XAIResponsesResponse): string;
/**
 * Extract citation URLs from text
 *
 * xAI citation format: [[1]](https://example.com)
 *
 * @param text - Text containing citations
 * @returns Deduplicated citation URL array
 */
export declare function extractCitations(text: string): string[];
/**
 * Extract token usage statistics
 *
 * @param response - API response
 * @returns Token usage statistics object
 */
export declare function extractUsage(response: XAIResponsesResponse): {
    input_tokens: number;
    output_tokens: number;
    reasoning_tokens: number;
    cached_tokens: number;
    total_tokens: number;
    web_search_calls: number;
    x_search_calls: number;
};
/**
 * Calculate API call cost
 *
 * @param response - API response
 * @returns Cost in USD
 */
export declare function calculateCost(response: XAIResponsesResponse): number;
/**
 * Extract search queries from response output array
 *
 * Grok's output contains web_search_call/x_search_call entries
 * that record the actual search keywords Grok used.
 *
 * @param response - API response
 * @returns Array of search query strings
 */
export declare function extractSearchQueries(response: XAIResponsesResponse): string[];
/**
 * Extract sources with titles from annotations
 *
 * xAI annotations contain url and title for each citation,
 * providing richer source info than regex-extracted URLs.
 * When title is missing or just a citation index, generates a readable title from URL.
 *
 * @param response - API response
 * @returns Deduplicated array of { title, url } objects
 */
export declare function extractSources(response: XAIResponsesResponse): Array<{
    title: string;
    url: string;
}>;
//# sourceMappingURL=grok-client.d.ts.map