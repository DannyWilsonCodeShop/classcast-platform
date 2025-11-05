import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug file upload endpoint called');
    
    const body = await request.json();
    console.log('📦 Request body:', {
      hasFileName: !!body.fileName,
      hasFileSize: !!body.fileSize,
      hasContentType: !!body.contentType,
      fileName: body.fileName,
      fileSize: body.fileSize,
      fileSizeType: typeof body.fileSize,
      contentType: body.contentType,
      fullBody: body
    });

    return NextResponse.json({
      success: true,
      debug: {
        receivedData: body,
        validation: {
          hasFileName: !!body.fileName,
          hasFileSize: !!body.fileSize,
          hasContentType: !!body.contentType,
          fileSizeIsNumber: typeof body.fileSize === 'number',
          fileSizeValue: body.fileSize
        }
      }
    });

  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        errorType: typeof error,
        errorConstructor: error?.constructor?.name
      }
    }, { status: 500 });
  }
}