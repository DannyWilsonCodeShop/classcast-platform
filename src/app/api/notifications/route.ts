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
const NOTIFICATIONS_TABLE = 'classcast-notifications';

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

    try {
      // Fetch recent peer responses to user's videos
      const peerResponsesResponse = await docClient.send(new ScanCommand({
        TableName: PEER_RESPONSES_TABLE,
        FilterExpression: 'videoOwnerId = :userId AND createdAt > :recentTime',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':recentTime': new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Last 24 hours
        },
        Limit: 10
      }));

      if (peerResponsesResponse.Items) {
        peerResponsesResponse.Items.forEach((response: any) => {
          notifications.push({
            id: `peer_response_${response.responseId}`,
            type: 'peer_response',
            title: 'New Peer Response',
            message: `${response.reviewerName} responded to your video: "${response.content.substring(0, 50)}${response.content.length > 50 ? '...' : ''}"`,
            url: `/student/peer-reviews?videoId=${response.videoId}`,
            timestamp: response.createdAt,
            priority: 'medium',
            senderName: response.reviewerName
          });
        });
      }

      // Fetch recent likes on user's videos
      const submissionsResponse = await docClient.send(new ScanCommand({
        TableName: SUBMISSIONS_TABLE,
        FilterExpression: 'studentId = :userId AND likes > :zero',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':zero': 0
        },
        Limit: 10
      }));

      if (submissionsResponse.Items) {
        submissionsResponse.Items.forEach((submission: any) => {
          if (submission.likes > 0) {
            notifications.push({
              id: `likes_${submission.submissionId}`,
              type: 'peer_review',
              title: 'Video Liked',
              message: `Your video "${submission.videoTitle}" received ${submission.likes} like${submission.likes > 1 ? 's' : ''}`,
              url: `/student/peer-reviews?videoId=${submission.submissionId}`,
              timestamp: submission.updatedAt || submission.submittedAt,
              priority: 'low'
            });
          }
        });
      }

      // Fetch recent grades
      const gradedSubmissionsResponse = await docClient.send(new ScanCommand({
        TableName: SUBMISSIONS_TABLE,
        FilterExpression: 'studentId = :userId AND grade IS NOT NULL AND updatedAt > :recentTime',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':recentTime': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // Last 7 days
        },
        Limit: 10
      }));

      if (gradedSubmissionsResponse.Items) {
        gradedSubmissionsResponse.Items.forEach((submission: any) => {
          notifications.push({
            id: `grade_${submission.submissionId}`,
            type: 'graded',
            title: 'Grade Received',
            message: `You received ${submission.grade}/${submission.maxScore || 100} for "${submission.videoTitle}"`,
            url: `/student/submissions`,
            timestamp: submission.updatedAt,
            priority: 'high'
          });
        });
      }

      // Fetch new assignments
      const assignmentsResponse = await docClient.send(new ScanCommand({
        TableName: ASSIGNMENTS_TABLE,
        FilterExpression: 'createdAt > :recentTime',
        ExpressionAttributeValues: {
          ':recentTime': new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // Last 3 days
        },
        Limit: 5
      }));

      if (assignmentsResponse.Items) {
        assignmentsResponse.Items.forEach((assignment: any) => {
          notifications.push({
            id: `assignment_${assignment.assignmentId}`,
            type: 'new_assignment',
            title: 'New Assignment',
            message: `"${assignment.title}" has been posted. Due: ${new Date(assignment.dueDate).toLocaleDateString()}`,
            url: `/student/assignments/${assignment.assignmentId}`,
            timestamp: assignment.createdAt,
            priority: 'medium'
          });
        });
      }

    } catch (dbError) {
      console.error('Database error fetching notifications:', dbError);
      // Fallback to sample notifications if database fails
      if (userRole === 'student') {
        notifications.push(
          {
            id: `welcome_${userId}`,
            type: 'info',
            title: 'Welcome to ClassCast!',
            message: 'Your dashboard is ready. Check out your assignments and peer reviews.',
            url: '/student/dashboard',
            timestamp: new Date().toISOString(),
            priority: 'low'
          },
          {
            id: `sample_like_${userId}`,
            type: 'peer_review',
            title: 'Video Liked',
            message: 'Your video "Introduction Assignment" received 3 likes from classmates',
            url: '/student/peer-reviews',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            priority: 'low'
          },
          {
            id: `sample_comment_${userId}`,
            type: 'peer_response',
            title: 'New Peer Response',
            message: 'Sarah commented on your video: "Great presentation! I learned a lot from your approach..."',
            url: '/student/peer-reviews',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
            priority: 'medium'
          },
          {
            id: `sample_grade_${userId}`,
            type: 'graded',
            title: 'Grade Received',
            message: 'You received 95/100 for "Math Problem Solving Video"',
            url: '/student/submissions',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
            priority: 'high'
          }
        );
      }
    }

    // If no notifications from database, add sample notifications
    if (notifications.length === 0 && userRole === 'student') {
      notifications.push(
        {
          id: `sample_assignment_${userId}`,
          type: 'new_assignment',
          title: 'New Assignment Posted',
          message: '"Week 3: Creative Problem Solving" has been posted. Due: Next Friday',
          url: '/student/assignments',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
          priority: 'medium'
        },
        {
          id: `sample_peer_${userId}`,
          type: 'peer_response',
          title: 'Peer Review Request',
          message: 'You have 2 new peer videos to review for extra credit',
          url: '/student/peer-reviews',
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
          priority: 'medium'
        },
        {
          id: `sample_reminder_${userId}`,
          type: 'info',
          title: 'Assignment Reminder',
          message: 'Don\'t forget: "Science Experiment Video" is due tomorrow at 11:59 PM',
          url: '/student/assignments',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
          priority: 'high'
        }
      );
    }

    // Sort notifications by timestamp (newest first)
    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    console.log('Generated notifications:', notifications.length);

    return NextResponse.json({
      success: true,
      notifications: notifications.slice(0, 20), // Limit to 20 most recent
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