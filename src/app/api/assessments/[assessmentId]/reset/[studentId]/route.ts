import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const SESSIONS_TABLE = 'classcast-assessment-sessions';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ assessmentId: string; studentId: string }> }
) {
  try {
    const { assessmentId, studentId } = await params;

    // Find the student's session
    const result = await docClient.send(new QueryCommand({
      TableName: SESSIONS_TABLE,
      IndexName: 'AssessmentIdIndex',
      KeyConditionExpression: 'assessmentId = :assessmentId AND studentId = :studentId',
      ExpressionAttributeValues: { ':assessmentId': assessmentId, ':studentId': studentId },
    }));

    const sessions = result.Items || [];
    const activeSession = sessions.find((s: any) => s.status === 'completed' || s.status === 'in-progress');

    if (!activeSession) {
      return NextResponse.json({ success: false, error: 'No session found to reset' }, { status: 404 });
    }

    // Set status to 'reset'
    await docClient.send(new UpdateCommand({
      TableName: SESSIONS_TABLE,
      Key: { sessionId: activeSession.sessionId },
      UpdateExpression: 'SET #status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': 'reset' },
    }));

    return NextResponse.json({ success: true, message: `Assessment reset for student ${studentId}. They can now retake it.` });
  } catch (error) {
    console.error('Error resetting assessment:', error);
    return NextResponse.json({ success: false, error: 'Failed to reset assessment' }, { status: 500 });
  }
}
