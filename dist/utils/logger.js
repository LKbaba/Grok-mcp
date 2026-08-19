/**
 * Logger Module
 *
 * Provides a unified logging interface with different log levels
 */
import { debugMode } from '../config/index.js';
/**
 * Log levels
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "DEBUG";
    LogLevel["INFO"] = "INFO";
    LogLevel["WARN"] = "WARN";
    LogLevel["ERROR"] = "ERROR";
})(LogLevel || (LogLevel = {}));
/**
 * Format timestamp
 */
function getTimestamp() {
    return new Date().toISOString();
}
/**
 * Logger
 */
export const logger = {
    /**
     * Debug log (only outputs in DEBUG mode)
     */
    debug: (message, meta) => {
        if (debugMode) {
            console.error(`[${LogLevel.DEBUG}] ${getTimestamp()} - ${message}`);
            if (meta) {
                console.error(JSON.stringify(meta, null, 2));
            }
        }
    },
    /**
     * Info log
     */
    info: (message, meta) => {
        console.error(`[${LogLevel.INFO}] ${getTimestamp()} - ${message}`);
        if (meta) {
            console.error(JSON.stringify(meta, null, 2));
        }
    },
    /**
     * Warning log
     */
    warn: (message, meta) => {
        console.error(`[${LogLevel.WARN}] ${getTimestamp()} - ${message}`);
        if (meta) {
            console.error(JSON.stringify(meta, null, 2));
        }
    },
    /**
     * Error log
     */
    error: (message, error) => {
        console.error(`[${LogLevel.ERROR}] ${getTimestamp()} - ${message}`);
        if (error) {
            if (error instanceof Error) {
                console.error(error.stack || error.message);
            }
            else {
                console.error(JSON.stringify(error, null, 2));
            }
        }
    },
};
/**
 * Performance monitor
 */
export class PerformanceMonitor {
    startTime;
    label;
    constructor(label) {
        this.label = label;
        this.startTime = Date.now();
        logger.debug(`[Perf] ${label} started`);
    }
    /**
     * End monitoring and log duration
     */
    end(meta) {
        const duration = Date.now() - this.startTime;
        logger.debug(`[Perf] ${this.label} completed, duration: ${duration}ms`, meta);
        return duration;
    }
}
/**
 * Create a performance monitor instance
 */
export function startPerformanceMonitor(label) {
    return new PerformanceMonitor(label);
}
//# sourceMappingURL=logger.js.map