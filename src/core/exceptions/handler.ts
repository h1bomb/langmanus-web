/**
 * Exception Handler
 * Handles different types of exceptions with unified error handling logic
 */

import { toast } from 'sonner';

import { logger } from './logger';
import { 
  ApiException,
  AuthException,
  BaseException,
  BusinessException,
  NetworkException,
  UnexpectedException,
  WorkflowException 
} from './types';

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
  static handle(
    error: unknown, 
    options: { 
      showToast?: boolean;
      silent?: boolean; 
      redirect?: string;
      callback?: (error: Error) => void;
    } = {}
  ): Error {
    const { showToast = true, silent = false, redirect, callback } = options;
    
    // Ensure we're dealing with an Error object
    const normalizedError = this.normalizeError(error);
    
    // Log the error
    if (!silent) {
      this.logError(normalizedError);
    }
    
    // Show toast notification
    if (showToast) {
      this.showErrorNotification(normalizedError);
    }
    
    // Execute callback
    if (callback && typeof callback === 'function') {
      callback(normalizedError);
    }
    
    // Redirect if needed
    if (redirect) {
      // Only in browser environment
      if (typeof window !== 'undefined') {
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
    
    if (typeof error === 'string') {
      return new Error(error);
    }
    
    if (error === null || error === undefined) {
      return new Error('Unknown error');
    }
    
    try {
      return new Error(JSON.stringify(error));
    } catch {
      return new Error('Error object cannot be serialized');
    }
  }
  
  /**
   * Log the error
   */
  private static logError(error: Error): void {
    if (error instanceof BaseException) {
      logger.error(`[${error.name}] ${error.message}`, {
        cause: error.cause,
        metadata: error.metadata
      });
      return;
    }
    
    logger.error(error.message, { error });
  }
  
  /**
   * Show appropriate notification based on error type
   */
  private static showErrorNotification(error: Error): void {
    // Customize message based on error type
    if (error instanceof ApiException) {
      toast.error(`API Error (${error.statusCode}): ${error.message}`);
    } else if (error instanceof NetworkException) {
      toast.error(`Network Error: ${error.message}`);
    } else if (error instanceof AuthException) {
      toast.error(`Authentication Error: ${error.message}`);
    } else if (error instanceof BusinessException) {
      toast.error(`Business Error: ${error.message}`);
    } else if (error instanceof WorkflowException) {
      toast.error(`Workflow Error: ${error.message}`);
    } else if (error instanceof UnexpectedException) {
      toast.error(`Unexpected Error: ${error.message}`);
    } else {
      toast.error(`Error: ${error.message}`);
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
    } = {}
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
