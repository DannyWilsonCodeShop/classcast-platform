import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // TODO: Implement real online users from DynamoDB
    // For now, return empty array to avoid showing mock data
    const onlineUsers: any[] = [];

    return NextResponse.json(onlineUsers);
  } catch (error) {
    console.error('Error fetching online users:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch online users',
        users: []
      },
      { status: 500 }
    );
  }
}
