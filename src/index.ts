#!/usr/bin/env node

/**
 * Grok-MCP 主入口文件
 * 基于 MCP 协议的 Grok API 服务
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { mcpConfig, debugMode } from './config/index.js';
import { TOOL_DEFINITIONS } from './tools/definitions.js';
import { grokAgentSearch } from './tools/agent-search.js';
import { grokBrainstorm } from './tools/brainstorm.js';
import type { GrokAgentSearchInput, GrokBrainstormInput } from './types/index.js';
import { logger, startPerformanceMonitor } from './utils/logger.js';

// ============================================================================
// MCP 服务器初始化
// ============================================================================

/**
 * 创建 MCP 服务器实例
 */
const server = new Server(
  {
    name: mcpConfig.name,
    version: mcpConfig.version,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ============================================================================
// 请求处理器
// ============================================================================

/**
 * 处理 tools/list 请求
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  logger.debug('收到 tools/list 请求');
  return { tools: TOOL_DEFINITIONS };
});

/**
 * 处理 tools/call 请求
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  logger.info(`收到工具调用请求: ${name}`);
  logger.debug('工具参数', args);

  // 开始性能监控
  const monitor = startPerformanceMonitor(`工具调用: ${name}`);

  try {
    switch (name) {
      case 'grok_agent_search': {
        // 调用 grok_agent_search 工具
        const input = args as unknown as GrokAgentSearchInput;
        const result = await grokAgentSearch(input);

        // 记录性能和使用统计
        const duration = monitor.end({
          tokens: result.usage.total_tokens,
          citations: result.citations.length,
        });

        // 格式化输出
        let output = `# 搜索结果\n\n${result.content}\n\n`;

        if (result.citations.length > 0) {
          output += `## 引用来源\n\n`;
          result.citations.forEach((url, index) => {
            output += `${index + 1}. ${url}\n`;
          });
          output += `\n`;
        }

        output += `## 使用统计\n\n`;
        output += `- 模型: ${input.model || 'grok-4.20-beta'}\n`;
        output += `- 输入 Tokens: ${result.usage.input_tokens}\n`;
        output += `- 输出 Tokens: ${result.usage.output_tokens}\n`;
        output += `- 推理 Tokens: ${result.usage.reasoning_tokens}\n`;
        output += `- 总 Tokens: ${result.usage.total_tokens}\n`;
        output += `- Web 搜索调用: ${result.usage.web_search_calls}\n`;
        output += `- X 搜索调用: ${result.usage.x_search_calls}\n`;
        output += `- 耗时: ${duration}ms\n`;

        logger.info(`搜索完成，耗时 ${duration}ms`);

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
        // 调用 grok_brainstorm 工具
        const input = args as unknown as GrokBrainstormInput;
        const result = await grokBrainstorm(input);

        // 记录性能和使用统计
        const duration = monitor.end({
          tokens: result.usage.total_tokens,
        });

        // 格式化输出
        let output = `# 头脑风暴结果\n\n`;
        output += `**主题**: ${input.topic}\n`;
        output += `**风格**: ${input.style || 'balanced'} | **数量**: ${input.count || 5}\n\n`;

        if (input.context) {
          output += `**背景**: ${input.context}\n\n`;
        }

        if (input.context_files && input.context_files.length > 0) {
          output += `**参考文件**: ${input.context_files.join(', ')}\n\n`;
        }

        output += `---\n\n${result.content}\n\n`;

        output += `---\n\n## 使用统计\n\n`;
        output += `- 模型: ${input.model || 'grok-4.20-beta'}\n`;
        output += `- 输入 Tokens: ${result.usage.input_tokens}\n`;
        output += `- 输出 Tokens: ${result.usage.output_tokens}\n`;
        output += `- 推理 Tokens: ${result.usage.reasoning_tokens}\n`;
        output += `- 总 Tokens: ${result.usage.total_tokens}\n`;
        output += `- 耗时: ${duration}ms\n`;

        logger.info(`头脑风暴完成，耗时 ${duration}ms`);

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
        throw new Error(`未知工具: ${name}`);
    }
  } catch (error) {
    logger.error(`工具调用失败: ${name}`, error);
    throw error;
  }
});

// ============================================================================
// 服务器启动
// ============================================================================

/**
 * 启动 MCP 服务器
 */
async function main() {
  try {
    logger.info('正在启动 Grok-MCP 服务器...');
    logger.info(`服务名称: ${mcpConfig.name}`);
    logger.info(`服务版本: ${mcpConfig.version}`);

    const transport = new StdioServerTransport();
    await server.connect(transport);

    logger.info('Grok-MCP 服务已启动');
    logger.info('等待客户端连接...');
  } catch (error) {
    logger.error('服务器启动失败', error);
    process.exit(1);
  }
}

// ============================================================================
// 错误处理
// ============================================================================

/**
 * 处理未捕获的异常
 */
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常', error);
  process.exit(1);
});

/**
 * 处理未处理的 Promise 拒绝
 * 仅记录错误，不退出进程 — 单次请求失败不应终止整个 MCP 服务器
 */
process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的 Promise 拒绝', reason as Error);
});

/**
 * 处理进程终止信号
 */
process.on('SIGINT', () => {
  logger.info('收到 SIGINT 信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('收到 SIGTERM 信号，正在关闭服务器...');
  process.exit(0);
});

// 启动服务器
main();
