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
      // Check if user exists and is unconfirmed
      let userStatus = 'UNKNOWN';
      try {
        const user = await cognitoAuthService.getUser(email);
        userStatus = user.status;
      } catch (error) {
        // User doesn't exist
        userStatus = 'NOT_FOUND';
      }

      // Only allow resending verification for unconfirmed users
      if (userStatus === 'NOT_FOUND') {
        return NextResponse.json(
          { message: 'No account found with that email address.' },
          { status: 404 }
        );
      }

      if (userStatus === 'ACTIVE') {
        return NextResponse.json(
          { message: 'This email has already been verified. You can sign in to your account.' },
          { status: 400 }
        );
      }

      // Attempt to resend verification code
      await cognitoAuthService.resendConfirmationCode(email);
      
      return NextResponse.json(
        {
          message: 'Verification code has been resent to your email address.',
        },
        { status: 200 }
      );
    } catch (authError) {
      // Handle specific Cognito errors
      if (authError instanceof Error) {
        const errorMessage = authError.message.toLowerCase();
        
        if (errorMessage.includes('user not found')) {
          return NextResponse.json(
            { message: 'No account found with that email address.' },
            { status: 404 }
          );
        }
        
        if (errorMessage.includes('already confirmed')) {
          return NextResponse.json(
            { message: 'This email has already been verified. You can sign in to your account.' },
            { status: 400 }
          );
        }
        
        if (errorMessage.includes('too many requests')) {
          return NextResponse.json(
            { message: 'Too many verification code requests. Please try again later.' },
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
      console.error('Resend verification authentication error:', authError);
      
      return NextResponse.json(
        { message: 'Failed to resend verification code. Please try again later.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Resend verification request error:', error);
    
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

