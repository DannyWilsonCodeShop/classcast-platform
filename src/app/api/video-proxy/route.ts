import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({ region: 'us-east-1' });
const VIDEO_BUCKET = process.env.S3_VIDEO_BUCKET_NAME || 'classcast-videos-463470937777-us-east-1';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoUrl = searchParams.get('url');
    
    if (!videoUrl) {
      return new NextResponse('Missing URL parameter', { status: 400 });
    }

    // Extract the S3 key from the URL (handle both direct and presigned URLs)
    let s3Key: string;
    try {
      const url = new URL(videoUrl);
      s3Key = url.pathname.substring(1); // Remove leading slash
      
      // For presigned URLs, we need to use the full URL as-is
      // Check if this is a presigned URL (has query parameters)
      if (url.search) {
        console.log('Detected presigned URL, using direct fetch instead of S3 client');
        // For presigned URLs, stream the response instead of loading into memory
        const response = await fetch(videoUrl);
        if (!response.ok) {
          return new NextResponse('Video not found', { status: 404 });
        }
        
        // Stream the response to avoid loading large files into memory
        return new NextResponse(response.body, {
          headers: {
            'Content-Type': response.headers.get('Content-Type') || 'video/mp4',
            'Content-Length': response.headers.get('Content-Length') || '0',
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=31536000',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers': 'Range, Content-Range, Content-Length, Content-Type',
            'X-Content-Type-Options': 'nosniff',
          },
        });
      }
    } catch (error) {
      return new NextResponse('Invalid URL format', { status: 400 });
    }

    console.log('Proxying video from S3:', { videoUrl, s3Key });

    try {
      // First, get the object metadata to determine content type
      const headCommand = new HeadObjectCommand({
        Bucket: VIDEO_BUCKET,
        Key: s3Key
      });
      
      const headResult = await s3Client.send(headCommand);
      const contentType = headResult.ContentType || 'video/mp4';
      
      console.log('Video metadata:', { contentType, contentLength: headResult.ContentLength });

      // Get the video file
      const getCommand = new GetObjectCommand({
        Bucket: VIDEO_BUCKET,
        Key: s3Key
      });

      const result = await s3Client.send(getCommand);
      
      if (!result.Body) {
        return new NextResponse('Video not found', { status: 404 });
      }

      // Stream the response directly to avoid loading large files into memory
      return new NextResponse(result.Body.transformToWebStream(), {
        headers: {
          'Content-Type': contentType,
          'Content-Length': result.ContentLength?.toString() || '0',
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Range, Content-Range, Content-Length, Content-Type',
          // Safari-specific headers
          'X-Content-Type-Options': 'nosniff',
        },
      });
    } catch (s3Error) {
      console.error('Error fetching video from S3:', s3Error);
      return new NextResponse('Video not found', { status: 404 });
    }
  } catch (error) {
    console.error('Error proxying video:', error);
    return new NextResponse('Failed to load video', { status: 500 });
  }
}

// Handle HEAD requests for range requests
export async function HEAD(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoUrl = searchParams.get('url');
    
    if (!videoUrl) {
      return new NextResponse('Missing URL parameter', { status: 400 });
    }

    const url = new URL(videoUrl);
    
    // Handle presigned URLs
    if (url.search) {
      console.log('HEAD request for presigned URL, using direct fetch');
      const response = await fetch(videoUrl, { method: 'HEAD' });
      if (!response.ok) {
        return new NextResponse('Video not found', { status: 404 });
      }
      
      return new NextResponse(null, {
        headers: {
          'Content-Type': response.headers.get('Content-Type') || 'video/mp4',
          'Content-Length': response.headers.get('Content-Length') || '0',
          'Accept-Ranges': 'bytes',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Range, Content-Range, Content-Length, Content-Type',
        },
      });
    }
    
    // Handle direct S3 URLs
    const s3Key = url.pathname.substring(1);
    const headCommand = new HeadObjectCommand({
      Bucket: VIDEO_BUCKET,
      Key: s3Key
    });
    
    const result = await s3Client.send(headCommand);
    
    return new NextResponse(null, {
      headers: {
        'Content-Type': result.ContentType || 'video/mp4',
        'Content-Length': result.ContentLength?.toString() || '0',
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Content-Range, Content-Length, Content-Type',
      },
    });
  } catch (error) {
    console.error('Error in HEAD request:', error);
    return new NextResponse('Video not found', { status: 404 });
  }
}
