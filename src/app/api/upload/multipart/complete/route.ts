import { NextRequest, NextResponse } from 'next/server';
import { s3Service } from '../../../../../lib/s3';

// Configure for large file uploads
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

/**
 * POST /api/upload/multipart/complete - Complete multipart upload
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uploadId, fileKey, parts } = body;

    console.log('Multipart upload complete request:', {
      uploadId,
      fileKey,
      partsCount: parts?.length
    });

    if (!uploadId || !fileKey || !parts || !Array.isArray(parts)) {
      return NextResponse.json(
        {
          success: false,
          error: 'uploadId, fileKey, and parts array are required',
        },
        { status: 400 }
      );
    }

    if (parts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'At least one part is required',
        },
        { status: 400 }
      );
    }

    // Validate parts structure
    for (const part of parts) {
      if (!part.ETag || !part.PartNumber) {
        return NextResponse.json(
          {
            success: false,
            error: 'Each part must have ETag and PartNumber',
          },
          { status: 400 }
        );
      }
    }

    // Complete multipart upload
    const fileUrl = await s3Service.completeMultipartUpload(
      fileKey,
      uploadId,
      parts
    );

    console.log('Multipart upload completed:', {
      uploadId,
      fileKey,
      fileUrl,
      partsCount: parts.length
    });

    return NextResponse.json({
      success: true,
      data: {
        fileKey,
        fileUrl,
        uploadId,
        partsCount: parts.length,
      },
      message: 'Multipart upload completed successfully',
    });

  } catch (error) {
    console.error('Error completing multipart upload:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to complete multipart upload',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

