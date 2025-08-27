import { NextRequest, NextResponse } from 'next/server';
import { cognitoAuthService } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, email, password } = body;

    // Basic validation
    if (!token || !email || !password) {
      return NextResponse.json(
        { message: 'Token, email, and new password are required' },
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

    // Password validation
    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Password complexity validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' },
        { status: 400 }
      );
    }

    // Token validation
    if (typeof token !== 'string' || token.trim().length === 0) {
      return NextResponse.json(
        { message: 'Invalid reset token' },
        { status: 400 }
      );
    }

    try {
      // Confirm the password reset with Cognito
      await cognitoAuthService.confirmForgotPassword(email, token, password);
      
      return NextResponse.json(
        {
          message: 'Password has been reset successfully. You can now sign in with your new password.',
        },
        { status: 200 }
      );
    } catch (authError) {
      // Handle specific Cognito errors
      if (authError instanceof Error) {
        const errorMessage = authError.message.toLowerCase();
        
        if (errorMessage.includes('invalid token') || errorMessage.includes('expired token')) {
          return NextResponse.json(
            { message: 'The reset link has expired or is invalid. Please request a new password reset.' },
            { status: 400 }
          );
        }
        
        if (errorMessage.includes('user not found')) {
          return NextResponse.json(
            { message: 'No account found with that email address.' },
            { status: 404 }
          );
        }
        
        if (errorMessage.includes('invalid password')) {
          return NextResponse.json(
            { message: 'Password does not meet security requirements.' },
            { status: 400 }
          );
        }
        
        if (errorMessage.includes('code mismatch')) {
          return NextResponse.json(
            { message: 'The reset code is incorrect or has expired. Please request a new password reset.' },
            { status: 400 }
          );
        }
        
        if (errorMessage.includes('too many attempts')) {
          return NextResponse.json(
            { message: 'Too many failed attempts. Please request a new password reset.' },
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
      console.error('Reset password authentication error:', authError);
      
      return NextResponse.json(
        { message: 'Failed to reset password. Please try again or request a new reset link.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Reset password request error:', error);
    
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

