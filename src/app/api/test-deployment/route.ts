import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Deployment test successful',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    features: {
      videoUpload: 'enabled',
      localStorage: 'enabled',
      s3Storage: 'disabled'
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({
      success: true,
      message: 'POST test successful',
      receivedData: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Invalid JSON in request body',
      timestamp: new Date().toISOString()
    });
  }
}
