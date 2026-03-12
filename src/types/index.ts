/**
 * Grok-MCP TypeScript 类型定义
 *
 * 本文件定义了 xAI API、MCP 工具和项目配置的所有类型
 */

// ============================================================================
// xAI API 类型定义
// ============================================================================

/**
 * xAI Responses API 请求类型
 */
export interface XAIResponsesRequest {
  /** 模型名称，例如 "grok-2-1212" */
  model: string;
  /** 对话消息数组 */
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  /** 流式响应开关 */
  stream: boolean;
  /** 温度参数 (0-2)，控制随机性 */
  temperature?: number;
  /** 服务端工具配置 */
  server_side_tools?: Array<XAIWebSearchTool | XAIXSearchTool>;
}

/**
 * Web Search 工具配置
 */
export interface XAIWebSearchTool {
  type: 'web_search';
  /** 启用图片理解 */
  enable_image_understanding?: boolean;
  /** 过滤器配置 */
  filters?: {
    /** 仅搜索指定域名（最多 5 个） */
    allowed_domains?: string[];
    /** 排除指定域名（最多 5 个） */
    excluded_domains?: string[];
  };
}

/**
 * X Search 工具配置
 */
export interface XAIXSearchTool {
  type: 'x_search';
  /** 开始日期 (ISO8601 格式) */
  from_date?: string;
  /** 结束日期 (ISO8601 格式) */
  to_date?: string;
  /** 启用图片理解 */
  enable_image_understanding?: boolean;
  /** 启用视频理解 */
  enable_video_understanding?: boolean;
  /** 仅搜索指定用户（最多 10 个） */
  allowed_x_handles?: string[];
  /** 排除指定用户（最多 10 个） */
  excluded_x_handles?: string[];
}

/**
 * xAI Responses API 响应类型
 */
export interface XAIResponsesResponse {
  /** 输出数组，可能包含搜索调用记录和消息 */
  output: Array<{
    type: string;
    role?: 'assistant';
    content?: Array<{
      type: 'output_text';
      text: string;
      /** 文本注释（包含引用信息） */
      annotations?: Array<{
        type: string;
        url?: string;
        title?: string;
        start_index: number;
        end_index: number;
      }>;
    }>;
    /** 搜索调用的动作信息 */
    action?: {
      type: string;
      query?: string;
    };
    status?: string;
  }>;
  /** Token 使用统计 */
  usage: XAIUsage;
}

/**
 * Token 使用统计类型
 */
export interface XAIUsage {
  /** 输入 tokens */
  input_tokens: number;
  /** 输入 tokens 详情 */
  input_tokens_details?: {
    cached_tokens?: number;
  };
  /** 输出 tokens */
  output_tokens: number;
  /** 输出 tokens 详情 */
  output_tokens_details?: {
    reasoning_tokens?: number;
  };
  /** 总 tokens */
  total_tokens: number;
  /** 成本（单位：ticks，1 tick = 0.0000000001 USD） */
  cost_in_usd_ticks: number;
  /** 服务端工具使用详情（不使用搜索工具时可能不存在） */
  server_side_tool_usage_details?: {
    web_search_calls?: number;
    x_search_calls?: number;
    code_interpreter_calls?: number;
    file_search_calls?: number;
    mcp_calls?: number;
    document_search_calls?: number;
  };
}

// ============================================================================
// MCP 工具类型定义
// ============================================================================

/**
 * grok_agent_search 工具输入参数
 */
export interface GrokAgentSearchInput {
  /** 搜索查询 */
  query: string;
  /** 搜索类型 */
  search_type?: 'web' | 'x' | 'mixed';
  /** 使用的模型（v3 新增） */
  model?: string;
  /** 输出格式（v3 新增） */
  output_format?: 'text' | 'json';
  /** Web Search 配置（当 search_type 为 'web' 或 'mixed' 时） */
  web_search_config?: {
    enable_image_understanding?: boolean;
    allowed_domains?: string[];
    excluded_domains?: string[];
  };
  /** X Search 配置（当 search_type 为 'x' 或 'mixed' 时） */
  x_search_config?: {
    from_date?: string;
    to_date?: string;
    enable_image_understanding?: boolean;
    enable_video_understanding?: boolean;
    allowed_x_handles?: string[];
    excluded_x_handles?: string[];
  };
}

/**
 * grok_agent_search 工具输出结果
 */
export interface GrokAgentSearchOutput {
  /** 搜索结果内容 */
  content: string;
  /** 引用的 URL 列表 */
  citations: string[];
  /** Token 使用统计 */
  usage: {
    input_tokens: number;
    output_tokens: number;
    reasoning_tokens: number;
    cached_tokens: number;
    total_tokens: number;
    web_search_calls: number;
    x_search_calls: number;
  };
}

/**
 * grok_brainstorm 工具输入参数
 */
export interface GrokBrainstormInput {
  /** 头脑风暴主题 */
  topic: string;
  /** 上下文信息（可选） */
  context?: string;
  /** 项目文件路径，读取后作为上下文（v3 新增） */
  context_files?: string[];
  /** 生成创意数量，1-10（v3 新增） */
  count?: number;
  /** 风格（v3 新增） */
  style?: 'innovative' | 'practical' | 'radical' | 'balanced';
  /** 使用的模型（v3 新增） */
  model?: string;
  /** 输出格式（v3 新增） */
  output_format?: 'text' | 'json';
}

/**
 * grok_brainstorm 工具输出结果
 */
export interface GrokBrainstormOutput {
  /** 创意内容 */
  content: string;
  /** Token 使用统计 */
  usage: {
    input_tokens: number;
    output_tokens: number;
    reasoning_tokens: number;
    total_tokens: number;
  };
}

// ============================================================================
// 配置类型定义
// ============================================================================

/**
 * Grok-MCP 项目配置类型
 */
export interface GrokMCPConfig {
  /** xAI API 密钥 */
  apiKey: string;
  /** API 基础 URL */
  baseURL: string;
  /** 默认模型 */
  model: string;
  /** 调试模式 */
  debug?: boolean;
}
