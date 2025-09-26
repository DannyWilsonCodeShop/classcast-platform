import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory store for mock users (in production, this would be a database)
const mockUsers = new Map();

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

      // Check if user already exists
      if (mockUsers.has(email)) {
        console.log('User already exists:', email);
        return NextResponse.json(
          { error: { message: 'A user with this email already exists' } },
          { status: 409 }
        );
      }

      // Create mock user data
      const mockUser = {
        id: email,
        email: email,
        firstName: firstName,
        lastName: lastName,
        password: password, // Store password for login verification
        role: role,
        studentId: studentId,
        instructorId: role === 'instructor' ? `INS-${Date.now()}` : undefined,
        department: department,
        emailVerified: true,
        createdAt: new Date().toISOString()
      };

      // Add user to mock store
      mockUsers.set(email, mockUser);
      console.log('Mock user created and stored successfully:', mockUser);

      return NextResponse.json(
        {
          message: 'Account created successfully! You can now log in immediately.',
          user: {
            id: mockUser.id,
            email: mockUser.email,
            firstName: mockUser.firstName,
            lastName: mockUser.lastName,
            role: mockUser.role,
            emailVerified: mockUser.emailVerified
          },
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