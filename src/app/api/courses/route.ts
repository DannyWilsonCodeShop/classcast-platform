import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBService } from '@/lib/dynamodb';

export async function GET(request: NextRequest) {
  try {
    // Sample course data for instructor dashboard
    const courses = [
      {
        id: 'cs-101',
        title: 'Introduction to Computer Science',
        studentCount: 45,
        assignmentsDue: 3,
        backgroundColor: '#4A90E2'
      },
      {
        id: 'math-201',
        title: 'Calculus II',
        studentCount: 38,
        assignmentsDue: 2,
        backgroundColor: '#06D6A0'
      },
      {
        id: 'eng-102',
        title: 'Creative Writing',
        studentCount: 28,
        assignmentsDue: 1,
        backgroundColor: '#FF6F61'
      },
      {
        id: 'phy-301',
        title: 'Quantum Physics',
        studentCount: 22,
        assignmentsDue: 4,
        backgroundColor: '#9B5DE5'
      },
      {
        id: 'bio-150',
        title: 'Cell Biology',
        studentCount: 35,
        assignmentsDue: 0,
        backgroundColor: '#FFD166'
      },
      {
        id: 'hist-201',
        title: 'World History',
        studentCount: 42,
        assignmentsDue: 2,
        backgroundColor: '#333333'
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        courses,
        pagination: {
          page: 1,
          limit: 12,
          total: courses.length,
          totalPages: 1,
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