import { NextRequest, NextResponse } from 'next/server';
import { mockAuthService, ensureMockServiceInitialized } from '@/lib/mock-auth';

export async function POST(request: NextRequest) {
  try {
    console.log('=== LOGIN API CALLED ===');
    
    // Ensure mock service is initialized
    console.log('🔧 Ensuring mock service is initialized...');
    const authService = ensureMockServiceInitialized();
    console.log('✅ Mock service initialized:', authService);
    
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
      console.log('About to call mockAuthService.login...');
      console.log('mockAuthService object:', mockAuthService);
      console.log('mockAuthService.login method:', typeof mockAuthService.login);
      
      // Use mock authentication service for development
      const authResult = await mockAuthService.login(email, password);
      console.log('Login successful, auth result:', { 
        userId: authResult.user.id, 
        email: authResult.user.email,
        hasToken: !!authResult.token 
      });

      // Set secure HTTP-only cookies for the session
      const response = NextResponse.json(
        {
          message: 'Login successful',
          user: {
            id: authResult.user.id,
            email: authResult.user.email,
            firstName: authResult.user.firstName,
            lastName: authResult.user.lastName,
            role: authResult.user.role,
            studentId: authResult.user.studentId,
            instructorId: authResult.user.instructorId,
            department: authResult.user.department,
            emailVerified: authResult.user.emailVerified,
          },
          tokens: {
            accessToken: authResult.token,
            refreshToken: authResult.token, // Mock service uses same token for both
            expiresIn: 3600, // 1 hour
          },
        },
        { status: 200 }
      );

      // Set secure cookies
      response.cookies.set('accessToken', authResult.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600, // 1 hour
        path: '/',
      });

      response.cookies.set('refreshToken', authResult.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      });

      return response;
    } catch (authError) {
      // Handle mock authentication errors
      console.error('Mock auth error:', authError);
      
      if (authError instanceof Error) {
        const errorMessage = authError.message.toLowerCase();
        console.log('Error message:', errorMessage);
        
        if (errorMessage.includes('invalid email or password')) {
          return NextResponse.json(
            { error: { message: 'Invalid email or password' } },
            { status: 401 }
          );
        }
      }
      
      // Log the error for debugging
      console.error('Login authentication error:', authError);
      
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

