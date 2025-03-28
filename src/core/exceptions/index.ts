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
export function CatchError<R = unknown, Args extends unknown[] = unknown[]>(
  options: {
    fallbackValue?: R;
  } = {},
) {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    if (!originalMethod) return descriptor;

    const className = target.constructor.name;

    descriptor.value = function (this: unknown, ...args: Args): R | Promise<R> {
      try {
        const result = originalMethod.apply(this, args);

        // If Promise, handle async errors
        if (result instanceof Promise) {
          return result.catch((error: unknown) => {
            // Use class name and method name to enhance error message
            const errorMessage =
              error instanceof Error ? error.message : String(error);

            const enhancedError = new Error(
              `Error in ${className}.${propertyKey}: ${errorMessage}`,
            );

            if (error instanceof Error && error.stack) {
              enhancedError.stack = error.stack;
            }

            ExceptionHandler.handle(enhancedError);
            return options.fallbackValue as R;
          });
        }

        return result;
      } catch (error: unknown) {
        // 使用类名和方法名增强错误信息
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        const enhancedError = new Error(
          `Error in ${className}.${propertyKey}: ${errorMessage}`,
        );

        if (error instanceof Error && error.stack) {
          enhancedError.stack = error.stack;
        }

        ExceptionHandler.handle(enhancedError);
        return options.fallbackValue as R;
      }
    };

    return descriptor;
  };
}

// Utility function - wrap a synchronous function to catch exceptions
export function tryCatch<T>(
  fn: () => T,
  options: {
    fallbackValue?: T;
  } = {},
): T | undefined {
  const { fallbackValue } = options;

  try {
    return fn();
  } catch (error: unknown) {
    ExceptionHandler.handle(error);
    return fallbackValue;
  }
}
