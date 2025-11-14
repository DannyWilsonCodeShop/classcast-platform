import { NextRequest, NextResponse } from 'next/server';
import { s3Service } from '../../../../../lib/s3';

// Configure for large file uploads
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

/**
 * POST /api/upload/multipart/part-url - Get presigned URL for a part
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uploadId, fileKey, partNumber } = body;

    console.log('Multipart part URL request:', {
      uploadId,
      fileKey,
      partNumber
    });

    if (!uploadId || !fileKey || !partNumber) {
      return NextResponse.json(
        {
          success: false,
          error: 'uploadId, fileKey, and partNumber are required',
        },
        { status: 400 }
      );
    }

    if (partNumber < 1 || partNumber > 10000) {
      return NextResponse.json(
        {
          success: false,
          error: 'partNumber must be between 1 and 10000',
        },
        { status: 400 }
      );
    }

    // Generate presigned URL for this part
    const presignedUrl = await s3Service.getMultipartUploadPartUrl(
      fileKey,
      uploadId,
      partNumber
    );

    console.log('Multipart part URL generated:', {
      uploadId,
      fileKey,
      partNumber
    });

    return NextResponse.json({
      success: true,
      data: {
        presignedUrl,
        partNumber,
        uploadId,
        fileKey,
      },
      message: 'Presigned URL generated for part upload',
    });

  } catch (error) {
    console.error('Error generating multipart part URL:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate part URL',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

