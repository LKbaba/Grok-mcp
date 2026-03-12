/**
 * Logger Module
 *
 * Provides a unified logging interface with different log levels
 */

import { debugMode } from '../config/index.js';

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Format timestamp
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Logger
 */
export const logger = {
  /**
   * Debug log (only outputs in DEBUG mode)
   */
  debug: (message: string, meta?: any) => {
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
  info: (message: string, meta?: any) => {
    console.error(`[${LogLevel.INFO}] ${getTimestamp()} - ${message}`);
    if (meta) {
      console.error(JSON.stringify(meta, null, 2));
    }
  },

  /**
   * Warning log
   */
  warn: (message: string, meta?: any) => {
    console.error(`[${LogLevel.WARN}] ${getTimestamp()} - ${message}`);
    if (meta) {
      console.error(JSON.stringify(meta, null, 2));
    }
  },

  /**
   * Error log
   */
  error: (message: string, error?: Error | any) => {
    console.error(`[${LogLevel.ERROR}] ${getTimestamp()} - ${message}`);
    if (error) {
      if (error instanceof Error) {
        console.error(error.stack || error.message);
      } else {
        console.error(JSON.stringify(error, null, 2));
      }
    }
  },
};

/**
 * Performance monitor
 */
export class PerformanceMonitor {
  private startTime: number;
  private label: string;

  constructor(label: string) {
    this.label = label;
    this.startTime = Date.now();
    logger.debug(`[Perf] ${label} started`);
  }

  /**
   * End monitoring and log duration
   */
  end(meta?: any): number {
    const duration = Date.now() - this.startTime;
    logger.debug(`[Perf] ${this.label} completed, duration: ${duration}ms`, meta);
    return duration;
  }
}

/**
 * Create a performance monitor instance
 */
export function startPerformanceMonitor(label: string): PerformanceMonitor {
  return new PerformanceMonitor(label);
}
