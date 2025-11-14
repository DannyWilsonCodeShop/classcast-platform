// Error reporting utility for sending bug reports via email

interface ErrorReport {
  error: Error | string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  page?: string;
  userAgent?: string;
  timestamp?: string;
  additionalContext?: Record<string, any>;
}

export class ErrorReporter {
  private static instance: ErrorReporter;
  private adminEmail = process.env.ADMIN_EMAIL || 'admin@classcast.com';
  
  static getInstance(): ErrorReporter {
    if (!ErrorReporter.instance) {
      ErrorReporter.instance = new ErrorReporter();
    }
    return ErrorReporter.instance;
  }

  async reportError(report: ErrorReport): Promise<void> {
    try {
      // Prepare error details
      const errorDetails = {
        error: report.error instanceof Error ? report.error.message : report.error,
        stack: report.error instanceof Error ? report.error.stack : undefined,
        userId: report.userId,
        userEmail: report.userEmail,
        userName: report.userName,
        url: report.page || window?.location?.href,
        userAgent: report.userAgent || navigator?.userAgent,
        timestamp: report.timestamp || new Date().toISOString(),
        component: report.additionalContext?.type || 'Unknown',
        action: report.additionalContext?.description || 'Error occurred',
        additionalContext: report.additionalContext
      };

      // Send to error reporting API
      await fetch('/api/error-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorDetails)
      });

      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error reported:', errorDetails);
      }
    } catch (reportingError) {
      // Fallback: log to console if reporting fails
      console.error('Failed to report error:', reportingError);
      console.error('Original error:', report.error);
    }
  }

  // Convenience method for React components
  reportReactError(error: Error, errorInfo: any, userId?: string, userEmail?: string, userName?: string): void {
    this.reportError({
      error,
      userId,
      userEmail,
      userName,
      additionalContext: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      }
    });
  }

  // Convenience method for API errors
  reportApiError(error: Error | string, endpoint: string, userId?: string, statusCode?: number): void {
    this.reportError({
      error,
      userId,
      additionalContext: {
        endpoint,
        statusCode,
        type: 'API_ERROR'
      }
    });
  }

  // Method for user-reported bugs
  reportUserBug(description: string, userId?: string, userEmail?: string, userName?: string, steps?: string[]): void {
    this.reportError({
      error: `User-reported bug: ${description}`,
      userId,
      userEmail,
      userName,
      additionalContext: {
        type: 'USER_REPORTED',
        description,
        stepsToReproduce: steps
      }
    });
  }
}

// Global error handler for unhandled errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    ErrorReporter.getInstance().reportError({
      error: event.error || event.message,
      additionalContext: {
        type: 'UNHANDLED_ERROR',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    });
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    ErrorReporter.getInstance().reportError({
      error: event.reason,
      additionalContext: {
        type: 'UNHANDLED_PROMISE_REJECTION'
      }
    });
  });
}

export default ErrorReporter.getInstance();