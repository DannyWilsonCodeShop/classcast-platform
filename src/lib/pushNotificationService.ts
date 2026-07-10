import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const snsClient = new SNSClient({ region: 'us-east-1' });

const PUSH_TOKENS_TABLE = 'classcast-push-tokens';
const NOTIFICATIONS_TABLE = 'classcast-notifications';

export interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Save a device push token for a user.
 */
export async function savePushToken(userId: string, token: string, platform: 'ios' | 'android' | 'web') {
  try {
    await docClient.send(new PutCommand({
      TableName: PUSH_TOKENS_TABLE,
      Item: {
        userId,
        token,
        platform,
        createdAt: new Date().toISOString(),
      },
    }));
  } catch (err) {
    console.error('Failed to save push token:', err);
  }
}

/**
 * Send a notification to a specific user (stores in notifications table for in-app display).
 */
export async function sendNotification(
  userId: string,
  notification: PushNotification,
  type: 'assignment' | 'grade' | 'deadline' | 'discussion' | 'general'
) {
  const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const now = new Date().toISOString();

  try {
    // Save to notifications table for in-app display
    await docClient.send(new PutCommand({
      TableName: NOTIFICATIONS_TABLE,
      Item: {
        notificationId,
        userId,
        title: notification.title,
        body: notification.body,
        type,
        data: notification.data || {},
        read: false,
        createdAt: now,
        ttl: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 day TTL
      },
    }));
  } catch (err) {
    console.error('Failed to save notification:', err);
  }

  // TODO: Send actual push via APNS/FCM when push token infrastructure is in place
  // For now, notifications are stored in-app and fetched by the client
}

/**
 * Notify all students in a course about a new assignment.
 */
export async function notifyNewAssignment(courseId: string, assignmentTitle: string, assignmentId: string) {
  try {
    // Get all enrolled students
    const courseResult = await docClient.send(new ScanCommand({
      TableName: 'classcast-courses',
      FilterExpression: 'courseId = :courseId',
      ExpressionAttributeValues: { ':courseId': courseId },
    }));

    const course = courseResult.Items?.[0];
    if (!course) return;

    const students = course.enrollment?.students || [];
    const courseName = course.name || course.courseName || 'Course';

    for (const student of students) {
      await sendNotification(student.userId, {
        title: '📝 New Assignment',
        body: `${assignmentTitle} posted in ${courseName}`,
        data: { assignmentId, courseId, type: 'new_assignment' },
      }, 'assignment');
    }
  } catch (err) {
    console.error('Failed to notify new assignment:', err);
  }
}

/**
 * Notify a student that their submission has been graded.
 */
export async function notifyGradePosted(studentId: string, assignmentTitle: string, grade: number, maxScore: number, assignmentId: string) {
  await sendNotification(studentId, {
    title: '📊 Grade Posted',
    body: `You received ${grade}/${maxScore} on "${assignmentTitle}"`,
    data: { assignmentId, type: 'grade_posted' },
  }, 'grade');
}

/**
 * Notify students about an upcoming deadline (24 hours before).
 */
export async function notifyUpcomingDeadline(studentId: string, assignmentTitle: string, assignmentId: string) {
  await sendNotification(studentId, {
    title: '⏰ Due Tomorrow',
    body: `"${assignmentTitle}" is due in 24 hours`,
    data: { assignmentId, type: 'deadline_reminder' },
  }, 'deadline');
}

/**
 * Notify a student that someone responded to their discussion post.
 */
export async function notifyDiscussionResponse(studentId: string, responderName: string, assignmentTitle: string, assignmentId: string) {
  await sendNotification(studentId, {
    title: '💬 New Response',
    body: `${responderName} replied to your post in "${assignmentTitle}"`,
    data: { assignmentId, type: 'discussion_response' },
  }, 'discussion');
}
