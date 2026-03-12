/**
 * MCP 工具定义
 *
 * 定义 Grok-MCP 提供的所有工具的 JSON Schema
 */

import { SUPPORTED_MODELS } from '../config/index.js';

/**
 * grok_agent_search 工具定义
 *
 * 使用 Grok AI 进行智能搜索，支持 Web 搜索、X 搜索或混合搜索
 */
export const grokAgentSearchTool = {
  name: 'grok_agent_search',
  description:
    '使用 Grok AI 进行智能搜索。支持 Web 搜索、X (Twitter) 搜索或混合搜索。' +
    'Grok 会自动分析查询、执行搜索、整合信息并提供带引用的答案。' +
    '适用于获取最新信息、研究特定主题、追踪社交媒体动态等场景。',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '搜索查询内容',
      },
      search_type: {
        type: 'string',
        enum: ['web', 'x', 'mixed'],
        description:
          '搜索类型：\n' +
          '- web: 仅使用 Web 搜索\n' +
          '- x: 仅使用 X (Twitter) 搜索\n' +
          '- mixed: 同时使用 Web 和 X 搜索（推荐）',
        default: 'mixed',
      },
      model: {
        type: 'string',
        enum: [...SUPPORTED_MODELS],
        description:
          '使用的 Grok 模型：\n' +
          '- grok-4.20-beta: 快速、便宜、2M 上下文（默认）\n' +
          '- grok-4-latest: 最高质量，适合复杂任务',
        default: 'grok-4.20-beta',
      },
      output_format: {
        type: 'string',
        enum: ['text', 'json'],
        description:
          '输出格式：\n' +
          '- text: Markdown 格式（默认）\n' +
          '- json: 结构化 JSON 格式',
        default: 'text',
      },
      web_search_config: {
        type: 'object',
        description: 'Web 搜索配置（当 search_type 为 web 或 mixed 时）',
        properties: {
          enable_image_understanding: {
            type: 'boolean',
            description: '启用图片理解功能，允许 Grok 分析搜索结果中的图片',
          },
          allowed_domains: {
            type: 'array',
            items: { type: 'string' },
            description: '仅搜索指定域名（最多 5 个），例如：["wikipedia.org", "github.com"]',
            maxItems: 5,
          },
          excluded_domains: {
            type: 'array',
            items: { type: 'string' },
            description: '排除指定域名（最多 5 个），例如：["example.com"]',
            maxItems: 5,
          },
        },
      },
      x_search_config: {
        type: 'object',
        description: 'X 搜索配置（当 search_type 为 x 或 mixed 时）',
        properties: {
          from_date: {
            type: 'string',
            description:
              '开始日期，ISO8601 格式，例如：2024-01-01T00:00:00Z\n' +
              '用于限制搜索时间范围的起始时间',
          },
          to_date: {
            type: 'string',
            description:
              '结束日期，ISO8601 格式，例如：2024-12-31T23:59:59Z\n' +
              '用于限制搜索时间范围的结束时间',
          },
          enable_image_understanding: {
            type: 'boolean',
            description: '启用图片理解功能，允许 Grok 分析推文中的图片',
          },
          enable_video_understanding: {
            type: 'boolean',
            description: '启用视频理解功能，允许 Grok 分析推文中的视频内容',
          },
          allowed_x_handles: {
            type: 'array',
            items: { type: 'string' },
            description:
              '仅搜索指定 X 账号的推文（最多 10 个），例如：["elonmusk", "OpenAI"]\n' +
              '注意：不需要 @ 前缀',
            maxItems: 10,
          },
          excluded_x_handles: {
            type: 'array',
            items: { type: 'string' },
            description:
              '排除指定 X 账号的推文（最多 10 个），例如：["spam_account"]\n' +
              '注意：不需要 @ 前缀',
            maxItems: 10,
          },
        },
      },
    },
    required: ['query'],
  },
};

/**
 * grok_brainstorm 工具定义
 *
 * 使用 Grok AI 进行创意头脑风暴
 */
export const grokBrainstormTool = {
  name: 'grok_brainstorm',
  description:
    '使用 Grok AI 进行创意头脑风暴。Grok 会基于给定主题生成创新想法、' +
    '多角度分析和创意建议。适合产品设计、内容创作、问题解决、战略规划等场景。' +
    'Grok 会从不同视角思考问题，提供富有创意和实用性的建议。' +
    '支持读取项目文件作为上下文，生成贴合项目的创意。',
  inputSchema: {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        description:
          '头脑风暴的主题，可以是问题、想法、产品概念等\n' +
          '例如："如何提高用户留存率"、"新产品功能创意"、"营销活动策划"',
      },
      context: {
        type: 'string',
        description:
          '额外的上下文信息（可选），帮助 Grok 更好地理解背景\n' +
          '例如：目标用户、行业背景、现有限制、预算范围等',
      },
      context_files: {
        type: 'array',
        items: { type: 'string' },
        description:
          '项目文件路径（可选），读取文件内容作为上下文\n' +
          '例如：["./README.md", "./docs/architecture.md"]',
      },
      count: {
        type: 'number',
        description: '生成创意数量，1-10（默认 5）',
        default: 5,
        minimum: 1,
        maximum: 10,
      },
      style: {
        type: 'string',
        enum: ['innovative', 'practical', 'radical', 'balanced'],
        description:
          '头脑风暴风格：\n' +
          '- innovative: 创新型，追求新颖独特\n' +
          '- practical: 务实型，注重可行性\n' +
          '- radical: 激进型，突破常规思维\n' +
          '- balanced: 平衡型（默认）',
        default: 'balanced',
      },
      model: {
        type: 'string',
        enum: [...SUPPORTED_MODELS],
        description:
          '使用的 Grok 模型：\n' +
          '- grok-4.20-beta: 快速、便宜、2M 上下文（默认）\n' +
          '- grok-4-latest: 最高质量，适合复杂任务',
        default: 'grok-4.20-beta',
      },
      output_format: {
        type: 'string',
        enum: ['text', 'json'],
        description:
          '输出格式：\n' +
          '- text: Markdown 格式（默认）\n' +
          '- json: 结构化 JSON（包含 ideas 数组，每个 idea 有 title/description/pros/cons/feasibility）',
        default: 'text',
      },
    },
    required: ['topic'],
  },
};

/**
 * 所有工具定义的数组
 */
export const TOOL_DEFINITIONS = [
  grokAgentSearchTool,
  grokBrainstormTool,
];
