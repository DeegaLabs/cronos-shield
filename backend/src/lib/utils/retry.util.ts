/**
 * Retry Utility
 * 
 * Utility for retrying failed operations
 */

export interface RetryOptions {
  maxRetries?: number;
  delay?: number;
  backoff?: number;
  retryCondition?: (error: any) => boolean;
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = 2,
    retryCondition = () => true,
  } = options;

  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry if condition is not met
      if (!retryCondition(error)) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retrying (exponential backoff)
      const waitTime = delay * Math.pow(backoff, attempt);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError;
}

/**
 * Check if error is retryable (network errors, timeouts, 5xx)
 */
export function isRetryableError(error: any): boolean {
  // Network errors
  if (!error.response) {
    return true;
  }
  
  // 5xx server errors
  if (error.response.status >= 500 && error.response.status < 600) {
    return true;
  }
  
  // 408 Request Timeout
  if (error.response.status === 408) {
    return true;
  }
  
  // 429 Too Many Requests
  if (error.response.status === 429) {
    return true;
  }
  
  return false;
}
