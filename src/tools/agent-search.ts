/**
 * grok_agent_search 工具实现
 *
 * 使用 Grok AI 进行智能搜索，支持 Web 搜索、X 搜索或混合搜索
 */

import type {
  GrokAgentSearchInput,
  GrokAgentSearchOutput,
} from '../types/index.js';
import {
  createResponse,
  extractContent,
  extractCitations,
  extractUsage,
  calculateCost,
} from '../utils/grok-client.js';
import {
  buildWebSearchTool,
  buildXSearchTool,
} from '../utils/tool-builder.js';
import { xaiConfig, debugMode, SUPPORTED_MODELS } from '../config/index.js';

/**
 * 验证模型名称是否支持
 */
function resolveModel(model?: string): string {
  if (!model) return xaiConfig.defaultModel;
  if ((SUPPORTED_MODELS as readonly string[]).includes(model)) return model;
  // 不支持的模型，回退到默认并警告
  console.error(`[Agent Search] 不支持的模型 "${model}"，使用默认模型 ${xaiConfig.defaultModel}`);
  return xaiConfig.defaultModel;
}

/**
 * grok_agent_search 工具主函数
 *
 * @param input - 搜索输入参数
 * @returns 搜索结果
 */
export async function grokAgentSearch(
  input: GrokAgentSearchInput
): Promise<GrokAgentSearchOutput> {
  try {
    // search_type 默认值为 mixed（同时搜索 Web 和 X）
    const searchType = input.search_type || 'mixed';
    const model = resolveModel(input.model);
    const outputFormat = input.output_format || 'text';

    if (debugMode) {
      console.error('[Agent Search] 开始搜索:', input.query);
      console.error('[Agent Search] 搜索类型:', searchType);
      console.error('[Agent Search] 模型:', model);
      console.error('[Agent Search] 输出格式:', outputFormat);
    }

    // 1. 根据 search_type 构建工具列表
    const tools = [];

    if (searchType === 'web' || searchType === 'mixed') {
      // 构建 Web Search 工具
      const webTool = buildWebSearchTool({
        allowedDomains: input.web_search_config?.allowed_domains,
        excludedDomains: input.web_search_config?.excluded_domains,
        enableImageUnderstanding:
          input.web_search_config?.enable_image_understanding,
      });
      tools.push(webTool);

      if (debugMode) {
        console.error('[Agent Search] 添加 Web Search 工具');
      }
    }

    if (searchType === 'x' || searchType === 'mixed') {
      // 构建 X Search 工具
      const xTool = buildXSearchTool({
        fromDate: input.x_search_config?.from_date,
        toDate: input.x_search_config?.to_date,
        allowedXHandles: input.x_search_config?.allowed_x_handles,
        excludedXHandles: input.x_search_config?.excluded_x_handles,
        enableImageUnderstanding:
          input.x_search_config?.enable_image_understanding,
        enableVideoUnderstanding:
          input.x_search_config?.enable_video_understanding,
      });
      tools.push(xTool);

      if (debugMode) {
        console.error('[Agent Search] 添加 X Search 工具');
      }
    }

    if (tools.length === 0) {
      throw new Error('至少需要指定一种搜索类型（web、x 或 mixed）');
    }

    // 2. 构建查询内容（如果需要 JSON 输出，在 prompt 中要求）
    let queryContent = input.query;
    if (outputFormat === 'json') {
      queryContent += '\n\n请以 JSON 格式返回搜索结果，包含以下结构：\n' +
        '{"summary": "搜索摘要", "results": [{"title": "标题", "content": "内容", "source": "来源URL"}], "key_findings": ["发现1", "发现2"]}';
    }

    // 3. 调用 Grok API
    if (debugMode) {
      console.error('[Agent Search] 调用 Grok API...');
    }

    const response = await createResponse({
      model,
      messages: [{ role: 'user', content: queryContent }],
      server_side_tools: tools,
    });

    // 4. 提取结果
    const content = extractContent(response);
    const citations = extractCitations(content);
    const usage = extractUsage(response);
    const cost = calculateCost(response);

    if (debugMode) {
      console.error('[Agent Search] 搜索完成');
      console.error('[Agent Search] 模型:', model);
      console.error('[Agent Search] 引用数量:', citations.length);
      console.error('[Agent Search] Token 使用:', usage.total_tokens);
      console.error('[Agent Search] 成本:', `$${cost.toFixed(6)}`);
    }

    // 5. 返回结果
    return {
      content,
      citations,
      usage,
    };
  } catch (error) {
    // 错误处理
    if (error instanceof Error) {
      console.error('[Agent Search] 搜索失败:', error.message);

      // 超时错误
      if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        throw new Error(
          `搜索超时。建议：\n` +
            `1. 简化查询内容\n` +
            `2. 减少搜索范围\n` +
            `3. 稍后重试\n` +
            `原始错误: ${error.message}`
        );
      }

      // API 错误
      if (error.message.includes('API') || error.message.includes('401')) {
        throw new Error(
          `API 调用失败。请检查：\n` +
            `1. XAI_API_KEY 是否正确配置\n` +
            `2. API 密钥是否有效\n` +
            `3. 网络连接是否正常\n` +
            `原始错误: ${error.message}`
        );
      }

      // 参数验证错误
      if (error.message.includes('验证失败')) {
        throw new Error(`参数验证失败: ${error.message}`);
      }

      // 其他错误
      throw new Error(`搜索失败: ${error.message}`);
    }

    throw error;
  }
}
