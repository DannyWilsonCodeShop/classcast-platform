import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const SUBMISSIONS_TABLE = 'classcast-submissions';

export async function PUT(
  request: NextRequest,
  { params }: { params: { submissionId: string } }
) {
  try {
    const { submissionId } = params;
    const body = await request.json();
    const { grade, feedback, status } = body;

    console.log('Grading submission:', { submissionId, grade, feedback, status });

    // Validate input
    if (!submissionId) {
      return NextResponse.json(
        { success: false, error: 'Submission ID is required' },
        { status: 400 }
      );
    }

    if (grade === undefined || grade === null) {
      return NextResponse.json(
        { success: false, error: 'Grade is required' },
        { status: 400 }
      );
    }

    // Verify submission exists
    const getResult = await docClient.send(new GetCommand({
      TableName: SUBMISSIONS_TABLE,
      Key: { submissionId }
    }));

    if (!getResult.Item) {
      return NextResponse.json(
        { success: false, error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Update submission with grade
    const now = new Date().toISOString();
    const updateResult = await docClient.send(new UpdateCommand({
      TableName: SUBMISSIONS_TABLE,
      Key: { submissionId },
      UpdateExpression: 'SET grade = :grade, instructorFeedback = :feedback, #status = :status, gradedAt = :gradedAt, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':grade': Number(grade),
        ':feedback': feedback || '',
        ':status': status || 'graded',
        ':gradedAt': now,
        ':updatedAt': now
      },
      ReturnValues: 'ALL_NEW'
    }));

    console.log('Submission graded successfully:', updateResult.Attributes);

    return NextResponse.json({
      success: true,
      message: 'Submission graded successfully',
      submission: updateResult.Attributes
    });

  } catch (error) {
    console.error('Error grading submission:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to grade submission',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

