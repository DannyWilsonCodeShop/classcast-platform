import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // TODO: Implement real trending topics from DynamoDB
    // For now, return empty array to avoid showing mock data
    const trendingTopics: any[] = [];

    return NextResponse.json(trendingTopics);
  } catch (error) {
    console.error('Error fetching trending topics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch trending topics',
        topics: []
      },
      { status: 500 }
    );
  }
}
