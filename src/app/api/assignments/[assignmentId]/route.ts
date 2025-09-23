import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
    const { assignmentId } = params;
    
    // Mock assignment data - in a real app, this would fetch from DynamoDB
    const mockAssignments: Record<string, any> = {
      'demo-assignment-123': {
        assignmentId: 'demo-assignment-123',
        title: 'Video Presentation Assignment',
        description: 'Create a comprehensive video presentation on your chosen topic that demonstrates your understanding of the course material.',
        assignmentType: 'video_assignment',
        status: 'active',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxScore: 100,
        requirements: [
          'Video must be 5-7 minutes long',
          'Include a clear introduction with your name and topic',
          'Present 3-5 main points with supporting evidence',
          'Use visual aids or slides to enhance your presentation',
          'Include a conclusion that summarizes your key points',
          'Speak clearly and maintain eye contact with the camera',
          'Ensure good lighting and audio quality',
          'Submit by the due date'
        ],
        courseId: 'demo-course-456',
        courseName: 'Introduction to Communication',
        instructorName: 'Dr. Smith',
        enablePeerResponses: true,
        minResponsesRequired: 2,
        maxResponsesPerVideo: 3,
        responseWordLimit: 50,
        responseCharacterLimit: 500,
        emoji: '🎥',
        color: '#3B82F6',
        requireLiveRecording: false,
        allowedFileTypes: ['mp4', 'webm', 'mov'],
        maxFileSize: 100 * 1024 * 1024, // 100MB
        maxDuration: 420 // 7 minutes in seconds
      },
      'assign_1': {
        assignmentId: 'assign_1',
        title: 'Video Presentation Assignment',
        description: 'Create a 5-minute video presentation on your chosen topic',
        assignmentType: 'video_assignment',
        status: 'upcoming',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        responseDueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        maxScore: 100,
        requirements: [
          'Video must be 5-7 minutes long',
          'Include introduction and conclusion',
          'Use clear audio and video quality',
          'Submit by due date'
        ],
        courseId: 'course_1',
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
        maxFileSize: 100 * 1024 * 1024, // 100MB
        maxDuration: 420 // 7 minutes in seconds
      }
    };
    
    const assignment = mockAssignments[assignmentId];
    
    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: assignment
    });
    
  } catch (error) {
    console.error('Error fetching assignment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignment' },
      { status: 500 }
    );
  }
}
