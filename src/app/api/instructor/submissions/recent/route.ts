import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // For now, return empty array since we don't have real data yet
    // In the future, this would fetch from DynamoDB
    const recentSubmissions: any[] = [];

    return NextResponse.json(recentSubmissions);
  } catch (error) {
    console.error('Error fetching recent submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent submissions' },
      { status: 500 }
    );
  }
}
