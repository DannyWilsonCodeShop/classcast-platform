import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sesClient = new SESClient({ region: 'us-east-1' });

const MESSAGES_TABLE = 'classcast-messages';
const USERS_TABLE = 'classcast-users';

// GET /api/messaging/messages - Get messages between two users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId1 = searchParams.get('userId1');
    const userId2 = searchParams.get('userId2');

    if (!userId1 || !userId2) {
      return NextResponse.json(
        { success: false, error: 'Both user IDs are required' },
        { status: 400 }
      );
    }

    // Create a consistent conversation ID (alphabetically sorted)
    const conversationId = [userId1, userId2].sort().join('_');

    const result = await docClient.send(new ScanCommand({
      TableName: MESSAGES_TABLE,
      FilterExpression: 'conversationId = :conversationId',
      ExpressionAttributeValues: {
        ':conversationId': conversationId
      }
    }));

    const messages = (result.Items || [])
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return NextResponse.json({
      success: true,
      messages
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST /api/messaging/messages - Create a new message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromUserId, toUserId, content } = body;

    if (!fromUserId || !toUserId || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get sender info
    const senderResult = await docClient.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId: fromUserId }
    }));

    if (!senderResult.Item) {
      return NextResponse.json(
        { success: false, error: 'Sender not found' },
        { status: 404 }
      );
    }

    const sender = senderResult.Item;
    const senderName = `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || sender.email;

    // Get recipient info
    const recipientResult = await docClient.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId: toUserId }
    }));

    if (!recipientResult.Item) {
      return NextResponse.json(
        { success: false, error: 'Recipient not found' },
        { status: 404 }
      );
    }

    const recipient = recipientResult.Item;

    // Create message
    const messageId = `message_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const conversationId = [fromUserId, toUserId].sort().join('_');
    const now = new Date().toISOString();

    const message = {
      id: messageId,
      conversationId,
      fromUserId,
      fromName: senderName,
      fromAvatar: sender.avatar || '/api/placeholder/40/40',
      toUserId,
      toName: `${recipient.firstName || ''} ${recipient.lastName || ''}`.trim() || recipient.email,
      toAvatar: recipient.avatar || '/api/placeholder/40/40',
      content: content.trim(),
      timestamp: now,
      read: false
    };

    await docClient.send(new PutCommand({
      TableName: MESSAGES_TABLE,
      Item: message
    }));

    // Send email notification to recipient
    try {
      const emailHtml = `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #4A90E2;">New Message on MyClassCast</h2>
              <p>You have received a new message from <strong>${senderName}</strong>:</p>
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;">${content}</p>
              </div>
              <p>
                <a href="https://class-cast.com/student/messages" 
                   style="display: inline-block; background-color: #4A90E2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                  View Messages
                </a>
              </p>
            </div>
          </body>
        </html>
      `;

      await sesClient.send(new SendEmailCommand({
        Source: 'noreply@myclasscast.com',
        Destination: {
          ToAddresses: [recipient.email]
        },
        Message: {
          Subject: {
            Data: `New message from ${senderName} on MyClassCast`,
            Charset: 'UTF-8'
          },
          Body: {
            Html: {
              Data: emailHtml,
              Charset: 'UTF-8'
            }
          }
        }
      }));

      console.log('Email notification sent to:', recipient.email);
    } catch (emailError) {
      console.error('Error sending email notification:', emailError);
      // Don't fail the message creation if email fails
    }

    return NextResponse.json({
      success: true,
      message
    });

  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create message' },
      { status: 500 }
    );
  }
}
