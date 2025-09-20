import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    
    // Comprehensive mock submissions data
    const mockSubmissions = [
      {
        submissionId: 'sub_1',
        assignmentId: 'assignment_1',
        assignmentTitle: 'Derivatives and Limits - Video Lesson',
        studentId: 'student_001',
        studentName: 'Alex Thompson',
        status: 'pending_review',
        submittedAt: '2024-01-22T14:30:00Z',
        grade: null,
        maxScore: 100,
        feedback: null,
        instructorName: 'Dr. Sarah Johnson',
        gradedAt: null,
        courseId: 'course_1',
        courseName: 'Introduction to Calculus',
        courseCode: 'MATH101',
        submissionType: 'video',
        assignmentType: 'Video Lesson',
        fileUrl: 'https://example.com/video1.mp4',
        fileSize: 45000000, // 45MB
        duration: 320, // 5 minutes 20 seconds
        isLate: false,
        thumbnailUrl: 'https://example.com/thumb1.jpg'
      },
      {
        submissionId: 'sub_2',
        assignmentId: 'assignment_2',
        assignmentTitle: 'Integration Techniques - Video Assessment',
        studentId: 'student_005',
        studentName: 'David Chen',
        status: 'graded',
        submittedAt: '2024-01-20T14:10:00Z',
        grade: 95,
        maxScore: 120,
        feedback: 'Excellent work! Your explanation of the substitution method was very clear. Great use of visual aids.',
        instructorName: 'Dr. Sarah Johnson',
        gradedAt: '2024-01-21T10:30:00Z',
        courseId: 'course_1',
        courseName: 'Introduction to Calculus',
        courseCode: 'MATH101',
        submissionType: 'video',
        assignmentType: 'Video Assessment',
        fileUrl: 'https://example.com/video2.mp4',
        fileSize: 48000000, // 48MB
        duration: 350, // 5 minutes 50 seconds
        isLate: false,
        thumbnailUrl: 'https://example.com/thumb2.jpg'
      },
      {
        submissionId: 'sub_3',
        assignmentId: 'assignment_5',
        assignmentTitle: 'Thermodynamics Concepts - Video Lesson',
        studentId: 'student_003',
        studentName: 'James Wilson',
        status: 'graded',
        submittedAt: '2024-01-21T10:45:00Z',
        grade: 92,
        maxScore: 130,
        feedback: 'Outstanding explanation! Your real-world examples made complex concepts accessible. Consider adding more mathematical derivations.',
        instructorName: 'Prof. Michael Chen',
        gradedAt: '2024-01-21T16:20:00Z',
        courseId: 'course_2',
        courseName: 'Physics for Engineers',
        courseCode: 'PHYS201',
        submissionType: 'video',
        assignmentType: 'Video Lesson',
        fileUrl: 'https://example.com/video3.mp4',
        fileSize: 58000000, // 58MB
        duration: 420, // 7 minutes
        isLate: false,
        thumbnailUrl: 'https://example.com/thumb3.jpg'
      },
      {
        submissionId: 'sub_4',
        assignmentId: 'assignment_6',
        assignmentTitle: 'Binary Tree Implementation - Video Assessment',
        studentId: 'student_002',
        studentName: 'Maria Rodriguez',
        status: 'pending_review',
        submittedAt: '2024-01-22T12:15:00Z',
        grade: null,
        maxScore: 200,
        feedback: null,
        instructorName: 'Dr. Emily Rodriguez',
        gradedAt: null,
        courseId: 'course_3',
        courseName: 'Data Structures & Algorithms',
        courseCode: 'CS301',
        submissionType: 'video',
        assignmentType: 'Video Assessment',
        fileUrl: 'https://example.com/video4.mp4',
        fileSize: 62000000, // 62MB
        duration: 480, // 8 minutes
        isLate: false,
        thumbnailUrl: 'https://example.com/thumb4.jpg'
      },
      {
        submissionId: 'sub_5',
        assignmentId: 'assignment_8',
        assignmentTitle: 'Technical Documentation - Video Lesson',
        studentId: 'student_007',
        studentName: 'Michael Brown',
        status: 'graded',
        submittedAt: '2024-01-19T15:45:00Z',
        grade: 88,
        maxScore: 110,
        feedback: 'Good technical content and clear explanations. Consider improving the visual presentation and adding more interactive examples.',
        instructorName: 'Prof. David Thompson',
        gradedAt: '2024-01-20T09:15:00Z',
        courseId: 'course_4',
        courseName: 'Technical Writing',
        courseCode: 'ENG101',
        submissionType: 'video',
        assignmentType: 'Video Lesson',
        fileUrl: 'https://example.com/video5.mp4',
        fileSize: 55000000, // 55MB
        duration: 400, // 6 minutes 40 seconds
        isLate: false,
        thumbnailUrl: 'https://example.com/thumb5.jpg'
      },
      {
        submissionId: 'sub_6',
        assignmentId: 'assignment_10',
        assignmentTitle: 'Renaissance Period Analysis - Video Discussion',
        studentId: 'student_004',
        studentName: 'Sarah Kim',
        status: 'pending_review',
        submittedAt: '2024-01-21T16:20:00Z',
        grade: null,
        maxScore: 180,
        feedback: null,
        instructorName: 'Prof. Robert Martinez',
        gradedAt: null,
        courseId: 'course_6',
        courseName: 'World History',
        courseCode: 'HIST201',
        submissionType: 'video',
        assignmentType: 'Video Discussion',
        fileUrl: 'https://example.com/video6.mp4',
        fileSize: 52000000, // 52MB
        duration: 380, // 6 minutes 20 seconds
        isLate: false,
        thumbnailUrl: 'https://example.com/thumb6.jpg'
      },
      {
        submissionId: 'sub_7',
        assignmentId: 'assignment_11',
        assignmentTitle: 'Mitosis Process - Video Lesson',
        studentId: 'student_006',
        studentName: 'Emma Johnson',
        status: 'pending_review',
        submittedAt: '2024-01-20T11:30:00Z',
        grade: null,
        maxScore: 125,
        feedback: null,
        instructorName: 'Dr. Jennifer Kim',
        gradedAt: null,
        courseId: 'course_7',
        courseName: 'Cell Biology',
        courseCode: 'BIO150',
        submissionType: 'video',
        assignmentType: 'Video Lesson',
        fileUrl: 'https://example.com/video7.mp4',
        fileSize: 41000000, // 41MB
        duration: 290, // 4 minutes 50 seconds
        isLate: false,
        thumbnailUrl: 'https://example.com/thumb7.jpg'
      },
      {
        submissionId: 'sub_8',
        assignmentId: 'assignment_12',
        assignmentTitle: 'Memory Systems - Video Discussion',
        studentId: 'student_008',
        studentName: 'Lisa Garcia',
        status: 'pending_review',
        submittedAt: '2024-01-19T13:20:00Z',
        grade: null,
        maxScore: 95,
        feedback: null,
        instructorName: 'Dr. Maria Garcia',
        gradedAt: null,
        courseId: 'course_8',
        courseName: 'Introduction to Psychology',
        courseCode: 'PSYC101',
        submissionType: 'video',
        assignmentType: 'Video Discussion',
        fileUrl: 'https://example.com/video8.mp4',
        fileSize: 43000000, // 43MB
        duration: 310, // 5 minutes 10 seconds
        isLate: false,
        thumbnailUrl: 'https://example.com/thumb8.jpg'
      },
      {
        submissionId: 'sub_9',
        assignmentId: 'assignment_3',
        assignmentTitle: 'Chain Rule Discussion - Video Discussion',
        studentId: 'student_001',
        studentName: 'Alex Thompson',
        status: 'graded',
        submittedAt: '2024-01-15T14:20:00Z',
        grade: 87,
        maxScore: 80,
        feedback: 'Good understanding of the chain rule concept. Your examples were clear, but try to include more complex scenarios in future discussions.',
        instructorName: 'Dr. Sarah Johnson',
        gradedAt: '2024-01-16T11:45:00Z',
        courseId: 'course_1',
        courseName: 'Introduction to Calculus',
        courseCode: 'MATH101',
        submissionType: 'video',
        assignmentType: 'Video Discussion',
        fileUrl: 'https://example.com/video9.mp4',
        fileSize: 38000000, // 38MB
        duration: 180, // 3 minutes
        isLate: false,
        thumbnailUrl: 'https://example.com/thumb9.jpg'
      },
      {
        submissionId: 'sub_10',
        assignmentId: 'assignment_7',
        assignmentTitle: 'Algorithm Complexity Analysis - Video Discussion',
        studentId: 'student_009',
        studentName: 'Ryan Davis',
        status: 'graded',
        submittedAt: '2024-01-18T09:15:00Z',
        grade: 78,
        maxScore: 120,
        feedback: 'Good effort on the complexity analysis. Your explanations were clear, but you need to work on providing more detailed mathematical proofs and examples.',
        instructorName: 'Dr. Emily Rodriguez',
        gradedAt: '2024-01-19T14:30:00Z',
        courseId: 'course_3',
        courseName: 'Data Structures & Algorithms',
        courseCode: 'CS301',
        submissionType: 'video',
        assignmentType: 'Video Discussion',
        fileUrl: 'https://example.com/video10.mp4',
        fileSize: 35000000, // 35MB
        duration: 250, // 4 minutes 10 seconds
        isLate: true,
        thumbnailUrl: 'https://example.com/thumb10.jpg'
      }
    ];

    // Filter by status if specified
    let filteredSubmissions = mockSubmissions;
    if (status) {
      filteredSubmissions = mockSubmissions.filter(submission => submission.status === status);
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedSubmissions = filteredSubmissions.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: {
        submissions: paginatedSubmissions,
        totalCount: filteredSubmissions.length,
        currentPage: page,
        totalPages: Math.ceil(filteredSubmissions.length / limit),
        hasNextPage: endIndex < filteredSubmissions.length,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch submissions' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}





