import { NextRequest, NextResponse } from 'next/server';

// Fallback upload service for when S3 is not available
// This creates a data URL for immediate preview
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'uploads';
    const userId = formData.get('userId') as string;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'No file provided',
        },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB for images)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds 10MB limit`,
        },
        { status: 400 }
      );
    }

    // Validate file type (images only for profile pictures)
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `File type ${file.type} is not allowed. Only images are supported.`,
          allowedTypes,
        },
        { status: 400 }
      );
    }

    // Convert file to base64 data URL
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Generate a mock file key for consistency
    const fileKey = `${folder}/${userId || 'anonymous'}/${Date.now()}-${file.name}`;

    return NextResponse.json({
      success: true,
      data: {
        fileKey,
        fileUrl: dataUrl, // This is a data URL, not a real S3 URL
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type,
        metadata: {
          'original-name': file.name,
          'file-size': file.size.toString(),
          'uploaded-by': userId || 'anonymous',
          'upload-timestamp': new Date().toISOString(),
          'fallback-mode': 'true',
        },
      },
      message: 'File processed successfully (fallback mode)',
      warning: 'This is a temporary preview. File will not persist after page refresh.',
    });
  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process file',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
