import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { moduleId: string } }
) {
  try {
    const { moduleId } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // In a real app, fetch from database
    // For now, return mock data based on moduleId
    const mockModule = {
      id: moduleId,
      title: 'Introduction to Calculus',
      description: 'Master the fundamentals of calculus with interactive videos and practice problems.',
      progress: 25, // User has completed 25%
      currentLessonId: 'lesson-1-2',
      lessons: [
        {
          id: 'lesson-1-1',
          title: 'What is Calculus?',
          type: 'video',
          duration: '12 minutes',
          isCompleted: true,
          isLocked: false
        },
        {
          id: 'lesson-1-2',
          title: 'Understanding Limits',
          type: 'video',
          duration: '18 minutes',
          isCompleted: false,
          isLocked: false
        },
        {
          id: 'lesson-1-3',
          title: 'Limits Quiz',
          type: 'quiz',
          isCompleted: false,
          isLocked: true
        }
      ]
    };

    return NextResponse.json({
      success: true,
      module: mockModule
    });
  } catch (error) {
    console.error('Error fetching study module:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch study module' },
      { status: 500 }
    );
  }
}