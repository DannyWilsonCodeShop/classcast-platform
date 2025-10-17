import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = 'classcast-users';

export interface NotificationPreferences {
  emailNotifications: {
    newAssignments: boolean;
    gradedAssignments: boolean;
    peerFeedback: boolean;
    courseAnnouncements: boolean;
    discussionReplies: boolean;
    upcomingDeadlines: boolean;
  };
  pushNotifications: {
    enabled: boolean;
  };
  digestFrequency: 'instant' | 'daily' | 'weekly' | 'never';
  unsubscribedAt?: string;
  isUnsubscribed: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  emailNotifications: {
    newAssignments: true,
    gradedAssignments: true,
    peerFeedback: true,
    courseAnnouncements: true,
    discussionReplies: true,
    upcomingDeadlines: true,
  },
  pushNotifications: {
    enabled: false,
  },
  digestFrequency: 'instant',
  isUnsubscribed: false,
};

/**
 * Get notification preferences for a user
 */
export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId },
    }));

    const user = result.Item;
    if (!user) {
      return DEFAULT_NOTIFICATION_PREFERENCES;
    }

    // Return user's preferences or defaults
    return user.notificationPreferences || DEFAULT_NOTIFICATION_PREFERENCES;
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
}

/**
 * Update notification preferences for a user
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<boolean> {
  try {
    // Get current user data
    const userResult = await docClient.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId },
    }));

    const user = userResult.Item;
    if (!user) {
      throw new Error('User not found');
    }

    // Merge with existing preferences
    const currentPrefs = user.notificationPreferences || DEFAULT_NOTIFICATION_PREFERENCES;
    const updatedPrefs = {
      ...currentPrefs,
      ...preferences,
      emailNotifications: {
        ...currentPrefs.emailNotifications,
        ...(preferences.emailNotifications || {}),
      },
      pushNotifications: {
        ...currentPrefs.pushNotifications,
        ...(preferences.pushNotifications || {}),
      },
    };

    // Update user with new preferences
    await docClient.send(new PutCommand({
      TableName: USERS_TABLE,
      Item: {
        ...user,
        notificationPreferences: updatedPrefs,
        updatedAt: new Date().toISOString(),
      },
    }));

    return true;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return false;
  }
}

/**
 * Unsubscribe user from all email notifications
 */
export async function unsubscribeFromEmails(userId: string): Promise<boolean> {
  try {
    const preferences: Partial<NotificationPreferences> = {
      isUnsubscribed: true,
      unsubscribedAt: new Date().toISOString(),
      emailNotifications: {
        newAssignments: false,
        gradedAssignments: false,
        peerFeedback: false,
        courseAnnouncements: false,
        discussionReplies: false,
        upcomingDeadlines: false,
      },
    };

    return await updateNotificationPreferences(userId, preferences);
  } catch (error) {
    console.error('Error unsubscribing from emails:', error);
    return false;
  }
}

/**
 * Check if user should receive a specific type of email notification
 */
export async function shouldSendEmailNotification(
  userId: string,
  notificationType: keyof NotificationPreferences['emailNotifications']
): Promise<boolean> {
  try {
    const preferences = await getNotificationPreferences(userId);

    // Check if globally unsubscribed
    if (preferences.isUnsubscribed) {
      return false;
    }

    // Check specific notification type
    return preferences.emailNotifications[notificationType] === true;
  } catch (error) {
    console.error('Error checking notification permission:', error);
    return false; // Default to not sending if error
  }
}

