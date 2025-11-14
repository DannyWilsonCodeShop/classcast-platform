import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { processVideoUrl, validateVideoUrl } from '@/lib/videoUrlProcessor';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const SUBMISSIONS_TABLE = 'classcast-submissions';

/**
 * GET /api/videos/[videoId]/view
 * Get video URL for viewing/embedding
 * Handles YouTube, Google Drive, and direct video URLs
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    // Get submission from database
    let getResult;
    let actualKey: { submissionId: string } | { id: string } = { submissionId: videoId };
    
    try {
      getResult = await docClient.send(new GetCommand({
        TableName: SUBMISSIONS_TABLE,
        Key: { submissionId: videoId }
      }));
      actualKey = { submissionId: videoId };
    } catch (error) {
      try {
        getResult = await docClient.send(new GetCommand({
          TableName: SUBMISSIONS_TABLE,
          Key: { id: videoId }
        }));
        actualKey = { id: videoId };
      } catch (error2) {
        return NextResponse.json(
          { error: 'Video not found' },
          { status: 404 }
        );
      }
    }

    if (!getResult.Item) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    const submission = getResult.Item;
    
    // Check all possible URL fields (in order of preference)
    const videoUrl = submission.videoUrl || 
                     submission.youtubeUrl || 
                     submission.googleDriveUrl || 
                     submission.googleDriveOriginalUrl ||
                     submission.url || 
                     submission.externalUrl;

    if (!videoUrl) {
      console.error('❌ No video URL found in submission:', { 
        videoId, 
        hasVideoUrl: !!submission.videoUrl,
        hasYoutubeUrl: !!submission.youtubeUrl,
        hasGoogleDriveUrl: !!submission.googleDriveUrl,
        submissionKeys: Object.keys(submission)
      });
      return NextResponse.json(
        { error: 'Video URL not found in submission' },
        { status: 404 }
      );
    }

    console.log('📹 Processing video URL:', { videoId, videoUrl: videoUrl.substring(0, 50) + '...' });

    // Validate the URL
    let validation;
    try {
      validation = validateVideoUrl(videoUrl);
    } catch (error) {
      console.error('❌ Error validating video URL:', error);
      return NextResponse.json(
        { 
          error: 'Failed to validate video URL',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    if (!validation.isValid) {
      console.error('❌ Invalid video URL:', validation.error);
      return NextResponse.json(
        { 
          error: validation.error || 'Invalid video URL',
          videoId 
        },
        { status: 400 }
      );
    }

    // Process the URL (converts Google Drive to embed format)
    let processed;
    try {
      processed = processVideoUrl(videoUrl);
    } catch (error) {
      console.error('❌ Error processing video URL:', error);
      return NextResponse.json(
        { 
          error: 'Failed to process video URL',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    // Return the processed URL information
    return NextResponse.json({
      success: true,
      data: {
        videoId,
        originalUrl: processed.originalUrl,
        displayUrl: processed.displayUrl,
        embedUrl: processed.embedUrl,
        videoType: processed.videoType,
        extractedVideoId: processed.videoId,
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const body = await request.json().catch(() => ({}));
    const { userId } = body;

    if (!videoId) {
      console.error('❌ Video ID is required');
      return NextResponse.json(
        { success: false, error: 'Video ID is required' },
        { status: 400 }
      );
    }

    console.log('📊 Tracking video view:', { videoId, userId });

    // Try to get current submission (try different key patterns)
    let getResult;
    let actualKey: { submissionId: string } | { id: string } = { submissionId: videoId };
    
    try {
      getResult = await docClient.send(new GetCommand({
        TableName: SUBMISSIONS_TABLE,
        Key: { submissionId: videoId }
      }));
      actualKey = { submissionId: videoId };
      console.log('✅ Found video with submissionId key');
    } catch (error) {
      console.log('⚠️ Error with submissionId, trying id key:', error);
      try {
        getResult = await docClient.send(new GetCommand({
          TableName: SUBMISSIONS_TABLE,
          Key: { id: videoId }
        }));
        actualKey = { id: videoId };
        console.log('✅ Found video with id key');
      } catch (error2) {
        console.log('❌ Video not found with either key:', videoId);
        // Don't return error, just log and return success to avoid breaking the UI
        return NextResponse.json({
          success: true,
          views: 0,
          message: 'Video not found in database'
        });
      }
    }

    if (!getResult.Item) {
      console.log('❌ Video not found in submissions table:', videoId);
      // Don't return error, just log and return success to avoid breaking the UI
      return NextResponse.json({
        success: true,
        views: 0,
        message: 'Video not found in database'
      });
    }

    const submission = getResult.Item;
    const currentViews = submission.views || 0;
    const viewedBy = submission.viewedBy || [];
    
    // Only increment view count if user hasn't viewed this video before
    // (or if no userId provided, assume it's a unique view)
    if (!userId || !viewedBy.includes(userId)) {
      const updatedViews = currentViews + 1;
      const updatedViewedBy = userId ? [...viewedBy, userId] : viewedBy;

      // Update submission with new view count - use the actual key that worked
      await docClient.send(new UpdateCommand({
        TableName: SUBMISSIONS_TABLE,
        Key: actualKey,
        UpdateExpression: 'SET views = :views, viewedBy = :viewedBy, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':views': updatedViews,
          ':viewedBy': updatedViewedBy,
          ':updatedAt': new Date().toISOString()
        }
      }));

      console.log('✅ Video view tracked successfully:', { videoId, views: updatedViews });

      return NextResponse.json({
        success: true,
        views: updatedViews
      });
    } else {
      // User already viewed this video, return current count
      console.log('ℹ️ Video already viewed by user:', { videoId, userId });
      
      return NextResponse.json({
        success: true,
        views: currentViews,
        alreadyViewed: true
      });
    }

  } catch (error) {
    console.error('❌ Error tracking video view:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track video view', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
