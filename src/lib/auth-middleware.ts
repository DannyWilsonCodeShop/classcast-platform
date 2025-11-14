import { NextRequest } from 'next/server';
import { verifyToken, extractTokenFromHeader, JWTPayload } from './jwt';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

export function getAuthUser(request: NextRequest): JWTPayload | null {
  const authHeader = request.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader);
  
  if (!token) {
    return null;
  }
  
  return verifyToken(token);
}

export function requireAuth(request: NextRequest): JWTPayload {
  const user = getAuthUser(request);
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}

export function requireRole(request: NextRequest, allowedRoles: string[]): JWTPayload {
  const user = requireAuth(request);
  
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Insufficient permissions');
  }
  
  return user;
}
