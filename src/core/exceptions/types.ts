/**
 * Exception Type Definitions
 */

// Base Exception Class
export class BaseException extends Error {
  public readonly name: string;
  public readonly cause?: Error;
  public readonly metadata?: Record<string, unknown>;

  constructor(message: string, options?: { cause?: Error; metadata?: Record<string, unknown> }) {
    super(message);
    this.name = this.constructor.name;
    this.cause = options?.cause;
    this.metadata = options?.metadata;
    
    // Ensure correct prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// API Related Exceptions
export class ApiException extends BaseException {
  public readonly statusCode: number;
  
  constructor(
    message: string, 
    statusCode = 500, 
    options?: { cause?: Error; metadata?: Record<string, unknown> }
  ) {
    super(message, options);
    this.statusCode = statusCode;
  }
}

// Network Exceptions
export class NetworkException extends BaseException {
  constructor(message = "Network connection failed", options?: { cause?: Error; metadata?: Record<string, unknown> }) {
    super(message, options);
  }
}

// Authentication Exceptions
export class AuthException extends BaseException {
  constructor(message = "Authentication failed or invalid credentials", options?: { cause?: Error; metadata?: Record<string, unknown> }) {
    super(message, options);
  }
}

// Business Logic Exceptions
export class BusinessException extends BaseException {
  constructor(message: string, options?: { cause?: Error; metadata?: Record<string, unknown> }) {
    super(message, options);
  }
}

// Workflow Exceptions
export class WorkflowException extends BaseException {
  constructor(message: string, options?: { cause?: Error; metadata?: Record<string, unknown> }) {
    super(message, options);
  }
}

// Unexpected Exceptions
export class UnexpectedException extends BaseException {
  constructor(message = "An unexpected error occurred", options?: { cause?: Error; metadata?: Record<string, unknown> }) {
    super(message, options);
  }
}
