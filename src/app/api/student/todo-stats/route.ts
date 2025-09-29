import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const COURSES_TABLE = 'classcast-courses';
const ASSIGNMENTS_TABLE = 'classcast-assignments';
const SUBMISSIONS_TABLE = 'classcast-submissions';
const PEER_RESPONSES_TABLE = 'classcast-peer-responses';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get courses where user is enrolled
    let courses = [];
    try {
      const coursesResult = await docClient.send(new ScanCommand({
        TableName: COURSES_TABLE,
        FilterExpression: 'contains(enrollment.students, :userId)',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      }));
      courses = coursesResult.Items || [];
    } catch (dbError: any) {
      if (dbError.name === 'ResourceNotFoundException') {
        return NextResponse.json({
          pendingAssignments: 0,
          pendingReviews: 0,
          nextDueAssignment: null
        });
      }
      throw dbError;
    }

    const courseIds = courses.map(course => course.courseId);

    // Get assignments for user's courses
    let allAssignments = [];
    if (courseIds.length > 0) {
      try {
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
      } catch (dbError: any) {
        if (dbError.name === 'ResourceNotFoundException') {
          return NextResponse.json({
            pendingAssignments: 0,
            pendingReviews: 0,
            nextDueAssignment: null
          });
        }
        throw dbError;
      }
    }

    // Get user's submissions
    let userSubmissions = [];
    try {
      const submissionsResult = await docClient.send(new ScanCommand({
        TableName: SUBMISSIONS_TABLE,
        FilterExpression: 'studentId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      }));
      userSubmissions = submissionsResult.Items || [];
    } catch (dbError: any) {
      if (dbError.name === 'ResourceNotFoundException') {
        userSubmissions = [];
      } else {
        throw dbError;
      }
    }

    // Get peer responses for user's submissions
    let pendingReviews = 0;
    try {
      const submissionIds = userSubmissions.map(sub => sub.submissionId);
      if (submissionIds.length > 0) {
        const responsePromises = submissionIds.map(submissionId => 
          docClient.send(new ScanCommand({
            TableName: PEER_RESPONSES_TABLE,
            FilterExpression: 'submissionId = :submissionId',
            ExpressionAttributeValues: {
              ':submissionId': submissionId
            }
          }))
        );
        
        const responseResults = await Promise.all(responsePromises);
        const allResponses = responseResults.flatMap(result => result.Items || []);
        
        // Count responses that need review (assuming there's a status field)
        pendingReviews = allResponses.filter(response => 
          response.status === 'pending' || response.status === 'submitted'
        ).length;
      }
    } catch (dbError: any) {
      if (dbError.name === 'ResourceNotFoundException') {
        pendingReviews = 0;
      } else {
        throw dbError;
      }
    }

    // Calculate pending assignments
    const submittedAssignmentIds = new Set(userSubmissions.map(sub => sub.assignmentId));
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const pendingAssignments = allAssignments.filter(assignment => {
      const dueDate = new Date(assignment.dueDate);
      return dueDate > now && dueDate <= oneWeekFromNow && !submittedAssignmentIds.has(assignment.assignmentId);
    });

    // Find next due assignment
    const upcomingAssignments = allAssignments.filter(assignment => {
      const dueDate = new Date(assignment.dueDate);
      return dueDate > now && !submittedAssignmentIds.has(assignment.assignmentId);
    });

    const nextDueAssignment = upcomingAssignments.length > 0 
      ? {
          title: upcomingAssignments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0].title,
          dueDate: new Date(upcomingAssignments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0].dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }
      : null;

    return NextResponse.json({
      pendingAssignments: pendingAssignments.length,
      pendingReviews,
      nextDueAssignment
    });

  } catch (error) {
    console.error('Error fetching todo stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch todo stats' },
      { status: 500 }
    );
  }
}
