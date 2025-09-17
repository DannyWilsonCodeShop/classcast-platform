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
  sessionExpiresAt?: number; // Unix timestamp
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

// Session TTL constants (in milliseconds)
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours
const REFRESH_THRESHOLD = 30 * 60 * 1000; // 30 minutes before expiry
const MAX_IDLE_TIME = 2 * 60 * 60 * 1000; // 2 hours of inactivity

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
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  // Session management functions
  const isSessionExpired = useCallback((user: User | null): boolean => {
    if (!user?.sessionExpiresAt) return false;
    return Date.now() > user.sessionExpiresAt;
  }, []);

  const isIdleTimeout = useCallback((): boolean => {
    return Date.now() - lastActivity > MAX_IDLE_TIME;
  }, [lastActivity]);

  const shouldRefreshSession = useCallback((user: User | null): boolean => {
    if (!user?.sessionExpiresAt) return false;
    const timeUntilExpiry = user.sessionExpiresAt - Date.now();
    return timeUntilExpiry < REFRESH_THRESHOLD;
  }, []);

  const createSessionExpiry = useCallback((): number => {
    return Date.now() + SESSION_DURATION;
  }, []);

  const updateLastActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  // Activity tracking
  useEffect(() => {
    const handleActivity = () => {
      updateLastActivity();
    };

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [updateLastActivity]);

  // Session monitoring
  useEffect(() => {
    if (!authState.isAuthenticated || !authState.user) return;

    const sessionCheckInterval = setInterval(() => {
      if (isSessionExpired(authState.user) || isIdleTimeout()) {
        console.log('Session expired, logging out');
        logout();
      } else if (shouldRefreshSession(authState.user)) {
        console.log('Refreshing session');
        const updatedUser = {
          ...authState.user,
          sessionExpiresAt: createSessionExpiry()
        };
        const updatedState = {
          user: updatedUser,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        };
        setAuthState(updatedState);
        localStorage.setItem('authState', JSON.stringify(updatedState));
      }
    }, 60000); // Check every minute

    return () => clearInterval(sessionCheckInterval);
  }, [authState.isAuthenticated, authState.user, isSessionExpired, isIdleTimeout, shouldRefreshSession, createSessionExpiry, logout]);

  // Check if user is authenticated on mount
  const checkAuthStatus = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Check localStorage for persisted auth state
      const storedAuthState = localStorage.getItem('authState');
      if (storedAuthState) {
        try {
          const parsedState = JSON.parse(storedAuthState);
          if (parsedState.user && parsedState.isAuthenticated) {
            // Check if session is expired
            if (isSessionExpired(parsedState.user) || isIdleTimeout()) {
              console.log('Session expired or idle timeout reached');
              localStorage.removeItem('authState');
              setAuthState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: 'Session expired. Please log in again.',
              });
              return;
            }

            // Check if session needs refresh
            if (shouldRefreshSession(parsedState.user)) {
              console.log('Session needs refresh');
              // Update session expiry
              const updatedUser = {
                ...parsedState.user,
                sessionExpiresAt: createSessionExpiry()
              };
              const updatedState = {
                user: updatedUser,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              };
              setAuthState(updatedState);
              localStorage.setItem('authState', JSON.stringify(updatedState));
              return;
            }

            setAuthState({
              user: parsedState.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return;
          }
        } catch (parseError) {
          console.error('Error parsing stored auth state:', parseError);
          localStorage.removeItem('authState');
        }
      }
      
      // No valid stored state, set as not authenticated
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
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
      // Add session expiry to user data
      const userWithSession = {
        ...userData.user,
        sessionExpiresAt: createSessionExpiry()
      };

      setAuthState({
        user: userWithSession,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      // Persist auth state to localStorage
      localStorage.setItem('authState', JSON.stringify({
        user: userWithSession,
        isAuthenticated: true,
      }));

      // Redirect to main dashboard for all users
      router.push('/dashboard');
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
      console.log('AuthContext: Starting signup process for:', userData);
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      console.log('AuthContext: Signup API response status:', response.status);

      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Signup failed');
        } catch (jsonError) {
          throw new Error('Signup failed - invalid server response');
        }
      }

      // Set authenticated state for mock service (no email verification needed)
      const newUser = {
        id: userData.email, // Use email as ID for mock service
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        studentId: userData.studentId,
        instructorId: userData.instructorId,
        department: userData.department,
        emailVerified: true, // Mock service users are pre-verified
      };

      console.log('AuthContext: Setting user state:', newUser);

      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
        user: newUser,
        isAuthenticated: true,
      }));

      // Persist auth state to localStorage
      localStorage.setItem('authState', JSON.stringify({
        user: newUser,
        isAuthenticated: true,
      }));

      console.log('AuthContext: Signup completed successfully');

      // Don't redirect here - let the SignupForm handle the redirect
      // This prevents conflicts between AuthContext and SignupForm redirects
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

      // Clear auth state from localStorage
      localStorage.removeItem('authState');

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

