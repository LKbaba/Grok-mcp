/**
 * Grok-MCP Configuration Module
 *
 * Loads environment variables, validates config, and exports type-safe configuration objects
 */

import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';
import type { GrokMCPConfig } from '../types/index.js';


// Load .env file
dotenvConfig();

// ============================================================================
// Config Validation Schema
// ============================================================================

/**
 * Environment variable validation schema
 */
const envSchema = z.object({
  // xAI API configuration
  XAI_API_KEY: z.string().min(1, 'XAI_API_KEY environment variable is required'),

  // Debug mode (optional)
  DEBUG: z.string().optional(),
});

// ============================================================================
// Config Validation & Loading
// ============================================================================

/**
 * Validate environment variables
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
        `Configuration validation failed:\n${messages.join('\n')}\n\n` +
          'Please check your .env file or set the required environment variables.\n' +
          'Refer to .env.example for required configuration items.'
      );
    }
    throw error;
  }
}

/**
 * Validated environment variables
 */
const env = validateEnv();

// ============================================================================
// Export Configuration Objects
// ============================================================================

/**
 * Supported model list (Grok 4.20 series only)
 * multi-agent-beta-0309: 4-Agent collaboration (Grok+Harper+Benjamin+Lucas), lowest hallucination rate (~4.2%)
 * beta-0309-reasoning: Single-model chain-of-thought, best for deep linear reasoning
 * beta-0309-non-reasoning: Fastest speed, best for quick creative divergence
 */
export const SUPPORTED_MODELS = [
  'grok-4.20-multi-agent-beta-0309',
  'grok-4.20-beta-0309-reasoning',
  'grok-4.20-beta-0309-non-reasoning',
] as const;
export type SupportedModel = typeof SUPPORTED_MODELS[number];

/**
 * xAI API configuration
 */
export const xaiConfig = {
  /** API key */
  apiKey: env.XAI_API_KEY,
  /** API base URL */
  baseURL: 'https://api.x.ai/v1',
  /** Default model (v4: multi-agent for best search accuracy and brainstorm quality) */
  defaultModel: 'grok-4.20-multi-agent-beta-0309' as SupportedModel,
  /** Request timeout (milliseconds) */
  timeout: 120000, // 120 seconds
} as const;

/**
 * MCP service configuration
 */
export const mcpConfig = {
  /** Service name */
  name: 'grok-mcp',
  /** Service version */
  version: '2.0.1',
} as const;

/**
 * Debug mode
 */
export const debugMode = env.DEBUG === 'true';

/**
 * Full configuration object
 */
export const config: GrokMCPConfig = {
  apiKey: xaiConfig.apiKey,
  baseURL: xaiConfig.baseURL,
  model: xaiConfig.defaultModel,
  debug: debugMode,
};

/**
 * Print configuration info (for debugging)
 */
export function printConfig() {
  console.error('Grok-MCP Configuration:');
  console.error('  - API URL:', xaiConfig.baseURL);
  console.error('  - Default Model:', xaiConfig.defaultModel);
  console.error('  - Timeout:', xaiConfig.timeout, 'ms');
  console.error('  - Debug Mode:', debugMode ? 'enabled' : 'disabled');
  console.error('  - MCP Service:', `${mcpConfig.name} v${mcpConfig.version}`);
}
