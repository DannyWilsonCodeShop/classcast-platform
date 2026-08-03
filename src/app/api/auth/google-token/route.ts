import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = 'classcast-users';
const COGNITO_DOMAIN = 'classcast-verification.auth.us-east-1.amazoncognito.com';
const CLIENT_ID = '7tbaq74itv3gdda1bt25iqafvh';

// Exchange Google/Cognito auth code for tokens and find/create user
export async function POST(request: NextRequest) {
  try {
    const { authCode, redirectUri } = await request.json();

    if (!authCode) {
      return NextResponse.json({ success: false, error: 'Missing auth code' }, { status: 400 });
    }

    // Exchange auth code for tokens
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

    // Get user info
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
    const sub = userInfo.sub;

    // Find or create user
    let userId: string;
    let role = 'student';

    const existingUserResult = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email },
    }));

    if (existingUserResult.Items && existingUserResult.Items.length > 0) {
      userId = existingUserResult.Items[0].userId;
      role = existingUserResult.Items[0].role || 'student';
    } else {
      // Create new user (default to student role)
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

    return NextResponse.json({
      success: true,
      userId,
      role,
      tokens: {
        idToken: tokens.id_token,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      },
    });
  } catch (error) {
    console.error('Google token exchange error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
