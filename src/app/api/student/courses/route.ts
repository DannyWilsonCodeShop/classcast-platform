import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock course data for demonstration
    const courses = [
      {
        id: 'course_1',
        code: 'MATH101',
        name: 'Introduction to Calculus',
        instructor: {
          name: 'Dr. Sarah Johnson',
          avatar: '/api/placeholder/40/40'
        },
        assignmentsDue: 3,
        nextDeadline: '2024-01-25T23:59:59Z',
        color: '#4A90E2'
      },
      {
        id: 'course_2',
        code: 'PHYS201',
        name: 'Physics for Engineers',
        instructor: {
          name: 'Prof. Michael Chen',
          avatar: '/api/placeholder/40/40'
        },
        assignmentsDue: 7,
        nextDeadline: '2024-01-23T23:59:59Z',
        color: '#06D6A0'
      },
      {
        id: 'course_3',
        code: 'CS301',
        name: 'Data Structures & Algorithms',
        instructor: {
          name: 'Dr. Emily Rodriguez',
          avatar: '/api/placeholder/40/40'
        },
        assignmentsDue: 2,
        nextDeadline: '2024-01-26T23:59:59Z',
        color: '#9B5DE5'
      },
      {
        id: 'course_4',
        code: 'ENG101',
        name: 'Technical Writing',
        instructor: {
          name: 'Prof. David Thompson',
          avatar: '/api/placeholder/40/40'
        },
        assignmentsDue: 0,
        nextDeadline: null,
        color: '#FFD166'
      },
      {
        id: 'course_5',
        code: 'CHEM102',
        name: 'Organic Chemistry',
        instructor: {
          name: 'Dr. Lisa Wang',
          avatar: '/api/placeholder/40/40'
        },
        assignmentsDue: 0,
        nextDeadline: '2024-02-01T09:00:00Z',
        color: '#FF6F61'
      },
      {
        id: 'course_6',
        code: 'HIST201',
        name: 'World History',
        instructor: {
          name: 'Prof. Robert Martinez',
          avatar: '/api/placeholder/40/40'
        },
        assignmentsDue: 11,
        nextDeadline: '2024-01-24T23:59:59Z',
        color: '#E91E63'
      }
    ];

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Error fetching student courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}