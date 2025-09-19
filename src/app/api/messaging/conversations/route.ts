import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userRole = searchParams.get('userRole');

    if (!userId || !userRole) {
      return NextResponse.json({ error: 'User ID and role are required' }, { status: 400 });
    }

    // Query conversations where the user is a participant
    const params = {
      TableName: 'classcast-conversations',
      FilterExpression: 'contains(participants, :userId)',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    };

    const result = await docClient.send(new ScanCommand(params));
    
    // Sort by last message timestamp
    const conversations = result.Items?.sort((a, b) => 
      new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
    ) || [];

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { participants, courseId, assignmentId } = body;

    if (!participants || participants.length < 2) {
      return NextResponse.json({ error: 'At least 2 participants required' }, { status: 400 });
    }

    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const conversation = {
      id: conversationId,
      participants,
      unreadCount: 0,
      courseId: courseId || null,
      assignmentId: assignmentId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await docClient.send(new PutCommand({
      TableName: 'classcast-conversations',
      Item: conversation
    }));

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}
