import { NextRequest, NextResponse } from 'next/server';
import { s3Service } from '../../../../lib/s3';

// Configure for large file uploads
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

/**
 * POST /api/upload/large-file - Handle large file uploads using presigned URLs
 * This endpoint generates presigned URLs for direct S3 uploads, bypassing Next.js body limits
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, fileSize, contentType, folder = 'videos', userId, metadata = {} } = body;

    console.log('Large file upload request:', {
      fileName,
      fileSize: `${(fileSize / (1024 * 1024)).toFixed(1)}MB`,
      contentType,
      folder,
      userId
    });

    if (!fileName || !fileSize || !contentType) {
      return NextResponse.json(
        {
          success: false,
          error: 'fileName, fileSize, and contentType are required',
        },
        { status: 400 }
      );
    }

    // Validate file size (max 5GB for large uploads)
    const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
    if (fileSize > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds 5GB limit. Current size: ${(fileSize / (1024 * 1024 * 1024)).toFixed(2)}GB`,
        },
        { status: 400 }
      );
    }

    // Validate file type for videos
    const allowedVideoTypes = [
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-ms-wmv',
      'video/webm',
      'video/ogg',
      'video/mov'
    ];

    if (!allowedVideoTypes.includes(contentType)) {
      return NextResponse.json(
        {
          success: false,
          error: `File type ${contentType} is not allowed for large uploads. Allowed types: ${allowedVideoTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Generate unique file key
    const fileKey = s3Service.generateFileKey(folder, fileName, userId);

    // Prepare metadata
    const finalMetadata = {
      ...metadata,
      'original-name': fileName,
      'file-size': fileSize.toString(),
      'uploaded-by': userId || 'anonymous',
      'upload-timestamp': new Date().toISOString(),
      'upload-method': 'presigned-large-file'
    };

    // Generate presigned upload URL with longer expiration for large files
    const expiresIn = 3600; // 1 hour for large file uploads
    const presignedUrl = await s3Service.generatePresignedUploadUrl(
      fileKey,
      contentType,
      expiresIn,
      finalMetadata
    );

    // Generate the final file URL
    const fileUrl = `https://${process.env.S3_ASSETS_BUCKET || 'cdk-hnb659fds-assets-463470937777-us-east-1'}.s3.amazonaws.com/${fileKey}`;

    console.log('Large file presigned URL generated:', {
      fileKey,
      expiresIn,
      fileSizeMB: (fileSize / (1024 * 1024)).toFixed(1)
    });

    return NextResponse.json({
      success: true,
      data: {
        fileKey,
        presignedUrl,
        fileUrl,
        expiresIn,
        uploadMethod: 'presigned-large-file',
        metadata: finalMetadata,
        instructions: {
          method: 'PUT',
          headers: {
            'Content-Type': contentType,
          },
          note: 'Upload the file directly to the presigned URL using a PUT request'
        }
      },
      message: 'Presigned URL generated for large file upload',
    });

  } catch (error) {
    console.error('Error generating large file upload URL:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate large file upload URL',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload/large-file - Check upload status or get upload URL
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileKey = searchParams.get('fileKey');

    if (!fileKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'fileKey is required',
        },
        { status: 400 }
      );
    }

    // Check if file exists in S3
    try {
      const exists = await s3Service.fileExists(fileKey);
      const fileUrl = `https://${process.env.S3_ASSETS_BUCKET || 'cdk-hnb659fds-assets-463470937777-us-east-1'}.s3.amazonaws.com/${fileKey}`;

      return NextResponse.json({
        success: true,
        data: {
          fileKey,
          exists,
          fileUrl: exists ? fileUrl : null,
          status: exists ? 'uploaded' : 'pending'
        }
      });
    } catch (error) {
      return NextResponse.json({
        success: true,
        data: {
          fileKey,
          exists: false,
          fileUrl: null,
          status: 'pending'
        }
      });
    }

  } catch (error) {
    console.error('Error checking large file status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check file status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}