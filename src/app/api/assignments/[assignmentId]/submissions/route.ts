import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const SUBMISSIONS_TABLE = 'classcast-submissions';
const USERS_TABLE = 'classcast-users';

export async function GET(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
    const { assignmentId } = params;
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 }
      );
    }

    // Build filter expression
    let filterExpression = 'assignmentId = :assignmentId';
    const expressionAttributeValues: any = {
      ':assignmentId': assignmentId
    };

    // If studentId is provided, filter by student
    if (studentId) {
      filterExpression += ' AND studentId = :studentId';
      expressionAttributeValues[':studentId'] = studentId;
    }

    // Get submissions for this assignment
    const submissionsResult = await docClient.send(new ScanCommand({
      TableName: SUBMISSIONS_TABLE,
      FilterExpression: filterExpression,
      ExpressionAttributeValues: expressionAttributeValues
    }));

    const submissions = submissionsResult.Items || [];

    // Enrich submissions with student information
    const enrichedSubmissions = await Promise.all(submissions.map(async (submission) => {
      let studentName = 'Unknown Student';
      let studentEmail = '';

      try {
        const studentResult = await docClient.send(new GetCommand({
          TableName: USERS_TABLE,
          Key: { userId: submission.studentId }
        }));

        if (studentResult.Item) {
          studentName = `${studentResult.Item.firstName || ''} ${studentResult.Item.lastName || ''}`.trim() || 'Unknown Student';
          studentEmail = studentResult.Item.email || '';
        }
      } catch (error) {
        console.warn('Could not fetch student information:', error);
      }

      return {
        ...submission,
        studentName,
        studentEmail
      };
    }));

    return NextResponse.json({
      success: true,
      submissions: enrichedSubmissions
    });

  } catch (error) {
    console.error('Error fetching assignment submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignment submissions' },
      { status: 500 }
    );
  }
}
