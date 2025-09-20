import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBService } from '@/lib/dynamodb';

export async function GET(request: NextRequest) {
  try {
    // Comprehensive mock course data for instructor dashboard
    const courses = [
      {
        courseId: 'cs-101',
        title: 'Introduction to Computer Science',
        code: 'CS101',
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
      {
        courseId: 'math-201',
        title: 'Calculus II',
        code: 'MATH201',
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
      {
        courseId: 'eng-102',
        title: 'Creative Writing Workshop',
        code: 'ENG102',
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
      },
      {
        courseId: 'phy-301',
        title: 'Quantum Physics',
        code: 'PHYS301',
        description: 'Introduction to quantum mechanics, wave-particle duality, and quantum field theory.',
        department: 'Physics',
        semester: 'Fall',
        year: 2024,
        status: 'published',
        credits: 4,
        currentEnrollment: 22,
        maxStudents: 25,
        backgroundColor: '#9B5DE5',
        instructor: {
          name: 'Prof. David Thompson',
          email: 'david.thompson@university.edu',
          avatar: '/api/placeholder/40/40'
        },
        schedule: {
          days: ['Tuesday', 'Thursday'],
          time: '11:00 AM - 12:30 PM',
          location: 'Room 401, Physics Building'
        },
        prerequisites: ['PHYS201', 'MATH201'],
        learningObjectives: [
          'Understand quantum mechanical principles',
          'Solve quantum mechanical problems',
          'Apply quantum theory to physical systems'
        ],
        gradingPolicy: {
          assignments: 25,
          exams: 45,
          participation: 10,
          final: 20
        },
        statistics: {
          totalAssignments: 10,
          averageGrade: 78.9,
          completionRate: 85
        },
        startDate: '2024-08-26',
        endDate: '2024-12-15',
        createdAt: '2024-07-05T14:00:00Z',
        updatedAt: '2024-08-15T10:30:00Z'
      },
      {
        courseId: 'bio-150',
        title: 'Cell Biology',
        code: 'BIO150',
        description: 'Study of cellular structure, function, and processes including metabolism and reproduction.',
        department: 'Biology',
        semester: 'Fall',
        year: 2024,
        status: 'draft',
        credits: 3,
        currentEnrollment: 35,
        maxStudents: 40,
        backgroundColor: '#FFD166',
        instructor: {
          name: 'Dr. Lisa Wang',
          email: 'lisa.wang@university.edu',
          avatar: '/api/placeholder/40/40'
        },
        schedule: {
          days: ['Monday', 'Wednesday', 'Friday'],
          time: '9:00 AM - 10:00 AM',
          location: 'Room 203, Biology Building'
        },
        prerequisites: ['BIO101'],
        learningObjectives: [
          'Understand cellular structure and function',
          'Learn metabolic processes',
          'Study cell division and reproduction'
        ],
        gradingPolicy: {
          assignments: 35,
          exams: 40,
          participation: 10,
          final: 15
        },
        statistics: {
          totalAssignments: 7,
          averageGrade: 85.7,
          completionRate: 90
        },
        startDate: '2024-08-26',
        endDate: '2024-12-15',
        createdAt: '2024-07-25T16:00:00Z',
        updatedAt: '2024-08-25T09:15:00Z'
      },
      {
        courseId: 'hist-201',
        title: 'World History: 1500-Present',
        code: 'HIST201',
        description: 'Survey of world history from 1500 to the present, focusing on major events and movements.',
        department: 'History',
        semester: 'Fall',
        year: 2024,
        status: 'published',
        credits: 3,
        currentEnrollment: 42,
        maxStudents: 50,
        backgroundColor: '#E91E63',
        instructor: {
          name: 'Prof. Robert Martinez',
          email: 'robert.martinez@university.edu',
          avatar: '/api/placeholder/40/40'
        },
        schedule: {
          days: ['Tuesday', 'Thursday'],
          time: '3:00 PM - 4:30 PM',
          location: 'Room 150, History Building'
        },
        prerequisites: [],
        learningObjectives: [
          'Understand major historical events',
          'Analyze historical sources',
          'Develop critical thinking skills'
        ],
        gradingPolicy: {
          assignments: 40,
          exams: 35,
          participation: 15,
          final: 10
        },
        statistics: {
          totalAssignments: 5,
          averageGrade: 88.1,
          completionRate: 94
        },
        startDate: '2024-08-26',
        endDate: '2024-12-15',
        createdAt: '2024-07-12T12:00:00Z',
        updatedAt: '2024-08-19T15:45:00Z'
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