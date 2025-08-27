import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/lib/auth';
import { mockAuthService } from '@/lib/mock-auth';

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
      instructorId, 
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

    if (role !== UserRole.STUDENT && role !== UserRole.INSTRUCTOR && role !== UserRole.ADMIN) {
      console.log('Invalid role:', role);
      return NextResponse.json(
        { error: { message: 'Invalid role specified' } },
        { status: 400 }
      );
    }

    if (role === UserRole.STUDENT && !studentId) {
      console.log('Student ID missing for student role');
      return NextResponse.json(
        { error: { message: 'Student ID is required for student role' } },
        { status: 400 }
      );
    }

    if (role === UserRole.INSTRUCTOR && (!instructorId || !department)) {
      console.log('Instructor ID or Department missing for instructor role');
      return NextResponse.json(
        { error: { message: 'Instructor ID and Department are required for instructor role' } },
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
      // Check if user already exists
      const existingUser = await mockAuthService.getUser(email);
      if (existingUser) {
        console.log('User already exists:', email);
        return NextResponse.json(
          { error: { message: 'A user with this email already exists' } },
          { status: 409 }
        );
      }

      console.log('Creating user with data:', { email, firstName, lastName, role, studentId, instructorId, department });

      // Create user with mock service
      const newUser = await mockAuthService.createUser({
        email,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password,
        role,
        studentId: role === UserRole.STUDENT ? studentId : undefined,
        instructorId: role === UserRole.INSTRUCTOR ? instructorId : undefined,
        department: role === UserRole.INSTRUCTOR ? department : undefined,
      });

      console.log('User created successfully:', newUser);

      // Return success response
      return NextResponse.json(
        {
          message: 'Account created successfully! Welcome to ClassCast.',
          user: {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            role: newUser.role,
            studentId: newUser.studentId,
            instructorId: newUser.instructorId,
            department: newUser.department,
            emailVerified: newUser.emailVerified,
          },
          nextStep: 'login',
        },
        { status: 201 }
      );
    } catch (authError) {
      // Log the error for debugging (but don't expose internal details)
      console.error('Signup error:', authError);
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
        { error: { message: 'Failed to create account. An unexpected error occurred.' } },
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

