import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const COURSES_TABLE = 'classcast-courses';
const ASSIGNMENTS_TABLE = 'classcast-assignments';
const SUBMISSIONS_TABLE = 'classcast-submissions';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from query params or headers
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get active courses for the user
    const coursesResult = await docClient.send(new ScanCommand({
      TableName: COURSES_TABLE,
      FilterExpression: 'contains(enrollment.students, :userId)',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }));
    
    const activeCourses = coursesResult.Items || [];
    const activeCourseIds = activeCourses.map(course => course.courseId);

    // Get assignments for user's courses
    const assignmentsResult = await docClient.send(new ScanCommand({
      TableName: ASSIGNMENTS_TABLE,
      FilterExpression: 'courseId IN :courseIds',
      ExpressionAttributeValues: {
        ':courseIds': activeCourseIds
      }
    }));
    
    const allAssignments = assignmentsResult.Items || [];
    
    // Get user's submissions
    const submissionsResult = await docClient.send(new ScanCommand({
      TableName: SUBMISSIONS_TABLE,
      FilterExpression: 'studentId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }));
    
    const userSubmissions = submissionsResult.Items || [];
    const submittedAssignmentIds = new Set(userSubmissions.map(sub => sub.assignmentId));
    
    // Calculate stats
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const assignmentsDue = allAssignments.filter(assignment => {
      const dueDate = new Date(assignment.dueDate);
      return dueDate > now && dueDate <= oneWeekFromNow && !submittedAssignmentIds.has(assignment.assignmentId);
    });
    
    const completed = allAssignments.filter(assignment => 
      submittedAssignmentIds.has(assignment.assignmentId)
    );

    const stats = {
      activeCourses: activeCourses.length,
      assignmentsDue: assignmentsDue.length,
      completed: completed.length
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching student stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
