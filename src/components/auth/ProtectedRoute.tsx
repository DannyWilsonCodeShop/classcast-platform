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
      // Admin users have instructor access
      if (user.role === 'admin' && requiredRole === 'instructor') {
        // Allow admin to access instructor routes
      } else if (user.role === 'admin' || user.role === 'instructor') {
        router.push('/instructor/dashboard');
      } else {
        router.push('/student/dashboard');
      }
      if (!(user.role === 'admin' && requiredRole === 'instructor')) return;
    }

    // Check if user has one of the allowed roles
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Admin has access to instructor routes
      if (user.role === 'admin' && allowedRoles.includes('instructor')) {
        // Allow
      } else if (user.role === 'admin' || user.role === 'instructor') {
        router.push('/instructor/dashboard');
      } else {
        router.push('/student/dashboard');
      }
      if (!(user.role === 'admin' && allowedRoles.includes('instructor'))) return;
    }
  }, [isAuthenticated, user, isLoading, requiredRole, allowedRoles, redirectTo, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#005587] border-t-transparent"></div>
      </div>
    );
  }

  // Show fallback while redirecting
  if (!isAuthenticated || !user) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#005587] border-t-transparent mx-auto mb-4"></div>
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
  <div data-student-page="">
    <ProtectedRoute {...props} requiredRole="student" />
  </div>
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

