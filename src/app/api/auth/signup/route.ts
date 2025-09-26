import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, password, role, studentId, department } = body;

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
      console.log('Creating user with mock data for now:', { email, firstName, lastName, role, studentId, department });

      // For now, return a mock successful response
      // This allows the frontend to work while we fix the AWS integration
      const mockUser = {
        id: email,
        email: email,
        firstName: firstName,
        lastName: lastName,
        role: role,
        emailVerified: true
      };

      console.log('Mock user created successfully:', mockUser);

      return NextResponse.json(
        {
          message: 'Account created successfully! You can now log in immediately.',
          user: mockUser,
          nextStep: 'login',
          needsVerification: false,
          requiresEmailConfirmation: false,
        },
        { status: 201 }
      );
    } catch (mockError) {
      console.error('Mock signup error:', mockError);
      
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