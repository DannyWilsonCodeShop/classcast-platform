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
        assignmentType: 'video_assignment',
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
        highlightedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        emoji: '🎥',
        color: '#3B82F6',
        coverPhoto: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=200&fit=crop',
        requireLiveRecording: false,
        allowedFileTypes: ['mp4', 'webm', 'mov', 'avi'],
        maxFileSize: 100 * 1024 * 1024 // 100MB
      },
      {
        assignmentId: 'assign_2',
        title: 'Digital Media Discussion',
        description: 'Create a video discussing the impact of digital media on society and respond to peers',
        assignmentType: 'video_discussion',
        status: 'in-progress',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
        responseDueDate: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000).toISOString(), // 17 days from now
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        maxScore: 85,
        requirements: [
          'Create 3-5 minute video discussing digital media impact',
          'Respond to at least 2 peer videos',
          'Use clear audio and video quality',
          'Engage meaningfully with peer responses'
        ],
        courseId: courseId || 'course_1',
        courseName: 'Introduction to Communication',
        instructorName: 'Dr. Smith',
        enablePeerResponses: true,
        minResponsesRequired: 2,
        maxResponsesPerVideo: 4,
        responseWordLimit: 100,
        responseCharacterLimit: 800,
        isPinned: true,
        pinnedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        emoji: '💬',
        color: '#10B981',
        coverPhoto: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=200&fit=crop',
        requireLiveRecording: true,
        allowedFileTypes: ['mp4', 'webm', 'mov', 'avi'],
        maxFileSize: 100 * 1024 * 1024 // 100MB
      },
      {
        assignmentId: 'assign_3',
        title: 'Communication Skills Assessment',
        description: 'Complete a video-based assessment of your communication skills',
        assignmentType: 'video_assessment',
        status: 'completed',
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        maxScore: 120,
        requirements: [
          'Record 10-15 minute video demonstrating communication skills',
          'Answer all assessment questions clearly',
          'Use professional presentation style',
          'Submit by due date'
        ],
        courseId: courseId || 'course_1',
        courseName: 'Introduction to Communication',
        instructorName: 'Dr. Smith',
        enablePeerResponses: false,
        emoji: '📝',
        color: '#8B5CF6',
        coverPhoto: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=200&fit=crop',
        requireLiveRecording: true,
        allowedFileTypes: ['mp4', 'webm', 'mov', 'avi'],
        maxFileSize: 100 * 1024 * 1024 // 100MB
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