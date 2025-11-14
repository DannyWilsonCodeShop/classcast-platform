import { NextRequest, NextResponse } from 'next/server';
import { s3Service } from '../../../../../lib/s3';

// Configure for large file uploads
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

/**
 * POST /api/upload/multipart/init - Initialize multipart upload
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, fileSize, contentType, folder = 'videos', userId, metadata = {} } = body;

    console.log('Multipart upload init request:', {
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

    // Validate file size (max 5GB for multipart uploads)
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

    // Generate unique file key
    const fileKey = s3Service.generateFileKey(folder, fileName, userId);

    // Initialize multipart upload
    const uploadId = await s3Service.initiateMultipartUpload(
      fileKey,
      contentType,
      {
        ...metadata,
        'original-name': fileName,
        'file-size': fileSize.toString(),
        'uploaded-by': userId || 'anonymous',
        'upload-timestamp': new Date().toISOString(),
        'upload-method': 'multipart-upload'
      }
    );

    // Generate the final file URL
    const fileUrl = s3Service.getFileUrl(fileKey);

    console.log('Multipart upload initialized:', {
      uploadId,
      fileKey,
      fileSizeMB: (fileSize / (1024 * 1024)).toFixed(1)
    });

    return NextResponse.json({
      success: true,
      data: {
        uploadId,
        fileKey,
        fileUrl,
        uploadMethod: 'multipart-upload',
      },
      message: 'Multipart upload initialized successfully',
    });

  } catch (error) {
    console.error('Error initializing multipart upload:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initialize multipart upload',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

