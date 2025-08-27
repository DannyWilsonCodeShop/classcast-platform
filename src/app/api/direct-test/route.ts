import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('=== DIRECT TEST ENDPOINT ===');
    
    // Create a simple mock service directly in this endpoint
    const mockUsers = new Map();
    mockUsers.set('instructor@classcast.com', {
      id: 'instructor_001',
      email: 'instructor@classcast.com',
      firstName: 'John',
      lastName: 'Doe',
      password: 'password123',
      role: 'instructor'
    });
    
    mockUsers.set('student@classcast.com', {
      id: 'student_001',
      email: 'student@classcast.com',
      firstName: 'Jane',
      lastName: 'Smith',
      password: 'password123',
      role: 'student'
    });
    
    console.log('Direct mock users created:', Array.from(mockUsers.keys()));
    
    // Test login logic
    const testEmail = 'instructor@classcast.com';
    const testPassword = 'password123';
    
    const user = mockUsers.get(testEmail);
    if (user && user.password === testPassword) {
      console.log('✅ Direct mock login successful:', user.email);
    } else {
      console.log('❌ Direct mock login failed');
    }
    
    return NextResponse.json({
      message: 'Direct test completed',
      usersCreated: mockUsers.size,
      userEmails: Array.from(mockUsers.keys()),
      testLogin: user && user.password === testPassword ? 'success' : 'failed'
    });
  } catch (error) {
    console.error('Direct test error:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
