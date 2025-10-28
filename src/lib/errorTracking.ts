/**
 * Error Tracking Utility
 * Sends error reports to the admin via email
 */

interface ErrorData {
  error: string;
  url: string;
  userId?: string;
  userAgent?: string;
  timestamp?: string;
  stack?: string;
  component?: string;
  action?: string;
}

/**
 * Report an error to the admin
 */
export async function reportError(errorData: ErrorData) {
  try {
    // Don't block the user's experience
    fetch('/api/error-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...errorData,
        timestamp: errorData.timestamp || new Date().toISOString(),
      })
    }).catch(err => {
      console.error('Failed to send error report:', err);
    });
  } catch (error) {
    console.error('Error reporting failed:', error);
  }
}

/**
 * Wrap an async function with error tracking
 */
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  component: string,
  action: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      
      reportError({
        error: errorMessage,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        stack,
        component,
        action,
      });
      
      throw error;
    }
  }) as T;
}

