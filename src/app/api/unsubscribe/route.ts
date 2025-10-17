import { NextRequest, NextResponse } from 'next/server';
import { unsubscribeFromEmails } from '@/lib/notificationPreferences';

/**
 * GET /api/unsubscribe?userId=xxx&token=xxx
 * Unsubscribe user from all email notifications
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const token = searchParams.get('token');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // TODO: Validate token for security
    // For now, we'll allow unsubscribe with just userId
    // In production, you'd want to generate and validate a secure token

    const success = await unsubscribeFromEmails(userId);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to unsubscribe' },
        { status: 500 }
      );
    }

    // Redirect to unsubscribe confirmation page
    return NextResponse.redirect(
      new URL(`/unsubscribe/success?userId=${userId}`, request.url)
    );
  } catch (error) {
    console.error('Error unsubscribing user:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to unsubscribe from emails' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/unsubscribe
 * Unsubscribe user from all email notifications (for form submissions)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const success = await unsubscribeFromEmails(userId);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to unsubscribe' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from all email notifications',
    });
  } catch (error) {
    console.error('Error unsubscribing user:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to unsubscribe from emails' 
      },
      { status: 500 }
    );
  }
}

