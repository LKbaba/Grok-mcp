/**
 * 日志模块
 *
 * 提供统一的日志记录接口，支持不同级别的日志输出
 */

import { debugMode } from '../config/index.js';

/**
 * 日志级别
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * 格式化时间戳
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * 日志记录器
 */
export const logger = {
  /**
   * 调试日志（仅在 DEBUG 模式下输出）
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
   * 信息日志
   */
  info: (message: string, meta?: any) => {
    console.error(`[${LogLevel.INFO}] ${getTimestamp()} - ${message}`);
    if (meta) {
      console.error(JSON.stringify(meta, null, 2));
    }
  },

  /**
   * 警告日志
   */
  warn: (message: string, meta?: any) => {
    console.error(`[${LogLevel.WARN}] ${getTimestamp()} - ${message}`);
    if (meta) {
      console.error(JSON.stringify(meta, null, 2));
    }
  },

  /**
   * 错误日志
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
 * 性能监控工具
 */
export class PerformanceMonitor {
  private startTime: number;
  private label: string;

  constructor(label: string) {
    this.label = label;
    this.startTime = Date.now();
    logger.debug(`[性能监控] ${label} 开始`);
  }

  /**
   * 结束监控并记录耗时
   */
  end(meta?: any): number {
    const duration = Date.now() - this.startTime;
    logger.debug(`[性能监控] ${this.label} 完成，耗时: ${duration}ms`, meta);
    return duration;
  }
}

/**
 * 创建性能监控实例
 */
export function startPerformanceMonitor(label: string): PerformanceMonitor {
  return new PerformanceMonitor(label);
}
