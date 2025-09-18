import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // For now, return empty stats since we don't have real data yet
    // In the future, this would fetch from DynamoDB
    const stats = {
      activeCourses: 0,
      totalStudents: 0,
      pendingReviews: 0,
      averageRating: 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
