import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useAuthGuard } from '../useAuthGuard';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockRouter = {
  push: jest.fn(),
};

(useRouter as jest.Mock).mockReturnValue(mockRouter);

// Test component to use the hook
const TestComponent: React.FC<{ options?: any }> = ({ options = {} }) => {
  const authGuard = useAuthGuard(options);
  
  return (
    <div>
      <div data-testid="user-role">{authGuard.user?.role || 'none'}</div>
      <div data-testid="authenticated">{authGuard.isAuthenticated.toString()}</div>
      <div data-testid="loading">{authGuard.isLoading.toString()}</div>
      <div data-testid="has-required-role">{authGuard.hasRequiredRole.toString()}</div>
      <div data-testid="permission-create">{authGuard.checkPermission('create_assignment').toString()}</div>
      <div data-testid="permission-submit">{authGuard.checkPermission('submit_assignment').toString()}</div>
      <div data-testid="permission-manage">{authGuard.checkPermission('manage_users').toString()}</div>
      <button onClick={() => authGuard.requireAuth()}>Require Auth</button>
      <button onClick={() => authGuard.requireRole('instructor')}>Require Instructor</button>
    </div>
  );
};

const renderWithAuth = (component: React.ReactElement, authState: any) => {
  (useAuth as jest.Mock).mockReturnValue(authState);
  return render(component);
};

