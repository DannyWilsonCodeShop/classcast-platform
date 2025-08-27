import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { mockAuthService } from '@/lib/mock-auth';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: { message: 'No access token found' } },
        { status: 401 }
      );
    }

    // Get user from mock auth service using token
    const user = await mockAuthService.getUserFromToken(accessToken);
    
    if (!user) {
      return NextResponse.json(
        { error: { message: 'Invalid or expired token' } },
        { status: 401 }
      );
    }

    // Return user information
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        studentId: user.studentId,
        instructorId: user.instructorId,
        department: user.department,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

