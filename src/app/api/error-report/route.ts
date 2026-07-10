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
      additionalContext
    } = errorData;

    // Report via SNS (SMS) + DynamoDB (persistent log)
    await reportError({
      message: error || 'Unknown error',
      stack: stack || '',
      url: url || '',
      userId: userId || 'unknown',
      userAgent: userAgent || '',
      severity: 'error',
      timestamp: timestamp || new Date().toISOString(),
      context: { component, action, ...additionalContext },
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
