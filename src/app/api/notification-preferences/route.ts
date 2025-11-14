import { NextRequest, NextResponse } from 'next/server';
import { 
  getNotificationPreferences, 
  updateNotificationPreferences,
  NotificationPreferences 
} from '@/lib/notificationPreferences';

/**
 * GET /api/notification-preferences?userId=xxx
 * Get notification preferences for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const preferences = await getNotificationPreferences(userId);

    return NextResponse.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch notification preferences' 
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notification-preferences
 * Update notification preferences for a user
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, preferences } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!preferences) {
      return NextResponse.json(
        { success: false, error: 'Preferences are required' },
        { status: 400 }
      );
    }

    const success = await updateNotificationPreferences(userId, preferences);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    // Get updated preferences to return
    const updatedPreferences = await getNotificationPreferences(userId);

    return NextResponse.json({
      success: true,
      data: updatedPreferences,
      message: 'Notification preferences updated successfully',
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update notification preferences' 
      },
      { status: 500 }
    );
  }
}

