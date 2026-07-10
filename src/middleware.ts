import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  const pathname = request.nextUrl.pathname;
  
  // Cache static assets for 1 year
  if (pathname.startsWith('/_next/static') || 
      pathname.startsWith('/static') ||
      pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot|webp|avif)$/)) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  
  // Cache API GET requests — vary by endpoint type
  if (pathname.startsWith('/api') && request.method === 'GET') {
    // Frequently changing data (feed, submissions) — short cache with revalidation
    if (pathname.includes('/feed') || pathname.includes('/submissions') || pathname.includes('/grades')) {
      response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=300');
    }
    // Semi-stable data (courses, assignments, profiles) — longer cache
    else if (pathname.includes('/courses') || pathname.includes('/assignments') || pathname.includes('/profile')) {
      response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=600');
    }
    // Default API caching
    else {
      response.headers.set('Cache-Control', 'public, max-age=120, s-maxage=120, stale-while-revalidate=300');
    }
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
