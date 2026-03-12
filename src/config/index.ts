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
 * Supported model list
 * grok-4.20-beta: Default model, fast, affordable, 2M context, 4-Agent native architecture
 * grok-4-latest: Flagship model, highest quality, suitable for complex tasks
 */
export const SUPPORTED_MODELS = ['grok-4.20-beta', 'grok-4-latest'] as const;
export type SupportedModel = typeof SUPPORTED_MODELS[number];

/**
 * xAI API configuration
 */
export const xaiConfig = {
  /** API key */
  apiKey: env.XAI_API_KEY,
  /** API base URL */
  baseURL: 'https://api.x.ai/v1',
  /** Default model (v3: switched from grok-4-latest to grok-4.20-beta) */
  defaultModel: 'grok-4.20-beta' as SupportedModel,
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
  version: '1.0.1',
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
