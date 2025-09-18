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
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const userData = await response.json();
        const newState = {
          user: userData.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          showEmailConfirmation: false,
          confirmationEmail: null,
        };
        setAuthState(newState);
        localStorage.setItem('authState', JSON.stringify(newState));
        
        // Redirect based on user role
        if (userData.user.role === 'student') {
          router.push('/student/dashboard');
        } else if (userData.user.role === 'instructor') {
          router.push('/instructor/dashboard');
        } else if (userData.user.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/');
        }
      } else {
        const errorData = await response.json();
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: errorData.message || 'Login failed',
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
      
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const responseData = await response.json();
        
        // Skip email confirmation - proceed directly to login
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
    checkAuthStatus();
  }, [checkAuthStatus]);

  const value: AuthContextType = {
    ...authState,
    login,
    signup,
    logout,
    refreshToken,
    clearError,
    checkAuthStatus,
    closeEmailConfirmation,
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
