/**
 * Logging Utility
 * Provides a unified logging interface that can be configured for different environments
 */

import type { ILogger, LogLevel } from "./types";
import { LogLevel as LogLevelEnum } from "./types";

// Log entry interface
interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: unknown;
}

// Logger class
export class Logger implements ILogger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== "production";
  }

  /**
   * Log debug level message
   */
  debug(message: string, data?: unknown): void {
    this.log(LogLevelEnum.DEBUG, message, data);
  }

  /**
   * Log info level message
   */
  info(message: string, data?: unknown): void {
    this.log(LogLevelEnum.INFO, message, data);
  }

  /**
   * Log warning level message
   */
  warn(message: string, data?: unknown): void {
    this.log(LogLevelEnum.WARN, message, data);
  }

  /**
   * Log error level message
   */
  error(message: string, data?: unknown): void {
    this.log(LogLevelEnum.ERROR, message, data);
  }

  /**
   * Generic logging method
   */
  private log(level: LogLevel, message: string, data?: unknown): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
    };

    // In development, output directly to console
    if (this.isDevelopment) {
      this.writeToConsole(entry);
    }

    // In production, we can add other logging logic
    // For example: send to a remote logging service, write to file, etc.
    if (!this.isDevelopment) {
      // TODO: Implement production logging logic
      // Could integrate with third-party services such as Sentry
    }
  }

  /**
   * Output log to console
   */
  private writeToConsole(entry: LogEntry): void {
    const { level, message, timestamp, data } = entry;

    // Choose different console methods based on log level
    switch (level) {
      case LogLevelEnum.DEBUG:
        console.debug(`[${timestamp}] [DEBUG] ${message}`, data ?? "");
        break;
      case LogLevelEnum.INFO:
        console.info(`[${timestamp}] [INFO] ${message}`, data ?? "");
        break;
      case LogLevelEnum.WARN:
        console.warn(`[${timestamp}] [WARN] ${message}`, data ?? "");
        break;
      case LogLevelEnum.ERROR:
        console.error(`[${timestamp}] [ERROR] ${message}`, data ?? "");
        break;
      default:
        console.log(`[${timestamp}] [${String(level)}] ${message}`, data ?? "");
    }
  }
}

// Export default singleton instance
export const logger = new Logger();
