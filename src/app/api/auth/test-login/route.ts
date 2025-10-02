import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    console.log('Test login request:', { email, password: password ? '***' : 'undefined' });

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: { message: 'Email and password are required' } },
        { status: 400 }
      );
    }

    // Test credentials
    const testUsers = [
      {
        email: 'teststudent@classcast.com',
        password: 'TestPassword123!',
        user: {
          id: 'test-student-123',
          email: 'teststudent@classcast.com',
          firstName: 'Test',
          lastName: 'Student',
          role: 'student' as const,
          avatar: '/api/placeholder/40/40',
          emailVerified: true,
          bio: 'Test student account',
          careerGoals: 'Learn and grow',
          classOf: '2025',
          funFact: 'I love testing!',
          favoriteSubject: 'Math',
          hobbies: 'Coding, Reading',
          schoolName: 'Test University',
        }
      },
      {
        email: 'testinstructor@classcast.com',
        password: 'TestPassword123!',
        user: {
          id: 'test-instructor-123',
          email: 'testinstructor@classcast.com',
          firstName: 'Test',
          lastName: 'Instructor',
          role: 'instructor' as const,
          avatar: '/api/placeholder/40/40',
          emailVerified: true,
          bio: 'Test instructor account',
          careerGoals: 'Teach and inspire',
          classOf: '2020',
          funFact: 'I love teaching!',
          favoriteSubject: 'Mathematics',
          hobbies: 'Teaching, Research',
          schoolName: 'Test University',
        }
      }
    ];

    const testUser = testUsers.find(u => u.email === email && u.password === password);
    
    if (!testUser) {
      return NextResponse.json(
        { error: { message: 'Invalid email or password' } },
        { status: 401 }
      );
    }

    // Generate mock tokens
    const mockTokens = {
      accessToken: `mock-access-token-${Date.now()}`,
      refreshToken: `mock-refresh-token-${Date.now()}`,
      idToken: `mock-id-token-${Date.now()}`,
    };

    console.log('Test login successful for user:', { id: testUser.user.id, email: testUser.user.email, role: testUser.user.role });

    return NextResponse.json({
      success: true,
      user: testUser.user,
      tokens: mockTokens,
    });

  } catch (error) {
    console.error('Test login error:', error);
    
    return NextResponse.json(
      { error: { message: 'Internal server error. Please try again later' } },
      { status: 500 }
    );
  }
}
