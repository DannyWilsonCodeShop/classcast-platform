import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({
  region: process.env.REGION || 'us-east-1',
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { userId, content, assignmentId } = await request.json();
    const { videoId } = await params;

    if (!userId || !content || !assignmentId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, content, assignmentId' },
        { status: 400 }
      );
    }

    if (content.trim().length < 200) {
      return NextResponse.json(
        { error: 'Response must be at least 200 characters long' },
        { status: 400 }
      );
    }

    const responseId = `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    // Create graded response
    const response = {
      responseId,
      videoId,
      assignmentId,
      userId,
      content: content.trim(),
      status: 'submitted', // submitted, graded, returned
      grade: null,
      instructorFeedback: null,
      wordCount: content.trim().split(/\s+/).length,
      createdAt: timestamp,
      updatedAt: timestamp,
      gradedAt: null
    };

    const putCommand = new PutCommand({
      TableName: process.env.RESPONSES_TABLE_NAME || 'ClassCastResponses',
      Item: response
    });

    await docClient.send(putCommand);

    // In a real app, you'd trigger a notification to the instructor
    // via SNS or send to a grading queue

    return NextResponse.json({
      success: true,
      response: {
        ...response,
        author: 'Current User', // In real app, fetch from users table
        authorAvatar: 'U'
      }
    });

  } catch (error) {
    console.error('Error creating graded response:', error);
    return NextResponse.json(
      { error: 'Failed to create graded response' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    const queryCommand = new QueryCommand({
      TableName: process.env.RESPONSES_TABLE_NAME || 'ClassCastResponses',
      KeyConditionExpression: 'videoId = :videoId',
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':videoId': videoId,
        ':userId': userId
      },
      ScanIndexForward: false // Most recent first
    });

    const result = await docClient.send(queryCommand);

    return NextResponse.json({
      success: true,
      responses: result.Items || []
    });

  } catch (error) {
    console.error('Error fetching responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch responses' },
      { status: 500 }
    );
  }
}
