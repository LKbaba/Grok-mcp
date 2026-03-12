/**
 * grok_brainstorm 工具实现
 *
 * 使用 Grok AI 进行创意头脑风暴
 */

import { readFile } from 'fs/promises';
import { resolve } from 'path';
import type {
  GrokBrainstormInput,
  GrokBrainstormOutput,
} from '../types/index.js';
import {
  createResponse,
  extractContent,
  extractUsage,
  calculateCost,
} from '../utils/grok-client.js';
import { xaiConfig, debugMode, SUPPORTED_MODELS } from '../config/index.js';

/**
 * 风格描述映射
 */
const STYLE_DESCRIPTIONS: Record<string, string> = {
  innovative: '创新型：追求新颖独特的想法，鼓励跳出传统框架思考',
  practical: '务实型：注重可行性和投入产出比，优先考虑可落地的方案',
  radical: '激进型：突破常规思维，大胆挑战现有假设，探索颠覆性方案',
  balanced: '平衡型：兼顾创新与可行性，从多个维度综合分析',
};

/**
 * 读取项目文件内容
 */
async function readContextFiles(files: string[]): Promise<string> {
  const contents: string[] = [];

  for (const filePath of files) {
    try {
      const absolutePath = resolve(filePath);
      const content = await readFile(absolutePath, 'utf-8');
      // 限制单个文件最大 5000 字符，避免 token 爆炸
      const truncated = content.length > 5000
        ? content.slice(0, 5000) + '\n... (文件截断，原始长度: ' + content.length + ' 字符)'
        : content;
      contents.push(`--- 文件: ${filePath} ---\n${truncated}`);
    } catch (error) {
      console.error(`[Brainstorm] 无法读取文件 ${filePath}:`, error instanceof Error ? error.message : error);
      contents.push(`--- 文件: ${filePath} ---\n(读取失败)`);
    }
  }

  return contents.join('\n\n');
}

/**
 * 验证模型名称是否支持
 */
function resolveModel(model?: string): string {
  if (!model) return xaiConfig.defaultModel;
  if ((SUPPORTED_MODELS as readonly string[]).includes(model)) return model;
  console.error(`[Brainstorm] 不支持的模型 "${model}"，使用默认模型 ${xaiConfig.defaultModel}`);
  return xaiConfig.defaultModel;
}

/**
 * 构建头脑风暴提示词
 *
 * @param input - 头脑风暴输入参数
 * @param fileContents - 项目文件内容（可选）
 * @returns 提示词字符串
 */
function buildBrainstormPrompt(input: GrokBrainstormInput, fileContents?: string): string {
  const count = input.count || 5;
  const style = input.style || 'balanced';
  const styleDesc = STYLE_DESCRIPTIONS[style] || STYLE_DESCRIPTIONS.balanced;
  const outputFormat = input.output_format || 'text';

  let prompt = `你是一位创意思维专家，擅长从多个角度分析问题并生成创新想法。

**思维风格**: ${styleDesc}

请针对以下主题进行头脑风暴：

**主题**: ${input.topic}
`;

  if (input.context) {
    prompt += `\n**背景信息**: ${input.context}\n`;
  }

  if (fileContents) {
    prompt += `\n**项目文件参考**:\n${fileContents}\n`;
  }

  prompt += `\n请生成 **${count}** 个创意想法`;

  if (outputFormat === 'json') {
    // JSON 格式输出要求
    prompt += `，并严格按照以下 JSON 格式返回（不要包含 markdown 代码块标记）：
{"ideas": [{"title": "想法标题", "description": "详细描述", "pros": ["优点1", "优点2"], "cons": ["挑战1"], "feasibility": "high 或 medium 或 low", "implementation": "实施建议"}]}`;
  } else {
    // Markdown 格式输出要求
    prompt += `，每个想法应包含：
1. **标题**：简洁有力的标题
2. **描述**：详细说明这个想法的核心内容
3. **优点**：列出至少 2-3 个优点
4. **潜在挑战**：列出可能遇到的 1-2 个挑战
5. **可行性评估**：高/中/低
6. **实施建议**：给出具体的实施步骤或建议

请从以下角度思考：
- **创新性**：是否有独特的视角或方法？
- **可行性**：实施的难度和所需资源
- **影响力**：对目标用户或业务的潜在影响
- **可扩展性**：未来的发展空间

请以清晰、结构化的方式呈现你的想法。`;
  }

  return prompt;
}

/**
 * grok_brainstorm 工具主函数
 *
 * @param input - 头脑风暴输入参数
 * @returns 头脑风暴结果
 */
export async function grokBrainstorm(
  input: GrokBrainstormInput
): Promise<GrokBrainstormOutput> {
  try {
    const model = resolveModel(input.model);

    if (debugMode) {
      console.error('[Brainstorm] 开始头脑风暴:', input.topic);
      console.error('[Brainstorm] 模型:', model);
      console.error('[Brainstorm] 数量:', input.count || 5);
      console.error('[Brainstorm] 风格:', input.style || 'balanced');
      console.error('[Brainstorm] 输出格式:', input.output_format || 'text');
      if (input.context) {
        console.error('[Brainstorm] 背景信息:', input.context);
      }
      if (input.context_files) {
        console.error('[Brainstorm] 上下文文件:', input.context_files);
      }
    }

    // 1. 读取项目文件（如果指定）
    let fileContents: string | undefined;
    if (input.context_files && input.context_files.length > 0) {
      if (debugMode) {
        console.error('[Brainstorm] 读取项目文件...');
      }
      fileContents = await readContextFiles(input.context_files);
    }

    // 2. 构建提示词
    const prompt = buildBrainstormPrompt(input, fileContents);

    // 3. 调用 Grok API（不使用搜索工具）
    if (debugMode) {
      console.error('[Brainstorm] 调用 Grok API...');
    }

    // 根据风格调整 temperature
    let temperature: number | undefined;
    switch (input.style) {
      case 'radical':
        temperature = 1.2; // 更高随机性，鼓励大胆想法
        break;
      case 'innovative':
        temperature = 0.9; // 适度创意
        break;
      case 'practical':
        temperature = 0.5; // 更保守，注重可行性
        break;
      // balanced 和默认：不设置 temperature，使用模型默认值
    }

    const response = await createResponse({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      // 不使用搜索工具，纯粹依靠 Grok 的创意思维
    });

    // 4. 提取结果
    const content = extractContent(response);
    const usage = extractUsage(response);
    const cost = calculateCost(response);

    if (debugMode) {
      console.error('[Brainstorm] 头脑风暴完成');
      console.error('[Brainstorm] 模型:', model);
      console.error('[Brainstorm] Token 使用:', usage.total_tokens);
      console.error('[Brainstorm] 推理 Tokens:', usage.reasoning_tokens);
      console.error('[Brainstorm] 成本:', `$${cost.toFixed(6)}`);
    }

    // 5. 返回结果
    return {
      content,
      usage: {
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
        reasoning_tokens: usage.reasoning_tokens,
        total_tokens: usage.total_tokens,
      },
    };
  } catch (error) {
    // 错误处理
    if (error instanceof Error) {
      console.error('[Brainstorm] 头脑风暴失败:', error.message);

      // 超时错误
      if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        throw new Error(
          `头脑风暴超时。建议：\n` +
            `1. 简化主题描述\n` +
            `2. 减少背景信息或文件数量\n` +
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

      // 其他错误
      throw new Error(`头脑风暴失败: ${error.message}`);
    }

    throw error;
  }
}
