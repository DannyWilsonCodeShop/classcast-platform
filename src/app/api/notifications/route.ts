import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const SUBMISSIONS_TABLE = 'classcast-submissions';
const ASSIGNMENTS_TABLE = 'classcast-assignments';
const COURSES_TABLE = 'classcast-courses';
const PEER_RESPONSES_TABLE = 'classcast-peer-responses';
const USERS_TABLE = 'classcast-users';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userRole = searchParams.get('role'); // 'student' or 'instructor'

    if (!userId || !userRole) {
      return NextResponse.json(
        { success: false, error: 'User ID and role are required' },
        { status: 400 }
      );
    }

    console.log('Fetching notifications for:', { userId, userRole });

    const notifications = [];

    if (userRole === 'student') {
      // Student notifications
      await Promise.all([
        // 1. New graded assignments
        (async () => {
          try {
            const submissionsResult = await docClient.send(new ScanCommand({
              TableName: SUBMISSIONS_TABLE,
              FilterExpression: 'studentId = :userId AND attribute_exists(grade) AND gradedAt > :oneDayAgo',
              ExpressionAttributeValues: {
                ':userId': userId,
                ':oneDayAgo': new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
              }
            }));

            if (submissionsResult.Items) {
              for (const submission of submissionsResult.Items) {
                // Get assignment details
                let assignmentTitle = 'Assignment';
                if (submission.assignmentId) {
                  const assignmentResult = await docClient.send(new GetCommand({
                    TableName: ASSIGNMENTS_TABLE,
                    Key: { assignmentId: submission.assignmentId }
                  }));
                  if (assignmentResult.Item) {
                    assignmentTitle = assignmentResult.Item.title || 'Assignment';
                  }
                }

                notifications.push({
                  id: `graded_${submission.submissionId}`,
                  type: 'graded',
                  title: 'Assignment Graded',
                  message: `${assignmentTitle} has been graded`,
                  url: `/student/assignments/${submission.assignmentId}`,
                  timestamp: submission.gradedAt || submission.updatedAt,
                  priority: 'high'
                });
              }
            }
          } catch (error) {
            console.error('Error fetching graded assignments:', error);
          }
        })(),

        // 2. New peer responses to their submissions
        (async () => {
          try {
            const responsesResult = await docClient.send(new ScanCommand({
              TableName: PEER_RESPONSES_TABLE,
              FilterExpression: 'videoId IN (SELECT submissionId FROM classcast-submissions WHERE studentId = :userId) AND submittedAt > :oneDayAgo',
              ExpressionAttributeValues: {
                ':userId': userId,
                ':oneDayAgo': new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
              }
            }));

            if (responsesResult.Items) {
              const responseCount = responsesResult.Items.length;
              if (responseCount > 0) {
                notifications.push({
                  id: `peer_responses_${userId}`,
                  type: 'peer_response',
                  title: 'New Peer Responses',
                  message: `${responseCount} new response${responseCount > 1 ? 's' : ''} to your video${responseCount > 1 ? 's' : ''}`,
                  url: '/student/peer-reviews',
                  timestamp: new Date().toISOString(),
                  priority: 'medium'
                });
              }
            }
          } catch (error) {
            console.error('Error fetching peer responses:', error);
          }
        })(),

        // 3. New assignments posted in their courses
        (async () => {
          try {
            // Get student's enrolled courses
            const coursesResult = await docClient.send(new ScanCommand({
              TableName: COURSES_TABLE,
              FilterExpression: 'contains(enrollment.students, :userId)',
              ExpressionAttributeValues: {
                ':userId': userId
              }
            }));

            if (coursesResult.Items) {
              const courseIds = coursesResult.Items.map(course => course.courseId);
              
              for (const courseId of courseIds) {
                const assignmentsResult = await docClient.send(new ScanCommand({
                  TableName: ASSIGNMENTS_TABLE,
                  FilterExpression: 'courseId = :courseId AND createdAt > :oneDayAgo',
                  ExpressionAttributeValues: {
                    ':courseId': courseId,
                    ':oneDayAgo': new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
                  }
                }));

                if (assignmentsResult.Items) {
                  for (const assignment of assignmentsResult.Items) {
                    notifications.push({
                      id: `new_assignment_${assignment.assignmentId}`,
                      type: 'new_assignment',
                      title: 'New Assignment Posted',
                      message: `${assignment.title} is now available`,
                      url: `/student/assignments/${assignment.assignmentId}`,
                      timestamp: assignment.createdAt,
                      priority: 'high'
                    });
                  }
                }
              }
            }
  } catch (error) {
            console.error('Error fetching new assignments:', error);
          }
        })()
      ]);

    } else if (userRole === 'instructor') {
      // Instructor notifications
      await Promise.all([
        // 1. New submissions to grade
        (async () => {
          try {
            const submissionsResult = await docClient.send(new ScanCommand({
              TableName: SUBMISSIONS_TABLE,
              FilterExpression: 'attribute_not_exists(grade) AND submittedAt > :oneDayAgo',
              ExpressionAttributeValues: {
                ':oneDayAgo': new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
              }
            }));

            if (submissionsResult.Items) {
              const ungradedCount = submissionsResult.Items.length;
              if (ungradedCount > 0) {
                notifications.push({
                  id: `ungraded_submissions_${userId}`,
                  type: 'ungraded',
                  title: 'Submissions to Grade',
                  message: `${ungradedCount} new submission${ungradedCount > 1 ? 's' : ''} need${ungradedCount === 1 ? 's' : ''} grading`,
                  url: '/instructor/grading/bulk',
                  timestamp: new Date().toISOString(),
                  priority: 'high'
                });
              }
            }
          } catch (error) {
            console.error('Error fetching ungraded submissions:', error);
          }
        })(),

        // 2. New peer responses to review
        (async () => {
          try {
            const responsesResult = await docClient.send(new ScanCommand({
              TableName: PEER_RESPONSES_TABLE,
              FilterExpression: 'submittedAt > :oneDayAgo',
              ExpressionAttributeValues: {
                ':oneDayAgo': new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
              }
            }));

            if (responsesResult.Items) {
              const responseCount = responsesResult.Items.length;
              if (responseCount > 0) {
                notifications.push({
                  id: `new_peer_responses_${userId}`,
                  type: 'peer_review',
                  title: 'New Peer Responses',
                  message: `${responseCount} new peer response${responseCount > 1 ? 's' : ''} to review`,
                  url: '/instructor/grading/bulk',
                  timestamp: new Date().toISOString(),
                  priority: 'medium'
                });
              }
            }
          } catch (error) {
            console.error('Error fetching new peer responses:', error);
          }
        })()
      ]);
    }

    // Sort notifications by timestamp (newest first)
    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    console.log('Generated notifications:', notifications.length);

    return NextResponse.json({
      success: true,
      notifications: notifications,
      count: notifications.length
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}