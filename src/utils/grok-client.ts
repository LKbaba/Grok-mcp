/**
 * Grok API 客户端
 *
 * 使用原生 fetch 调用 xAI Responses API
 * 原生 fetch (undici) 自动读取 HTTPS_PROXY 环境变量，无需额外代理配置
 */

import type {
  XAIResponsesRequest,
  XAIResponsesResponse,
  XAIWebSearchTool,
  XAIXSearchTool,
} from '../types/index.js';
import { xaiConfig, debugMode } from '../config/index.js';

// ============================================================================
// 核心 API 方法
// ============================================================================

/**
 * 调用 xAI Responses API
 *
 * @param request - API 请求参数
 * @returns API 响应
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
    console.error('[Grok Client] 发送请求:', JSON.stringify(body, null, 2));
  }

  // 重试逻辑：最多重试 3 次
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
        throw new Error(`API 请求失败 (${res.status}): ${errorText}`);
      }

      const response = await res.json() as XAIResponsesResponse;

      if (debugMode) {
        console.error('[Grok Client] 收到响应:', JSON.stringify(response, null, 2));
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // 如果是超时或网络错误，等待后重试
      if (attempt < 2 && (
        lastError.name === 'AbortError' ||
        lastError.message.includes('fetch failed') ||
        lastError.message.includes('ECONNRESET')
      )) {
        const delay = Math.pow(2, attempt) * 1000; // 指数退避：1s, 2s
        if (debugMode) {
          console.error(`[Grok Client] 第 ${attempt + 1} 次重试，等待 ${delay}ms...`);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      break;
    }
  }

  console.error('[Grok Client] API 调用失败:', lastError);
  throw lastError;
}

// ============================================================================
// 辅助方法
// ============================================================================

/**
 * 从响应中提取文本内容
 *
 * @param response - API 响应
 * @returns 文本内容
 */
export function extractContent(response: XAIResponsesResponse): string {
  // output 数组可能包含 web_search_call、x_search_call 等，需要找到 message 类型
  const messageOutput = response.output?.find(item => item.type === 'message');
  if (!messageOutput) {
    throw new Error('响应结构无效：缺少 message 类型的输出');
  }

  const content = messageOutput.content?.[0];
  if (!content || content.type !== 'output_text') {
    throw new Error('响应结构无效：缺少 output_text 类型的内容');
  }

  return content.text;
}

/**
 * 从文本中提取引用 URL
 *
 * xAI 的引用格式：[[1]](https://example.com)
 *
 * @param text - 包含引用的文本
 * @returns 引用 URL 数组（去重）
 */
export function extractCitations(text: string): string[] {
  const citationRegex = /\[\[(\d+)\]\]\((https?:\/\/[^\)]+)\)/g;
  const citations: string[] = [];
  let match;

  while ((match = citationRegex.exec(text)) !== null) {
    citations.push(match[2]); // 提取 URL
  }

  // 去重并返回
  return [...new Set(citations)];
}

/**
 * 提取 Token 使用统计
 *
 * @param response - API 响应
 * @returns Token 使用统计对象
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
 * 计算 API 调用成本
 *
 * @param response - API 响应
 * @returns 成本（美元）
 */
export function calculateCost(response: XAIResponsesResponse): number {
  const costInTicks = response.usage.cost_in_usd_ticks;
  // 1 tick = 0.0000000001 USD
  // 即 10,000,000,000 ticks = 1 USD
  return costInTicks / 10_000_000_000;
}
