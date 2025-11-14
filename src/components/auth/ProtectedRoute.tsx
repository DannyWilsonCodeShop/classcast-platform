'use client';

import React, { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'student' | 'instructor' | 'admin';
  allowedRoles?: ('student' | 'instructor' | 'admin')[];
  redirectTo?: string;
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  allowedRoles,
  redirectTo = '/auth/login',
  fallback,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Wait for auth check to complete

    if (!isAuthenticated || !user) {
      router.push(redirectTo);
      return;
    }

    // Check role-based access
    if (requiredRole && user.role !== requiredRole) {
      // Redirect to appropriate dashboard based on user's actual role
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (user.role === 'instructor') {
        router.push('/instructor/dashboard');
      } else {
        router.push('/student/dashboard');
      }
      return;
    }

    // Check if user has one of the allowed roles
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect to appropriate dashboard based on user's actual role
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (user.role === 'instructor') {
        router.push('/instructor/dashboard');
      } else {
        router.push('/student/dashboard');
      }
      return;
    }
  }, [isAuthenticated, user, isLoading, requiredRole, allowedRoles, redirectTo, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show fallback while redirecting
  if (!isAuthenticated || !user) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Check role-based access
  if (requiredRole && user.role !== requiredRole) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  // User is authenticated and has required role, render children
  return <>{children}</>;
};

// Convenience components for specific roles
export const StudentRoute: React.FC<Omit<ProtectedRouteProps, 'requiredRole' | 'allowedRoles'>> = (props) => (
  <ProtectedRoute {...props} requiredRole="student" />
);

export const InstructorRoute: React.FC<Omit<ProtectedRouteProps, 'requiredRole' | 'allowedRoles'>> = (props) => (
  <ProtectedRoute {...props} requiredRole="instructor" />
);

export const AdminRoute: React.FC<Omit<ProtectedRouteProps, 'requiredRole' | 'allowedRoles'>> = (props) => (
  <ProtectedRoute {...props} requiredRole="admin" />
);

export const InstructorOrAdminRoute: React.FC<Omit<ProtectedRouteProps, 'requiredRole' | 'allowedRoles'>> = (props) => (
  <ProtectedRoute {...props} allowedRoles={['instructor', 'admin']} />
);

export const AnyAuthenticatedRoute: React.FC<Omit<ProtectedRouteProps, 'requiredRole' | 'allowedRoles'>> = (props) => (
  <ProtectedRoute {...props} />
);

