import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Handle large file uploads by setting appropriate headers
  if (request.nextUrl.pathname.startsWith('/api/upload') || 
      request.nextUrl.pathname.startsWith('/api/videos/presigned-upload')) {
    
    const response = NextResponse.next();
    
    // Add CORS headers for upload endpoints
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/upload/:path*',
    '/api/videos/:path*'
  ]
};