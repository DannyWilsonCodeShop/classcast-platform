import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const SESSIONS_TABLE = 'classcast-assessment-sessions';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ assessmentId: string; sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await request.json();
    const { videoUrl, questionTimestamps, integrityEvents, status, completedAt } = body;

    if (!videoUrl || !questionTimestamps) {
      return NextResponse.json({ success: false, error: 'videoUrl and questionTimestamps are required' }, { status: 400 });
    }

    // Verify session exists
    const existing = await docClient.send(new GetCommand({
      TableName: SESSIONS_TABLE,
      Key: { sessionId },
    }));

    if (!existing.Item) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    if (existing.Item.status === 'completed') {
      return NextResponse.json({ success: false, error: 'Session is already completed' }, { status: 409 });
    }

    // Update session
    const now = new Date().toISOString();
    await docClient.send(new UpdateCommand({
      TableName: SESSIONS_TABLE,
      Key: { sessionId },
      UpdateExpression: 'SET videoUrl = :videoUrl, questionTimestamps = :timestamps, integrityEvents = :events, #status = :status, completedAt = :completedAt',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':videoUrl': videoUrl,
        ':timestamps': questionTimestamps,
        ':events': integrityEvents || [],
        ':status': status || 'completed',
        ':completedAt': completedAt || now,
      },
    }));

    return NextResponse.json({
      success: true,
      message: 'Assessment session completed',
    });
  } catch (error) {
    console.error('Error completing assessment session:', error);
    return NextResponse.json({ success: false, error: 'Failed to complete session' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assessmentId: string; sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const result = await docClient.send(new GetCommand({
      TableName: SESSIONS_TABLE,
      Key: { sessionId },
    }));

    if (!result.Item) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { session: result.Item },
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch session' }, { status: 500 });
  }
}
