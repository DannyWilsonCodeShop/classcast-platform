import { NextRequest, NextResponse } from 'next/server';
import { reportError } from '@/lib/errorReporter';

export async function POST(request: NextRequest) {
  try {
    const errorData = await request.json();
    const {
      error,
      url,
      userId,
      userAgent,
      timestamp,
      stack,
      component,
      action,
      severity,
      context,
      additionalContext
    } = errorData;

    const allowedSeverity = severity === 'critical' || severity === 'warning' ? severity : 'error';
    const mergedContext = { component, action, ...(additionalContext || {}), ...(context || {}) };
    // Prefer an explicit userId, otherwise try to recover it from context.
    const resolvedUserId = userId || context?.userId || context?.studentId || 'unknown';

    // Report via SNS (SMS) + DynamoDB (persistent log)
    await reportError({
      message: error || 'Unknown error',
      stack: stack || '',
      url: url || '',
      userId: resolvedUserId,
      userAgent: userAgent || '',
      severity: allowedSeverity,
      timestamp: timestamp || new Date().toISOString(),
      context: mergedContext,
    });

    console.log('✅ Error reported:', error?.substring(0, 80));

    return NextResponse.json({
      success: true,
      message: 'Error reported'
    });
  } catch (err) {
    console.error('❌ Error reporting failed:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to report error' },
      { status: 500 }
    );
  }
}
