import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

/**
 * POST /api/thumbnails/extract
 * For YouTube videos: extracts the YouTube thumbnail URL and saves it.
 * For S3 videos: we can't extract frames server-side without FFmpeg/Lambda,
 * so we mark them for client-side extraction or use the video URL itself.
 * 
 * Body: { submissionId?: string, runAll?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { submissionId, runAll } = body;

    let submissions: any[] = [];

    if (runAll) {
      // Get all submissions with placeholder thumbnails
      const result = await docClient.send(new ScanCommand({
        TableName: 'classcast-submissions',
      }));
      submissions = (result.Items || []).filter(s => 
        !s.thumbnailUrl || s.thumbnailUrl.includes('/api/placeholder') || s.thumbnailUrl === ''
      );
    } else if (submissionId) {
      // Just process one
      submissions = [{ submissionId }];
    }

    let updated = 0;

    for (const sub of submissions) {
      const videoUrl = sub.videoUrl || '';
      let thumbnailUrl = '';

      // YouTube - extract from URL
      if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        let videoId = '';
        if (videoUrl.includes('youtu.be/')) {
          videoId = videoUrl.split('youtu.be/')[1]?.split(/[?&]/)[0] || '';
        } else {
          try { videoId = new URL(videoUrl).searchParams.get('v') || ''; } catch {}
        }
        if (videoId) {
          thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }
      }
      // Google Drive - use preview thumbnail
      else if (videoUrl.includes('drive.google')) {
        const match = videoUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match?.[1]) {
          thumbnailUrl = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w640`;
        }
      }
      // S3 video - no server-side extraction possible without FFmpeg
      // Leave as empty to let client handle via <video> poster or show gradient
      else if (videoUrl.includes('s3.') || videoUrl.includes('amazonaws.com')) {
        // Use the video URL itself as the "thumbnail" - client will use <video> tag
        thumbnailUrl = videoUrl;
      }

      if (thumbnailUrl && sub.submissionId) {
        await docClient.send(new UpdateCommand({
          TableName: 'classcast-submissions',
          Key: { submissionId: sub.submissionId },
          UpdateExpression: 'SET thumbnailUrl = :t',
          ExpressionAttributeValues: { ':t': thumbnailUrl },
        }));
        updated++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updated} thumbnails`,
      processed: submissions.length,
      updated,
    });
  } catch (error) {
    console.error('Thumbnail extraction error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to extract thumbnails' },
      { status: 500 }
    );
  }
}
