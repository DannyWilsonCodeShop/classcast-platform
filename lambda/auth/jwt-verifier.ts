import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { APIGatewayProxyEvent } from 'aws-lambda';

// JWT verifier configuration
const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env['USER_POOL_ID'] || '',
  tokenUse: 'access',
  clientId: process.env['USER_POOL_CLIENT_ID'] || '',
});

// Extended user claims interface
export interface AuthenticatedUser {
  sub: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department: string;
  studentId?: string | undefined;
  instructorId?: string | undefined;
  groups: string[];
  isStudent: boolean;
  isInstructor: boolean;
  isAdmin: boolean;
  lastLogin: string;
  preferences: Record<string, any>;
  tokenUse: string;
  scope: string;
  authTime: number;
  exp: number;
  iat: number;
}

// JWT verification result
export interface JwtVerificationResult {
  success: boolean;
  user?: AuthenticatedUser;
  error?: string;
  statusCode?: number;
}

/**
 * Verify JWT token from Authorization header
 */
export async function verifyJwtToken(event: APIGatewayProxyEvent): Promise<JwtVerificationResult> {
  try {
    // Extract token from Authorization header
    const authHeader = event.headers['Authorization'] || event.headers['authorization'];
    if (!authHeader) {
      return {
        success: false,
        error: 'Authorization header is missing',
        statusCode: 401
      };
    }

    // Check if it's a Bearer token
    if (!authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Invalid authorization format. Expected Bearer token',
        statusCode: 401
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the token
    const payload = await verifier.verify(token);
    
    // Extract user information from claims
    const user: AuthenticatedUser = {
      sub: payload.sub,
      email: String(payload['email'] || ''),
      firstName: String(payload['firstName'] || payload['given_name'] || ''),
      lastName: String(payload['lastName'] || payload['family_name'] || ''),
      role: String(payload['role'] || 'student'),
      department: String(payload['department'] || ''),
      studentId: payload['studentId'] as string | undefined,
      instructorId: payload['instructorId'] as string | undefined,
      groups: Array.isArray(payload['groups']) ? payload['groups'] as string[] : [],
      isStudent: Boolean(payload['isStudent'] || false),
      isInstructor: Boolean(payload['isInstructor'] || false),
      isAdmin: Boolean(payload['isAdmin'] || false),
      lastLogin: String(payload['lastLogin'] || ''),
      preferences: typeof payload['preferences'] === 'object' ? payload['preferences'] as Record<string, any> : {},
      tokenUse: payload.token_use || '',
      scope: payload.scope || '',
      authTime: payload.auth_time || 0,
      exp: payload.exp || 0,
      iat: payload.iat || 0
    };

    return {
      success: true,
      user
    };

  } catch (error) {
    console.error('JWT verification failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        return {
          success: false,
          error: 'Token has expired',
          statusCode: 401
        };
      }
      if (error.message.includes('invalid')) {
        return {
          success: false,
          error: 'Invalid token',
          statusCode: 401
        };
      }
    }

    return {
      success: false,
      error: 'Token verification failed',
      statusCode: 401
    };
  }
}

/**
 * Check if user has required role
 */
export function hasRole(user: AuthenticatedUser, requiredRole: string | string[]): boolean {
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return roles.includes(user.role) || user.isAdmin;
}

/**
 * Check if user has required group membership
 */
export function hasGroup(user: AuthenticatedUser, requiredGroup: string | string[]): boolean {
  const groups = Array.isArray(requiredGroup) ? requiredGroup : [requiredGroup];
  return groups.some(group => user.groups.includes(group)) || user.isAdmin;
}

/**
 * Check if user can access resource (basic ownership check)
 */
export function canAccessResource(user: AuthenticatedUser, resourceOwnerId: string): boolean {
  return user.sub === resourceOwnerId || user.isAdmin;
}

/**
 * Get user's accessible courses (for students) or managed courses (for instructors)
 */
export function getUserCourseAccess(user: AuthenticatedUser): {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  scope: 'own' | 'department' | 'all';
} {
  if (user.isAdmin) {
    return {
      canView: true,
      canEdit: true,
      canDelete: true,
      scope: 'all'
    };
  }

  if (user.isInstructor) {
    return {
      canView: true,
      canEdit: true,
      canDelete: false,
      scope: 'department'
    };
  }

  if (user.isStudent) {
    return {
      canView: true,
      canEdit: false,
      canDelete: false,
      scope: 'own'
    };
  }

  return {
    canView: false,
    canEdit: false,
    canDelete: false,
    scope: 'own'
  };
}

/**
 * Create authorization error response
 */
export function createAuthError(message: string, statusCode: number = 401): {
  statusCode: number;
  body: string;
  headers: Record<string, string>;
} {
  return {
    statusCode,
    body: JSON.stringify({
      error: 'Authorization failed',
      message,
      timestamp: new Date().toISOString()
    }),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    }
  };
}

/**
 * Create success response with user context
 */
export function createSuccessResponse<T>(
  data: T,
  user: AuthenticatedUser,
  statusCode: number = 200
): {
  statusCode: number;
  body: string;
  headers: Record<string, string>;
} {
  return {
    statusCode,
    body: JSON.stringify({
      success: true,
      data,
      user: {
        userId: user.sub,
        role: user.role,
        department: user.department
      },
      timestamp: new Date().toISOString()
    }),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    }
  };
}
