/**
 * Search Tool Builder
 *
 * Provides type-safe xAI search tool builder functions with parameter validation
 */
import type { XAIWebSearchTool, XAIXSearchTool } from '../types/index.js';
/**
 * Build Web Search tool configuration
 *
 * @param options - Web Search configuration options
 * @returns Web Search tool object
 * @throws If parameter validation fails
 *
 * @example
 * ```typescript
 * const tool = buildWebSearchTool({
 *   allowedDomains: ['https://example.com'],
 *   enableImageUnderstanding: true
 * });
 * ```
 */
export declare function buildWebSearchTool(options?: {
    allowedDomains?: string[];
    excludedDomains?: string[];
    enableImageUnderstanding?: boolean;
}): XAIWebSearchTool;
/**
 * Build X Search tool configuration
 *
 * @param options - X Search configuration options
 * @returns X Search tool object
 * @throws If parameter validation fails
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
export declare function buildXSearchTool(options?: {
    fromDate?: string;
    toDate?: string;
    allowedXHandles?: string[];
    excludedXHandles?: string[];
    enableImageUnderstanding?: boolean;
    enableVideoUnderstanding?: boolean;
}): XAIXSearchTool;
/**
 * Validate ISO8601 date format
 *
 * @param dateString - Date string
 * @returns Whether the string is valid ISO8601 format
 */
export declare function isValidISO8601(dateString: string): boolean;
/**
 * Convert date to ISO8601 format
 *
 * @param date - Date object
 * @returns ISO8601 formatted date string
 */
export declare function toISO8601(date: Date): string;
//# sourceMappingURL=tool-builder.d.ts.map