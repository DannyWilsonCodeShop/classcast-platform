import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { isRequestFromDemoUser, getDemoTargetFromRequest } from '@/lib/demo-mode-middleware';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = 'classcast-users';

// GET /api/profile - Get user profile by userId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get('userId');

    // Handle demo mode - redirect to target user
    if (isRequestFromDemoUser(request)) {
      const demoTargetUser = getDemoTargetFromRequest(request);
      if (demoTargetUser) {
        userId = demoTargetUser;
        console.log(`🎭 Demo mode: Fetching profile for target user ${userId}`);
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user profile from DynamoDB
    const result = await docClient.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId }
    }));

    if (!result.Item) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Return user profile data
    const userProfile = {
      id: result.Item.userId,
      email: result.Item.email,
      firstName: result.Item.firstName,
      lastName: result.Item.lastName,
      role: result.Item.role,
      avatar: result.Item.avatar,
      bio: result.Item.bio,
      department: result.Item.department,
      instructorId: result.Item.instructorId,
      studentId: result.Item.studentId,
      careerGoals: result.Item.careerGoals,
      classOf: result.Item.classOf,
      funFact: result.Item.funFact,
      favoriteSubject: result.Item.favoriteSubject,
      hobbies: result.Item.hobbies,
      schoolName: result.Item.schoolName,
      yearsExperience: result.Item.yearsExperience,
      emailVerified: result.Item.emailVerified || false,
      createdAt: result.Item.createdAt,
      updatedAt: result.Item.updatedAt
    };

    const response = NextResponse.json({
      success: true,
      data: userProfile
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch user profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
