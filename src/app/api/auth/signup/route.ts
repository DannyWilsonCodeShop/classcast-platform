import { NextRequest, NextResponse } from 'next/server';
import { cognitoAuthService } from '@/lib/auth';

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

    if (role === 'student' && !studentId) {
      console.log('Student ID missing for student role');
      return NextResponse.json(
        { error: { message: 'Student ID is required for student role' } },
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
      console.log('Creating user with AWS Cognito:', { email, firstName, lastName, role, studentId, department });

      // Use AWS Cognito for user creation
      const result = await cognitoAuthService.createUser({
        username: email, // Use email as username
        email,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password,
        role: role as 'student' | 'instructor' | 'admin',
        studentId: role === 'student' ? studentId : undefined,
        instructorId: role === 'instructor' ? `INS-${Date.now()}` : undefined,
        department: role === 'instructor' ? department : undefined,
      });

      console.log('User created successfully with AWS Cognito:', result);

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
          message: 'Account created successfully! Please check your email for a confirmation link to verify your account.',
          user: {
            id: result.username,
            email: result.email,
            firstName: result.firstName,
            lastName: result.lastName,
            role: result.role,
            studentId: result.studentId,
            instructorId: result.instructorId,
            department: result.department,
            emailVerified: result.status === 'ACTIVE',
          },
          nextStep: 'verify-email',
          requiresEmailConfirmation: true,
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

