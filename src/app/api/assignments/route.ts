import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Mock assignments data for now
    const mockAssignments = [
      {
        assignmentId: 'assign_1',
        title: 'Video Presentation Assignment',
        description: 'Create a 5-minute video presentation on your chosen topic',
        assignmentType: 'video',
        status: 'upcoming',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        responseDueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        maxScore: 100,
        requirements: [
          'Video must be 5-7 minutes long',
          'Include introduction and conclusion',
          'Use clear audio and video quality',
          'Submit by due date'
        ],
        courseId: courseId || 'course_1',
        courseName: 'Introduction to Communication',
        instructorName: 'Dr. Smith',
        enablePeerResponses: true,
        minResponsesRequired: 2,
        maxResponsesPerVideo: 3,
        responseWordLimit: 50,
        responseCharacterLimit: 500,
        isPinned: true,
        isHighlighted: true,
        pinnedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        highlightedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        assignmentId: 'assign_2',
        title: 'Essay on Digital Media',
        description: 'Write a 1000-word essay analyzing the impact of digital media on society',
        assignmentType: 'essay',
        status: 'in-progress',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        maxScore: 85,
        requirements: [
          'Minimum 1000 words',
          'Use proper citations',
          'Include introduction, body, and conclusion',
          'Submit as PDF document'
        ],
        courseId: courseId || 'course_1',
        courseName: 'Introduction to Communication',
        instructorName: 'Dr. Smith',
        isPinned: true,
        pinnedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        assignmentId: 'assign_3',
        title: 'Group Project Presentation',
        description: 'Collaborate with classmates to create a group presentation',
        assignmentType: 'presentation',
        status: 'completed',
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        maxScore: 120,
        requirements: [
          'Work in groups of 3-4 students',
          'Present for 15-20 minutes',
          'Include visual aids',
          'Submit presentation slides'
        ],
        courseId: courseId || 'course_1',
        courseName: 'Introduction to Communication',
        instructorName: 'Dr. Smith'
      }
    ];

    // Filter by course if specified
    let filteredAssignments = mockAssignments;
    if (courseId) {
      filteredAssignments = mockAssignments.filter(assignment => assignment.courseId === courseId);
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedAssignments = filteredAssignments.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: {
        assignments: paginatedAssignments,
        totalCount: filteredAssignments.length,
        currentPage: page,
        totalPages: Math.ceil(filteredAssignments.length / limit),
        hasNextPage: endIndex < filteredAssignments.length,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch assignments' 
      },
      { status: 500 }
    );
  }
}