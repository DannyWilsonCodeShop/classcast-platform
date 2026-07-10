import { NextRequest, NextResponse } from 'next/server';
import { savePushToken } from '@/lib/pushNotificationService';

/**
 * POST /api/notifications/push-token
 * Body: { userId, token, platform }
 * Saves a device push token for push notification delivery.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, token, platform } = await request.json();

    if (!userId || !token) {
      return NextResponse.json(
        { success: false, error: 'userId and token are required' },
        { status: 400 }
      );
    }

    await savePushToken(userId, token, platform || 'ios');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving push token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save push token' },
      { status: 500 }
    );
  }
}
