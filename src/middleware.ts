import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  const pathname = request.nextUrl.pathname;
  
  // Cache static assets for 1 year (immutable — hash in filename)
  if (pathname.startsWith('/_next/static') || 
      pathname.startsWith('/static') ||
      pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot|webp|avif)$/)) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  
  // API GET routes — aggressive stale-while-revalidate for instant perceived speed
  // s-maxage = CDN cache time, stale-while-revalidate = serve stale while refreshing in background
  if (pathname.startsWith('/api') && request.method === 'GET') {
    // Auth routes — never cache
    if (pathname.startsWith('/api/auth')) {
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
    }
    // Real-time data (feed, study-hall) — very short CDN cache, long stale window
    else if (pathname.includes('/feed') || pathname.includes('/study-hall')) {
      response.headers.set('Cache-Control', 'public, max-age=10, s-maxage=15, stale-while-revalidate=60');
    }
    // Submissions, grades — moderate cache
    else if (pathname.includes('/submissions') || pathname.includes('/grades') || pathname.includes('/enrollment')) {
      response.headers.set('Cache-Control', 'public, max-age=30, s-maxage=30, stale-while-revalidate=120');
    }
    // Course data, assignment lists, sections — stable, cache longer
    else if (pathname.includes('/courses') || pathname.includes('/assignments') || pathname.includes('/sections')) {
      response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=600');
    }
    // Profile, user data — stable
    else if (pathname.includes('/profile') || pathname.includes('/users')) {
      response.headers.set('Cache-Control', 'public, max-age=120, s-maxage=300, stale-while-revalidate=600');
    }
    // Default API
    else {
      response.headers.set('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=300');
    }
  }
  
  // POST/PUT/DELETE — never cache
  if (pathname.startsWith('/api') && request.method !== 'GET') {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
  }

  // Page routes — cache HTML at CDN edge for instant navigation
  if (!pathname.startsWith('/api') && !pathname.startsWith('/_next') && !pathname.includes('.')) {
    // Student/instructor pages — short CDN cache, long stale window
    if (pathname.startsWith('/student') || pathname.startsWith('/instructor')) {
      response.headers.set('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
    }
    // Public pages (about, study-hall, join) — longer cache
    else if (pathname.startsWith('/about') || pathname.startsWith('/study-hall') || pathname.startsWith('/join')) {
      response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
    }
  }
  
  // Security headers
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
