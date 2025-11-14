import { NextRequest, NextResponse } from 'next/server';
import { processVideoUrl, validateVideoUrl } from '@/lib/videoUrlProcessor';

/**
 * GET /api/videos/[submissionId]/view
 * Get video URL for viewing/embedding
 * Handles YouTube, Google Drive, and direct video URLs
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { submissionId: string } }
) {
  try {
    const { submissionId } = params;

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      );
    }

    // TODO: Fetch the video submission from your database
    // This is a placeholder - replace with your actual database query
    // const submission = await getVideoSubmission(submissionId);
    
    // For now, we'll assume the videoUrl is passed as a query parameter
    // In production, you should fetch it from the database
    const searchParams = request.nextUrl.searchParams;
    const videoUrl = searchParams.get('url');

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Video URL is required' },
        { status: 400 }
      );
    }

    // Validate the URL
    const validation = validateVideoUrl(videoUrl);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: validation.error || 'Invalid video URL',
          submissionId 
        },
        { status: 400 }
      );
    }

    // Process the URL (converts Google Drive to embed format)
    const processed = processVideoUrl(videoUrl);

    // Return the processed URL information
    return NextResponse.json({
      success: true,
      data: {
        submissionId,
        originalUrl: processed.originalUrl,
        displayUrl: processed.displayUrl,
        embedUrl: processed.embedUrl,
        videoType: processed.videoType,
        videoId: processed.videoId,
      },
    });

  } catch (error) {
    console.error('Error processing video view request:', error);
    return NextResponse.json(
      {
        error: 'Failed to process video URL',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

