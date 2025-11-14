import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // For now, return 401 since we're not using session-based auth
    // The AuthContext will handle authentication state locally
    return NextResponse.json(
      { error: { message: 'No active session' } },
      { status: 401 }
    );
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}