import { NextRequest, NextResponse } from 'next/server';
import ErrorReporter from './errorReporting';

export interface ApiError extends Error {
  statusCode?: number;
  userId?: string;
}

export function withErrorReporting<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      // Extract request info if available
      const request = args.find(arg => arg instanceof NextRequest) as NextRequest | undefined;
      const endpoint = request?.url || 'Unknown endpoint';
      
      // Extract user ID from request if available
      let userId: string | undefined;
      try {
        if (request) {
          const body = await request.clone().json().catch(() => ({}));
          userId = body.userId || body.user?.id;
        }
      } catch {
        // Ignore errors when trying to extract user ID
      }

      // Report the error
      ErrorReporter.reportApiError(
        error instanceof Error ? error : String(error),
        endpoint,
        userId,
        (error as ApiError)?.statusCode
      );

      // Return appropriate error response
      const statusCode = (error as ApiError)?.statusCode || 500;
      const message = error instanceof Error ? error.message : 'Internal server error';
      
      return NextResponse.json(
        { 
          success: false, 
          error: message,
          timestamp: new Date().toISOString()
        },
        { status: statusCode }
      );
    }
  };
}

// Utility function to create API errors with status codes
export function createApiError(message: string, statusCode: number = 500): ApiError {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  return error;
}

// Common API error types
export const ApiErrors = {
  BadRequest: (message: string) => createApiError(message, 400),
  Unauthorized: (message: string = 'Unauthorized') => createApiError(message, 401),
  Forbidden: (message: string = 'Forbidden') => createApiError(message, 403),
  NotFound: (message: string = 'Not found') => createApiError(message, 404),
  Conflict: (message: string) => createApiError(message, 409),
  ValidationError: (message: string) => createApiError(message, 422),
  InternalError: (message: string = 'Internal server error') => createApiError(message, 500),
};