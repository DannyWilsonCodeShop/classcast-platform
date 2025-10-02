import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.S3_ASSETS_BUCKET || 'classcast-assets';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const video = formData.get('video') as File;
    const userId = formData.get('userId') as string;
    const assignmentId = formData.get('assignmentId') as string;

    if (!video) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = video.name.split('.').pop() || 'webm';
    const fileName = `video-submissions/${userId}/${assignmentId}/${timestamp}.${fileExtension}`;

    // Convert file to buffer
    const buffer = Buffer.from(await video.arrayBuffer());

    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: video.type,
      CacheControl: 'max-age=31536000',
    });

    await s3Client.send(uploadCommand);

    const videoUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${fileName}`;

    return NextResponse.json({
      success: true,
      data: {
        videoUrl: videoUrl,
        fileName: fileName,
        size: video.size,
        type: video.type,
        uploadedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Error uploading video:', error);
    return NextResponse.json(
      { error: 'Failed to upload video' },
      { status: 500 }
    );
  }
}
