'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api, apiClient, User, LoginRequest } from '@/lib/api';

// ============================================================================
// TYPES
// ============================================================================

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface SignupData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: 'student' | 'instructor';
  studentId?: string;
  instructorId?: string;
  department?: string;
  instructorCode?: string;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (userData: SignupData) => Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }>;
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
        // Verify token is still valid
        const tokenValid = await api.ensureValidToken();
        if (tokenValid) {
          setUser(storedUser);
        } else {
          // Token is invalid, clear user data
          api.clearCurrentUser();
          setUser(null);
        }
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
      setIsLoading(false);
      // Throw the error so LoginForm can catch and display it
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: SignupData): Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/signup-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        let errorMessage = 'Signup failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || 'Signup failed';
        } catch (jsonError) {
          errorMessage = `Signup failed with status ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      if (result.success) {
        // Handle JWT-based signup response
        if (result.tokens) {
          // Store tokens in API client
          apiClient.setAccessToken(result.tokens.accessToken);
          if (typeof window !== 'undefined') {
            localStorage.setItem('refreshToken', result.tokens.refreshToken);
            localStorage.setItem('idToken', result.tokens.idToken);
          }
        }

        // Create user object from signup data
        const newUser: User = {
          id: result.user?.id || userData.email,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          emailVerified: true,
        };

        setUser(newUser);
        api.setCurrentUser(newUser);
        
        console.log('AuthContext: User created successfully, redirecting...', { role: userData.role });
        
        // Small delay to ensure state is set before redirect
        setTimeout(() => {
          // Redirect based on role
          if (newUser.role === 'student') {
            console.log('AuthContext: Redirecting student to dashboard');
            router.push('/student/dashboard');
          } else {
            console.log('AuthContext: Redirecting instructor to dashboard');
            router.push('/instructor/dashboard');
          }
        }, 100);
        
        return { success: true };
      } else {
        setError(result.error || 'Signup failed');
        return { success: false, error: result.error || 'Signup failed' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed';
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
    signup,
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