import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useCallback } from 'react';

interface UseAuthGuardOptions {
  requiredRole?: 'student' | 'instructor' | 'admin';
  allowedRoles?: ('student' | 'instructor' | 'admin')[];
  redirectTo?: string;
  onUnauthorized?: () => void;
}

interface UseAuthGuardReturn {
  user: ReturnType<typeof useAuth>['user'];
  isAuthenticated: boolean;
  isLoading: boolean;
  hasRequiredRole: boolean;
  checkPermission: (action: string) => boolean;
  requireAuth: () => boolean;
  requireRole: (role: 'student' | 'instructor' | 'admin') => boolean;
}

export const useAuthGuard = (options: UseAuthGuardOptions = {}): UseAuthGuardReturn => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const {
    requiredRole,
    allowedRoles,
    redirectTo = '/auth/login',
    onUnauthorized,
  } = options;

  // Check if user has required role
  const hasRequiredRole = useCallback(() => {
    if (!user) return false;
    
    if (requiredRole) {
      return user.role === requiredRole;
    }
    
    if (allowedRoles) {
      return allowedRoles.includes(user.role);
    }
    
    return true; // No role requirements
  }, [user, requiredRole, allowedRoles]);

  // Check permission for specific action
  const checkPermission = useCallback((action: string): boolean => {
    if (!user) return false;

    // Admin has all permissions
    if (user.role === 'admin') return true;

    // Role-based permissions
    switch (action) {
      case 'create_assignment':
      case 'edit_assignment':
      case 'delete_assignment':
      case 'grade_submission':
      case 'view_all_submissions':
        return user.role === 'instructor';
      
      case 'submit_assignment':
      case 'view_own_submissions':
      case 'view_own_grades':
        return user.role === 'student';
      
      case 'view_instructor_feed':
      case 'bulk_grade':
        return user.role === 'instructor';
      
      case 'manage_users':
      case 'system_settings':
        return user.role === 'admin';
      
      default:
        return false;
    }
  }, [user]);

  // Require authentication
  const requireAuth = useCallback((): boolean => {
    if (!isAuthenticated || !user) {
      if (onUnauthorized) {
        onUnauthorized();
      } else {
        router.push(redirectTo);
      }
      return false;
    }
    return true;
  }, [isAuthenticated, user, onUnauthorized, redirectTo, router]);

  // Require specific role
  const requireRole = useCallback((role: 'student' | 'instructor' | 'admin'): boolean => {
    if (!requireAuth()) return false;
    
    if (user!.role !== role) {
      if (onUnauthorized) {
        onUnauthorized();
      } else {
        // Redirect to appropriate dashboard
        if (user!.role === 'admin') {
          router.push('/admin/dashboard');
        } else if (user!.role === 'instructor') {
          router.push('/instructor/dashboard');
        } else {
          router.push('/student/dashboard');
        }
      }
      return false;
    }
    
    return true;
  }, [user, requireAuth, onUnauthorized, router]);

  // Auto-redirect on mount if requirements not met
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      if (onUnauthorized) {
        onUnauthorized();
      } else {
        router.push(redirectTo);
      }
      return;
    }

    // Check role requirements
    if (requiredRole && user.role !== requiredRole) {
      if (onUnauthorized) {
        onUnauthorized();
      } else {
        // Redirect to appropriate dashboard
        if (user.role === 'admin') {
          router.push('/admin/dashboard');
        } else if (user.role === 'instructor') {
          router.push('/instructor/dashboard');
        } else {
          router.push('/student/dashboard');
        }
      }
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      if (onUnauthorized) {
        onUnauthorized();
      } else {
        // Redirect to appropriate dashboard
        if (user.role === 'admin') {
          router.push('/admin/dashboard');
        } else if (user.role === 'instructor') {
          router.push('/instructor/dashboard');
        } else {
          router.push('/student/dashboard');
        }
      }
      return;
    }
  }, [isLoading, isAuthenticated, user, requiredRole, allowedRoles, redirectTo, onUnauthorized, router]);

  return {
    user,
    isAuthenticated,
    isLoading,
    hasRequiredRole: hasRequiredRole(),
    checkPermission,
    requireAuth,
    requireRole,
  };
};

