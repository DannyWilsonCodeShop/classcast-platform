import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { CognitoIdentityProviderClient, AdminLinkProviderForUserCommand, ListUsersCommand } from '@aws-sdk/client-cognito-identity-provider';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const cognitoClient = new CognitoIdentityProviderClient({ region: 'us-east-1' });

const USERS_TABLE = 'classcast-users';
const COGNITO_DOMAIN = 'classcast-verification.auth.us-east-1.amazoncognito.com';
const CLIENT_ID = '7tbaq74itv3gdda1bt25iqafvh';
const USER_POOL_ID = 'us-east-1_uK50qBrap';

// Link Google identity to existing Cognito user (if they signed up with email/password first)
async function linkGoogleToExistingUser(email: string, googleSub: string) {
  try {
    // Check if a native Cognito user exists with this email
    const listResult = await cognitoClient.send(new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Filter: `email = "${email}"`,
    }));

    const nativeUser = listResult.Users?.find(u =>
      u.UserStatus !== 'EXTERNAL_PROVIDER' &&
      !u.Username?.startsWith('google_')
    );

    if (nativeUser && nativeUser.Username) {
      // Link the Google provider to the existing native user
      await cognitoClient.send(new AdminLinkProviderForUserCommand({
        UserPoolId: USER_POOL_ID,
        DestinationUser: {
          ProviderName: 'Cognito',
          ProviderAttributeValue: nativeUser.Username,
        },
        SourceUser: {
          ProviderName: 'Google',
          ProviderAttributeName: 'Cognito_Subject',
          ProviderAttributeValue: googleSub,
        },
      }));
      console.log(`Linked Google identity to existing user: ${email}`);
      return true;
    }
  } catch (error) {
    // Linking may fail if already linked — that's fine
    console.log('Link attempt (may already be linked):', (error as Error).message);
  }
  return false;
}

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

    // Extract Google sub from the Cognito sub (format: "google_<googleId>" or just the sub)
    const googleSub = sub.startsWith('google_') ? sub.replace('google_', '') : sub;

    // Find or create user in DynamoDB
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

      // Update the existing user with Google auth info
      await docClient.send(new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { userId },
        UpdateExpression: 'SET googleSub = :gsub, authProvider = if_not_exists(authProvider, :provider)',
        ExpressionAttributeValues: {
          ':gsub': googleSub,
          ':provider': 'google',
        },
      }));

      // Link Google identity to existing Cognito user
      await linkGoogleToExistingUser(email, googleSub);
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
          googleSub,
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
