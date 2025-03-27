/**
 * Exception Handling Module Entry
 * Exports all exception types and utilities
 */

// Then export the logger implementation
export * from "./logger";

// Export all exception types
export * from "./types";

// Export exception handler
export * from "./handler";

// Import exception handler
import { ExceptionHandler } from "./handler";

// Exception catching decorator (for class methods)
export function CatchError(
  options: {
    showToast?: boolean;
    silent?: boolean;
    fallbackValue?: any;
  } = {},
) {
  return function (
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      try {
        const result = originalMethod.apply(this, args);

        // If Promise, handle async errors
        if (result instanceof Promise) {
          return result.catch((error) => {
            ExceptionHandler.handle(error, options);
            return options.fallbackValue;
          });
        }

        return result;
      } catch (error) {
        ExceptionHandler.handle(error, options);
        return options.fallbackValue;
      }
    };

    return descriptor;
  };
}

// Utility function - wrap a synchronous function to catch exceptions
export function tryCatch<T>(
  fn: () => T,
  options: {
    showToast?: boolean;
    silent?: boolean;
    fallbackValue?: T;
  } = {},
): T | undefined {
  const { fallbackValue, ...handlerOptions } = options;

  try {
    return fn();
  } catch (error) {
    ExceptionHandler.handle(error, handlerOptions);
    return fallbackValue;
  }
}
