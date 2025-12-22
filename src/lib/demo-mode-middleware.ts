// ============================================================================
// DEMO MODE API MIDDLEWARE
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/lib/api';
import { 
  isDemoUser, 
  getDemoTargetUserId, 
  validateDemoPermissions,
  getEffectiveUserId 
} from './demo-mode-utils';

/**
 * Middleware to handle demo mode API requests
 */
export function withDemoModeMiddleware(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Extract user from request (you may need to adjust this based on your auth implementation)
      const user = await getUserFromRequest(request);
      
      // Validate demo permissions
      const permissionCheck = validateDemoPermissions(request.method, user);
      if (!permissionCheck.allowed) {
        return NextResponse.json(
          { 
            success: false, 
            error: permissionCheck.reason || 'Action not allowed in demo mode' 
          },
          { status: 403 }
        );
      }

      // Transform request for demo mode if needed
      if (isDemoUser(user)) {
        const transformedRequest = transformRequestForDemo(request, user);
        return handler(transformedRequest);
      }

      return handler(request);
    } catch (error) {
      console.error('Demo mode middleware error:', error);
      return handler(request);
    }
  };
}

/**
 * Transform request parameters for demo mode
 */
function transformRequestForDemo(
  request: NextRequest, 
  user: User | null
): NextRequest {
  if (!isDemoUser(user)) return request;

  const targetUserId = getDemoTargetUserId(user);
  if (!targetUserId) return request;

  const url = new URL(request.url);
  
  // Transform common query parameters
  if (url.searchParams.has('userId')) {
    url.searchParams.set('userId', targetUserId);
  }
  
  if (url.searchParams.has('studentId')) {
    url.searchParams.set('studentId', targetUserId);
  }

  // Create new request with transformed URL
  return new NextRequest(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });
}

/**
 * Extract user from request (simplified - adjust based on your auth implementation)
 */
async function getUserFromRequest(request: NextRequest): Promise<User | null> {
  try {
    // This is a simplified version - you may need to implement proper JWT token extraction
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return null;

    // For now, we'll check if this is a demo request based on a custom header
    // In a real implementation, you'd decode the JWT token
    const isDemoHeader = request.headers.get('x-demo-mode');
    if (isDemoHeader === 'true') {
      return {
        id: 'demo-user-123',
        email: 'demo@email.com',
        firstName: 'Demo',
        lastName: 'User',
        role: 'student',
        emailVerified: true,
        isDemoUser: true,
        demoViewingUserId: 'dwilson1919@gmail.com'
      };
    }

    return null;
  } catch (error) {
    console.error('Error extracting user from request:', error);
    return null;
  }
}

/**
 * Helper to get effective user ID for database queries
 */
export function getEffectiveUserIdFromRequest(
  request: NextRequest,
  user: User | null
): string | null {
  const { searchParams } = new URL(request.url);
  const requestedUserId = searchParams.get('userId') || searchParams.get('studentId');
  
  if (isDemoUser(user)) {
    // For demo users, always return the target user ID
    return getDemoTargetUserId(user);
  }
  
  return requestedUserId || user?.id || null;
}

/**
 * Add demo mode headers to response
 */
export function addDemoModeHeaders(
  response: NextResponse,
  user: User | null
): NextResponse {
  if (isDemoUser(user)) {
    response.headers.set('X-Demo-Mode', 'true');
    response.headers.set('X-Demo-Target-User', getDemoTargetUserId(user) || '');
    response.headers.set('X-Read-Only', 'true');
  }
  
  return response;
}

/**
 * Utility to check if request is from demo user
 */
export function isRequestFromDemoUser(request: NextRequest): boolean {
  return request.headers.get('x-demo-mode') === 'true';
}

/**
 * Get demo target user ID from request headers
 */
export function getDemoTargetFromRequest(request: NextRequest): string | null {
  if (!isRequestFromDemoUser(request)) return null;
  return request.headers.get('x-demo-target-user') || null;
}