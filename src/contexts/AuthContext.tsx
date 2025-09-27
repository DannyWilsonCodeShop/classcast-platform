'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { EmailConfirmationModal } from '@/components/auth/EmailConfirmationModal';

export interface User {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: 'student' | 'instructor' | 'admin';
  instructorId?: string;
  department?: string;
  emailVerified?: boolean;
  sessionExpiresAt?: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  showEmailConfirmation: boolean;
  confirmationEmail: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  checkAuthStatus: () => Promise<void>;
  closeEmailConfirmation: () => void;
  updateUser: (userData: Partial<User>) => void;
}

interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'instructor' | 'admin';
  studentId?: string;
  instructorId?: string;
  department?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    showEmailConfirmation: false,
    confirmationEmail: null,
  });
  const router = useRouter();

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Use current domain for API calls
      const loginUrl = '/api/auth/login';
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('Login successful, userData:', userData);
        const newState = {
          user: userData.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          showEmailConfirmation: false,
          confirmationEmail: null,
        };
        console.log('Setting auth state:', newState);
        setAuthState(newState);
        localStorage.setItem('authState', JSON.stringify(newState));
        
        // Redirect based on user role
        console.log('User role:', userData.user.role);
        console.log('Current URL before redirect:', window.location.href);
        
        if (userData.user.role === 'student') {
          console.log('Redirecting to student dashboard');
          router.push('/student/dashboard');
        } else if (userData.user.role === 'instructor') {
          console.log('Redirecting to instructor dashboard');
          router.push('/instructor/dashboard');
        } else if (userData.user.role === 'admin') {
          console.log('Redirecting to admin dashboard');
          router.push('/admin/dashboard');
        } else {
          console.log('Redirecting to home page');
          router.push('/');
        }
        
        console.log('Redirect command sent, waiting for navigation...');
      } else {
        const errorData = await response.json();
        
        // Handle email verification error
        if (errorData.error?.code === 'EMAIL_NOT_VERIFIED') {
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
            error: null,
            showEmailConfirmation: true,
            confirmationEmail: errorData.error.email,
          }));
          // Store email for verification page
          localStorage.setItem('pendingVerificationEmail', errorData.error.email);
          router.push(`/verify-email?email=${encodeURIComponent(errorData.error.email)}`);
          return;
        }
        
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: errorData.error?.message || errorData.message || 'Login failed',
        }));
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Network error. Please try again.',
      }));
    }
  }, []);

  // Signup function
  const signup = useCallback(async (userData: SignupData) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Use current domain for API calls
      const signupUrl = '/api/auth/signup';
      
      const response = await fetch(signupUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const responseData = await response.json();
        
        // Check if user needs email verification
        if (responseData.requiresEmailConfirmation || responseData.needsVerification) {
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
            error: null,
            showEmailConfirmation: true,
            confirmationEmail: userData.email,
          }));
          // Store email for verification page
          localStorage.setItem('pendingVerificationEmail', userData.email);
          router.push(`/verify-email?email=${encodeURIComponent(userData.email)}`);
          return responseData;
        }
        
        // If no verification needed, proceed directly to login
        const newState = {
          user: responseData.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          showEmailConfirmation: false,
          confirmationEmail: null,
        };
        setAuthState(newState);
        localStorage.setItem('authState', JSON.stringify(newState));
        
        // Redirect based on user role
        if (responseData.user.role === 'student') {
          router.push('/student/dashboard');
        } else if (responseData.user.role === 'instructor') {
          router.push('/instructor/dashboard');
        } else if (responseData.user.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/');
        }
        
        // Return response data for SignupForm to handle
        return responseData;
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || errorData.message || 'Signup failed';
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        // Throw error so SignupForm can catch it
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error. Please try again.';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      // Re-throw error so SignupForm can catch it
      throw error;
    }
  }, [router]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        showEmailConfirmation: false,
        confirmationEmail: null,
      });

      localStorage.removeItem('authState');
      router.push('/auth/login');
    } catch (error) {
      console.error('Error during logout:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        showEmailConfirmation: false,
        confirmationEmail: null,
      });
      localStorage.removeItem('authState');
      router.push('/auth/login');
    }
  }, [router]);

  // Refresh token function
  const refreshToken = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        setAuthState(prev => ({
          ...prev,
          user: userData.user,
          isAuthenticated: true,
          error: null,
        }));
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Session expired. Please login again.',
          showEmailConfirmation: false,
          confirmationEmail: null,
        });
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Failed to refresh session. Please login again.',
        showEmailConfirmation: false,
        confirmationEmail: null,
      });
      router.push('/auth/login');
    }
  }, [router]);

  // Clear error function
  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  const closeEmailConfirmation = useCallback(() => {
    setAuthState(prev => ({ 
      ...prev, 
      showEmailConfirmation: false, 
      confirmationEmail: null 
    }));
    // Redirect to login page after closing the modal
    router.push('/auth/login');
  }, [router]);

  // Check auth status function
  const checkAuthStatus = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const storedAuthState = localStorage.getItem('authState');
      if (storedAuthState) {
        try {
          const parsedState = JSON.parse(storedAuthState);
          if (parsedState.user && parsedState.isAuthenticated) {
            setAuthState(parsedState);
          } else {
            setAuthState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
              showEmailConfirmation: false,
              confirmationEmail: null,
            });
          }
        } catch (parseError) {
          console.error('Error parsing stored auth state:', parseError);
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            showEmailConfirmation: false,
            confirmationEmail: null,
          });
        }
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          showEmailConfirmation: false,
          confirmationEmail: null,
        });
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        showEmailConfirmation: false,
        confirmationEmail: null,
      });
    }
  }, []);

  // Check auth status on mount
  useEffect(() => {
    // Development mode: Set a mock user for testing
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      // Check if we're on instructor dashboard
      const isInstructorRoute = window.location.pathname.startsWith('/instructor');
      
      const mockUser: User = isInstructorRoute ? {
        id: 'dev-instructor-001',
        email: 'instructor@classcast.com',
        firstName: 'Dr. Sarah',
        lastName: 'Instructor',
        role: 'instructor',
        instructorId: 'inst-001',
        department: 'Computer Science',
        emailVerified: true,
        sessionExpiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      } : {
        id: 'dev-student-001',
        email: 'student@classcast.com',
        firstName: 'John',
        lastName: 'Student',
        role: 'student',
        emailVerified: true,
        sessionExpiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      };
      
      const mockAuthState: AuthState = {
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        showEmailConfirmation: false,
        confirmationEmail: null,
      };
      
      setAuthState(mockAuthState);
      localStorage.setItem('authState', JSON.stringify(mockAuthState));
      return;
    }
    
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Update user data
  const updateUser = useCallback((userData: Partial<User>) => {
    setAuthState(prev => {
      if (prev.user) {
        const updatedUser = { ...prev.user, ...userData };
        const newState = { ...prev, user: updatedUser };
        localStorage.setItem('authState', JSON.stringify(newState));
        return newState;
      }
      return prev;
    });
  }, []);

  const value: AuthContextType = {
    ...authState,
    login,
    signup,
    logout,
    refreshToken,
    clearError,
    checkAuthStatus,
    closeEmailConfirmation,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <EmailConfirmationModal
        isOpen={authState.showEmailConfirmation}
        email={authState.confirmationEmail || ''}
        onClose={closeEmailConfirmation}
      />
    </AuthContext.Provider>
  );
};

