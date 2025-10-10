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
    let allAssignments: any[] = [];
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
    let userSubmissions: any[] = [];
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

    // Get videos that need peer review from this student
    let pendingReviews = 0;
    try {
      // Get all submissions from the user's courses (peer videos to review)
      let allPeerSubmissions: any[] = [];
      if (courseIds.length > 0) {
        const peerSubmissionsResult = await docClient.send(new ScanCommand({
          TableName: SUBMISSIONS_TABLE,
          FilterExpression: 'studentId <> :userId',
          ExpressionAttributeValues: {
            ':userId': userId
          }
        }));
        allPeerSubmissions = (peerSubmissionsResult.Items || []).filter(sub => 
          courseIds.includes(sub.courseId)
        );
      }

      // Get all peer responses this user has already made
      let userResponses = [];
      const responsesResult = await docClient.send(new ScanCommand({
        TableName: PEER_RESPONSES_TABLE,
        FilterExpression: 'reviewerId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      }));
      userResponses = responsesResult.Items || [];

      // Get the video IDs the user has already responded to
      const respondedVideoIds = new Set(userResponses.map(r => r.videoId));

      // Count peer videos that haven't been responded to yet
      pendingReviews = allPeerSubmissions.filter(sub => 
        !respondedVideoIds.has(sub.submissionId)
      ).length;
      
      console.log(`Pending reviews calculation: ${allPeerSubmissions.length} peer videos, ${userResponses.length} responses made, ${pendingReviews} pending`);
    } catch (dbError: any) {
      console.error('Error calculating pending reviews:', dbError);
      if (dbError.name === 'ResourceNotFoundException') {
        pendingReviews = 0;
      } else {
        // Don't throw, just set to 0
        pendingReviews = 0;
      }
    }

    // Calculate pending assignments
    const submittedAssignmentIds = new Set(userSubmissions.map(sub => sub.assignmentId));
    const now = new Date();
    
    const pendingAssignments = allAssignments.filter(assignment => {
      const dueDate = new Date(assignment.dueDate);
      const isNotDue = dueDate > now;
      const isNotSubmitted = !submittedAssignmentIds.has(assignment.assignmentId);
      
      console.log(`Assignment ${assignment.assignmentId}:`, {
        title: assignment.title,
        dueDate: assignment.dueDate,
        isNotDue,
        isNotSubmitted,
        included: isNotDue && isNotSubmitted
      });
      
      // Show all assignments that are not yet due and haven't been submitted
      return isNotDue && isNotSubmitted;
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

    const result = {
      pendingAssignments: pendingAssignments.length,
      pendingReviews,
      nextDueAssignment
    };
    
    console.log('Todo stats result:', result);
    console.log(`Found ${allAssignments.length} total assignments, ${pendingAssignments.length} pending`);
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error fetching todo stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch todo stats' },
      { status: 500 }
    );
  }
}
