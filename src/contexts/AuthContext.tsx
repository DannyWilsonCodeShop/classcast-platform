'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'instructor' | 'admin';
  studentId?: string;
  instructorId?: string;
  department?: string;
  emailVerified: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  checkAuthStatus: () => Promise<void>;
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
  });

  const router = useRouter();

  // Check if user is authenticated on mount
  const checkAuthStatus = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (response.ok) {
        try {
          const userData = await response.json();
          setAuthState({
            user: userData.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (jsonError) {
          console.error('Error parsing JSON response:', jsonError);
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: 'Invalid response format from server',
          });
        }
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Failed to check authentication status',
      });
    }
  }, []);

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Login failed');
        } catch (jsonError) {
          throw new Error('Login failed - invalid server response');
        }
      }

      let userData;
      try {
        userData = await response.json();
      } catch (jsonError) {
        throw new Error('Login failed - invalid response format');
      }
      setAuthState({
        user: userData.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      // Redirect based on role
      if (userData.user.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (userData.user.role === 'instructor') {
        router.push('/instructor/dashboard');
      } else {
        router.push('/student/dashboard');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      // Don't throw error - let the UI handle it via the error state
    }
  }, [router]);

  // Signup function
  const signup = useCallback(async (userData: SignupData) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Signup failed');
        } catch (jsonError) {
          throw new Error('Signup failed - invalid server response');
        }
      }

      // Don't set authenticated state yet - user needs to verify email
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
      }));

      // Redirect to email verification
      router.push(`/auth/verify?email=${encodeURIComponent(userData.email)}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      // Don't throw error - let the UI handle it via the error state
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
      });

      router.push('/auth/login');
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if logout fails, clear local state
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
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
        return true;
      } else {
        // Token refresh failed, redirect to login
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Session expired. Please login again.',
        });
        router.push('/auth/login');
        return false;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Failed to refresh session. Please login again.',
      });
      router.push('/auth/login');
      return false;
    }
  }, [router]);

  // Clear error function
  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  // Set up automatic token refresh
  useEffect(() => {
    if (!authState.isAuthenticated) return;

    // Refresh token every 50 minutes (tokens typically expire in 1 hour)
    const refreshInterval = setInterval(refreshToken, 50 * 60 * 1000);

    // Set up beforeunload event to refresh token when user is about to leave
    const handleBeforeUnload = () => {
      refreshToken();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [authState.isAuthenticated, refreshToken]);

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const contextValue: AuthContextType = {
    ...authState,
    login,
    signup,
    logout,
    refreshToken,
    clearError,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

