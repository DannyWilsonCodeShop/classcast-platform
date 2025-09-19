import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { sendEmailNotification } from '@/lib/email-service';

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    // Query messages for the conversation
    const params = {
      TableName: 'classcast-messages',
      IndexName: 'conversationId-timestamp-index',
      KeyConditionExpression: 'conversationId = :conversationId',
      ExpressionAttributeValues: {
        ':conversationId': conversationId
      },
      ScanIndexForward: false, // Sort by timestamp descending
      Limit: 50
    };

    const result = await docClient.send(new QueryCommand(params));
    const messages = result.Items || [];

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      conversationId, 
      senderId, 
      senderName, 
      senderRole, 
      recipientId, 
      recipientName, 
      recipientRole, 
      subject, 
      content, 
      courseId, 
      assignmentId 
    } = body;

    if (!conversationId || !senderId || !recipientId || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    const message = {
      id: messageId,
      conversationId,
      senderId,
      senderName,
      senderRole,
      recipientId,
      recipientName,
      recipientRole,
      subject: subject || 'No Subject',
      content,
      timestamp,
      isRead: false,
      courseId: courseId || null,
      assignmentId: assignmentId || null
    };

    // Save message
    await docClient.send(new PutCommand({
      TableName: 'classcast-messages',
      Item: message
    }));

    // Update conversation's last message and timestamp
    await docClient.send(new UpdateCommand({
      TableName: 'classcast-conversations',
      Key: { id: conversationId },
      UpdateExpression: 'SET lastMessage = :lastMessage, updatedAt = :updatedAt, unreadCount = unreadCount + :increment',
      ExpressionAttributeValues: {
        ':lastMessage': {
          id: messageId,
          senderName,
          content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
          timestamp
        },
        ':updatedAt': timestamp,
        ':increment': 1
      }
    }));

    // Send email notification
    try {
      await sendEmailNotification({
        recipientEmail: `${recipientId}@example.com`, // This should be fetched from user data
        recipientName,
        senderName,
        subject: subject || 'New Message',
        messageContent: content,
        conversationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/messaging/${conversationId}`,
        courseName: courseId ? 'Course Name' : undefined, // This should be fetched from course data
        assignmentTitle: assignmentId ? 'Assignment Title' : undefined
      });
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't fail the message creation if email fails
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
}
