import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = 'classcast-users';
const COURSES_TABLE = 'classcast-courses';

const COGNITO_DOMAIN = 'classcast-verification.auth.us-east-1.amazoncognito.com';
const CLIENT_ID = '7tbaq74itv3gdda1bt25iqafvh';

// Exchange Cognito auth code for tokens, create/find user, and enroll in class
export async function POST(request: NextRequest) {
  try {
    const { authCode, classCode, redirectUri } = await request.json();

    if (!authCode || !classCode) {
      return NextResponse.json({ success: false, error: 'Missing authCode or classCode' }, { status: 400 });
    }

    // 1. Exchange auth code for tokens with Cognito
    const tokenResponse = await fetch(`https://${COGNITO_DOMAIN}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        code: authCode,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const err = await tokenResponse.text();
      console.error('Token exchange failed:', err);
      return NextResponse.json({ success: false, error: 'Authentication failed' }, { status: 401 });
    }

    const tokens = await tokenResponse.json();

    // 2. Get user info from Cognito
    const userInfoResponse = await fetch(`https://${COGNITO_DOMAIN}/oauth2/userInfo`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoResponse.ok) {
      return NextResponse.json({ success: false, error: 'Failed to get user info' }, { status: 401 });
    }

    const userInfo = await userInfoResponse.json();
    const email = userInfo.email;
    const firstName = userInfo.given_name || userInfo.name?.split(' ')[0] || '';
    const lastName = userInfo.family_name || userInfo.name?.split(' ').slice(1).join(' ') || '';
    const sub = userInfo.sub; // Cognito sub

    // 3. Find or create user in DynamoDB
    let userId: string;

    // Check if user already exists by email
    const existingUserResult = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email },
    }));

    if (existingUserResult.Items && existingUserResult.Items.length > 0) {
      userId = existingUserResult.Items[0].userId;
    } else {
      // Create new student user
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await docClient.send(new PutCommand({
        TableName: USERS_TABLE,
        Item: {
          userId,
          email,
          firstName,
          lastName,
          role: 'student',
          cognitoSub: sub,
          authProvider: 'google',
          createdAt: new Date().toISOString(),
          enrolledCourses: [],
        },
      }));
    }

    // 4. Find course by class code
    const coursesResult = await docClient.send(new ScanCommand({
      TableName: COURSES_TABLE,
    }));

    let targetCourse: any = null;
    let targetSection: any = null;

    for (const course of coursesResult.Items || []) {
      const sections = course.sections || [];
      for (const section of sections) {
        if (section.classCode === classCode || section.sectionCode === classCode) {
          targetCourse = course;
          targetSection = section;
          break;
        }
      }
      // Also check top-level classCode
      if (!targetCourse && course.classCode === classCode) {
        targetCourse = course;
        targetSection = sections[0] || null;
      }
      if (targetCourse) break;
    }

    if (!targetCourse) {
      return NextResponse.json({ success: false, error: 'Invalid class code' }, { status: 404 });
    }

    // 5. Enroll student in course
    const courseId = targetCourse.courseId;
    const sectionId = targetSection?.sectionId || 'default';

    // Check if already enrolled
    const userDoc = await docClient.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId },
    }));

    const enrolledCourses = userDoc.Item?.enrolledCourses || [];
    const alreadyEnrolled = enrolledCourses.some((c: any) => c.courseId === courseId || c === courseId);

    if (!alreadyEnrolled) {
      // Add enrollment
      const enrollment = {
        courseId,
        sectionId,
        courseName: targetCourse.title || targetCourse.courseName,
        enrolledAt: new Date().toISOString(),
        instructorId: targetCourse.instructorId,
      };

      await docClient.send(new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { userId },
        UpdateExpression: 'SET enrolledCourses = list_append(if_not_exists(enrolledCourses, :empty), :enrollment), schoolLogo = if_not_exists(schoolLogo, :logo), schoolName = if_not_exists(schoolName, :schoolName)',
        ExpressionAttributeValues: {
          ':enrollment': [enrollment],
          ':empty': [],
          ':logo': targetCourse.schoolLogo || '',
          ':schoolName': targetCourse.schoolName || '',
        },
      }));

      // Increment enrollment count on course section
      if (targetSection) {
        try {
          const sectionIndex = (targetCourse.sections || []).findIndex((s: any) => s.sectionId === sectionId);
          if (sectionIndex >= 0) {
            await docClient.send(new UpdateCommand({
              TableName: COURSES_TABLE,
              Key: { courseId },
              UpdateExpression: `SET sections[${sectionIndex}].currentEnrollment = if_not_exists(sections[${sectionIndex}].currentEnrollment, :zero) + :one`,
              ExpressionAttributeValues: { ':zero': 0, ':one': 1 },
            }));
          }
        } catch (e) {
          console.error('Failed to increment enrollment count:', e);
        }
      }
    }

    return NextResponse.json({
      success: true,
      userId,
      courseId,
      courseName: targetCourse.title || targetCourse.courseName,
      alreadyEnrolled,
      tokens: {
        idToken: tokens.id_token,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      },
    });
  } catch (error) {
    console.error('Google enroll error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
