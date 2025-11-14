import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const COURSES_TABLE = 'classcast-courses';
const ASSIGNMENTS_TABLE = 'classcast-assignments';
const SUBMISSIONS_TABLE = 'classcast-submissions';

export async function GET(request: NextRequest) {
  try {
    // Get instructor ID from query params
    const { searchParams } = new URL(request.url);
    const instructorId = searchParams.get('instructorId');
    
    if (!instructorId) {
      return NextResponse.json(
        { error: 'Instructor ID is required' },
        { status: 400 }
      );
    }

    // Get courses taught by this instructor
    const coursesResult = await docClient.send(new ScanCommand({
      TableName: COURSES_TABLE,
      FilterExpression: 'instructorId = :instructorId',
      ExpressionAttributeValues: {
        ':instructorId': instructorId
      }
    }));
    
    const courses = coursesResult.Items || [];
    const courseIds = courses.map(course => course.courseId);
    
    // Get assignments for these courses
    let allAssignments = [];
    if (courseIds.length > 0) {
      // DynamoDB doesn't support IN with expression attribute values directly
      const assignmentPromises = courseIds.map(courseId => 
        docClient.send(new ScanCommand({
          TableName: ASSIGNMENTS_TABLE,
          FilterExpression: 'courseId = :courseId',
          ExpressionAttributeValues: {
            ':courseId': courseId
          }
        }))
      );
      
      const assignmentResults = await Promise.all(assignmentPromises);
      allAssignments = assignmentResults.flatMap(result => result.Items || []);
    }
    
    // Get submissions for these assignments
    const assignmentIds = allAssignments.map(assignment => assignment.assignmentId);
    let allSubmissions = [];
    if (assignmentIds.length > 0) {
      // DynamoDB doesn't support IN with expression attribute values directly
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
      allSubmissions = submissionResults.flatMap(result => result.Items || []);
    }
    
    // Count ungraded assignments (submissions without grades)
    const ungradedAssignments = allSubmissions.filter(submission => 
      (submission.grade === null || submission.grade === undefined) && 
      submission.status !== 'draft' && 
      submission.status !== 'deleted' && 
      !submission.hidden
    ).length;
    
    // Count total messages (for now, we'll use a placeholder since we don't have a messages table)
    const messages = 0; // TODO: Implement when messages table is available

    const stats = {
      activeCourses: courses.length,
      ungradedAssignments,
      messages,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
