import { NextRequest, NextResponse } from 'next/server';
import { CognitoIdentityProviderClient, InitiateAuthCommand, GetUserCommand } from '@aws-sdk/client-cognito-identity-provider';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || 'us-east-1_uK50qBrap';
const CLIENT_ID = process.env.COGNITO_CLIENT_ID || process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '7tbaq74itv3gdda1bt25iqafvh';

export async function POST(request: NextRequest) {
  try {
    console.log('=== DIRECT COGNITO LOGIN API CALLED ===');
    
    const body = await request.json();
    const { email, password } = body;
    
    console.log('Login request:', { email, password: password ? '***' : 'undefined' });

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: { message: 'Email and password are required' } },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: { message: 'Please enter a valid email address' } },
        { status: 400 }
      );
    }

    // Password length validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: { message: 'Password must be at least 8 characters long' } },
        { status: 400 }
      );
    }

    // Check for test credentials first
    const testUsers = [
      {
        email: 'teststudent@classcast.com',
        password: 'TestPassword123!',
        user: {
          id: 'test-student-123',
          email: 'teststudent@classcast.com',
          firstName: 'Test',
          lastName: 'Student',
          role: 'student' as const,
          avatar: '/api/placeholder/40/40',
          emailVerified: true,
          bio: 'Test student account',
          careerGoals: 'Learn and grow',
          classOf: '2025',
          funFact: 'I love testing!',
          favoriteSubject: 'Math',
          hobbies: 'Coding, Reading',
          schoolName: 'Test University',
        }
      },
      {
        email: 'testinstructor@classcast.com',
        password: 'TestPassword123!',
        user: {
          id: 'test-instructor-123',
          email: 'testinstructor@classcast.com',
          firstName: 'Test',
          lastName: 'Instructor',
          role: 'instructor' as const,
          avatar: '/api/placeholder/40/40',
          emailVerified: true,
          bio: 'Test instructor account',
          careerGoals: 'Teach and inspire',
          classOf: '2020',
          funFact: 'I love teaching!',
          favoriteSubject: 'Mathematics',
          hobbies: 'Teaching, Research',
          schoolName: 'Test University',
        }
      }
    ];

    const testUser = testUsers.find(u => u.email === email && u.password === password);
    
    if (testUser) {
      console.log('Using test credentials for:', email);
      
      // Generate mock tokens
      const mockTokens = {
        accessToken: `mock-access-token-${Date.now()}`,
        refreshToken: `mock-refresh-token-${Date.now()}`,
        idToken: `mock-id-token-${Date.now()}`,
      };

      return NextResponse.json({
        success: true,
        user: testUser.user,
        tokens: mockTokens,
      });
    }

    try {
      console.log('Calling Cognito for authentication:', email);
      
      // Authenticate with Cognito
      const authCommand = new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: CLIENT_ID,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      });

      const authResponse = await cognitoClient.send(authCommand);
      console.log('Cognito auth response received');

      if (!authResponse.AuthenticationResult) {
        throw new Error('Authentication failed - no result from Cognito');
      }

      const { AccessToken, IdToken, RefreshToken } = authResponse.AuthenticationResult;

      if (!AccessToken) {
        throw new Error('No access token received from Cognito');
      }

      // Get user details
      const getUserCommand = new GetUserCommand({
        AccessToken: AccessToken,
      });

      const userResponse = await cognitoClient.send(getUserCommand);
      console.log('User details retrieved from Cognito');

      // Extract user attributes
      const attributes = userResponse.UserAttributes || [];
      const userAttributes: { [key: string]: string } = {};
      
      attributes.forEach(attr => {
        if (attr.Name && attr.Value) {
          userAttributes[attr.Name] = attr.Value;
        }
      });

      // Determine user role
      let role = 'student'; // default
      if (userAttributes['custom:role']) {
        role = userAttributes['custom:role'];
      } else if (userAttributes['email']?.includes('instructor')) {
        role = 'instructor';
      }

      // Create user object
      const user = {
        id: userAttributes['sub'] || userResponse.Username || '',
        email: userAttributes['email'] || email,
        firstName: userAttributes['given_name'] || userAttributes['name'] || '',
        lastName: userAttributes['family_name'] || '',
        role: role as 'student' | 'instructor' | 'admin',
        avatar: userAttributes['picture'] || '/api/placeholder/40/40',
        emailVerified: userAttributes['email_verified'] === 'true',
        bio: userAttributes['custom:bio'] || '',
        careerGoals: userAttributes['custom:careerGoals'] || '',
        classOf: userAttributes['custom:classOf'] || '',
        funFact: userAttributes['custom:funFact'] || '',
        favoriteSubject: userAttributes['custom:favoriteSubject'] || '',
        hobbies: userAttributes['custom:hobbies'] || '',
        schoolName: userAttributes['custom:schoolName'] || '',
      };

      console.log('Login successful for user:', { id: user.id, email: user.email, role: user.role });

      return NextResponse.json({
        success: true,
        user,
        tokens: {
          accessToken: AccessToken,
          refreshToken: RefreshToken || '',
          idToken: IdToken || '',
        },
      });

    } catch (authError: any) {
      console.error('Cognito authentication error:', authError);
      
      // Handle specific Cognito errors
      if (authError.name === 'NotAuthorizedException') {
        return NextResponse.json(
          { error: { message: 'Invalid email or password' } },
          { status: 401 }
        );
      } else if (authError.name === 'UserNotConfirmedException') {
        return NextResponse.json(
          { error: { message: 'Please verify your email address before logging in' } },
          { status: 401 }
        );
      } else if (authError.name === 'UserNotFoundException') {
        return NextResponse.json(
          { error: { message: 'No account found with this email address' } },
          { status: 401 }
        );
      } else if (authError.name === 'TooManyRequestsException') {
        return NextResponse.json(
          { error: { message: 'Too many login attempts. Please try again later' } },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { error: { message: 'Authentication failed. Please check your credentials and try again' } },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Login request error:', error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: { message: 'Invalid request format' } },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: { message: 'Internal server error. Please try again later' } },
      { status: 500 }
    );
  }
}