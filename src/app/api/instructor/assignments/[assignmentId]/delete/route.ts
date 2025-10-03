import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const ASSIGNMENTS_TABLE = 'classcast-assignments';
const SUBMISSIONS_TABLE = 'classcast-submissions';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
    const { assignmentId } = params;

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 }
      );
    }

    // First, get all submissions for this assignment
    const submissionsResult = await docClient.send(new ScanCommand({
      TableName: SUBMISSIONS_TABLE,
      FilterExpression: 'assignmentId = :assignmentId',
      ExpressionAttributeValues: {
        ':assignmentId': assignmentId
      }
    }));

    const submissions = submissionsResult.Items || [];

    // Delete all submissions for this assignment
    const deleteSubmissionPromises = submissions.map(submission => 
      docClient.send(new DeleteCommand({
        TableName: SUBMISSIONS_TABLE,
        Key: { submissionId: submission.submissionId }
      }))
    );

    await Promise.all(deleteSubmissionPromises);

    // Delete the assignment
    await docClient.send(new DeleteCommand({
      TableName: ASSIGNMENTS_TABLE,
      Key: { assignmentId: assignmentId }
    }));

    return NextResponse.json({
      success: true,
      message: 'Assignment and all associated submissions deleted successfully',
      deletedSubmissions: submissions.length
    });

  } catch (error) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json(
      { error: 'Failed to delete assignment' },
      { status: 500 }
    );
  }
}
