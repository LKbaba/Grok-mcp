/**
 * Grok API Client
 *
 * Uses native fetch to call xAI Responses API
 * Native fetch (undici) automatically reads HTTPS_PROXY env var, no extra proxy config needed
 */

import type {
  XAIResponsesRequest,
  XAIResponsesResponse,
  XAIWebSearchTool,
  XAIXSearchTool,
} from '../types/index.js';
import { xaiConfig, debugMode } from '../config/index.js';

// ============================================================================
// Core API Methods
// ============================================================================

/**
 * Call xAI Responses API
 *
 * @param request - API request parameters
 * @returns API response
 */
export async function createResponse(
  request: Omit<XAIResponsesRequest, 'stream'>
): Promise<XAIResponsesResponse> {
  const url = `${xaiConfig.baseURL}/responses`;

  const body: Record<string, unknown> = {
    model: request.model,
    input: request.messages,
    stream: false,
  };

  if (request.temperature !== undefined) {
    body.temperature = request.temperature;
  }

  if (request.server_side_tools) {
    body.tools = request.server_side_tools;
  }

  if (debugMode) {
    console.error('[Grok Client] Sending request:', JSON.stringify(body, null, 2));
  }

  // Retry logic: up to 3 attempts
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), xaiConfig.timeout);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${xaiConfig.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API request failed (${res.status}): ${errorText}`);
      }

      const response = await res.json() as XAIResponsesResponse;

      if (debugMode) {
        console.error('[Grok Client] Received response:', JSON.stringify(response, null, 2));
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // If timeout or network error, wait and retry
      if (attempt < 2 && (
        lastError.name === 'AbortError' ||
        lastError.message.includes('fetch failed') ||
        lastError.message.includes('ECONNRESET')
      )) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s
        if (debugMode) {
          console.error(`[Grok Client] Retry attempt ${attempt + 1}, waiting ${delay}ms...`);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      break;
    }
  }

  console.error('[Grok Client] API call failed:', lastError);
  throw lastError;
}

// ============================================================================
// Helper Methods
// ============================================================================

/**
 * Extract text content from response
 *
 * @param response - API response
 * @returns Text content
 */
export function extractContent(response: XAIResponsesResponse): string {
  // Output array may contain web_search_call, x_search_call, etc. — find the message type
  const messageOutput = response.output?.find(item => item.type === 'message');
  if (!messageOutput) {
    throw new Error('Invalid response structure: missing message type output');
  }

  const content = messageOutput.content?.[0];
  if (!content || content.type !== 'output_text') {
    throw new Error('Invalid response structure: missing output_text type content');
  }

  return content.text;
}

/**
 * Extract citation URLs from text
 *
 * xAI citation format: [[1]](https://example.com)
 *
 * @param text - Text containing citations
 * @returns Deduplicated citation URL array
 */
export function extractCitations(text: string): string[] {
  const citationRegex = /\[\[(\d+)\]\]\((https?:\/\/[^\)]+)\)/g;
  const citations: string[] = [];
  let match;

  while ((match = citationRegex.exec(text)) !== null) {
    citations.push(match[2]); // Extract URL
  }

  // Deduplicate and return
  return [...new Set(citations)];
}

/**
 * Extract token usage statistics
 *
 * @param response - API response
 * @returns Token usage statistics object
 */
export function extractUsage(response: XAIResponsesResponse) {
  const usage = response.usage;

  return {
    input_tokens: usage.input_tokens,
    output_tokens: usage.output_tokens,
    reasoning_tokens: usage.output_tokens_details?.reasoning_tokens || 0,
    cached_tokens: usage.input_tokens_details?.cached_tokens || 0,
    total_tokens: usage.total_tokens,
    web_search_calls: usage.server_side_tool_usage_details?.web_search_calls || 0,
    x_search_calls: usage.server_side_tool_usage_details?.x_search_calls || 0,
  };
}

/**
 * Calculate API call cost
 *
 * @param response - API response
 * @returns Cost in USD
 */
export function calculateCost(response: XAIResponsesResponse): number {
  const costInTicks = response.usage.cost_in_usd_ticks;
  // 1 tick = 0.0000000001 USD
  // i.e. 10,000,000,000 ticks = 1 USD
  return costInTicks / 10_000_000_000;
}
