import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const s3 = new S3Client({ region: 'us-east-1' });
const BUCKET = process.env.VIDEO_BUCKET || 'classcast-videos-463470937777-us-east-1';

/**
 * POST /api/upload/video-presign
 * 
 * Generates a presigned S3 PUT URL for video uploads from the recording page.
 * The client sends the video file directly to S3 using this URL.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, fileType, userId } = body;

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: 'fileName and fileType are required' },
        { status: 400 }
      );
    }

    // Generate a unique file key
    const ext = fileName.split('.').pop() || 'mp4';
    const fileKey = `videos/${userId || 'anonymous'}/${uuidv4()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: fileKey,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    const videoUrl = `https://${BUCKET}.s3.us-east-1.amazonaws.com/${fileKey}`;

    return NextResponse.json({
      success: true,
      uploadUrl,
      videoUrl,
      fileKey,
    });
  } catch (error) {
    console.error('Error generating video presign URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
