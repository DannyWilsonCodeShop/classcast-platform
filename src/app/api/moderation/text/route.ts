import { NextRequest, NextResponse } from 'next/server';
import { contentModerationService } from '@/lib/contentModeration';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, context, userId, contentType } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required and must be a string' },
        { status: 400 }
      );
    }

    if (content.length > 10000) {
      return NextResponse.json(
        { error: 'Content is too long. Maximum 10,000 characters allowed.' },
        { status: 400 }
      );
    }

    const result = await contentModerationService.moderateText(content, context);

    // Log moderation result for audit purposes
    console.log(`Content moderation for user ${userId}:`, {
      contentType,
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
    console.error('Text moderation error:', error);
    
    if (error instanceof Error && error.message.includes('OpenAI API key not configured')) {
      return NextResponse.json(
        { error: 'Content moderation service is not available' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to moderate content' },
      { status: 500 }
    );
  }
}
