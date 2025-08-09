/**
 * Error types and utilities for the Dev Assistant API client
 */

import { DevAssistantError } from './client';

/**
 * Union type of all possible errors that can be thrown by the SDK
 */
export type DevAssistantClientError = DevAssistantError | NetworkError | ValidationError;

/**
 * Error thrown when network-related issues occur
 */
export class NetworkError extends Error {
  public readonly originalError?: Error;

  constructor(message: string, originalError?: Error) {
    super(message);
    this.name = 'NetworkError';
    this.originalError = originalError;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NetworkError);
    }
  }
}

/**
 * Error thrown when request validation fails
 */
export class ValidationError extends Error {
  public readonly field?: string;
  public readonly value?: any;

  constructor(message: string, field?: string, value?: any) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
}

/**
 * Utility function to check if an error is a DevAssistantError
 */
export function isDevAssistantError(error: any): error is DevAssistantError {
  return error instanceof DevAssistantError;
}

/**
 * Utility function to check if an error is a NetworkError
 */
export function isNetworkError(error: any): error is NetworkError {
  return error instanceof NetworkError;
}

/**
 * Utility function to check if an error is a ValidationError
 */
export function isValidationError(error: any): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Utility function to get a user-friendly error message
 */
export function getErrorMessage(error: any): string {
  if (isDevAssistantError(error)) {
    return `API Error (${error.code}): ${error.message}`;
  }
  
  if (isNetworkError(error)) {
    return `Network Error: ${error.message}`;
  }
  
  if (isValidationError(error)) {
    return `Validation Error: ${error.message}`;
  }
  
  return `Unknown Error: ${error.message || 'An unknown error occurred'}`;
}

/**
 * Utility function to retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry validation errors
      if (isValidationError(error)) {
        throw error;
      }
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) * (0.5 + Math.random() * 0.5);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}