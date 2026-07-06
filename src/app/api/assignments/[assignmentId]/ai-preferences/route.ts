import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { AIGradingPreferences } from '@/types/aiGrading';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const ASSIGNMENTS_TABLE = 'classcast-assignments';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { assignmentId } = await params;

    if (!assignmentId) {
      return NextResponse.json(
        { success: false, error: 'Assignment ID is required' },
        { status: 400 }
      );
    }

    // Find the assignment by scanning for assignmentId
    const result = await docClient.send(new ScanCommand({
      TableName: ASSIGNMENTS_TABLE,
      FilterExpression: 'assignmentId = :assignmentId',
      ExpressionAttributeValues: {
        ':assignmentId': assignmentId,
      },
    }));

    const assignment = result.Items?.[0];

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      );
    }

    const preferences = assignment.aiGradingPreferences || null;

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error('Error fetching AI preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch AI preferences' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { assignmentId } = await params;
    const body: AIGradingPreferences = await request.json();

    if (!assignmentId) {
      return NextResponse.json(
        { success: false, error: 'Assignment ID is required' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.gradingMode || !body.strictnessLevel) {
      return NextResponse.json(
        { success: false, error: 'gradingMode and strictnessLevel are required' },
        { status: 400 }
      );
    }

    const validModes = ['rubric_only', 'rubric_feedback', 'response_grading'];
    if (!validModes.includes(body.gradingMode)) {
      return NextResponse.json(
        { success: false, error: 'Invalid gradingMode' },
        { status: 400 }
      );
    }

    const validStrictness = ['lenient', 'moderate', 'strict'];
    if (!validStrictness.includes(body.strictnessLevel)) {
      return NextResponse.json(
        { success: false, error: 'Invalid strictnessLevel' },
        { status: 400 }
      );
    }

    // Verify assignment exists
    const existingResult = await docClient.send(new ScanCommand({
      TableName: ASSIGNMENTS_TABLE,
      FilterExpression: 'assignmentId = :assignmentId',
      ExpressionAttributeValues: {
        ':assignmentId': assignmentId,
      },
    }));

    if (!existingResult.Items || existingResult.Items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    const preferences: AIGradingPreferences = {
      gradingMode: body.gradingMode,
      strictnessLevel: body.strictnessLevel,
      keywords: body.keywords || [],
      concepts: body.concepts || [],
      ...(body.feedbackPreferences ? { feedbackPreferences: body.feedbackPreferences } : {}),
      updatedAt: now,
    };

    // Save to DynamoDB
    await docClient.send(new UpdateCommand({
      TableName: ASSIGNMENTS_TABLE,
      Key: { assignmentId },
      UpdateExpression: 'SET aiGradingPreferences = :prefs, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':prefs': preferences,
        ':updatedAt': now,
      },
    }));

    return NextResponse.json({
      success: true,
      updatedAt: now,
    });
  } catch (error) {
    console.error('Error saving AI preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save AI preferences' },
      { status: 500 }
    );
  }
}
