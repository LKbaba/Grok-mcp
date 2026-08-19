/**
 * Grok-MCP Configuration Module
 *
 * Loads environment variables, validates config, and exports type-safe configuration objects
 */
import type { GrokMCPConfig } from '../types/index.js';
/**
 * Supported model list (Grok 4.20 series only)
 * multi-agent-beta-0309: 4-Agent collaboration (Grok+Harper+Benjamin+Lucas), lowest hallucination rate (~4.2%)
 * beta-0309-reasoning: Single-model chain-of-thought, best for deep linear reasoning
 * beta-0309-non-reasoning: Fastest speed, best for quick creative divergence
 */
export declare const SUPPORTED_MODELS: readonly ["grok-4.20-multi-agent-beta-0309", "grok-4.20-beta-0309-reasoning", "grok-4.20-beta-0309-non-reasoning"];
export type SupportedModel = typeof SUPPORTED_MODELS[number];
/**
 * xAI API configuration
 */
export declare const xaiConfig: {
    /** API key */
    readonly apiKey: string;
    /** API base URL */
    readonly baseURL: "https://api.x.ai/v1";
    /** Default model (v4: multi-agent for best search accuracy and brainstorm quality) */
    readonly defaultModel: SupportedModel;
    /** 请求超时（毫秒），可用环境变量 GROK_MCP_TIMEOUT 覆盖，默认 500 秒 */
    readonly timeout: number;
};
/**
 * MCP service configuration
 */
export declare const mcpConfig: {
    /** Service name */
    readonly name: "grok-mcp";
    /** Service version */
    readonly version: "2.0.5";
};
/**
 * Debug mode
 */
export declare const debugMode: boolean;
/**
 * Full configuration object
 */
export declare const config: GrokMCPConfig;
/**
 * Print configuration info (for debugging)
 */
export declare function printConfig(): void;
//# sourceMappingURL=index.d.ts.map