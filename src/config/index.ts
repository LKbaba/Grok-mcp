/**
 * Grok-MCP 配置管理模块
 *
 * 负责加载环境变量、验证配置并导出类型安全的配置对象
 */

import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';
import type { GrokMCPConfig } from '../types/index.js';


// 加载 .env 文件
dotenvConfig();

// ============================================================================
// 配置验证 Schema
// ============================================================================

/**
 * 环境变量验证 Schema
 */
const envSchema = z.object({
  // xAI API 配置
  XAI_API_KEY: z.string().min(1, 'XAI_API_KEY 环境变量不能为空'),

  // 调试模式（可选）
  DEBUG: z.string().optional(),
});

// ============================================================================
// 配置验证与加载
// ============================================================================

/**
 * 验证环境变量
 */
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(
        (err) => `  - ${err.path.join('.')}: ${err.message}`
      );
      throw new Error(
        `配置验证失败:\n${messages.join('\n')}\n\n` +
          '请检查 .env 文件或设置相应的环境变量。\n' +
          '参考 .env.example 文件了解所需的配置项。'
      );
    }
    throw error;
  }
}

/**
 * 验证后的环境变量
 */
const env = validateEnv();

// ============================================================================
// 导出配置对象
// ============================================================================

/**
 * 支持的模型列表
 * grok-4.20-beta: 默认模型，快速、便宜、2M 上下文、4-Agent 原生架构
 * grok-4-latest: 旗舰模型，最高质量，适合复杂任务
 */
export const SUPPORTED_MODELS = ['grok-4.20-beta', 'grok-4-latest'] as const;
export type SupportedModel = typeof SUPPORTED_MODELS[number];

/**
 * xAI API 配置
 */
export const xaiConfig = {
  /** API 密钥 */
  apiKey: env.XAI_API_KEY,
  /** API 基础 URL */
  baseURL: 'https://api.x.ai/v1',
  /** 默认模型（v3: 从 grok-4-latest 切换到 grok-4.20-beta） */
  defaultModel: 'grok-4.20-beta' as SupportedModel,
  /** 请求超时时间（毫秒） */
  timeout: 120000, // 120 秒
} as const;

/**
 * MCP 服务配置
 */
export const mcpConfig = {
  /** 服务名称 */
  name: 'grok-mcp',
  /** 服务版本 */
  version: '1.0.0',
} as const;

/**
 * 调试模式
 */
export const debugMode = env.DEBUG === 'true';

/**
 * 完整配置对象
 */
export const config: GrokMCPConfig = {
  apiKey: xaiConfig.apiKey,
  baseURL: xaiConfig.baseURL,
  model: xaiConfig.defaultModel,
  debug: debugMode,
};

/**
 * 打印配置信息（用于调试）
 */
export function printConfig() {
  console.error('Grok-MCP 配置信息:');
  console.error('  - API URL:', xaiConfig.baseURL);
  console.error('  - 默认模型:', xaiConfig.defaultModel);
  console.error('  - 超时时间:', xaiConfig.timeout, 'ms');
  console.error('  - 调试模式:', debugMode ? '开启' : '关闭');
  console.error('  - MCP 服务:', `${mcpConfig.name} v${mcpConfig.version}`);
}
