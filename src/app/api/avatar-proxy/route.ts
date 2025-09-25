import { NextRequest, NextResponse } from 'next/server';
import { s3Service } from '@/lib/s3';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const s3Url = searchParams.get('url');
    
    if (!s3Url) {
      return new NextResponse('Missing URL parameter', { status: 400 });
    }

    // Extract the key from the S3 URL
    const url = new URL(s3Url);
    const key = url.pathname.substring(1); // Remove leading slash
    
    console.log('Fetching avatar from S3 with key:', key);
    
    // Get the file from S3
    const { body, contentType } = await s3Service.getFile(key);
    
    // Return the file with proper headers
    return new NextResponse(body, {
      headers: {
        'Content-Type': contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error('Error proxying avatar:', error);
    return new NextResponse('Failed to load avatar', { status: 500 });
  }
}
