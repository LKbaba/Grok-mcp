/**
 * Grok API Client
 *
 * Uses native fetch to call xAI Responses API
 * Proxy support is configured globally in index.ts via undici ProxyAgent
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

  // Native JSON Schema structured output
  if (request.text) {
    body.text = request.text;
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

      // 仅对瞬时网络错误重试；超时(AbortError)不重试
      // 原因：multi-agent 慢请求重试仍会慢，重试只会 N 倍浪费时间并更晚失败
      if (attempt < 2 && (
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

/**
 * Extract search queries from response output array
 *
 * Grok's output contains web_search_call/x_search_call entries
 * that record the actual search keywords Grok used.
 *
 * @param response - API response
 * @returns Array of search query strings
 */
export function extractSearchQueries(response: XAIResponsesResponse): string[] {
  const queries: string[] = [];

  for (const item of response.output) {
    if (
      (item.type === 'web_search_call' || item.type === 'x_search_call') &&
      item.action?.query
    ) {
      queries.push(item.action.query);
    }
  }

  return queries;
}

/**
 * Generate a readable title from a URL when no real title is available.
 * e.g. "https://www.anthropic.com/news/claude-opus-4-6" → "Claude Opus 4 6 — anthropic.com"
 * e.g. "https://x.com/xai/status/123456" → "@xai — x.com"
 */
function titleFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const domain = parsed.hostname.replace(/^www\./, '');
    const segments = parsed.pathname.split('/').filter(Boolean);

    // Special handling for X/Twitter URLs: extract @handle
    if (domain === 'x.com' || domain === 'twitter.com') {
      const handle = segments[0];
      if (handle && handle !== 'i') {
        return `@${handle} — ${domain}`;
      }
      return domain;
    }

    // General: take the last meaningful path segment
    const last = segments[segments.length - 1];

    if (last) {
      // Convert slug to readable text: "claude-code-best-practices" → "Claude Code Best Practices"
      const readable = decodeURIComponent(last)
        .replace(/[-_]/g, ' ')
        .replace(/\.\w+$/, '') // strip file extension
        .replace(/\b\w/g, c => c.toUpperCase());
      return `${readable} — ${domain}`;
    }

    return domain;
  } catch {
    return url;
  }
}

/**
 * Check if a title from annotations is actually useful (not just a citation index)
 */
function isUsefulTitle(title: string | undefined): boolean {
  if (!title) return false;
  // Reject pure numbers ("1", "2"), very short strings, or bracketed numbers ("[1]")
  if (/^\[?\d+\]?$/.test(title.trim())) return false;
  if (title.trim().length < 3) return false;
  return true;
}

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
export function extractSources(response: XAIResponsesResponse): Array<{ title: string; url: string }> {
  const seen = new Set<string>();
  const sources: Array<{ title: string; url: string }> = [];

  const messageOutput = response.output?.find(item => item.type === 'message');
  if (!messageOutput?.content) return sources;

  for (const contentItem of messageOutput.content) {
    if (contentItem.type === 'output_text' && contentItem.annotations) {
      for (const annotation of contentItem.annotations) {
        if (annotation.url && !seen.has(annotation.url)) {
          seen.add(annotation.url);
          sources.push({
            title: isUsefulTitle(annotation.title) ? annotation.title! : titleFromUrl(annotation.url),
            url: annotation.url,
          });
        }
      }
    }
  }

  return sources;
}
