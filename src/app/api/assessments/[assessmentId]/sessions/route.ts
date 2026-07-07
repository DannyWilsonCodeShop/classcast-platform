import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const SESSIONS_TABLE = 'classcast-assessment-sessions';
const ASSIGNMENTS_TABLE = 'classcast-assignments';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  try {
    const { assessmentId } = await params;
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    let result;
    if (studentId) {
      // Query specific student's session
      result = await docClient.send(new QueryCommand({
        TableName: SESSIONS_TABLE,
        IndexName: 'AssessmentIdIndex',
        KeyConditionExpression: 'assessmentId = :assessmentId AND studentId = :studentId',
        ExpressionAttributeValues: { ':assessmentId': assessmentId, ':studentId': studentId },
      }));
    } else {
      // List all sessions for this assessment
      result = await docClient.send(new QueryCommand({
        TableName: SESSIONS_TABLE,
        IndexName: 'AssessmentIdIndex',
        KeyConditionExpression: 'assessmentId = :assessmentId',
        ExpressionAttributeValues: { ':assessmentId': assessmentId },
      }));
    }

    return NextResponse.json({
      success: true,
      data: { sessions: result.Items || [] },
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Error fetching assessment sessions:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  try {
    const { assessmentId } = await params;
    const body = await request.json();
    const { studentId } = body;

    if (!studentId) {
      return NextResponse.json({ success: false, error: 'studentId is required' }, { status: 400 });
    }

    // Check if student already has a completed session (single attempt)
    const existingResult = await docClient.send(new QueryCommand({
      TableName: SESSIONS_TABLE,
      IndexName: 'AssessmentIdIndex',
      KeyConditionExpression: 'assessmentId = :assessmentId AND studentId = :studentId',
      ExpressionAttributeValues: { ':assessmentId': assessmentId, ':studentId': studentId },
    }));

    const existingSessions = existingResult.Items || [];
    const completedSession = existingSessions.find((s: any) => s.status === 'completed');
    if (completedSession) {
      return NextResponse.json({ success: false, error: 'Assessment already completed. Only one attempt is allowed.' }, { status: 409 });
    }

    // Check if there's an in-progress session (resume it)
    const inProgressSession = existingSessions.find((s: any) => s.status === 'in-progress');
    if (inProgressSession) {
      // Get questions from assignment
      const assignmentResult = await docClient.send(new GetCommand({
        TableName: ASSIGNMENTS_TABLE,
        Key: { assignmentId: assessmentId },
      }));
      const questions = assignmentResult.Item?.assessmentQuestions || [];
      return NextResponse.json({ success: true, data: { session: inProgressSession, questions } });
    }

    // Get assignment to check due date and get questions
    const assignmentResult = await docClient.send(new GetCommand({
      TableName: ASSIGNMENTS_TABLE,
      Key: { assignmentId: assessmentId },
    }));
    const assignment = assignmentResult.Item;

    if (!assignment) {
      return NextResponse.json({ success: false, error: 'Assessment not found' }, { status: 404 });
    }

    if (assignment.dueDate && new Date(assignment.dueDate) < new Date()) {
      return NextResponse.json({ success: false, error: 'Assessment deadline has passed' }, { status: 400 });
    }

    const questions = assignment.assessmentQuestions || [];
    if (questions.length === 0) {
      return NextResponse.json({ success: false, error: 'Assessment has no questions configured' }, { status: 400 });
    }

    // Create new session
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const session = {
      sessionId,
      assessmentId,
      studentId,
      videoUrl: null,
      questionTimestamps: [],
      integrityEvents: [],
      status: 'in-progress',
      startedAt: now,
      completedAt: null,
      gradingData: null,
    };

    await docClient.send(new PutCommand({ TableName: SESSIONS_TABLE, Item: session }));

    return NextResponse.json({
      success: true,
      data: { session, questions },
    });
  } catch (error) {
    console.error('Error starting assessment session:', error);
    return NextResponse.json({ success: false, error: 'Failed to start session' }, { status: 500 });
  }
}
