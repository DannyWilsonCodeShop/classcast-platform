'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api, User, LoginRequest } from '@/lib/api';

// ============================================================================
// TYPES
// ============================================================================

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  checkAuthStatus: () => Promise<void>;
  clearError: () => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // ============================================================================
  // AUTH FUNCTIONS
  // ============================================================================

  const checkAuthStatus = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if we have a stored user and valid token
      const storedUser = api.getCurrentUser();
      const isAuthenticated = api.isAuthenticated();
      
      if (storedUser && isAuthenticated) {
        setUser(storedUser);
      } else {
        // Clear invalid data
        api.clearCurrentUser();
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setUser(null);
      api.clearCurrentUser();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const credentials: LoginRequest = { email, password };
      const response = await api.login(credentials);
      
      // Load full user profile from database
      try {
        const profileResponse = await fetch(`/api/profile?userId=${response.user.id}`, {
          credentials: 'include'
        });
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (profileData.success) {
            // Merge profile data with login response, ensuring role is preserved
            const fullUser = {
              ...response.user,
              ...profileData.data,
              // Ensure role is set from profile data if not in login response
              role: profileData.data.role || response.user.role || 'student' // Fallback to student if no role found
            };
            
            console.log('Login response user:', response.user);
            console.log('Profile data:', profileData.data);
            console.log('Full user data after profile merge:', fullUser);
            console.log('Final role:', fullUser.role);
            
            // Store full user data
            console.log('Setting user with role:', fullUser.role);
            api.setCurrentUser(fullUser);
            setUser(fullUser);
          } else {
            // Fallback to basic user data if profile load fails
            console.log('Profile load failed, using basic user data:', response.user);
            const userWithRole = {
              ...response.user,
              role: response.user.role || 'student' // Fallback to student if no role found
            };
            console.log('Setting fallback user with role:', userWithRole.role);
            api.setCurrentUser(userWithRole);
            setUser(userWithRole);
          }
        } else {
          // Fallback to basic user data if profile load fails
          const userWithRole = {
            ...response.user,
            role: response.user.role || 'student' // Fallback to student if no role found
          };
          console.log('Setting profile-failed user with role:', userWithRole.role);
          api.setCurrentUser(userWithRole);
          setUser(userWithRole);
        }
      } catch (profileError) {
        console.warn('Failed to load user profile, using basic data:', profileError);
        // Fallback to basic user data if profile load fails
        const userWithRole = {
          ...response.user,
          role: response.user.role || 'student' // Fallback to student if no role found
        };
        console.log('Setting catch-block user with role:', userWithRole.role);
        api.setCurrentUser(userWithRole);
        setUser(userWithRole);
      }
      
      // Redirect based on user role
      if (response.user.role === 'student') {
        router.push('/student/dashboard');
      } else if (response.user.role === 'instructor') {
        router.push('/instructor/dashboard');
      } else if (response.user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      api.clearCurrentUser();
      router.push('/auth/login');
    }
  };

  const updateUser = (userData: Partial<User>): void => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      api.setCurrentUser(updatedUser);
    }
  };

  const clearError = (): void => {
    setError(null);
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    login,
    logout,
    updateUser,
    checkAuthStatus,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ============================================================================
// EXPORT USER TYPE FOR COMPATIBILITY
// ============================================================================

export type { User };