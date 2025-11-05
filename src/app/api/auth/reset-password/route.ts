import { NextRequest, NextResponse } from 'next/server';
import { cognitoAuthService } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('=== COGNITO PASSWORD RESET API CALLED ===');
    
    const body = await request.json();
    const { email, confirmationCode, password } = body;
    
    // Input validation
    if (!email || !confirmationCode || !password) {
      return NextResponse.json(
        { error: { message: 'Email, confirmation code, and new password are required' } },
        { status: 400 }
      );
    }

    // Password strength validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: { message: 'Password must be at least 8 characters long' } },
        { status: 400 }
      );
    }

    // Password complexity validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { error: { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' } },
        { status: 400 }
      );
    }

    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedPassword = password.trim();
    const sanitizedCode = confirmationCode.trim();

    try {
      // Use Cognito to confirm the password reset
      await cognitoAuthService.confirmForgotPassword(
        sanitizedEmail,
        sanitizedCode,
        sanitizedPassword
      );

      console.log('Password reset successfully for user:', sanitizedEmail);

      return NextResponse.json({
        success: true,
        message: 'Password reset successfully'
      });

    } catch (cognitoError) {
      console.error('Cognito password reset error:', cognitoError);
      
      // Handle specific Cognito errors
      if (cognitoError instanceof Error) {
        const errorMessage = cognitoError.message.toLowerCase();
        
        if (errorMessage.includes('invalid verification code') || errorMessage.includes('codeMismatchException')) {
          return NextResponse.json(
            { error: { message: 'Invalid confirmation code. Please check the code from your email.' } },
            { status: 400 }
          );
        }
        
        if (errorMessage.includes('expired') || errorMessage.includes('expiredCodeException')) {
          return NextResponse.json(
            { error: { message: 'Confirmation code has expired. Please request a new password reset.' } },
            { status: 400 }
          );
        }
        
        if (errorMessage.includes('user not found') || errorMessage.includes('userNotFoundException')) {
          return NextResponse.json(
            { error: { message: 'No account found with this email address.' } },
            { status: 404 }
          );
        }
        
        if (errorMessage.includes('too many requests') || errorMessage.includes('limitExceededException')) {
          return NextResponse.json(
            { error: { message: 'Too many password reset attempts. Please try again later.' } },
            { status: 429 }
          );
        }
        
        if (errorMessage.includes('invalid password') || errorMessage.includes('invalidPasswordException')) {
          return NextResponse.json(
            { error: { message: 'Password does not meet security requirements.' } },
            { status: 400 }
          );
        }
      }
      
      // Generic error for unknown Cognito errors
      return NextResponse.json(
        { error: { message: 'Failed to reset password. Please try again or request a new reset link.' } },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Password reset request error:', error);
    
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

