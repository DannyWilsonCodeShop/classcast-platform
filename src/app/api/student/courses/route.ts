import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Helper function to determine course status
    const getCourseStatus = (assignmentsDue: number, nextDeadline: string | null) => {
      const now = new Date();
      
      if (assignmentsDue === 0) {
        return 'up-to-date';
      }
      
      if (nextDeadline) {
        const deadline = new Date(nextDeadline);
        const timeDiff = deadline.getTime() - now.getTime();
        const daysDiff = timeDiff / (1000 * 3600 * 24);
        
        if (daysDiff < 0) {
          return 'past-due';
        } else if (daysDiff <= 3) {
          return 'upcoming';
        }
      }
      
      return 'up-to-date';
    };

    // Comprehensive mock course data for demonstration
    const courses = [
      {
        id: 'course_1',
        code: 'MATH101',
        name: 'Introduction to Calculus',
        description: 'Fundamental concepts of differential and integral calculus with real-world applications',
        instructor: {
          name: 'Dr. Sarah Johnson',
          avatar: '/api/placeholder/40/40'
        },
        assignmentsDue: 3,
        nextDeadline: '2024-01-25T23:59:59Z',
        color: '#4A90E2',
        status: getCourseStatus(3, '2024-01-25T23:59:59Z'),
        assignmentCount: 12,
        backgroundColor: '#4A90E2'
      },
      {
        id: 'course_2',
        code: 'PHYS201',
        name: 'Physics for Engineers',
        description: 'Classical mechanics, thermodynamics, and wave phenomena with laboratory components',
        instructor: {
          name: 'Prof. Michael Chen',
          avatar: '/api/placeholder/40/40'
        },
        assignmentsDue: 7,
        nextDeadline: '2024-01-23T23:59:59Z',
        color: '#06D6A0',
        status: getCourseStatus(7, '2024-01-23T23:59:59Z'),
        assignmentCount: 15,
        backgroundColor: '#06D6A0'
      },
      {
        id: 'course_3',
        code: 'CS301',
        name: 'Data Structures & Algorithms',
        description: 'Advanced programming concepts and algorithmic problem solving with complexity analysis',
        instructor: {
          name: 'Dr. Emily Rodriguez',
          avatar: '/api/placeholder/40/40'
        },
        assignmentsDue: 2,
        nextDeadline: '2024-01-26T23:59:59Z',
        color: '#9B5DE5',
        status: getCourseStatus(2, '2024-01-26T23:59:59Z'),
        assignmentCount: 10,
        backgroundColor: '#9B5DE5'
      },
      {
        id: 'course_4',
        code: 'ENG101',
        name: 'Technical Writing',
        description: 'Professional communication and technical documentation for engineering students',
        instructor: {
          name: 'Prof. David Thompson',
          avatar: '/api/placeholder/40/40'
        },
        assignmentsDue: 0,
        nextDeadline: null,
        color: '#FFD166',
        status: getCourseStatus(0, null),
        assignmentCount: 8,
        backgroundColor: '#FFD166'
      },
      {
        id: 'course_5',
        code: 'CHEM102',
        name: 'Organic Chemistry',
        description: 'Structure, properties, and reactions of organic compounds with laboratory work',
        instructor: {
          name: 'Dr. Lisa Wang',
          avatar: '/api/placeholder/40/40'
        },
        assignmentsDue: 0,
        nextDeadline: '2024-02-01T09:00:00Z',
        color: '#FF6F61',
        status: getCourseStatus(0, '2024-02-01T09:00:00Z'),
        assignmentCount: 14,
        backgroundColor: '#FF6F61'
      },
      {
        id: 'course_6',
        code: 'HIST201',
        name: 'World History',
        description: 'Survey of world civilizations from ancient to modern times with focus on cultural exchange',
        instructor: {
          name: 'Prof. Robert Martinez',
          avatar: '/api/placeholder/40/40'
        },
        assignmentsDue: 11,
        nextDeadline: '2024-01-24T23:59:59Z',
        color: '#E91E63',
        status: getCourseStatus(11, '2024-01-24T23:59:59Z'),
        assignmentCount: 20,
        backgroundColor: '#E91E63'
      },
      {
        id: 'course_7',
        code: 'BIO150',
        name: 'Cell Biology',
        description: 'Study of cellular structure, function, and processes including metabolism and reproduction',
        instructor: {
          name: 'Dr. Jennifer Kim',
          avatar: '/api/placeholder/40/40'
        },
        assignmentsDue: 4,
        nextDeadline: '2024-01-28T23:59:59Z',
        color: '#2ECC71',
        status: getCourseStatus(4, '2024-01-28T23:59:59Z'),
        assignmentCount: 16,
        backgroundColor: '#2ECC71'
      },
      {
        id: 'course_8',
        code: 'PSYC101',
        name: 'Introduction to Psychology',
        description: 'Fundamental principles of human behavior, cognition, and mental processes',
        instructor: {
          name: 'Dr. Maria Garcia',
          avatar: '/api/placeholder/40/40'
        },
        assignmentsDue: 1,
        nextDeadline: '2024-01-30T23:59:59Z',
        color: '#F39C12',
        status: getCourseStatus(1, '2024-01-30T23:59:59Z'),
        assignmentCount: 12,
        backgroundColor: '#F39C12'
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