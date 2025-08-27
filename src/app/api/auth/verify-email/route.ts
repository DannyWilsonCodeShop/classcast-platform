import { NextRequest, NextResponse } from 'next/server';
import { cognitoAuthService } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    // Basic validation
    if (!email || !code) {
      return NextResponse.json(
        { message: 'Email and verification code are required' },
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

    // Code validation
    if (typeof code !== 'string' || code.trim().length !== 6) {
      return NextResponse.json(
        { message: 'Verification code must be 6 characters long' },
        { status: 400 }
      );
    }

    // Code format validation (should be numeric)
    if (!/^\d+$/.test(code.trim())) {
      return NextResponse.json(
        { message: 'Verification code must contain only numbers' },
        { status: 400 }
      );
    }

    try {
      // Confirm the email verification with Cognito
      await cognitoAuthService.confirmSignUp(email, code.trim());
      
      return NextResponse.json(
        {
          message: 'Email verified successfully. You can now sign in to your account.',
        },
        { status: 200 }
      );
    } catch (authError) {
      // Handle specific Cognito errors
      if (authError instanceof Error) {
        const errorMessage = authError.message.toLowerCase();
        
        if (errorMessage.includes('code mismatch') || errorMessage.includes('invalid code')) {
          return NextResponse.json(
            { message: 'The verification code is incorrect. Please check your email and try again.' },
            { status: 400 }
          );
        }
        
        if (errorMessage.includes('expired code')) {
          return NextResponse.json(
            { message: 'The verification code has expired. Please request a new one.' },
            { status: 400 }
          );
        }
        
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
        
        if (errorMessage.includes('too many attempts')) {
          return NextResponse.json(
            { message: 'Too many failed verification attempts. Please request a new verification code.' },
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
      console.error('Email verification authentication error:', authError);
      
      return NextResponse.json(
        { message: 'Failed to verify email. Please check the code and try again.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Email verification request error:', error);
    
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

