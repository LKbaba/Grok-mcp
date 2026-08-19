/**
 * MCP Tool Definitions
 *
 * Defines JSON Schema for all tools provided by Grok-MCP
 */
import { SUPPORTED_MODELS } from '../config/index.js';
/**
 * grok_agent_search tool definition
 *
 * Intelligent search using Grok AI, supports Web search, X search, or mixed search
 */
export const grokAgentSearchTool = {
    name: 'grok_agent_search',
    description: 'Intelligent search powered by Grok AI. Supports Web search, X (Twitter) search, or mixed search. ' +
        'Grok automatically analyzes queries, executes searches, synthesizes information, and provides cited answers. ' +
        'Ideal for getting latest information, researching topics, and tracking social media trends.',
    inputSchema: {
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: 'Search query content',
            },
            search_type: {
                type: 'string',
                enum: ['web', 'x', 'mixed'],
                description: 'Search type:\n' +
                    '- web: Web search only\n' +
                    '- x: X (Twitter) search only\n' +
                    '- mixed: Both Web and X search (recommended)',
                default: 'mixed',
            },
            model: {
                type: 'string',
                enum: [...SUPPORTED_MODELS],
                description: 'Grok model to use:\n' +
                    '- grok-4.20-multi-agent-beta-0309: 4-Agent collaboration, lowest hallucination rate (default)\n' +
                    '- grok-4.20-beta-0309-reasoning: Deep chain-of-thought reasoning\n' +
                    '- grok-4.20-beta-0309-non-reasoning: Fastest speed, creative divergence',
                default: 'grok-4.20-multi-agent-beta-0309',
            },
            output_format: {
                type: 'string',
                enum: ['text', 'json'],
                description: 'Output format:\n' +
                    '- text: Markdown format (default)\n' +
                    '- json: Structured JSON (enforced via native JSON Schema)',
                default: 'text',
            },
            web_search_config: {
                type: 'object',
                description: 'Web search config (when search_type is web or mixed). Image understanding is enabled by default.',
                properties: {
                    allowed_domains: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Only search specified domains (max 5, mutually exclusive with excluded_domains), e.g.: ["wikipedia.org", "github.com"]',
                        maxItems: 5,
                    },
                    excluded_domains: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Exclude specified domains (max 5, mutually exclusive with allowed_domains), e.g.: ["example.com"]',
                        maxItems: 5,
                    },
                },
            },
            x_search_config: {
                type: 'object',
                description: 'X search config (when search_type is x or mixed). Image understanding is enabled by default.',
                properties: {
                    from_date: {
                        type: 'string',
                        description: 'Start date, ISO8601 format, e.g.: 2024-01-01T00:00:00Z\n' +
                            'Used to limit the search time range start',
                    },
                    to_date: {
                        type: 'string',
                        description: 'End date, ISO8601 format, e.g.: 2024-12-31T23:59:59Z\n' +
                            'Used to limit the search time range end',
                    },
                    enable_video_understanding: {
                        type: 'boolean',
                        description: 'Enable video understanding, allows Grok to analyze video content in tweets',
                    },
                    allowed_x_handles: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Only search tweets from specified X accounts (max 10, mutually exclusive with excluded_x_handles), e.g.: ["elonmusk", "OpenAI"]\n' +
                            'Note: No @ prefix needed',
                        maxItems: 10,
                    },
                    excluded_x_handles: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Exclude tweets from specified X accounts (max 10, mutually exclusive with allowed_x_handles), e.g.: ["spam_account"]\n' +
                            'Note: No @ prefix needed',
                        maxItems: 10,
                    },
                },
            },
        },
        required: ['query'],
    },
};
/**
 * grok_brainstorm tool definition
 *
 * Creative brainstorming using Grok AI
 */
export const grokBrainstormTool = {
    name: 'grok_brainstorm',
    description: 'Creative brainstorming powered by Grok AI. Generates innovative ideas, ' +
        'multi-perspective analysis, and creative suggestions based on a given topic. ' +
        'Ideal for product design, content creation, problem solving, and strategic planning. ' +
        'Supports reading project files as context to generate project-relevant ideas.',
    inputSchema: {
        type: 'object',
        properties: {
            topic: {
                type: 'string',
                description: 'Brainstorm topic — can be a question, idea, product concept, etc.\n' +
                    'e.g.: "How to improve user retention", "New product feature ideas", "Marketing campaign planning"',
            },
            context: {
                type: 'string',
                description: 'Additional context information (optional) to help Grok better understand the background\n' +
                    'e.g.: target audience, industry background, existing constraints, budget range, etc.',
            },
            context_files: {
                type: 'array',
                items: { type: 'string' },
                maxItems: 10,
                description: 'Project file paths (optional, max 10), reads file content as context\n' +
                    'e.g.: ["./README.md", "./docs/architecture.md"]',
            },
            count: {
                type: 'number',
                description: 'Number of ideas to generate, 1-10 (default 5)',
                default: 5,
                minimum: 1,
                maximum: 10,
            },
            style: {
                type: 'string',
                enum: ['innovative', 'practical', 'radical', 'balanced'],
                description: 'Brainstorm style:\n' +
                    '- innovative: Pursue novel and unique ideas\n' +
                    '- practical: Focus on feasibility\n' +
                    '- radical: Break conventional thinking\n' +
                    '- balanced: Balance of all (default)',
                default: 'balanced',
            },
            model: {
                type: 'string',
                enum: [...SUPPORTED_MODELS],
                description: 'Grok model to use:\n' +
                    '- grok-4.20-multi-agent-beta-0309: 4-Agent collaboration, lowest hallucination rate (default)\n' +
                    '- grok-4.20-beta-0309-reasoning: Deep chain-of-thought reasoning\n' +
                    '- grok-4.20-beta-0309-non-reasoning: Fastest speed, creative divergence',
                default: 'grok-4.20-multi-agent-beta-0309',
            },
            output_format: {
                type: 'string',
                enum: ['text', 'json'],
                description: 'Output format:\n' +
                    '- text: Markdown format (default)\n' +
                    '- json: Structured JSON enforced via native JSON Schema (ideas array with title/description/pros/cons/feasibility/implementation)',
                default: 'text',
            },
        },
        required: ['topic'],
    },
};
/**
 * Array of all tool definitions
 */
export const TOOL_DEFINITIONS = [
    grokAgentSearchTool,
    grokBrainstormTool,
];
//# sourceMappingURL=definitions.js.map