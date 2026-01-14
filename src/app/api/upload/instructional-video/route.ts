import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'classcast-videos-463470937777-us-east-1';

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * Upload instructional video for assignments
 * POST /api/upload/instructional-video
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📥 Instructional video upload request received');
    console.log('🔐 Request headers:', {
      contentType: request.headers.get('content-type'),
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer'),
    });

    const formData = await request.formData();
    const videoFile = formData.get('video') as File;
    const type = formData.get('type') as string; // 'instructional'

    console.log('📦 Form data received:', {
      hasVideo: !!videoFile,
      type,
      videoName: videoFile?.name,
      videoSize: videoFile?.size,
    });

    if (!videoFile) {
      console.error('❌ No video file provided');
      return NextResponse.json(
        { success: false, error: 'No video file provided' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }

    console.log('📤 Uploading instructional video:', videoFile.name, videoFile.size);

    // Generate unique filename
    const fileExtension = videoFile.name.split('.').pop() || 'mp4';
    const fileName = `instructional-${Date.now()}-${uuidv4().slice(0, 8)}.${fileExtension}`;
    const s3Key = `instructional-videos/${fileName}`;

    console.log('🔑 S3 Key:', s3Key);
    console.log('🪣 Bucket:', BUCKET_NAME);

    // Convert file to buffer
    const arrayBuffer = await videoFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('📊 Buffer size:', buffer.length);

    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: videoFile.type || 'video/mp4',
      Metadata: {
        'original-filename': videoFile.name,
        'upload-type': type || 'instructional',
        'uploaded-at': new Date().toISOString()
      }
    });

    console.log('☁️ Sending to S3...');
    await s3Client.send(uploadCommand);

    // Construct the video URL
    const videoUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${s3Key}`;

    console.log('✅ Instructional video uploaded successfully:', videoUrl);

    return NextResponse.json({
      success: true,
      videoUrl,
      fileName,
      size: videoFile.size,
      message: 'Instructional video uploaded successfully'
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });

  } catch (error) {
    console.error('❌ Error uploading instructional video:', error);
    console.error('❌ Error details:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to upload instructional video',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  }
}

