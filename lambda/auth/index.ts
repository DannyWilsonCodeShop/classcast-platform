// Main export file for DemoProject Authentication Lambda Functions

// ============================================================================
// COGNITO TRIGGER FUNCTIONS
// ============================================================================

// Pre-token generation - adds custom claims to JWT tokens
export { handler as preTokenGenerationHandler } from './pre-token-generation';

// Post-confirmation - handles user profile creation and group assignment
export { handler as postConfirmationHandler } from './post-confirmation';

// Pre-authentication - checks account status and updates last login
export { handler as preAuthenticationHandler } from './pre-authentication';

// Custom message - customizes email messages for Cognito events
export { handler as customMessageHandler } from './custom-message';

// Signup handlers
export { handler as signupHandler } from './signup-handler';
export { handler as signupConfirmationHandler } from './signup-confirmation';
export { handler as resendConfirmationHandler } from './resend-confirmation';

// Authentication handlers
export { handler as signinHandler } from './signin-handler';
export { handler as refreshTokenHandler } from './refresh-token-handler';
export { handler as signoutHandler } from './signout-handler';
export { handler as forgotPasswordHandler } from './forgot-password-handler';
export { handler as confirmPasswordResetHandler } from './confirm-password-reset';

// Session management handler
export { handler as sessionManagementHandler } from './session-management';

// Role-based handlers
export { handler as roleBasedSignupHandler } from './role-based-signup';
export { handler as roleManagementHandler } from './role-management';

// Assignment handlers
export { handler as createAssignmentHandler } from './create-assignment';

// ============================================================================
// JWT VERIFICATION UTILITIES
// ============================================================================

export {
  verifyJwtToken,
  createAuthError,
  createSuccessResponse,
} from './jwt-verifier';

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Import types for internal use
import type { AuthenticatedUser } from './jwt-verifier';

// Re-export types for external use
export type { AuthenticatedUser, JwtVerificationResult } from './jwt-verifier';

// ============================================================================
// CONSTANTS
// ============================================================================

export const AUTH_CONSTANTS = {
  // JWT token types
  TOKEN_TYPES: {
    ACCESS: 'access',
    ID: 'id',
    REFRESH: 'refresh'
  },
  
  // User roles
  USER_ROLES: {
    STUDENT: 'student',
    INSTRUCTOR: 'instructor',
    ADMIN: 'admin'
  },
  
  // Cognito groups
  COGNITO_GROUPS: {
    STUDENTS: 'students',
    INSTRUCTORS: 'instructors',
    ADMINS: 'admins'
  },
  
  // Account statuses
  ACCOUNT_STATUS: {
    ACTIVE: 'active',
    LOCKED: 'locked',
    SUSPENDED: 'suspended',
    DISABLED: 'disabled'
  },
  
  // Permission scopes
  PERMISSION_SCOPES: {
    OWN: 'own',
    DEPARTMENT: 'department',
    ALL: 'all'
  }
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(user: AuthenticatedUser, roles: string[]): boolean {
  return roles.includes(user.role) || user.isAdmin;
}

/**
 * Check if user has any of the specified groups
 */
export function hasAnyGroup(user: AuthenticatedUser, groups: string[]): boolean {
  return groups.some(group => user.groups.includes(group)) || user.isAdmin;
}

/**
 * Get user's display name
 */
export function getUserDisplayName(user: AuthenticatedUser): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.firstName) {
    return user.firstName;
  }
  if (user.lastName) {
    return user.lastName;
  }
  return user.email;
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: AuthenticatedUser, requiredRole: string | string[]): boolean {
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(user.role) || user.isAdmin;
  }
  return user.role === requiredRole || user.isAdmin;
}

/**
 * Check if user can access a specific resource
 */
export function canAccessResource(user: AuthenticatedUser, resourceOwnerId: string): boolean {
  // Admin can access everything
  if (user.isAdmin) {
    return true;
  }
  
  // Users can access their own resources
  if (user.sub === resourceOwnerId) {
    return true;
  }
  
  // Instructors can access their students' resources
  if (user.isInstructor && user.role === 'instructor') {
    // This would need additional logic to check student-instructor relationship
    return false;
  }
  
  return false;
}

/**
 * Check if user can perform action on resource
 */
export function canPerformAction(
  user: AuthenticatedUser,
  action: 'view' | 'edit' | 'delete',
  resourceOwnerId?: string,
  requiredRole?: string | string[]
): boolean {
  // Admin can do everything
  if (user.isAdmin) {
    return true;
  }
  
  // Check role requirements
  if (requiredRole && !hasRole(user, requiredRole)) {
    return false;
  }
  
  // Check resource ownership for edit/delete actions
  if ((action === 'edit' || action === 'delete') && resourceOwnerId) {
    return canAccessResource(user, resourceOwnerId);
  }
  
  return true;
}

/**
 * Get user's department access level
 */
export function getUserDepartmentAccess(user: AuthenticatedUser): {
  canViewDepartment: boolean;
  canEditDepartment: boolean;
  canViewOtherDepartments: boolean;
} {
  if (user.isAdmin) {
    return {
      canViewDepartment: true,
      canEditDepartment: true,
      canViewOtherDepartments: true
    };
  }
  
  if (user.isInstructor) {
    return {
      canViewDepartment: true,
      canEditDepartment: true,
      canViewOtherDepartments: false
    };
  }
  
  return {
    canViewDepartment: true,
    canEditDepartment: false,
    canViewOtherDepartments: false
  };
}

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

/**
 * Create a standardized API response
 */
export function createApiResponse<T>(
  data: T,
  user: AuthenticatedUser,
  statusCode: number = 200,
  message?: string
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
      message,
      user: {
        userId: user.sub,
        role: user.role,
        department: user.department,
        displayName: getUserDisplayName(user)
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

/**
 * Create an error response with user context
 */
export function createErrorResponse(
  error: string,
  user: AuthenticatedUser,
  statusCode: number = 400,
  details?: any
): {
  statusCode: number;
  body: string;
  headers: Record<string, string>;
} {
  return {
    statusCode,
    body: JSON.stringify({
      success: false,
      error,
      details,
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
