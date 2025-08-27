import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('=== SIMPLE TEST ENDPOINT ===');
    
    // Test basic functionality
    const testData = {
      message: 'Simple test endpoint working',
      timestamp: new Date().toISOString(),
      test: 'This endpoint is accessible'
    };
    
    console.log('Test data:', testData);
    
    return NextResponse.json(testData);
  } catch (error) {
    console.error('Simple test error:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
