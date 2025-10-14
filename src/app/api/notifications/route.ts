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

    // Simplified notifications - return empty array for now to avoid DynamoDB issues
    const notifications = [];

    // Add a sample notification to test the system
    if (userRole === 'student') {
      notifications.push({
        id: `welcome_${userId}`,
        type: 'info',
        title: 'Welcome to ClassCast!',
        message: 'Your dashboard is ready. Check out your assignments and peer reviews.',
        url: '/student/dashboard',
        timestamp: new Date().toISOString(),
        priority: 'low'
      });
    }

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