/**
 * Search Tool Builder
 *
 * Provides type-safe xAI search tool builder functions with parameter validation
 */
import { z } from 'zod';
// ============================================================================
// Parameter Validation Schemas
// ============================================================================
/**
 * Web Search tool parameter validation schema
 */
const webSearchOptionsSchema = z.object({
    allowedDomains: z
        .array(z.string().min(1, 'Domain cannot be empty').max(253, 'Domain too long').regex(/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/, 'Invalid domain format, e.g.: github.com, stackoverflow.com'))
        .max(5, 'Maximum of 5 allowed domains')
        .optional(),
    excludedDomains: z
        .array(z.string().min(1, 'Domain cannot be empty').max(253, 'Domain too long').regex(/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/, 'Invalid domain format, e.g.: github.com, stackoverflow.com'))
        .max(5, 'Maximum of 5 excluded domains')
        .optional(),
    enableImageUnderstanding: z.boolean().optional(),
});
/**
 * X Search tool parameter validation schema
 */
const xSearchOptionsSchema = z.object({
    fromDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/, 'Date must be in ISO8601 format (e.g.: 2024-01-01T00:00:00Z)')
        .optional(),
    toDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/, 'Date must be in ISO8601 format (e.g.: 2024-01-01T00:00:00Z)')
        .optional(),
    allowedXHandles: z
        .array(z.string().min(1, 'X handle cannot be empty'))
        .max(10, 'Maximum of 10 allowed X handles')
        .optional(),
    excludedXHandles: z
        .array(z.string().min(1, 'X handle cannot be empty'))
        .max(10, 'Maximum of 10 excluded X handles')
        .optional(),
    enableImageUnderstanding: z.boolean().optional(),
    enableVideoUnderstanding: z.boolean().optional(),
});
// ============================================================================
// Tool Builder Functions
// ============================================================================
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
export function buildWebSearchTool(options) {
    // Parameter validation
    if (options) {
        try {
            webSearchOptionsSchema.parse(options);
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                const messages = error.errors.map((err) => `  - ${err.path.join('.')}: ${err.message}`);
                throw new Error(`Web Search tool parameter validation failed:\n${messages.join('\n')}`);
            }
            throw error;
        }
    }
    // Mutual exclusivity check (xAI API requirement)
    if (options?.allowedDomains?.length && options?.excludedDomains?.length) {
        throw new Error('allowed_domains and excluded_domains are mutually exclusive');
    }
    // Build tool object
    const tool = {
        type: 'web_search',
        // Default: enable image understanding (v4 decision)
        enable_image_understanding: options?.enableImageUnderstanding ?? true,
    };
    // Add filters
    if (options?.allowedDomains || options?.excludedDomains) {
        tool.filters = {};
        if (options.allowedDomains) {
            tool.filters.allowed_domains = options.allowedDomains;
        }
        if (options.excludedDomains) {
            tool.filters.excluded_domains = options.excludedDomains;
        }
    }
    return tool;
}
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
export function buildXSearchTool(options) {
    // Parameter validation
    if (options) {
        try {
            xSearchOptionsSchema.parse(options);
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                const messages = error.errors.map((err) => `  - ${err.path.join('.')}: ${err.message}`);
                throw new Error(`X Search tool parameter validation failed:\n${messages.join('\n')}`);
            }
            throw error;
        }
        // Date logic validation
        if (options.fromDate && options.toDate) {
            const from = new Date(options.fromDate);
            const to = new Date(options.toDate);
            if (from > to) {
                throw new Error('fromDate cannot be later than toDate');
            }
        }
    }
    // Mutual exclusivity check (xAI API requirement)
    if (options?.allowedXHandles?.length && options?.excludedXHandles?.length) {
        throw new Error('allowed_x_handles and excluded_x_handles are mutually exclusive');
    }
    // Build tool object
    const tool = {
        type: 'x_search',
        // Default: enable image understanding (v4 decision)
        enable_image_understanding: options?.enableImageUnderstanding ?? true,
    };
    // Add optional parameters
    if (options?.fromDate)
        tool.from_date = options.fromDate;
    if (options?.toDate)
        tool.to_date = options.toDate;
    if (options?.enableVideoUnderstanding !== undefined) {
        tool.enable_video_understanding = options.enableVideoUnderstanding;
    }
    if (options?.allowedXHandles) {
        tool.allowed_x_handles = options.allowedXHandles;
    }
    if (options?.excludedXHandles) {
        tool.excluded_x_handles = options.excludedXHandles;
    }
    return tool;
}
// ============================================================================
// Helper Functions
// ============================================================================
/**
 * Validate ISO8601 date format
 *
 * @param dateString - Date string
 * @returns Whether the string is valid ISO8601 format
 */
export function isValidISO8601(dateString) {
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
    if (!iso8601Regex.test(dateString)) {
        return false;
    }
    const date = new Date(dateString);
    return !isNaN(date.getTime());
}
/**
 * Convert date to ISO8601 format
 *
 * @param date - Date object
 * @returns ISO8601 formatted date string
 */
export function toISO8601(date) {
    return date.toISOString();
}
//# sourceMappingURL=tool-builder.js.map