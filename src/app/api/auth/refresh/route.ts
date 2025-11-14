import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, generateTokens } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Verify the refresh token
    const payload = verifyToken(refreshToken);
    
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // Generate new tokens
    const tokens = generateTokens({
      id: payload.id,
      email: payload.email,
      role: payload.role,
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: payload.id,
          email: payload.email,
          role: payload.role,
        },
        tokens,
      },
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to refresh token',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}