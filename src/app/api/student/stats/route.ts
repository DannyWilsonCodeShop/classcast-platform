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
    let allAssignments = [];
    if (activeCourseIds.length > 0) {
      // DynamoDB doesn't support IN with expression attribute values directly
      // We need to query each course individually
      const assignmentPromises = activeCourseIds.map(courseId => 
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
    
    // Count ALL assignments that are not yet submitted (not just due in next 7 days)
    const assignmentsDue = allAssignments.filter(assignment => {
      const dueDate = new Date(assignment.dueDate);
      // Assignment is due if: not submitted AND due date hasn't passed yet
      return dueDate > now && !submittedAssignmentIds.has(assignment.assignmentId);
    });
    
    const completed = allAssignments.filter(assignment => 
      submittedAssignmentIds.has(assignment.assignmentId)
    );

    const stats = {
      activeCourses: activeCourses.length,
      assignmentsDue: assignmentsDue.length,
      completed: completed.length
    };

    console.log('📊 Student Stats:', {
      userId,
      activeCourses: activeCourses.length,
      totalAssignments: allAssignments.length,
      assignmentsDue: assignmentsDue.length,
      completed: completed.length,
      submitted: submittedAssignmentIds.size
    });

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching student stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
