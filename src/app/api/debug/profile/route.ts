import { NextRequest, NextResponse } from 'next/server';
import { dynamoDBService } from '@/lib/dynamodb';
import { s3Service } from '@/lib/s3';

// GET /api/debug/profile - Debug profile functionality
export async function GET(request: NextRequest) {
  try {
    console.log('Debug profile endpoint called');
    
    // Test DynamoDB connection
    console.log('Testing DynamoDB connection...');
    const testUser = await dynamoDBService.getUserById('test-user-123');
    console.log('DynamoDB test result:', testUser);
    
    // Test S3 connection
    console.log('Testing S3 connection...');
    const s3Health = await s3Service.healthCheck();
    console.log('S3 health check result:', s3Health);
    
    return NextResponse.json({
      success: true,
      dynamodb: {
        connected: !!testUser,
        user: testUser
      },
      s3: {
        connected: s3Health
      },
      message: 'Debug completed'
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Debug failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
