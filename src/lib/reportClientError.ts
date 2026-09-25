// Lightweight client-side error reporter for the student record/upload/post flow.
// Fires-and-forgets to /api/error-report which logs to the classcast-error-logs
// DynamoDB table (30-day TTL) and optionally sends an SMS for error/critical severity.
//
// This captures HANDLED errors (caught in try/catch and shown to the user) that the
// global window.onerror handler never sees — e.g. failed uploads, submission saves,
// YouTube/Drive link posts, thumbnail generation, camera/recording failures.

export type ClientErrorSeverity = 'critical' | 'error' | 'warning';

interface ReportOptions {
  step: string; // e.g. 'multipart-init', 's3-part-put', 'submission-save', 'presign', 'record-camera'
  error: unknown;
  severity?: ClientErrorSeverity;
  context?: Record<string, any>;
}

export function reportClientError({ step, error, severity = 'error', context = {} }: ReportOptions): void {
  try {
    const message =
      error instanceof Error ? error.message : typeof error === 'string' ? error : JSON.stringify(error);
    const stack = error instanceof Error ? error.stack : undefined;

    const payload = {
      error: `[record:${step}] ${message}`,
      stack: stack || '',
      severity,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      context: { step, ...context },
    };

    // Fire and forget — never block or throw from the reporter itself.
    if (typeof fetch !== 'undefined') {
      fetch('/api/error-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true, // allow the report to complete even if the page navigates away
      }).catch(() => {});
    }
  } catch {
    // Swallow — logging must never break the user flow.
  }
}
