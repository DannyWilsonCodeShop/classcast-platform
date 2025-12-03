import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  const pathname = request.nextUrl.pathname;
  
  // Cache static assets for 1 year
  if (pathname.startsWith('/_next/static') || 
      pathname.startsWith('/static') ||
      pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  
  // Cache API GET requests for 5 minutes
  if (pathname.startsWith('/api') && request.method === 'GET') {
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=600');
  }
  
  // Don't cache API POST/PUT/DELETE
  if (pathname.startsWith('/api') && request.method !== 'GET') {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  }
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/image|favicon.ico).*)',
  ],
};
