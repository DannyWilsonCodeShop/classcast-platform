import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    
    // Mock submissions data
    const mockSubmissions = [
      {
        submissionId: 'sub_1',
        assignmentId: 'assign_1',
        assignmentTitle: 'Video Presentation Assignment',
        studentId: 'student_1',
        studentName: 'John Doe',
        status: 'submitted',
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        grade: 85,
        maxScore: 100,
        feedback: 'Great presentation! Good use of visual aids and clear delivery. Consider adding more specific examples in the conclusion.',
        instructorName: 'Dr. Smith',
        gradedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        courseId: 'course_1',
        courseName: 'Introduction to Communication',
        submissionType: 'video',
        fileUrl: 'https://example.com/video1.mp4',
        fileSize: 125000000, // 125MB
        duration: 320, // 5 minutes 20 seconds
        isLate: false
      },
      {
        submissionId: 'sub_2',
        assignmentId: 'assign_2',
        assignmentTitle: 'Essay on Digital Media',
        studentId: 'student_1',
        studentName: 'John Doe',
        status: 'graded',
        submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        grade: 92,
        maxScore: 85,
        feedback: 'Excellent analysis! Your arguments are well-supported with evidence. The writing is clear and engaging.',
        instructorName: 'Dr. Smith',
        gradedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        courseId: 'course_1',
        courseName: 'Introduction to Communication',
        submissionType: 'document',
        fileUrl: 'https://example.com/essay1.pdf',
        fileSize: 2500000, // 2.5MB
        wordCount: 1050,
        isLate: false
      },
      {
        submissionId: 'sub_3',
        assignmentId: 'assign_3',
        assignmentTitle: 'Group Project Presentation',
        studentId: 'student_1',
        studentName: 'John Doe',
        status: 'returned',
        submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        grade: null,
        maxScore: 120,
        feedback: 'Good effort, but the presentation needs more depth. Please revise and resubmit with additional research and analysis.',
        instructorName: 'Dr. Smith',
        gradedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
        courseId: 'course_1',
        courseName: 'Introduction to Communication',
        submissionType: 'presentation',
        fileUrl: 'https://example.com/presentation1.pptx',
        fileSize: 15000000, // 15MB
        slideCount: 25,
        isLate: true
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





