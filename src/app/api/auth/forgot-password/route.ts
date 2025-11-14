import { NextRequest, NextResponse } from 'next/server';
import { cognitoAuthService } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Basic validation
    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    try {
      // Check if user exists
      let userExists = false;
      try {
        await cognitoAuthService.getUser(email);
        userExists = true;
      } catch (error) {
        // User doesn't exist
        userExists = false;
      }

      // For security reasons, don't reveal whether a user exists or not
      // Always return success to prevent email enumeration attacks
      
      try {
        // Attempt to send forgot password email
        await cognitoAuthService.forgotPassword(email);
        
        return NextResponse.json(
          {
            message: 'If an account with that email exists, a password reset link has been sent.',
            // Don't reveal whether the email was actually sent
            // This prevents email enumeration attacks
          },
          { status: 200 }
        );
      } catch (forgotPasswordError) {
        // Log the error for debugging
        console.error('Forgot password error:', forgotPasswordError);
        
        // Still return success to prevent email enumeration
        return NextResponse.json(
          {
            message: 'If an account with that email exists, a password reset link has been sent.',
          },
          { status: 200 }
        );
      }
    } catch (authError) {
      // Handle specific Cognito errors
      if (authError instanceof Error) {
        const errorMessage = authError.message.toLowerCase();
        
        if (errorMessage.includes('user not found')) {
          // Don't reveal that the user doesn't exist
          return NextResponse.json(
            {
              message: 'If an account with that email exists, a password reset link has been sent.',
            },
            { status: 200 }
          );
        }
        
        if (errorMessage.includes('too many requests')) {
          return NextResponse.json(
            { message: 'Too many password reset requests. Please try again later.' },
            { status: 429 }
          );
        }
        
        if (errorMessage.includes('user pool not found')) {
          console.error('Cognito configuration error:', authError);
          return NextResponse.json(
            { message: 'Service temporarily unavailable. Please try again later' },
            { status: 503 }
          );
        }
      }
      
      // Log the error for debugging (but don't expose internal details)
      console.error('Forgot password authentication error:', authError);
      
      // Still return success to prevent email enumeration
      return NextResponse.json(
        {
          message: 'If an account with that email exists, a password reset link has been sent.',
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Forgot password request error:', error);
    
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

