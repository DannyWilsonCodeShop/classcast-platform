import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const COURSES_TABLE = 'classcast-courses';
const ASSIGNMENTS_TABLE = 'classcast-assignments';
const SUBMISSIONS_TABLE = 'classcast-submissions';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = params;

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // First, get all assignments for this course
    const assignmentsResult = await docClient.send(new ScanCommand({
      TableName: ASSIGNMENTS_TABLE,
      FilterExpression: 'courseId = :courseId',
      ExpressionAttributeValues: {
        ':courseId': courseId
      }
    }));

    const assignments = assignmentsResult.Items || [];
    const assignmentIds = assignments.map(assignment => assignment.assignmentId);

    // Delete all submissions for these assignments
    if (assignmentIds.length > 0) {
      const submissionPromises = assignmentIds.map(assignmentId => 
        docClient.send(new ScanCommand({
          TableName: SUBMISSIONS_TABLE,
          FilterExpression: 'assignmentId = :assignmentId',
          ExpressionAttributeValues: {
            ':assignmentId': assignmentId
          }
        }))
      );

      const submissionResults = await Promise.all(submissionPromises);
      const allSubmissions = submissionResults.flatMap(result => result.Items || []);

      // Delete each submission
      const deleteSubmissionPromises = allSubmissions.map(submission => 
        docClient.send(new DeleteCommand({
          TableName: SUBMISSIONS_TABLE,
          Key: { submissionId: submission.submissionId }
        }))
      );

      await Promise.all(deleteSubmissionPromises);
    }

    // Delete all assignments for this course
    const deleteAssignmentPromises = assignments.map(assignment => 
      docClient.send(new DeleteCommand({
        TableName: ASSIGNMENTS_TABLE,
        Key: { assignmentId: assignment.assignmentId }
      }))
    );

    await Promise.all(deleteAssignmentPromises);

    // Finally, delete the course
    await docClient.send(new DeleteCommand({
      TableName: COURSES_TABLE,
      Key: { courseId: courseId }
    }));

    return NextResponse.json({
      success: true,
      message: 'Course and all associated data deleted successfully',
      deletedAssignments: assignments.length,
      deletedSubmissions: assignmentIds.length > 0 ? 
        (await Promise.all(assignmentIds.map(async (assignmentId) => {
          const result = await docClient.send(new ScanCommand({
            TableName: SUBMISSIONS_TABLE,
            FilterExpression: 'assignmentId = :assignmentId',
            ExpressionAttributeValues: { ':assignmentId': assignmentId }
          }));
          return result.Items?.length || 0;
        }))).reduce((sum, count) => sum + count, 0) : 0
    });

  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}
