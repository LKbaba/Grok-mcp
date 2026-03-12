/**
 * 搜索工具构建器
 *
 * 提供类型安全的 xAI 搜索工具构建函数，包含参数验证
 */

import { z } from 'zod';
import type { XAIWebSearchTool, XAIXSearchTool } from '../types/index.js';

// ============================================================================
// 参数验证 Schema
// ============================================================================

/**
 * Web Search 工具参数验证 Schema
 */
const webSearchOptionsSchema = z.object({
  allowedDomains: z
    .array(z.string().min(1, '域名不能为空').regex(
      /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/,
      '域名格式无效，示例：github.com、stackoverflow.com'
    ))
    .max(5, '最多只能指定 5 个允许的域名')
    .optional(),
  excludedDomains: z
    .array(z.string().min(1, '域名不能为空').regex(
      /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/,
      '域名格式无效，示例：github.com、stackoverflow.com'
    ))
    .max(5, '最多只能指定 5 个排除的域名')
    .optional(),
  enableImageUnderstanding: z.boolean().optional(),
});

/**
 * X Search 工具参数验证 Schema
 */
const xSearchOptionsSchema = z.object({
  fromDate: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/,
      '日期必须是 ISO8601 格式（例如：2024-01-01T00:00:00Z）'
    )
    .optional(),
  toDate: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/,
      '日期必须是 ISO8601 格式（例如：2024-01-01T00:00:00Z）'
    )
    .optional(),
  allowedXHandles: z
    .array(z.string().min(1, 'X 账号不能为空'))
    .max(10, '最多只能指定 10 个允许的 X 账号')
    .optional(),
  excludedXHandles: z
    .array(z.string().min(1, 'X 账号不能为空'))
    .max(10, '最多只能指定 10 个排除的 X 账号')
    .optional(),
  enableImageUnderstanding: z.boolean().optional(),
  enableVideoUnderstanding: z.boolean().optional(),
});

// ============================================================================
// 工具构建函数
// ============================================================================

/**
 * 构建 Web Search 工具配置
 *
 * @param options - Web Search 配置选项
 * @returns Web Search 工具对象
 * @throws 如果参数验证失败
 *
 * @example
 * ```typescript
 * const tool = buildWebSearchTool({
 *   allowedDomains: ['https://example.com'],
 *   enableImageUnderstanding: true
 * });
 * ```
 */
export function buildWebSearchTool(options?: {
  allowedDomains?: string[];
  excludedDomains?: string[];
  enableImageUnderstanding?: boolean;
}): XAIWebSearchTool {
  // 参数验证
  if (options) {
    try {
      webSearchOptionsSchema.parse(options);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map(
          (err) => `  - ${err.path.join('.')}: ${err.message}`
        );
        throw new Error(
          `Web Search 工具参数验证失败:\n${messages.join('\n')}`
        );
      }
      throw error;
    }
  }

  // 构建工具对象
  const tool: XAIWebSearchTool = {
    type: 'web_search',
  };

  // 添加可选参数
  if (options?.enableImageUnderstanding !== undefined) {
    tool.enable_image_understanding = options.enableImageUnderstanding;
  }

  // 添加过滤器
  if (options?.allowedDomains || options?.excludedDomains) {
    tool.filters = {};
    if (options.allowedDomains) {
      tool.filters.allowed_domains = options.allowedDomains;
    }
    if (options.excludedDomains) {
      tool.filters.excluded_domains = options.excludedDomains;
    }
  }

  return tool;
}

/**
 * 构建 X Search 工具配置
 *
 * @param options - X Search 配置选项
 * @returns X Search 工具对象
 * @throws 如果参数验证失败
 *
 * @example
 * ```typescript
 * const tool = buildXSearchTool({
 *   fromDate: '2024-01-01T00:00:00Z',
 *   toDate: '2024-12-31T23:59:59Z',
 *   allowedXHandles: ['elonmusk', 'OpenAI'],
 *   enableVideoUnderstanding: true
 * });
 * ```
 */
export function buildXSearchTool(options?: {
  fromDate?: string;
  toDate?: string;
  allowedXHandles?: string[];
  excludedXHandles?: string[];
  enableImageUnderstanding?: boolean;
  enableVideoUnderstanding?: boolean;
}): XAIXSearchTool {
  // 参数验证
  if (options) {
    try {
      xSearchOptionsSchema.parse(options);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map(
          (err) => `  - ${err.path.join('.')}: ${err.message}`
        );
        throw new Error(`X Search 工具参数验证失败:\n${messages.join('\n')}`);
      }
      throw error;
    }

    // 日期逻辑验证
    if (options.fromDate && options.toDate) {
      const from = new Date(options.fromDate);
      const to = new Date(options.toDate);
      if (from > to) {
        throw new Error('fromDate 不能晚于 toDate');
      }
    }
  }

  // 构建工具对象
  const tool: XAIXSearchTool = {
    type: 'x_search',
  };

  // 添加可选参数
  if (options?.fromDate) tool.from_date = options.fromDate;
  if (options?.toDate) tool.to_date = options.toDate;
  if (options?.enableImageUnderstanding !== undefined) {
    tool.enable_image_understanding = options.enableImageUnderstanding;
  }
  if (options?.enableVideoUnderstanding !== undefined) {
    tool.enable_video_understanding = options.enableVideoUnderstanding;
  }
  if (options?.allowedXHandles) {
    tool.allowed_x_handles = options.allowedXHandles;
  }
  if (options?.excludedXHandles) {
    tool.excluded_x_handles = options.excludedXHandles;
  }

  return tool;
}

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 验证 ISO8601 日期格式
 *
 * @param dateString - 日期字符串
 * @returns 是否为有效的 ISO8601 格式
 */
export function isValidISO8601(dateString: string): boolean {
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
  if (!iso8601Regex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * 将日期转换为 ISO8601 格式
 *
 * @param date - Date 对象
 * @returns ISO8601 格式的日期字符串
 */
export function toISO8601(date: Date): string {
  return date.toISOString();
}
