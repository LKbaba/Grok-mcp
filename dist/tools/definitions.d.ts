/**
 * MCP Tool Definitions
 *
 * Defines JSON Schema for all tools provided by Grok-MCP
 */
/**
 * grok_agent_search tool definition
 *
 * Intelligent search using Grok AI, supports Web search, X search, or mixed search
 */
export declare const grokAgentSearchTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query: {
                type: string;
                description: string;
            };
            search_type: {
                type: string;
                enum: string[];
                description: string;
                default: string;
            };
            model: {
                type: string;
                enum: ("grok-4.20-multi-agent-beta-0309" | "grok-4.20-beta-0309-reasoning" | "grok-4.20-beta-0309-non-reasoning")[];
                description: string;
                default: string;
            };
            output_format: {
                type: string;
                enum: string[];
                description: string;
                default: string;
            };
            web_search_config: {
                type: string;
                description: string;
                properties: {
                    allowed_domains: {
                        type: string;
                        items: {
                            type: string;
                        };
                        description: string;
                        maxItems: number;
                    };
                    excluded_domains: {
                        type: string;
                        items: {
                            type: string;
                        };
                        description: string;
                        maxItems: number;
                    };
                };
            };
            x_search_config: {
                type: string;
                description: string;
                properties: {
                    from_date: {
                        type: string;
                        description: string;
                    };
                    to_date: {
                        type: string;
                        description: string;
                    };
                    enable_video_understanding: {
                        type: string;
                        description: string;
                    };
                    allowed_x_handles: {
                        type: string;
                        items: {
                            type: string;
                        };
                        description: string;
                        maxItems: number;
                    };
                    excluded_x_handles: {
                        type: string;
                        items: {
                            type: string;
                        };
                        description: string;
                        maxItems: number;
                    };
                };
            };
        };
        required: string[];
    };
};
/**
 * grok_brainstorm tool definition
 *
 * Creative brainstorming using Grok AI
 */
export declare const grokBrainstormTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            topic: {
                type: string;
                description: string;
            };
            context: {
                type: string;
                description: string;
            };
            context_files: {
                type: string;
                items: {
                    type: string;
                };
                maxItems: number;
                description: string;
            };
            count: {
                type: string;
                description: string;
                default: number;
                minimum: number;
                maximum: number;
            };
            style: {
                type: string;
                enum: string[];
                description: string;
                default: string;
            };
            model: {
                type: string;
                enum: ("grok-4.20-multi-agent-beta-0309" | "grok-4.20-beta-0309-reasoning" | "grok-4.20-beta-0309-non-reasoning")[];
                description: string;
                default: string;
            };
            output_format: {
                type: string;
                enum: string[];
                description: string;
                default: string;
            };
        };
        required: string[];
    };
};
/**
 * Array of all tool definitions
 */
export declare const TOOL_DEFINITIONS: ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query: {
                type: string;
                description: string;
            };
            search_type: {
                type: string;
                enum: string[];
                description: string;
                default: string;
            };
            model: {
                type: string;
                enum: ("grok-4.20-multi-agent-beta-0309" | "grok-4.20-beta-0309-reasoning" | "grok-4.20-beta-0309-non-reasoning")[];
                description: string;
                default: string;
            };
            output_format: {
                type: string;
                enum: string[];
                description: string;
                default: string;
            };
            web_search_config: {
                type: string;
                description: string;
                properties: {
                    allowed_domains: {
                        type: string;
                        items: {
                            type: string;
                        };
                        description: string;
                        maxItems: number;
                    };
                    excluded_domains: {
                        type: string;
                        items: {
                            type: string;
                        };
                        description: string;
                        maxItems: number;
                    };
                };
            };
            x_search_config: {
                type: string;
                description: string;
                properties: {
                    from_date: {
                        type: string;
                        description: string;
                    };
                    to_date: {
                        type: string;
                        description: string;
                    };
                    enable_video_understanding: {
                        type: string;
                        description: string;
                    };
                    allowed_x_handles: {
                        type: string;
                        items: {
                            type: string;
                        };
                        description: string;
                        maxItems: number;
                    };
                    excluded_x_handles: {
                        type: string;
                        items: {
                            type: string;
                        };
                        description: string;
                        maxItems: number;
                    };
                };
            };
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            topic: {
                type: string;
                description: string;
            };
            context: {
                type: string;
                description: string;
            };
            context_files: {
                type: string;
                items: {
                    type: string;
                };
                maxItems: number;
                description: string;
            };
            count: {
                type: string;
                description: string;
                default: number;
                minimum: number;
                maximum: number;
            };
            style: {
                type: string;
                enum: string[];
                description: string;
                default: string;
            };
            model: {
                type: string;
                enum: ("grok-4.20-multi-agent-beta-0309" | "grok-4.20-beta-0309-reasoning" | "grok-4.20-beta-0309-non-reasoning")[];
                description: string;
                default: string;
            };
            output_format: {
                type: string;
                enum: string[];
                description: string;
                default: string;
            };
        };
        required: string[];
    };
})[];
//# sourceMappingURL=definitions.d.ts.map