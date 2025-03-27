/**
 * Logging Utility
 * Provides a unified logging interface that can be configured for different environments
 */

// Log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

// Log entry interface
interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: unknown;
}

// Logger class
export class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  /**
   * Log debug level message
   */
  debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Log info level message
   */
  info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Log warning level message
   */
  warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Log error level message
   */
  error(message: string, data?: unknown): void {
    this.log(LogLevel.ERROR, message, data);
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
      case LogLevel.DEBUG:
        console.debug(`[${timestamp}] [DEBUG] ${message}`, data ?? '');
        break;
      case LogLevel.INFO:
        console.info(`[${timestamp}] [INFO] ${message}`, data ?? '');
        break;
      case LogLevel.WARN:
        console.warn(`[${timestamp}] [WARN] ${message}`, data ?? '');
        break;
      case LogLevel.ERROR:
        console.error(`[${timestamp}] [ERROR] ${message}`, data ?? '');
        break;
      default:
        console.log(`[${timestamp}] [${String(level)}] ${message}`, data ?? '');
    }
  }
}

// Export default singleton instance
export const logger = new Logger();
