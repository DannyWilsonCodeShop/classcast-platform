import { NextResponse } from 'next/server';
import { mockAuthService, ensureMockServiceInitialized } from '@/lib/mock-auth';

export async function GET() {
  try {
    console.log('=== TEST MOCK SERVICE ===');
    
    // Ensure mock service is initialized
    console.log('🔧 Ensuring mock service is initialized...');
    const authService = ensureMockServiceInitialized();
    console.log('✅ Mock service initialized:', authService);
    
    // Test if mock service is accessible
    console.log('Mock service object:', mockAuthService);
    console.log('Mock service methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(mockAuthService)));
    
    // Test debug state
    mockAuthService.debugState();
    
    // Test getting a user
    const user = await mockAuthService.getUser('instructor@classcast.com');
    console.log('Test user lookup:', user);
    
    // Get all users for debugging
    const allUsers = mockAuthService.getAllUsers();
    console.log('All users in system:', allUsers);
    
    return NextResponse.json({
      message: 'Mock service test completed',
      mockServiceExists: !!mockAuthService,
      userFound: !!user,
      totalUsers: allUsers.length,
      debugInfo: 'Check console for details'
    });
  } catch (error) {
    console.error('Test mock service error:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
