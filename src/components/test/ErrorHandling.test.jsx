import { describe, it, expect, vi } from 'vitest';
import { mapError, AppError } from '../error/ErrorMapper';

describe('Error Handling System', () => {
  it('should map network errors to user-friendly messages', () => {
    const networkError = new Error('Failed to fetch');
    const mapped = mapError(networkError);

    expect(mapped.userMessage).toContain('connect');
    expect(mapped.code).toBe('NETWORK_ERROR');
    expect(mapped.canRetry).toBe(true);
  });

  it('should map 401 errors to authentication messages', () => {
    const authError = { response: { status: 401 } };
    const mapped = mapError(authError);

    expect(mapped.userMessage).toContain('sign in');
    expect(mapped.code).toBe('AUTH_REQUIRED');
  });

  it('should map 403 errors to permission messages', () => {
    const forbiddenError = { response: { status: 403 } };
    const mapped = mapError(forbiddenError);

    expect(mapped.userMessage).toContain('permission');
    expect(mapped.code).toBe('FORBIDDEN');
  });

  it('should handle AppError instances correctly', () => {
    const appError = new AppError('VALIDATION_ERROR', 'Invalid input', false);
    const mapped = mapError(appError);

    expect(mapped.code).toBe('VALIDATION_ERROR');
    expect(mapped.userMessage).toBe('Invalid input');
    expect(mapped.canRetry).toBe(false);
  });

  it('should provide generic message for unknown errors', () => {
    const unknownError = { message: 'Something weird happened' };
    const mapped = mapError(unknownError);

    expect(mapped.userMessage).toContain('unexpected');
    expect(mapped.code).toBe('UNKNOWN_ERROR');
  });
});