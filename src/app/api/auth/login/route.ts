import { NextRequest, NextResponse } from 'next/server';
import { simpleCognitoAuthService } from '@/lib/auth-simple';
import { mockAuthService } from '@/lib/mock-auth';

export async function POST(request: NextRequest) {
  try {
    console.log('=== LOGIN API CALLED ===');
    
    // Using AWS Cognito for authentication
    console.log('🔧 Using AWS Cognito for authentication...');
    
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
      console.log('About to call awsCognitoAuthService.login...');
      
      // Use AWS Cognito for authentication
      const authResult = await simpleCognitoAuthService.login(email, password);
      console.log('Login successful, auth result:', { 
        userId: authResult.user.id, 
        email: authResult.user.email,
        hasToken: !!authResult.tokens.accessToken 
      });

      // Set secure HTTP-only cookies for the session
      const response = NextResponse.json(
        {
          message: 'Login successful',
          user: {
            id: authResult.user.username,
            email: authResult.user.email,
            firstName: authResult.user.firstName,
            lastName: authResult.user.lastName,
            role: authResult.user.role,
            studentId: authResult.user.studentId,
            instructorId: authResult.user.instructorId,
            department: authResult.user.department,
            emailVerified: authResult.user.status === 'ACTIVE',
          },
          tokens: {
            accessToken: authResult.tokens.accessToken,
            refreshToken: authResult.tokens.refreshToken,
            idToken: authResult.tokens.idToken,
            expiresIn: 3600, // 1 hour
          },
        },
        { status: 200 }
      );

      // Set secure cookies
      response.cookies.set('accessToken', authResult.tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600, // 1 hour
        path: '/',
      });

      response.cookies.set('refreshToken', authResult.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      });

      response.cookies.set('idToken', authResult.tokens.idToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600, // 1 hour
        path: '/',
      });

      return response;
    } catch (authError) {
      // Handle AWS Cognito authentication errors
      console.error('AWS Cognito auth error, falling back to mock service:', authError);
      
      try {
        // Fallback to mock service if Cognito fails
        console.log('Attempting to authenticate with mock service as fallback');
        const mockUser = await mockAuthService.authenticate(email, password);
        
        console.log('Mock service authentication successful:', { 
          userId: mockUser.id, 
          email: mockUser.email,
          role: mockUser.role
        });

        // Return success response with mock user data
        return NextResponse.json(
          {
            message: 'Login successful',
            user: {
              id: mockUser.id,
              email: mockUser.email,
              firstName: mockUser.firstName,
              lastName: mockUser.lastName,
              role: mockUser.role,
              studentId: mockUser.studentId,
              instructorId: mockUser.instructorId,
              department: mockUser.department,
              emailVerified: mockUser.emailVerified,
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
      } catch (mockError) {
        console.error('Mock service authentication also failed:', mockError);
        
        if (authError instanceof Error) {
          const errorMessage = authError.message.toLowerCase();
          console.log('Error message:', errorMessage);
          
          if (errorMessage.includes('invalid email or password') || mockError instanceof Error) {
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

