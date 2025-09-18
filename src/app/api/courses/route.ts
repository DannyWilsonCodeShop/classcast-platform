import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBService } from '@/lib/dynamodb';

export async function GET(request: NextRequest) {
  try {
    const dynamoDBService = new DynamoDBService();
    
    // For now, return empty array since we don't have real data yet
    // In the future, this would fetch from DynamoDB courses table
    const courses: any[] = [];

    return NextResponse.json({
      success: true,
      data: {
        courses,
        pagination: {
          page: 1,
          limit: 12,
          total: 0,
          totalPages: 0,
        }
      }
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}