/**
 * Exception Handler
 * Handles different types of exceptions with unified error handling logic
 */

import {
  ApiException,
  AuthException,
  BaseException,
  BusinessException,
  NetworkException,
  UnexpectedException,
  WorkflowException,
} from "./types";

import { logger } from "./index";

// Error notification type
export type ErrorNotificationFn = (
  errorType: string,
  message: string,
  details?: Record<string, unknown>,
) => void;

// Default no-op notification function
const noopNotification: ErrorNotificationFn = () => {
  // No operation, intentionally empty
};

/**
 * Exception Handler
 * Provides unified error handling for different types of exceptions
 */
export class ExceptionHandler {
  // Global notification handler
  private static notificationHandler: ErrorNotificationFn = noopNotification;

  /**
   * Set a global notification handler
   * @param handler Notification function to use globally
   */
  static setGlobalNotificationHandler(handler: ErrorNotificationFn): void {
    this.notificationHandler = handler;
  }

  /**
   * Handle an exception
   * @param error The error object
   * @param options Handling options
   */
  static handle(
    error: unknown,
    options: {
      showToast?: boolean;
      silent?: boolean;
      redirect?: string;
      callback?: (error: Error) => void;
      notificationFn?: ErrorNotificationFn;
    } = {},
  ): Error {
    const {
      showToast = true,
      silent = false,
      redirect,
      callback,
      notificationFn = this.notificationHandler,
    } = options;

    // Ensure we're dealing with an Error object
    const normalizedError = this.normalizeError(error);

    // Log the error
    if (!silent) {
      this.logError(normalizedError);
    }

    // Show notification
    if (showToast) {
      this.showErrorNotification(normalizedError, notificationFn);
    }

    // Execute callback
    if (callback && typeof callback === "function") {
      callback(normalizedError);
    }

    // Redirect if needed
    if (redirect) {
      // Only in browser environment
      if (typeof window !== "undefined") {
        window.location.href = redirect;
      }
    }

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
   * Show appropriate notification based on error type
   */
  private static showErrorNotification(
    error: Error,
    notificationFn: ErrorNotificationFn,
  ): void {
    // Customize message based on error type
    if (error instanceof ApiException) {
      notificationFn("API Error", error.message, {
        statusCode: error.statusCode,
      });
    } else if (error instanceof NetworkException) {
      notificationFn("Network Error", error.message, error.metadata);
    } else if (error instanceof AuthException) {
      notificationFn("Authentication Error", error.message, error.metadata);
    } else if (error instanceof BusinessException) {
      notificationFn("Business Error", error.message, error.metadata);
    } else if (error instanceof WorkflowException) {
      notificationFn("Workflow Error", error.message, error.metadata);
    } else if (error instanceof UnexpectedException) {
      notificationFn("Unexpected Error", error.message, error.metadata);
    } else {
      notificationFn("Error", error.message);
    }
  }

  /**
   * Catch exceptions in async functions
   * @param fn Async function to execute
   * @param options Exception handling options
   */
  static async tryAsync<T>(
    fn: () => Promise<T>,
    options: {
      showToast?: boolean;
      silent?: boolean;
      fallbackValue?: T;
      callback?: (error: Error) => void;
      notificationFn?: ErrorNotificationFn;
    } = {},
  ): Promise<T | undefined> {
    const { fallbackValue, ...handlerOptions } = options;

    try {
      return await fn();
    } catch (error) {
      this.handle(error, handlerOptions);
      return fallbackValue;
    }
  }
}
