import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Return empty courses array for now
    // This prevents 404 errors when the dashboard tries to load courses
    const courses = [];

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Error fetching student courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}