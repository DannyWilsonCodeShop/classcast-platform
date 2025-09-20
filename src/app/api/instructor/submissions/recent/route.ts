import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Comprehensive recent submissions data for demonstration
    const recentSubmissions = [
      {
        id: 'sub_1',
        studentName: 'Alex Thompson',
        studentId: 'student_001',
        assignmentTitle: 'Derivatives and Limits - Video Lesson',
        assignmentId: 'assignment_1',
        submittedAt: '2024-01-22T14:30:00Z',
        courseName: 'Introduction to Calculus',
        courseCode: 'MATH101',
        status: 'pending_review',
        submissionType: 'video',
        duration: 320,
        fileSize: 45000000,
        grade: null,
        maxPoints: 100
      },
      {
        id: 'sub_2',
        studentName: 'Maria Rodriguez',
        studentId: 'student_002',
        assignmentTitle: 'Binary Tree Implementation - Video Assessment',
        assignmentId: 'assignment_6',
        submittedAt: '2024-01-22T12:15:00Z',
        courseName: 'Data Structures & Algorithms',
        courseCode: 'CS301',
        status: 'pending_review',
        submissionType: 'video',
        duration: 480,
        fileSize: 62000000,
        grade: null,
        maxPoints: 200
      },
      {
        id: 'sub_3',
        studentName: 'James Wilson',
        studentId: 'student_003',
        assignmentTitle: 'Thermodynamics Concepts - Video Lesson',
        assignmentId: 'assignment_5',
        submittedAt: '2024-01-21T10:45:00Z',
        courseName: 'Physics for Engineers',
        courseCode: 'PHYS201',
        status: 'graded',
        submissionType: 'video',
        duration: 420,
        fileSize: 58000000,
        grade: 92,
        maxPoints: 130
      },
      {
        id: 'sub_4',
        studentName: 'Sarah Kim',
        studentId: 'student_004',
        assignmentTitle: 'Renaissance Period Analysis - Video Discussion',
        assignmentId: 'assignment_10',
        submittedAt: '2024-01-21T16:20:00Z',
        courseName: 'World History',
        courseCode: 'HIST201',
        status: 'pending_review',
        submissionType: 'video',
        duration: 380,
        fileSize: 52000000,
        grade: null,
        maxPoints: 180
      },
      {
        id: 'sub_5',
        studentName: 'David Chen',
        studentId: 'student_005',
        assignmentTitle: 'Integration Techniques - Video Assessment',
        assignmentId: 'assignment_2',
        submittedAt: '2024-01-20T14:10:00Z',
        courseName: 'Introduction to Calculus',
        courseCode: 'MATH101',
        status: 'graded',
        submissionType: 'video',
        duration: 350,
        fileSize: 48000000,
        grade: 95,
        maxPoints: 120
      },
      {
        id: 'sub_6',
        studentName: 'Emma Johnson',
        studentId: 'student_006',
        assignmentTitle: 'Mitosis Process - Video Lesson',
        assignmentId: 'assignment_11',
        submittedAt: '2024-01-20T11:30:00Z',
        courseName: 'Cell Biology',
        courseCode: 'BIO150',
        status: 'pending_review',
        submissionType: 'video',
        duration: 290,
        fileSize: 41000000,
        grade: null,
        maxPoints: 125
      },
      {
        id: 'sub_7',
        studentName: 'Michael Brown',
        studentId: 'student_007',
        assignmentTitle: 'Technical Documentation - Video Lesson',
        assignmentId: 'assignment_8',
        submittedAt: '2024-01-19T15:45:00Z',
        courseName: 'Technical Writing',
        courseCode: 'ENG101',
        status: 'graded',
        submissionType: 'video',
        duration: 400,
        fileSize: 55000000,
        grade: 88,
        maxPoints: 110
      },
      {
        id: 'sub_8',
        studentName: 'Lisa Garcia',
        studentId: 'student_008',
        assignmentTitle: 'Memory Systems - Video Discussion',
        assignmentId: 'assignment_12',
        submittedAt: '2024-01-19T13:20:00Z',
        courseName: 'Introduction to Psychology',
        courseCode: 'PSYC101',
        status: 'pending_review',
        submissionType: 'video',
        duration: 310,
        fileSize: 43000000,
        grade: null,
        maxPoints: 95
      }
    ];

    return NextResponse.json(recentSubmissions);
  } catch (error) {
    console.error('Error fetching recent submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent submissions' },
      { status: 500 }
    );
  }
}
