import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({ 
  region: 'us-east-1',
  // Use IAM role instead of explicit credentials
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Presigned URL API received request:', body);
    const { fileName, contentType, userId, folder = 'uploads' } = body;

    if (!fileName || !contentType) {
      console.log('Missing required fields:', { fileName, contentType });
      return NextResponse.json({
        success: false,
        error: 'fileName and contentType are required'
      }, { status: 400 });
    }

    // Generate unique file key
    const timestamp = Date.now();
    const fileExtension = fileName.split('.').pop() || 'jpg';
    const sanitizedName = fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase().substring(0, 50);
    const fileKey = `${folder}/${sanitizedName}_${userId || 'anonymous'}_${timestamp}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: 'classcast-videos-463470937777-us-east-1',
      Key: fileKey,
      ContentType: contentType,
      Metadata: {
        'user-id': userId || 'anonymous',
        'upload-timestamp': new Date().toISOString(),
        'original-filename': fileName,
        'folder': folder
      }
    });

    console.log('Creating S3 command:', { fileKey, contentType, userId, folder });
    
    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutes
    const fileUrl = `https://classcast-videos-463470937777-us-east-1.s3.us-east-1.amazonaws.com/${fileKey}`;

    console.log('Generated presigned URL for:', fileKey);

    return NextResponse.json({
      success: true,
      data: {
        presignedUrl,
        fileKey,
        fileUrl,
        expiresIn: 300
      },
      message: 'Presigned URL generated successfully'
    });

  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate presigned URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}