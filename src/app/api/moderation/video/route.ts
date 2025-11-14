import { NextRequest, NextResponse } from 'next/server';
import { contentModerationService } from '@/lib/contentModeration';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoUrl, metadata, userId, contentType } = body;

    if (!videoUrl || typeof videoUrl !== 'string') {
      return NextResponse.json(
        { error: 'Video URL is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate video URL format
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(videoUrl)) {
      return NextResponse.json(
        { error: 'Invalid video URL format' },
        { status: 400 }
      );
    }

    const result = await contentModerationService.moderateVideo(videoUrl, metadata);

    // Log moderation result for audit purposes
    console.log(`Video moderation for user ${userId}:`, {
      contentType,
      videoUrl: videoUrl.substring(0, 50) + '...',
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
    console.error('Video moderation error:', error);
    
    if (error instanceof Error && error.message.includes('OpenAI API key not configured')) {
      return NextResponse.json(
        { error: 'Content moderation service is not available' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to moderate video content' },
      { status: 500 }
    );
  }
}
