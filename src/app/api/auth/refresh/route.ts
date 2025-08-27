import { NextRequest, NextResponse } from 'next/server';
import { cognitoAuthService } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    // Basic validation
    if (!refreshToken) {
      return NextResponse.json(
        { message: 'Refresh token is required' },
        { status: 400 }
      );
    }

    try {
      // Attempt to refresh the token with Cognito
      const refreshResult = await cognitoAuthService.refreshToken(refreshToken);

      // Set new secure HTTP-only cookies for the session
      const response = NextResponse.json(
        {
          message: 'Token refreshed successfully',
          tokens: {
            accessToken: refreshResult.accessToken,
            expiresIn: refreshResult.expiresIn,
          },
        },
        { status: 200 }
      );

      // Set new access token cookie
      response.cookies.set('accessToken', refreshResult.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: refreshResult.expiresIn,
        path: '/',
      });

      return response;
    } catch (authError) {
      // Handle specific Cognito errors
      if (authError instanceof Error) {
        const errorMessage = authError.message.toLowerCase();
        
        if (errorMessage.includes('invalid token') || errorMessage.includes('expired token')) {
          return NextResponse.json(
            { message: 'Refresh token is invalid or expired. Please sign in again.' },
            { status: 401 }
          );
        }
        
        if (errorMessage.includes('token revoked')) {
          return NextResponse.json(
            { message: 'Refresh token has been revoked. Please sign in again.' },
            { status: 401 }
          );
        }
        
        if (errorMessage.includes('user not found')) {
          return NextResponse.json(
            { message: 'User account not found. Please sign in again.' },
            { status: 401 }
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
      console.error('Token refresh authentication error:', authError);
      
      return NextResponse.json(
        { message: 'Failed to refresh token. Please sign in again.' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Token refresh request error:', error);
    
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

