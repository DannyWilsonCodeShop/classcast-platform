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

// Detects the "stale deploy" error: after we ship a new build, a page still running
// the old build tries to fetch JS chunks that no longer exist. A one-time reload
// pulls the new build and fixes it. Guarded so it can never loop.
function isChunkLoadError(err: any): boolean {
  const msg = (err && (err.message || err.toString?.())) || String(err || '');
  const name = err?.name || '';
  return (
    name === 'ChunkLoadError' ||
    /Loading chunk [\w-]+ failed/i.test(msg) ||
    /Loading CSS chunk/i.test(msg) ||
    /failed to fetch dynamically imported module/i.test(msg) ||
    /importing a module script failed/i.test(msg)
  );
}

const CHUNK_RELOAD_KEY = 'classcast_chunk_reloaded_at';

function handleStaleChunk(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const last = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || '0');
    // Only auto-reload once per 60s window to avoid reload loops if it's not actually stale.
    if (Date.now() - last < 60000) return false;
    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
    window.location.reload();
    return true;
  } catch {
    return false;
  }
}

// Global error handler for unhandled errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (isChunkLoadError(event.error || event.message)) {
      handleStaleChunk(); // reload to get the new build; don't log as an error
      return;
    }
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
    if (isChunkLoadError(event.reason)) {
      handleStaleChunk();
      return;
    }
    ErrorReporter.getInstance().reportError({
      error: event.reason,
      additionalContext: {
        type: 'UNHANDLED_PROMISE_REJECTION'
      }
    });
  });
}

export default ErrorReporter.getInstance();