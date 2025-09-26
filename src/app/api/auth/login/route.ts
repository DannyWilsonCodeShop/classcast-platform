import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory store for mock users (in production, this would be a database)
const mockUsers = new Map();

export async function POST(request: NextRequest) {
  try {
    console.log('=== MOCK LOGIN API CALLED ===');
    
    const body = await request.json();
    const { email, password } = body;
    
    console.log('Login API called with:', { email, password: password ? '***' : 'undefined' });

    // Basic validation
    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json(
        { error: { message: 'Email and password are required' } },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Invalid email format:', email);
      return NextResponse.json(
        { error: { message: 'Please enter a valid email address' } },
        { status: 400 }
      );
    }

    // Password length validation
    if (password.length < 8) {
      console.log('Password too short:', password.length);
      return NextResponse.json(
        { error: { message: 'Password must be at least 8 characters long' } },
        { status: 400 }
      );
    }

    try {
      console.log('Attempting mock authentication for:', email);
      
      // Check if user exists in our mock store
      const user = mockUsers.get(email);
      
      if (!user) {
        console.log('User not found in mock store:', email);
        return NextResponse.json(
          { error: { message: 'Invalid email or password' } },
          { status: 401 }
        );
      }

      // Check password (in a real app, this would be hashed)
      if (user.password !== password) {
        console.log('Invalid password for user:', email);
        return NextResponse.json(
          { error: { message: 'Invalid email or password' } },
          { status: 401 }
        );
      }

      console.log('Mock authentication successful:', { 
        userId: user.id, 
        email: user.email,
        role: user.role
      });

      // Return success response with user data
      return NextResponse.json(
        {
          message: 'Login successful',
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            studentId: user.studentId,
            instructorId: user.instructorId,
            department: user.department,
            emailVerified: user.emailVerified,
          },
          tokens: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            idToken: 'mock-id-token',
            expiresIn: 3600, // 1 hour
          },
        },
        { status: 200 }
      );
    } catch (authError) {
      console.error('Mock authentication error:', authError);
      
      return NextResponse.json(
        { error: { message: 'Authentication failed. Please check your credentials and try again' } },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Login request error:', error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: 'Invalid request format' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: 'Internal server error. Please try again later' },
      { status: 500 }
    );
  }
}

// Function to add a user to the mock store (called from signup)
export function addMockUser(userData: any) {
  mockUsers.set(userData.email, userData);
  console.log('Added user to mock store:', userData.email);
}