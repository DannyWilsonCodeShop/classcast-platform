import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock course data for demonstration
    const courses = [
      {
        id: 'course_1',
        code: 'MATH101',
        name: 'Introduction to Calculus',
        description: 'Learn the fundamentals of differential and integral calculus with practical applications.',
        instructor: 'Dr. Sarah Johnson',
        instructorId: 'instructor_1',
        instructorAvatar: '/api/placeholder/40/40',
        startDate: '2024-01-15',
        endDate: '2024-05-15',
        status: 'active',
        progress: 65,
        assignmentCount: 8,
        completedAssignments: 5,
        studentCount: 24,
        color: '#4A90E2',
        thumbnail: '/api/placeholder/300/200',
        lastActivity: '2024-01-20T10:30:00Z',
        nextDueDate: '2024-01-25T23:59:59Z',
        upcomingAssignments: 3
      },
      {
        id: 'course_2',
        code: 'PHYS201',
        name: 'Physics for Engineers',
        description: 'Comprehensive study of mechanics, thermodynamics, and electromagnetism for engineering students.',
        instructor: 'Prof. Michael Chen',
        instructorId: 'instructor_2',
        instructorAvatar: '/api/placeholder/40/40',
        startDate: '2024-01-10',
        endDate: '2024-05-10',
        status: 'active',
        progress: 45,
        assignmentCount: 12,
        completedAssignments: 5,
        studentCount: 18,
        color: '#06D6A0',
        thumbnail: '/api/placeholder/300/200',
        lastActivity: '2024-01-19T14:20:00Z',
        nextDueDate: '2024-01-23T23:59:59Z',
        upcomingAssignments: 7
      },
      {
        id: 'course_3',
        code: 'CS301',
        name: 'Data Structures & Algorithms',
        description: 'Advanced programming concepts including trees, graphs, sorting, and searching algorithms.',
        instructor: 'Dr. Emily Rodriguez',
        instructorId: 'instructor_3',
        instructorAvatar: '/api/placeholder/40/40',
        startDate: '2024-01-08',
        endDate: '2024-05-08',
        status: 'active',
        progress: 80,
        assignmentCount: 10,
        completedAssignments: 8,
        studentCount: 32,
        color: '#9B5DE5',
        thumbnail: '/api/placeholder/300/200',
        lastActivity: '2024-01-21T09:15:00Z',
        nextDueDate: '2024-01-26T23:59:59Z',
        upcomingAssignments: 2
      },
      {
        id: 'course_4',
        code: 'ENG101',
        name: 'Technical Writing',
        description: 'Learn to write clear, concise technical documents and reports for professional communication.',
        instructor: 'Prof. David Thompson',
        instructorId: 'instructor_4',
        instructorAvatar: '/api/placeholder/40/40',
        startDate: '2023-09-01',
        endDate: '2023-12-15',
        status: 'completed',
        progress: 100,
        assignmentCount: 6,
        completedAssignments: 6,
        studentCount: 28,
        color: '#FFD166',
        thumbnail: '/api/placeholder/300/200',
        lastActivity: '2023-12-10T16:45:00Z',
        nextDueDate: null,
        upcomingAssignments: 0
      },
      {
        id: 'course_5',
        code: 'CHEM102',
        name: 'Organic Chemistry',
        description: 'Study of carbon compounds, reaction mechanisms, and synthesis in organic chemistry.',
        instructor: 'Dr. Lisa Wang',
        instructorId: 'instructor_5',
        instructorAvatar: '/api/placeholder/40/40',
        startDate: '2024-02-01',
        endDate: '2024-06-01',
        status: 'upcoming',
        progress: 0,
        assignmentCount: 0,
        completedAssignments: 0,
        studentCount: 22,
        color: '#FF6F61',
        thumbnail: '/api/placeholder/300/200',
        lastActivity: null,
        nextDueDate: '2024-02-01T09:00:00Z',
        upcomingAssignments: 0
      },
      {
        id: 'course_6',
        code: 'HIST201',
        name: 'World History',
        description: 'Comprehensive survey of world history from ancient civilizations to modern times.',
        instructor: 'Prof. Robert Martinez',
        instructorId: 'instructor_6',
        instructorAvatar: '/api/placeholder/40/40',
        startDate: '2024-01-12',
        endDate: '2024-05-12',
        status: 'active',
        progress: 30,
        assignmentCount: 15,
        completedAssignments: 4,
        studentCount: 35,
        color: '#4A90E2',
        thumbnail: '/api/placeholder/300/200',
        lastActivity: '2024-01-18T11:30:00Z',
        nextDueDate: '2024-01-24T23:59:59Z',
        upcomingAssignments: 11
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