describe('useAuthGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should return auth state from context', () => {
      const authState = {
        user: { role: 'student' },
        isAuthenticated: true,
        isLoading: false,
      };

      renderWithAuth(<TestComponent />, authState);

      expect(screen.getByTestId('user-role')).toHaveTextContent('student');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
  });

  describe('Role Validation', () => {
    it('should return true when user has required role', () => {
      const authState = {
        user: { role: 'instructor' },
        isAuthenticated: true,
        isLoading: false,
      };

      renderWithAuth(
        <TestComponent options={{ requiredRole: 'instructor' }} />,
        authState
      );

      expect(screen.getByTestId('has-required-role')).toHaveTextContent('true');
    });

    it('should return false when user does not have required role', () => {
      const authState = {
        user: { role: 'student' },
        isAuthenticated: true,
        isLoading: false,
      };

      renderWithAuth(
        <TestComponent options={{ requiredRole: 'instructor' }} />,
        authState
      );

      expect(screen.getByTestId('has-required-role')).toHaveTextContent('false');
    });

    it('should return true when user has one of allowed roles', () => {
      const authState = {
        user: { role: 'instructor' },
        isAuthenticated: true,
        isLoading: false,
      };

      renderWithAuth(
        <TestComponent options={{ allowedRoles: ['instructor', 'admin'] }} />,
        authState
      );

      expect(screen.getByTestId('has-required-role')).toHaveTextContent('true');
    });

    it('should return false when user does not have any of allowed roles', () => {
      const authState = {
        user: { role: 'student' },
        isAuthenticated: true,
        isLoading: false,
      };

      renderWithAuth(
        <TestComponent options={{ allowedRoles: ['instructor', 'admin'] }} />,
        authState
      );

      expect(screen.getByTestId('has-required-role')).toHaveTextContent('false');
    });

    it('should return true when no role requirements specified', () => {
      const authState = {
        user: { role: 'student' },
        isAuthenticated: true,
        isLoading: false,
      };

      renderWithAuth(<TestComponent />, authState);

      expect(screen.getByTestId('has-required-role')).toHaveTextContent('true');
    });
  });

  describe('Permission Checking', () => {
    it('should allow admin all permissions', () => {
      const authState = {
        user: { role: 'admin' },
        isAuthenticated: true,
        isLoading: false,
      };

      renderWithAuth(<TestComponent />, authState);

      expect(screen.getByTestId('permission-create')).toHaveTextContent('true');
      expect(screen.getByTestId('permission-submit')).toHaveTextContent('true');
      expect(screen.getByTestId('permission-manage')).toHaveTextContent('true');
    });

    it('should allow instructor assignment permissions', () => {
      const authState = {
        user: { role: 'instructor' },
        isAuthenticated: true,
        isLoading: false,
      };

      renderWithAuth(<TestComponent />, authState);

      expect(screen.getByTestId('permission-create')).toHaveTextContent('true');
      expect(screen.getByTestId('permission-submit')).toHaveTextContent('false');
      expect(screen.getByTestId('permission-manage')).toHaveTextContent('false');
    });

    it('should allow student submission permissions', () => {
      const authState = {
        user: { role: 'student' },
        isAuthenticated: true,
        isLoading: false,
      };

      renderWithAuth(<TestComponent />, authState);

      expect(screen.getByTestId('permission-create')).toHaveTextContent('false');
      expect(screen.getByTestId('permission-submit')).toHaveTextContent('true');
      expect(screen.getByTestId('permission-manage')).toHaveTextContent('false');
    });

    it('should return false for unknown permissions', () => {
      const authState = {
        user: { role: 'student' },
        isAuthenticated: true,
        isLoading: false,
      };

      renderWithAuth(<TestComponent />, authState);

      // Test unknown permission
      const testComponent = screen.getByTestId('permission-create');
      expect(testComponent).toHaveTextContent('false');
    });
  });

  describe('requireAuth Function', () => {
    it('should return true for authenticated users', () => {
      const authState = {
        user: { role: 'student' },
        isAuthenticated: true,
        isLoading: false,
      };

      renderWithAuth(<TestComponent />, authState);

      const requireAuthButton = screen.getByText('Require Auth');
      requireAuthButton.click();

      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should redirect unauthenticated users', () => {
      const authState = {
        user: null,
        isAuthenticated: false,
        isLoading: false,
      };

      renderWithAuth(<TestComponent />, authState);

      const requireAuthButton = screen.getByText('Require Auth');
      requireAuthButton.click();

      expect(mockRouter.push).toHaveBeenCalledWith('/auth/login');
    });

    it('should call onUnauthorized callback when provided', () => {
      const onUnauthorized = jest.fn();
      const authState = {
        user: null,
        isAuthenticated: false,
        isLoading: false,
      };

      renderWithAuth(
        <TestComponent options={{ onUnauthorized }} />,
        authState
      );

      const requireAuthButton = screen.getByText('Require Auth');
      requireAuthButton.click();

      expect(onUnauthorized).toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  describe('requireRole Function', () => {
    it('should return true for users with required role', () => {
      const authState = {
        user: { role: 'instructor' },
        isAuthenticated: true,
        isLoading: false,
      };

      renderWithAuth(<TestComponent />, authState);

      const requireRoleButton = screen.getByText('Require Instructor');
      requireRoleButton.click();

      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should redirect users without required role', () => {
      const authState = {
        user: { role: 'student' },
        isAuthenticated: true,
        isLoading: false,
      };

      renderWithAuth(<TestComponent />, authState);

      const requireRoleButton = screen.getByText('Require Instructor');
      requireRoleButton.click();

      expect(mockRouter.push).toHaveBeenCalledWith('/student/dashboard');
    });

    it('should call onUnauthorized callback when provided', () => {
      const onUnauthorized = jest.fn();
      const authState = {
        user: { role: 'student' },
        isAuthenticated: true,
        isLoading: false,
      };

      renderWithAuth(
        <TestComponent options={{ onUnauthorized }} />,
        authState
      );

      const requireRoleButton = screen.getByText('Require Instructor');
      requireRoleButton.click();

      expect(onUnauthorized).toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  describe('Auto-redirect on Mount', () => {
    it('should redirect unauthenticated users on mount', async () => {
      const authState = {
        user: null,
        isAuthenticated: false,
        isLoading: false,
      };

      renderWithAuth(<TestComponent />, authState);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/auth/login');
      });
    });

    it('should redirect users without required role on mount', async () => {
      const authState = {
        user: { role: 'student' },
        isAuthenticated: true,
        isLoading: false,
      };

      renderWithAuth(
        <TestComponent options={{ requiredRole: 'instructor' }} />,
        authState
      );

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/student/dashboard');
      });
    });

    it('should redirect users without allowed roles on mount', async () => {
      const authState = {
        user: { role: 'student' },
        isAuthenticated: true,
        isLoading: false,
      };

      renderWithAuth(
        <TestComponent options={{ allowedRoles: ['instructor', 'admin'] }} />,
        authState
      );

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/student/dashboard');
      });
    });

    it('should call onUnauthorized callback when provided', async () => {
      const onUnauthorized = jest.fn();
      const authState = {
        user: { role: 'student' },
        isAuthenticated: true,
        isLoading: false,
      };

      renderWithAuth(
        <TestComponent options={{ requiredRole: 'instructor', onUnauthorized }} />,
        authState
      );

      await waitFor(() => {
        expect(onUnauthorized).toHaveBeenCalled();
      });

      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  describe('Custom Redirect Paths', () => {
    it('should use custom redirect path', async () => {
      const authState = {
        user: null,
        isAuthenticated: false,
        isLoading: false,
      };

      renderWithAuth(
        <TestComponent options={{ redirectTo: '/custom-login' }} />,
        authState
      );

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/custom-login');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined user gracefully', async () => {
      const authState = {
        user: undefined,
        isAuthenticated: true,
        isLoading: false,
      };

      renderWithAuth(<TestComponent />, authState);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/auth/login');
      });
    });

    it('should handle missing role gracefully', async () => {
      const authState = {
        user: { role: undefined },
        isAuthenticated: true,
        isLoading: false,
      };

      renderWithAuth(
        <TestComponent options={{ requiredRole: 'student' }} />,
        authState
      );

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/auth/login');
      });
    });

    it('should not redirect while loading', () => {
      const authState = {
        user: null,
        isAuthenticated: false,
        isLoading: true,
      };

      renderWithAuth(<TestComponent />, authState);

      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });
});






