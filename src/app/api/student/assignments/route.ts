import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Return empty assignments array for now
    // This prevents 404 errors when the dashboard tries to load assignments
    const assignments = [];

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('Error fetching student assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}