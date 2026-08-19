/**
 * Logger Module
 *
 * Provides a unified logging interface with different log levels
 */
/**
 * Log levels
 */
export declare enum LogLevel {
    DEBUG = "DEBUG",
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR"
}
/**
 * Logger
 */
export declare const logger: {
    /**
     * Debug log (only outputs in DEBUG mode)
     */
    debug: (message: string, meta?: any) => void;
    /**
     * Info log
     */
    info: (message: string, meta?: any) => void;
    /**
     * Warning log
     */
    warn: (message: string, meta?: any) => void;
    /**
     * Error log
     */
    error: (message: string, error?: Error | any) => void;
};
/**
 * Performance monitor
 */
export declare class PerformanceMonitor {
    private startTime;
    private label;
    constructor(label: string);
    /**
     * End monitoring and log duration
     */
    end(meta?: any): number;
}
/**
 * Create a performance monitor instance
 */
export declare function startPerformanceMonitor(label: string): PerformanceMonitor;
//# sourceMappingURL=logger.d.ts.map