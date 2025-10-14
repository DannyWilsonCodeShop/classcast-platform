import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const NOTIFICATIONS_TABLE = 'classcast-notifications';

export async function POST(request: NextRequest) {
  try {
    const { 
      recipientId, 
      senderId, 
      senderName, 
      type, 
      title, 
      message, 
      relatedId, 
      relatedType,
      priority = 'normal'
    } = await request.json();

    if (!recipientId || !senderId || !type || !title || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('🔔 Creating notification:', { recipientId, senderId, type, title });

    // Generate unique notification ID
    const notificationId = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const notification = {
      notificationId,
      recipientId,
      senderId,
      senderName,
      type, // 'peer_response', 'like', 'comment', 'grade', etc.
      title,
      message,
      relatedId, // ID of the related item (video, assignment, etc.)
      relatedType, // 'video', 'assignment', 'post', etc.
      priority, // 'high', 'normal', 'low'
      isRead: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save notification to DynamoDB
    await docClient.send(new PutCommand({
      TableName: NOTIFICATIONS_TABLE,
      Item: notification
    }));

    console.log('✅ Notification created successfully:', notificationId);

    return NextResponse.json({
      success: true,
      notificationId,
      message: 'Notification created successfully'
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
