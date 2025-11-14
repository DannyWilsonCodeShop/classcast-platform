import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const NOTIFICATIONS_TABLE = 'classcast-notifications';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const { notificationId } = await params;

    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    console.log('📖 Marking notification as read:', notificationId);

    // Mark notification as read
    await docClient.send(new UpdateCommand({
      TableName: NOTIFICATIONS_TABLE,
      Key: { notificationId },
      UpdateExpression: 'SET isRead = :isRead, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':isRead': true,
        ':updatedAt': new Date().toISOString()
      }
    }));

    console.log('✅ Notification marked as read:', notificationId);

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}
