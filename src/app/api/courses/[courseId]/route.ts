import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = params;

    // Comprehensive mock course data based on courseId
    const courseData = {
      'cs-101': {
        courseId: 'cs-101',
        courseName: 'Introduction to Computer Science',
        courseCode: 'CS101',
        description: 'Fundamental concepts of computer science including programming, algorithms, and data structures.',
        department: 'Computer Science',
        semester: 'Fall',
        year: 2024,
        status: 'published',
        credits: 3,
        currentEnrollment: 45,
        maxStudents: 50,
        backgroundColor: '#4A90E2',
        instructor: {
          name: 'Dr. Sarah Johnson',
          email: 'sarah.johnson@university.edu',
          avatar: '/api/placeholder/40/40'
        },
        schedule: {
          days: ['Monday', 'Wednesday', 'Friday'],
          time: '10:00 AM - 11:00 AM',
          location: 'Room 201, Computer Science Building'
        },
        prerequisites: ['MATH101'],
        learningObjectives: [
          'Understand basic programming concepts',
          'Learn fundamental algorithms',
          'Master data structure implementation'
        ],
        gradingPolicy: {
          assignments: 40,
          exams: 30,
          participation: 10,
          final: 20
        },
        statistics: {
          totalAssignments: 8,
          averageGrade: 87.5,
          completionRate: 92
        },
        startDate: '2024-08-26',
        endDate: '2024-12-15',
        createdAt: '2024-07-15T10:00:00Z',
        updatedAt: '2024-08-20T14:30:00Z'
      },
      'math-201': {
        courseId: 'math-201',
        courseName: 'Calculus II',
        courseCode: 'MATH201',
        description: 'Advanced calculus topics including integration techniques, sequences, and series.',
        department: 'Mathematics',
        semester: 'Fall',
        year: 2024,
        status: 'published',
        credits: 4,
        currentEnrollment: 38,
        maxStudents: 45,
        backgroundColor: '#06D6A0',
        instructor: {
          name: 'Prof. Michael Chen',
          email: 'michael.chen@university.edu',
          avatar: '/api/placeholder/40/40'
        },
        schedule: {
          days: ['Tuesday', 'Thursday'],
          time: '2:00 PM - 3:30 PM',
          location: 'Room 105, Mathematics Building'
        },
        prerequisites: ['MATH101'],
        learningObjectives: [
          'Master integration techniques',
          'Understand sequences and series',
          'Apply calculus to real-world problems'
        ],
        gradingPolicy: {
          assignments: 30,
          exams: 50,
          participation: 5,
          final: 15
        },
        statistics: {
          totalAssignments: 12,
          averageGrade: 82.3,
          completionRate: 88
        },
        startDate: '2024-08-26',
        endDate: '2024-12-15',
        createdAt: '2024-07-10T09:00:00Z',
        updatedAt: '2024-08-18T16:45:00Z'
      },
      'eng-102': {
        courseId: 'eng-102',
        courseName: 'Creative Writing Workshop',
        courseCode: 'ENG102',
        description: 'Develop creative writing skills through workshops, peer review, and various writing exercises.',
        department: 'English',
        semester: 'Fall',
        year: 2024,
        status: 'published',
        credits: 3,
        currentEnrollment: 28,
        maxStudents: 30,
        backgroundColor: '#FF6F61',
        instructor: {
          name: 'Dr. Emily Rodriguez',
          email: 'emily.rodriguez@university.edu',
          avatar: '/api/placeholder/40/40'
        },
        schedule: {
          days: ['Monday', 'Wednesday'],
          time: '1:00 PM - 2:30 PM',
          location: 'Room 302, Humanities Building'
        },
        prerequisites: ['ENG101'],
        learningObjectives: [
          'Develop creative writing techniques',
          'Learn peer review skills',
          'Create a portfolio of original work'
        ],
        gradingPolicy: {
          assignments: 60,
          exams: 0,
          participation: 20,
          final: 20
        },
        statistics: {
          totalAssignments: 6,
          averageGrade: 91.2,
          completionRate: 96
        },
        startDate: '2024-08-26',
        endDate: '2024-12-15',
        createdAt: '2024-07-20T11:00:00Z',
        updatedAt: '2024-08-22T13:20:00Z'
      }
    };

    const course = courseData[courseId as keyof typeof courseData];

    if (!course) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Course not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch course' 
      },
      { status: 500 }
    );
  }
}
