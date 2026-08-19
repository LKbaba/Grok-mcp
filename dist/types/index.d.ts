/**
 * Grok-MCP TypeScript Type Definitions
 *
 * Defines all types for xAI API, MCP tools, and project configuration
 */
/**
 * xAI Responses API request type
 */
export interface XAIResponsesRequest {
    /** Model name, e.g. "grok-4.20-beta" */
    model: string;
    /** Conversation messages array */
    messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
    }>;
    /** Streaming response toggle */
    stream: boolean;
    /** Temperature (0-2), controls randomness */
    temperature?: number;
    /** Server-side tool configuration */
    server_side_tools?: Array<XAIWebSearchTool | XAIXSearchTool>;
    /** Structured output format (native JSON Schema enforcement) */
    text?: {
        format: {
            type: 'json_schema';
            name: string;
            schema: Record<string, unknown>;
            strict: boolean;
        };
    };
}
/**
 * Web Search tool configuration
 */
export interface XAIWebSearchTool {
    type: 'web_search';
    /** Enable image understanding */
    enable_image_understanding?: boolean;
    /** Filter configuration */
    filters?: {
        /** Only search specified domains (max 5) */
        allowed_domains?: string[];
        /** Exclude specified domains (max 5) */
        excluded_domains?: string[];
    };
}
/**
 * X Search tool configuration
 */
export interface XAIXSearchTool {
    type: 'x_search';
    /** Start date (ISO8601 format) */
    from_date?: string;
    /** End date (ISO8601 format) */
    to_date?: string;
    /** Enable image understanding */
    enable_image_understanding?: boolean;
    /** Enable video understanding */
    enable_video_understanding?: boolean;
    /** Only search specified users (max 10) */
    allowed_x_handles?: string[];
    /** Exclude specified users (max 10) */
    excluded_x_handles?: string[];
}
/**
 * xAI Responses API response type
 */
export interface XAIResponsesResponse {
    /** Output array, may contain search call records and messages */
    output: Array<{
        type: string;
        role?: 'assistant';
        content?: Array<{
            type: 'output_text';
            text: string;
            /** Text annotations (contains citation info) */
            annotations?: Array<{
                type: string;
                url?: string;
                title?: string;
                start_index: number;
                end_index: number;
            }>;
        }>;
        /** Search call action info */
        action?: {
            type: string;
            query?: string;
        };
        status?: string;
    }>;
    /** Token usage statistics */
    usage: XAIUsage;
}
/**
 * Token usage statistics type
 */
export interface XAIUsage {
    /** Input tokens */
    input_tokens: number;
    /** Input tokens details */
    input_tokens_details?: {
        cached_tokens?: number;
    };
    /** Output tokens */
    output_tokens: number;
    /** Output tokens details */
    output_tokens_details?: {
        reasoning_tokens?: number;
    };
    /** Total tokens */
    total_tokens: number;
    /** Cost (unit: ticks, 1 tick = 0.0000000001 USD) */
    cost_in_usd_ticks: number;
    /** Server-side tool usage details (may be absent when no search tools used) */
    server_side_tool_usage_details?: {
        web_search_calls?: number;
        x_search_calls?: number;
        code_interpreter_calls?: number;
        file_search_calls?: number;
        mcp_calls?: number;
        document_search_calls?: number;
    };
}
/**
 * grok_agent_search tool input parameters
 */
export interface GrokAgentSearchInput {
    /** Search query */
    query: string;
    /** Search type */
    search_type?: 'web' | 'x' | 'mixed';
    /** Model to use */
    model?: string;
    /** Output format */
    output_format?: 'text' | 'json';
    /** Web Search config (when search_type is 'web' or 'mixed') */
    web_search_config?: {
        enable_image_understanding?: boolean;
        allowed_domains?: string[];
        excluded_domains?: string[];
    };
    /** X Search config (when search_type is 'x' or 'mixed') */
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
 * grok_agent_search tool output result
 */
export interface GrokAgentSearchOutput {
    /** Search result content */
    content: string;
    /** Grok's actual search queries (extracted from web_search_call/x_search_call output entries) */
    searchQueries: string[];
    /** Sources with titles (extracted from annotations) */
    sources: Array<{
        title: string;
        url: string;
    }>;
    /** Cited URL list (fallback: regex-extracted from text when annotations unavailable) */
    citations: string[];
    /** Token usage statistics */
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
 * grok_brainstorm tool input parameters
 */
export interface GrokBrainstormInput {
    /** Brainstorm topic */
    topic: string;
    /** Context information (optional) */
    context?: string;
    /** Project file paths, read as context */
    context_files?: string[];
    /** Number of ideas to generate, 1-10 */
    count?: number;
    /** Brainstorm style */
    style?: 'innovative' | 'practical' | 'radical' | 'balanced';
    /** Model to use */
    model?: string;
    /** Output format */
    output_format?: 'text' | 'json';
}
/**
 * grok_brainstorm tool output result
 */
export interface GrokBrainstormOutput {
    /** Generated content */
    content: string;
    /** Token usage statistics */
    usage: {
        input_tokens: number;
        output_tokens: number;
        reasoning_tokens: number;
        total_tokens: number;
    };
}
/**
 * Grok-MCP project configuration type
 */
export interface GrokMCPConfig {
    /** xAI API key */
    apiKey: string;
    /** API base URL */
    baseURL: string;
    /** Default model */
    model: string;
    /** Debug mode */
    debug?: boolean;
}
//# sourceMappingURL=index.d.ts.map