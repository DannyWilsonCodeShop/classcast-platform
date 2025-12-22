// ============================================================================
// DEMO MODE UTILITIES
// ============================================================================

import { User } from '@/lib/api';

export interface DemoModeConfig {
  isDemoUser: boolean;
  targetUserId?: string;
  targetUserEmail?: string;
  readOnlyMode: boolean;
}

/**
 * Check if the current user is a demo user
 */
export function isDemoUser(user: User | null): boolean {
  return user?.isDemoUser === true;
}

/**
 * Get the target user ID that the demo user should view
 */
export function getDemoTargetUserId(user: User | null): string | null {
  if (!isDemoUser(user)) return null;
  return user?.demoViewingUserId || null;
}

/**
 * Get demo mode configuration from user
 */
export function getDemoModeConfig(user: User | null): DemoModeConfig {
  const isDemo = isDemoUser(user);
  return {
    isDemoUser: isDemo,
    targetUserId: isDemo ? getDemoTargetUserId(user) : undefined,
    targetUserEmail: isDemo ? user?.demoViewingUserId : undefined,
    readOnlyMode: isDemo,
  };
}

/**
 * Transform API request to use demo target user if applicable
 */
export function transformApiRequestForDemo(
  url: string, 
  user: User | null
): string {
  if (!isDemoUser(user)) return url;
  
  const targetUserId = getDemoTargetUserId(user);
  if (!targetUserId) return url;

  // Transform common API patterns
  const urlObj = new URL(url, 'http://localhost');
  
  // Replace userId parameter
  if (urlObj.searchParams.has('userId')) {
    urlObj.searchParams.set('userId', targetUserId);
  }
  
  // Replace studentId parameter
  if (urlObj.searchParams.has('studentId')) {
    urlObj.searchParams.set('studentId', targetUserId);
  }

  return urlObj.pathname + urlObj.search;
}

/**
 * Check if an action should be blocked in demo mode
 */
export function isActionBlockedInDemo(
  action: string, 
  user: User | null
): boolean {
  if (!isDemoUser(user)) return false;

  const blockedActions = [
    'create',
    'update', 
    'delete',
    'submit',
    'upload',
    'post',
    'edit',
    'grade',
    'approve',
    'reject',
    'publish',
    'unpublish',
    'archive',
    'restore',
    'invite',
    'remove',
    'assign',
    'unassign'
  ];

  return blockedActions.some(blocked => 
    action.toLowerCase().includes(blocked)
  );
}

/**
 * Get demo mode display information
 */
export function getDemoModeDisplay(user: User | null) {
  if (!isDemoUser(user)) return null;

  const targetEmail = getDemoTargetUserId(user);
  return {
    message: `Demo Mode: Viewing ${targetEmail}'s account`,
    targetEmail,
    isReadOnly: true,
    bannerColor: 'bg-blue-100 border-blue-500 text-blue-800',
  };
}

/**
 * Validate demo mode permissions for API endpoints
 */
export function validateDemoPermissions(
  method: string,
  user: User | null
): { allowed: boolean; reason?: string } {
  if (!isDemoUser(user)) {
    return { allowed: true };
  }

  // Only allow GET requests in demo mode
  if (method.toUpperCase() !== 'GET') {
    return { 
      allowed: false, 
      reason: 'Demo users can only view data, not modify it' 
    };
  }

  return { allowed: true };
}

/**
 * Get the actual user ID to use for data queries
 * Returns target user ID for demo users, original user ID otherwise
 */
export function getEffectiveUserId(user: User | null): string | null {
  if (isDemoUser(user)) {
    return getDemoTargetUserId(user);
  }
  return user?.id || null;
}

/**
 * Check if demo user has access to view specific user's data
 */
export function canDemoUserViewUser(
  demoUser: User | null, 
  targetUserId: string
): boolean {
  if (!isDemoUser(demoUser)) return false;
  
  const allowedTargetId = getDemoTargetUserId(demoUser);
  return allowedTargetId === targetUserId;
}