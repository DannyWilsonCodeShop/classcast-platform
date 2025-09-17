import { NextRequest, NextResponse } from 'next/server';
import { contentModerationService } from '@/lib/contentModeration';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, type, context, userId } = body;

    if (!content || !type || !context) {
      return NextResponse.json(
        { error: 'Content, type, and context are required' },
        { status: 400 }
      );
    }

    if (!['text', 'video'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be either "text" or "video"' },
        { status: 400 }
      );
    }

    const result = await contentModerationService.moderateSubmission(
      content, 
      type as 'text' | 'video', 
      context
    );

    // Log moderation result for audit purposes
    console.log(`Submission moderation for user ${userId}:`, {
      assignmentId: context.assignmentId,
      courseId: context.courseId,
      type,
      isAppropriate: result.isAppropriate,
      confidence: result.confidence,
      flags: result.flags,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Submission moderation error:', error);
    
    if (error instanceof Error && error.message.includes('OpenAI API key not configured')) {
      return NextResponse.json(
        { error: 'Content moderation service is not available' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to moderate submission' },
      { status: 500 }
    );
  }
}
