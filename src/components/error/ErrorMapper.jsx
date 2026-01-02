/**
 * Centralized error mapping and sanitization
 * Converts internal errors to user-friendly messages
 */

export class AppError extends Error {
  constructor(message, code, userMessage) {
    super(message);
    this.code = code;
    this.userMessage = userMessage;
    this.name = 'AppError';
  }
}

// Error code to user-friendly message mapping
const ERROR_MESSAGES = {
  // Authentication
  'AUTH_REQUIRED': 'Please sign in to continue.',
  'AUTH_EXPIRED': 'Your session has expired. Please sign in again.',
  'AUTH_FORBIDDEN': 'You don\'t have permission to access this resource.',
  
  // Data/Network
  'NETWORK_ERROR': 'Unable to connect. Please check your internet connection.',
  'DATA_NOT_FOUND': 'The requested data could not be found.',
  'DATA_INVALID': 'The provided data is invalid. Please check and try again.',
  
  // Operations
  'OPERATION_FAILED': 'The operation could not be completed. Please try again.',
  'RATE_LIMIT': 'Too many requests. Please wait a moment and try again.',
  'SERVER_ERROR': 'Something went wrong on our end. Please try again later.',
  
  // Validation
  'VALIDATION_ERROR': 'Please check your input and try again.',
  'MISSING_REQUIRED': 'Required information is missing.',
  
  // Payment
  'PAYMENT_FAILED': 'Payment could not be processed. Please try again.',
  'INSUFFICIENT_FUNDS': 'Insufficient balance to complete this transaction.',
  
  // Generic
  'UNKNOWN': 'An unexpected error occurred. Please try again.',
};

/**
 * Map error to user-friendly message
 * @param {Error|string} error - The error object or message
 * @returns {Object} { userMessage, code, canRetry, originalError }
 */
export function mapError(error) {
  // Handle string errors
  if (typeof error === 'string') {
    return {
      userMessage: error,
      code: 'CUSTOM',
      canRetry: false,
      originalError: error
    };
  }

  // Handle AppError instances
  if (error instanceof AppError) {
    return {
      userMessage: error.userMessage,
      code: error.code,
      canRetry: true,
      originalError: error
    };
  }

  // Handle standard errors
  const errorMessage = error?.message || String(error);
  const errorCode = error?.code || 'UNKNOWN';

  // Match against known patterns
  if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
    return {
      userMessage: ERROR_MESSAGES.AUTH_REQUIRED,
      code: 'AUTH_REQUIRED',
      canRetry: false,
      originalError: error
    };
  }

  if (errorMessage.includes('Forbidden') || errorMessage.includes('403')) {
    return {
      userMessage: ERROR_MESSAGES.AUTH_FORBIDDEN,
      code: 'AUTH_FORBIDDEN',
      canRetry: false,
      originalError: error
    };
  }

  if (errorMessage.includes('Not Found') || errorMessage.includes('404')) {
    return {
      userMessage: ERROR_MESSAGES.DATA_NOT_FOUND,
      code: 'DATA_NOT_FOUND',
      canRetry: false,
      originalError: error
    };
  }

  if (errorMessage.includes('Network') || errorMessage.includes('fetch failed')) {
    return {
      userMessage: ERROR_MESSAGES.NETWORK_ERROR,
      code: 'NETWORK_ERROR',
      canRetry: true,
      originalError: error
    };
  }

  if (errorMessage.includes('Rate limit') || errorMessage.includes('429')) {
    return {
      userMessage: ERROR_MESSAGES.RATE_LIMIT,
      code: 'RATE_LIMIT',
      canRetry: true,
      originalError: error
    };
  }

  if (errorMessage.includes('500') || errorMessage.includes('Internal')) {
    return {
      userMessage: ERROR_MESSAGES.SERVER_ERROR,
      code: 'SERVER_ERROR',
      canRetry: true,
      originalError: error
    };
  }

  // Default fallback
  return {
    userMessage: ERROR_MESSAGES.UNKNOWN,
    code: 'UNKNOWN',
    canRetry: true,
    originalError: error
  };
}

/**
 * Log error safely (only in development)
 */
export function logError(error, context = '') {
  if (import.meta.env.DEV) {
    console.error(`[${context || 'Error'}]:`, error);
  }
}

/**
 * Create a standardized error object for API responses
 */
export function createErrorResponse(error) {
  const mapped = mapError(error);
  
  return {
    success: false,
    error: mapped.userMessage,
    code: mapped.code,
    canRetry: mapped.canRetry
  };
}