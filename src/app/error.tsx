'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report the error to our monitoring system
    fetch('/api/error-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.message,
        stack: error.stack,
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        timestamp: new Date().toISOString(),
        component: 'global-error-boundary',
        action: 'unhandled-crash',
      }),
    }).catch(() => {});
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-3">😞</div>
        <h2 className="text-lg font-bold text-[#005587] mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-600 mb-4">
          An unexpected error occurred. Our team has been notified.
        </p>
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-[#005587] text-white rounded-xl text-sm font-bold"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
