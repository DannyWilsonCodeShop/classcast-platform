import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    
    // Comprehensive mock student data
    const allStudents = [
      {
        id: 'student_001',
        name: 'Alex Thompson',
        email: 'alex.thompson@university.edu',
        avatar: '/api/placeholder/40/40',
        major: 'Computer Science',
        year: 'Junior',
        gpa: 3.7,
        enrolledCourses: ['course_1', 'course_3', 'course_4'],
        lastActive: '2024-01-22T14:30:00Z',
        totalSubmissions: 15,
        averageGrade: 88.5
      },
      {
        id: 'student_002',
        name: 'Maria Rodriguez',
        email: 'maria.rodriguez@university.edu',
        avatar: '/api/placeholder/40/40',
        major: 'Data Science',
        year: 'Senior',
        gpa: 3.9,
        enrolledCourses: ['course_1', 'course_2', 'course_3', 'course_6'],
        lastActive: '2024-01-22T12:15:00Z',
        totalSubmissions: 22,
        averageGrade: 91.2
      },
      {
        id: 'student_003',
        name: 'James Wilson',
        email: 'james.wilson@university.edu',
        avatar: '/api/placeholder/40/40',
        major: 'Physics',
        year: 'Sophomore',
        gpa: 3.5,
        enrolledCourses: ['course_2', 'course_5', 'course_7'],
        lastActive: '2024-01-21T10:45:00Z',
        totalSubmissions: 18,
        averageGrade: 85.8
      },
      {
        id: 'student_004',
        name: 'Sarah Kim',
        email: 'sarah.kim@university.edu',
        avatar: '/api/placeholder/40/40',
        major: 'History',
        year: 'Junior',
        gpa: 3.8,
        enrolledCourses: ['course_4', 'course_6', 'course_8'],
        lastActive: '2024-01-21T16:20:00Z',
        totalSubmissions: 20,
        averageGrade: 89.3
      },
      {
        id: 'student_005',
        name: 'David Chen',
        email: 'david.chen@university.edu',
        avatar: '/api/placeholder/40/40',
        major: 'Mathematics',
        year: 'Senior',
        gpa: 3.6,
        enrolledCourses: ['course_1', 'course_2', 'course_3'],
        lastActive: '2024-01-20T14:10:00Z',
        totalSubmissions: 25,
        averageGrade: 87.1
      },
      {
        id: 'student_006',
        name: 'Emma Johnson',
        email: 'emma.johnson@university.edu',
        avatar: '/api/placeholder/40/40',
        major: 'Biology',
        year: 'Sophomore',
        gpa: 3.4,
        enrolledCourses: ['course_5', 'course_7', 'course_8'],
        lastActive: '2024-01-20T11:30:00Z',
        totalSubmissions: 16,
        averageGrade: 84.6
      },
      {
        id: 'student_007',
        name: 'Michael Brown',
        email: 'michael.brown@university.edu',
        avatar: '/api/placeholder/40/40',
        major: 'Engineering',
        year: 'Junior',
        gpa: 3.3,
        enrolledCourses: ['course_2', 'course_4', 'course_6'],
        lastActive: '2024-01-19T15:45:00Z',
        totalSubmissions: 19,
        averageGrade: 82.9
      },
      {
        id: 'student_008',
        name: 'Lisa Garcia',
        email: 'lisa.garcia@university.edu',
        avatar: '/api/placeholder/40/40',
        major: 'Psychology',
        year: 'Senior',
        gpa: 3.7,
        enrolledCourses: ['course_6', 'course_8'],
        lastActive: '2024-01-19T13:20:00Z',
        totalSubmissions: 21,
        averageGrade: 90.1
      },
      {
        id: 'student_009',
        name: 'Ryan Davis',
        email: 'ryan.davis@university.edu',
        avatar: '/api/placeholder/40/40',
        major: 'Computer Science',
        year: 'Freshman',
        gpa: 3.2,
        enrolledCourses: ['course_1', 'course_3', 'course_4'],
        lastActive: '2024-01-18T09:15:00Z',
        totalSubmissions: 12,
        averageGrade: 79.8
      },
      {
        id: 'student_010',
        name: 'Jessica Lee',
        email: 'jessica.lee@university.edu',
        avatar: '/api/placeholder/40/40',
        major: 'Chemistry',
        year: 'Junior',
        gpa: 3.8,
        enrolledCourses: ['course_5', 'course_7'],
        lastActive: '2024-01-17T16:30:00Z',
        totalSubmissions: 17,
        averageGrade: 92.4
      },
      {
        id: 'student_011',
        name: 'Kevin Martinez',
        email: 'kevin.martinez@university.edu',
        avatar: '/api/placeholder/40/40',
        major: 'Physics',
        year: 'Senior',
        gpa: 3.9,
        enrolledCourses: ['course_2', 'course_3', 'course_5'],
        lastActive: '2024-01-16T14:20:00Z',
        totalSubmissions: 28,
        averageGrade: 94.2
      },
      {
        id: 'student_012',
        name: 'Amanda Taylor',
        email: 'amanda.taylor@university.edu',
        avatar: '/api/placeholder/40/40',
        major: 'English',
        year: 'Sophomore',
        gpa: 3.6,
        enrolledCourses: ['course_4', 'course_6', 'course_8'],
        lastActive: '2024-01-15T11:45:00Z',
        totalSubmissions: 14,
        averageGrade: 86.7
      }
    ];

    // Filter by course if specified
    let students = allStudents;
    if (courseId) {
      students = allStudents.filter(student => 
        student.enrolledCourses.includes(courseId)
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        students,
        totalCount: students.length
      }
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch students' 
      },
      { status: 500 }
    );
  }
}
