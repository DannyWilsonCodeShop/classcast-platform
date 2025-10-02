import { NextRequest, NextResponse } from 'next/server';
import { s3Service } from '../../../lib/s3';

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// POST /api/upload - Upload a file to S3
export async function POST(request: NextRequest) {
  try {
    console.log('Upload API called');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'uploads';
    const userId = formData.get('userId') as string;
    const metadata = formData.get('metadata') as string;

    console.log('Upload request data:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      folder,
      userId,
      hasMetadata: !!metadata
    });

    if (!file) {
      console.error('No file provided in upload request');
      return NextResponse.json(
        {
          success: false,
          error: 'No file provided',
        },
        { status: 400 }
      );
    }

    // Validate file size (max 100MB for videos, 10MB for other files)
    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024; // 100MB for videos, 10MB for others
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds ${isVideo ? '100MB' : '10MB'} limit`,
        },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      // Videos
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-ms-wmv',
      'video/webm',
      'video/ogg',
      // Audio
      'audio/mpeg',
      'audio/wav',
      'audio/mp4',
      'audio/ogg',
      'audio/webm',
      // Documents
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      // Archives
      'application/zip',
      'application/x-rar-compressed',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `File type ${file.type} is not allowed`,
          allowedTypes,
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Generate unique file key
    const fileKey = s3Service.generateFileKey(folder, file.name, userId);

    // Parse metadata if provided
    let parsedMetadata: Record<string, string> = {};
    if (metadata) {
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch (error) {
        console.warn('Invalid metadata JSON provided:', metadata);
      }
    }

    // Add default metadata
    const finalMetadata = {
      ...parsedMetadata,
      'original-name': file.name,
      'file-size': file.size.toString(),
      'uploaded-by': userId || 'anonymous',
      'upload-timestamp': new Date().toISOString(),
    };

    // Upload file to S3
    console.log('Attempting to upload file to S3:', {
      fileKey,
      fileSize: buffer.length,
      contentType: file.type,
      bucket: process.env.S3_ASSETS_BUCKET || 'cdk-hnb659fds-assets-463470937777-us-east-1'
    });

    let fileUrl: string;
    try {
      fileUrl = await s3Service.uploadFile(
        fileKey,
        buffer,
        file.type,
        finalMetadata
      );
      console.log('S3 upload successful:', fileUrl);
    } catch (s3Error) {
      console.error('S3 upload failed:', s3Error);
      throw s3Error;
    }

    console.log('File uploaded successfully:', {
      fileKey,
      fileUrl,
      fileName: file.name
    });

    return NextResponse.json({
      success: true,
      data: {
        fileKey,
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type,
        metadata: finalMetadata,
      },
      message: 'File uploaded successfully',
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    
    // Log more detailed error information
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

// GET /api/upload - Generate presigned upload URL
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');
    const contentType = searchParams.get('contentType');
    const folder = searchParams.get('folder') || 'uploads';
    const userId = searchParams.get('userId');
    const expiresIn = parseInt(searchParams.get('expiresIn') || '3600');

    if (!fileName || !contentType) {
      return NextResponse.json(
        {
          success: false,
          error: 'fileName and contentType are required',
        },
        { status: 400 }
      );
    }

    // Generate unique file key
    const fileKey = s3Service.generateFileKey(folder, fileName, userId);

    // Generate presigned upload URL
    const presignedUrl = await s3Service.generatePresignedUploadUrl(
      fileKey,
      contentType,
      expiresIn
    );

    return NextResponse.json({
      success: true,
      data: {
        fileKey,
        presignedUrl,
        expiresIn,
        uploadMethod: 'presigned-url',
      },
      message: 'Presigned upload URL generated successfully',
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate presigned URL',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
