import { NextRequest, NextResponse } from 'next/server';
import { simpleCognitoAuthService } from '@/lib/auth-simple';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      email, 
      firstName, 
      lastName, 
      password, 
      role, 
      studentId, 
      department 
    } = body;

    console.log('Signup request body:', body);

    // Basic validation
    if (!email || !password || !firstName || !lastName || !role) {
      console.log('Missing required fields:', { email: !!email, password: !!password, firstName: !!firstName, lastName: !!lastName, role: !!role });
      return NextResponse.json(
        { error: { message: 'Missing required fields' } },
        { status: 400 }
      );
    }

    if (role !== 'student' && role !== 'instructor' && role !== 'admin') {
      console.log('Invalid role:', role);
      return NextResponse.json(
        { error: { message: 'Invalid role specified' } },
        { status: 400 }
      );
    }


    if (role === 'instructor' && !department) {
      console.log('Department missing for instructor role');
      return NextResponse.json(
        { error: { message: 'Department is required for instructor role' } },
        { status: 400 }
      );
    }

    // Password validation
    if (password.length < 8) {
      console.log('Password too short:', password.length);
      return NextResponse.json(
        { error: { message: 'Password must be at least 8 characters long' } },
        { status: 400 }
      );
    }

    try {
      console.log('Creating user with AWS Cognito (auto-confirmed):', { email, firstName, lastName, role, studentId, department });

      // Use direct Cognito admin commands to create and auto-confirm user
      const { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand, AdminUpdateUserAttributesCommand } = await import('@aws-sdk/client-cognito-identity-provider');
      
      const cognitoClient = new CognitoIdentityProviderClient({
        region: process.env.AWS_REGION || 'us-east-1',
      });

      const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || 'us-east-1_uK50qBrap';

      // Prepare user attributes
      const userAttributes = [
        { Name: 'email', Value: email },
        { Name: 'given_name', Value: firstName.trim() },
        { Name: 'family_name', Value: lastName.trim() },
        { Name: 'custom:role', Value: role },
        { Name: 'email_verified', Value: 'true' }, // Auto-verify email
      ];

      if (role === 'instructor' && department) {
        userAttributes.push({ Name: 'custom:department', Value: department });
        userAttributes.push({ Name: 'custom:instructorId', Value: `INS-${Date.now()}` });
      }

      // Create user with admin command (auto-confirmed)
      const createCommand = new AdminCreateUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
        UserAttributes: userAttributes,
        TemporaryPassword: password,
        MessageAction: 'SUPPRESS', // Don't send welcome email
      });

      const createResponse = await cognitoClient.send(createCommand);
      console.log('User created with AdminCreateUser:', createResponse.User?.Username);

      // Set permanent password
      const setPasswordCommand = new AdminSetUserPasswordCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
        Password: password,
        Permanent: true,
      });

      await cognitoClient.send(setPasswordCommand);
      console.log('Permanent password set for user:', email);

      // Create result object
      const result = {
        username: email,
        email: email,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: role as 'student' | 'instructor' | 'admin',
        instructorId: role === 'instructor' ? `INS-${Date.now()}` : undefined,
        department: role === 'instructor' ? department : undefined,
        status: 'CONFIRMED' as const,
      };

      console.log('User created and auto-confirmed successfully:', result);

      // No verification needed since user is auto-confirmed
      const needsVerification = false;

      // Create user profile in DynamoDB
      try {
        const { DynamoDBService } = await import('@/lib/dynamodb');
        const dynamoDBService = new DynamoDBService();
        
        const userProfile = {
          userId: result.username, // Use username as userId
          email: result.email,
          firstName: result.firstName,
          lastName: result.lastName,
          role: result.role,
          studentId: result.studentId,
          instructorId: result.instructorId,
          department: result.department,
          status: 'active',
          enabled: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          preferences: {
            notifications: {
              email: true,
              push: false
            },
            theme: 'light',
            language: 'en'
          }
        };

        await dynamoDBService.putItem('classcast-users', userProfile);
        console.log('User profile created in DynamoDB');
      } catch (dbError) {
        console.error('Failed to create user profile in DynamoDB:', dbError);
        // Continue execution even if profile creation fails
      }

      // Return success response
      return NextResponse.json(
        {
          message: 'Account created successfully! You can now log in immediately.',
          user: {
            id: result.username,
            email: result.email,
            firstName: result.firstName,
            lastName: result.lastName,
            role: result.role,
            instructorId: result.instructorId,
            department: result.department,
            emailVerified: true, // Always true since we auto-confirm
          },
          nextStep: 'login',
          needsVerification: false,
          requiresEmailConfirmation: false,
        },
        { status: 201 }
      );
    } catch (authError) {
      console.error('Cognito signup error:', authError);
      
      if (authError instanceof Error) {
        if (authError.message.includes('email already exists')) {
          return NextResponse.json(
            { error: { message: 'A user with this email already exists' } },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { error: { message: authError.message || 'Failed to create account. Please try again later' } },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: { message: 'Failed to create account. Please try again later' } },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Signup request error:', error);
    
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

