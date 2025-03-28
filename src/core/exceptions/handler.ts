/**
 * Exception Handler
 * Handles different types of exceptions with unified error handling logic
 */

import { BaseException } from "./types";

import { logger } from "./index";

/**
 * Exception Handler
 * Provides unified error handling for different types of exceptions
 */
export class ExceptionHandler {
  /**
   * Handle an exception
   * @param error The error object
   * @param options Handling options
   */
  static handle(error: unknown): Error {
    // Ensure we're dealing with an Error object
    const normalizedError = this.normalizeError(error);
    this.logError(normalizedError);

    return normalizedError;
  }

  /**
   * Normalize any error object to an Error instance
   */
  private static normalizeError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }

    if (typeof error === "string") {
      return new Error(error);
    }

    if (error === null || error === undefined) {
      return new Error("Unknown error");
    }

    try {
      return new Error(JSON.stringify(error));
    } catch {
      return new Error("Error object cannot be serialized");
    }
  }

  /**
   * Log the error
   */
  private static logError(error: Error): void {
    if (error instanceof BaseException) {
      logger.error(`[${error.name}] ${error.message}`, {
        cause: error.cause,
        metadata: error.metadata,
      });
      return;
    }

    logger.error(error.message, { error });
  }

  /**
   * Catch exceptions in async functions
   * @param fn Async function to execute
   * @param options Exception handling options
   */
  static async tryAsync<T>(
    fn: () => Promise<T>,
    options: {
      fallbackValue?: T;
    } = {},
  ): Promise<T | undefined> {
    const { fallbackValue } = options;

    try {
      return await fn();
    } catch (error) {
      this.handle(error);
      return fallbackValue;
    }
  }
}
