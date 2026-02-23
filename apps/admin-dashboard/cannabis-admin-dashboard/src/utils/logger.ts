/**
 * Logger Utility
 * Centralized logging with levels and environment-aware output
 */

import { env } from '../config/env';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  data?: any;
  context?: string;
}

class Logger {
  private minLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs = 100; // Keep last 100 logs in memory

  constructor() {
    // Set minimum log level based on environment
    this.minLevel = env.isDev ? LogLevel.DEBUG : LogLevel.WARN;
  }

  /**
   * Log debug message (dev only)
   */
  debug(message: string, data?: any, context?: string) {
    this.log(LogLevel.DEBUG, message, data, context);
  }

  /**
   * Log informational message
   */
  info(message: string, data?: any, context?: string) {
    this.log(LogLevel.INFO, message, data, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: any, context?: string) {
    this.log(LogLevel.WARN, message, data, context);
  }

  /**
   * Log error message
   */
  error(message: string, error?: any, context?: string) {
    this.log(LogLevel.ERROR, message, error, context);
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, message: string, data?: any, context?: string) {
    // Don't log if below minimum level
    if (level < this.minLevel) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      data,
      context,
    };

    // Store in memory
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }

    // Output to console with appropriate method
    this.outputToConsole(entry);

    // TODO: Send errors to error tracking service (e.g., Sentry)
    if (level === LogLevel.ERROR && !env.isDev) {
      this.sendToErrorTracking(entry);
    }
  }

  /**
   * Output log entry to console
   */
  private outputToConsole(entry: LogEntry) {
    const prefix = entry.context ? `[${entry.context}]` : '';
    const timestamp = env.isDev ? `[${entry.timestamp.toISOString()}]` : '';
    const fullMessage = `${timestamp} ${prefix} ${entry.message}`.trim();

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(fullMessage, entry.data || '');
        break;
      case LogLevel.INFO:
        console.info(fullMessage, entry.data || '');
        break;
      case LogLevel.WARN:
        console.warn(fullMessage, entry.data || '');
        break;
      case LogLevel.ERROR:
        console.error(fullMessage, entry.data || '');
        if (entry.data instanceof Error) {
          console.error(entry.data.stack);
        }
        break;
    }
  }

  /**
   * Send error to tracking service
   */
  private sendToErrorTracking(entry: LogEntry) {
    // TODO: Implement error tracking service integration
    // Example: Sentry.captureException(entry.data)
  }

  /**
   * Get recent logs (for debugging)
   */
  getRecentLogs(count: number = 10): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Clear all stored logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Set minimum log level
   */
  setMinLevel(level: LogLevel) {
    this.minLevel = level;
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience methods
export const log = {
  debug: (message: string, data?: any, context?: string) =>
    logger.debug(message, data, context),
  info: (message: string, data?: any, context?: string) =>
    logger.info(message, data, context),
  warn: (message: string, data?: any, context?: string) =>
    logger.warn(message, data, context),
  error: (message: string, error?: any, context?: string) =>
    logger.error(message, error, context),
};

export default logger;
