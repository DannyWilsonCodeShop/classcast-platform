import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const NOTIFICATIONS_TABLE = 'classcast-notifications';
const USERS_TABLE = 'classcast-users';

export async function POST(request: NextRequest) {
  try {
    const { 
      recipientId,
      recipientRole, // NEW: Send to all users with this role
      senderId, 
      senderName, 
      type, 
      title, 
      message, 
      relatedId, 
      relatedType,
      priority = 'normal',
      actionUrl // NEW: URL to navigate to when clicked
    } = await request.json();

    if ((!recipientId && !recipientRole) || !senderId || !type || !title || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields (need recipientId OR recipientRole)' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    let recipientIds: string[] = [];

    // If recipientRole is provided, get all users with that role
    if (recipientRole) {
      console.log('🔔 Creating notifications for all users with role:', recipientRole);
      
      try {
        const usersResult = await docClient.send(new ScanCommand({
          TableName: USERS_TABLE,
          FilterExpression: '#role = :role',
          ExpressionAttributeNames: {
            '#role': 'role'
          },
          ExpressionAttributeValues: {
            ':role': recipientRole
          }
        }));

        recipientIds = (usersResult.Items || [])
          .map((user: any) => user.userId || user.id)
          .filter((id: string) => id);

        console.log(`📧 Found ${recipientIds.length} users with role ${recipientRole}`);
      } catch (error) {
        console.error('Error fetching users by role:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch recipients' },
          { status: 500 }
        );
      }
    } else {
      // Single recipient
      recipientIds = [recipientId];
    }

    if (recipientIds.length === 0) {
      console.warn('⚠️ No recipients found');
      return NextResponse.json({
        success: true,
        message: 'No recipients found for the specified role',
        count: 0
      });
    }

    // Create notification for each recipient
    const notificationPromises = recipientIds.map(async (recId) => {
      const notificationId = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const notification = {
        notificationId,
        recipientId: recId,
        senderId,
        senderName,
        type, // 'peer_response', 'like', 'comment', 'grade', 'moderation_flag', etc.
        title,
        message,
        relatedId, // ID of the related item (video, assignment, etc.)
        relatedType, // 'video', 'assignment', 'post', 'moderation-flag', etc.
        priority, // 'high', 'normal', 'low'
        actionUrl, // URL to navigate to when clicked
        isRead: false,
        createdAt: now,
        updatedAt: now
      };

      // Save notification to DynamoDB
      await docClient.send(new PutCommand({
        TableName: NOTIFICATIONS_TABLE,
        Item: notification
      }));

      return notificationId;
    });

    const notificationIds = await Promise.all(notificationPromises);

    console.log(`✅ ${notificationIds.length} notification(s) created successfully`);

    return NextResponse.json({
      success: true,
      notificationIds,
      count: notificationIds.length,
      message: `Notification(s) created successfully`
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
