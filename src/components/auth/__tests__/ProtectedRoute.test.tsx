import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ProtectedRoute, StudentRoute, InstructorRoute, AdminRoute, InstructorOrAdminRoute, AnyAuthenticatedRoute } from '../ProtectedRoute';
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

// Test component to render inside protected routes
const TestComponent: React.FC = () => (
  <div data-testid="protected-content">
    <h1>Protected Content</h1>
    <p>This content should only be visible to authorized users.</p>
  </div>
);

const renderWithAuth = (component: React.ReactElement, authState: any) => {
  (useAuth as jest.Mock).mockReturnValue(authState);
  return render(component);
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner while checking authentication', () => {
      renderWithAuth(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>,
        { isLoading: true, isAuthenticated: false, user: null }
      );

      expect(screen.getByTestId('loading')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should show custom fallback while loading', () => {
      const customFallback = <div data-testid="custom-loading">Custom Loading...</div>;
      
      renderWithAuth(
        <ProtectedRoute fallback={customFallback}>
          <TestComponent />
        </ProtectedRoute>,
        { isLoading: true, isAuthenticated: false, user: null }
      );

      expect(screen.getByTestId('custom-loading')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Unauthenticated Users', () => {
    it('should redirect unauthenticated users to login', async () => {
      renderWithAuth(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>,
        { isLoading: false, isAuthenticated: false, user: null }
      );

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/auth/login');
      });

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should redirect to custom path when specified', async () => {
      renderWithAuth(
        <ProtectedRoute redirectTo="/custom-login">
          <TestComponent />
        </ProtectedRoute>,
        { isLoading: false, isAuthenticated: false, user: null }
      );

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/custom-login');
      });
    });

    it('should show fallback while redirecting', () => {
      const customFallback = <div data-testid="redirecting">Redirecting...</div>;
      
      renderWithAuth(
        <ProtectedRoute fallback={customFallback}>
          <TestComponent />
        </ProtectedRoute>,
        { isLoading: false, isAuthenticated: false, user: null }
      );

      expect(screen.getByTestId('redirecting')).toBeInTheDocument();
    });
  });

  describe('Role-Based Access Control', () => {
    it('should allow access when user has required role', () => {
      renderWithAuth(
        <ProtectedRoute requiredRole="student">
          <TestComponent />
        </ProtectedRoute>,
        { 
          isLoading: false, 
          isAuthenticated: true, 
          user: { role: 'student' } 
        }
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should redirect when user does not have required role', async () => {
      renderWithAuth(
        <ProtectedRoute requiredRole="instructor">
          <TestComponent />
        </ProtectedRoute>,
        { 
          isLoading: false, 
          isAuthenticated: true, 
          user: { role: 'student' } 
        }
      );

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/student/dashboard');
      });

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should allow access when user has one of allowed roles', () => {
      renderWithAuth(
        <ProtectedRoute allowedRoles={['instructor', 'admin']}>
          <TestComponent />
        </ProtectedRoute>,
        { 
          isLoading: false, 
          isAuthenticated: true, 
          user: { role: 'instructor' } 
        }
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should redirect when user does not have any of allowed roles', async () => {
      renderWithAuth(
        <ProtectedRoute allowedRoles={['instructor', 'admin']}>
          <TestComponent />
        </ProtectedRoute>,
        { 
          isLoading: false, 
          isAuthenticated: true, 
          user: { role: 'student' } 
        }
      );

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/student/dashboard');
      });

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Role-Specific Redirects', () => {
    it('should redirect students to student dashboard', async () => {
      renderWithAuth(
        <ProtectedRoute requiredRole="instructor">
          <TestComponent />
        </ProtectedRoute>,
        { 
          isLoading: false, 
          isAuthenticated: true, 
          user: { role: 'student' } 
        }
      );

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/student/dashboard');
      });
    });

    it('should redirect instructors to instructor dashboard', async () => {
      renderWithAuth(
        <ProtectedRoute requiredRole="admin">
          <TestComponent />
        </ProtectedRoute>,
        { 
          isLoading: false, 
          isAuthenticated: true, 
          user: { role: 'instructor' } 
        }
      );

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/instructor/dashboard');
      });
    });

    it('should redirect admins to admin dashboard', async () => {
      renderWithAuth(
        <ProtectedRoute requiredRole="student">
          <TestComponent />
        </ProtectedRoute>,
        { 
          isLoading: false, 
          isAuthenticated: true, 
          user: { role: 'admin' } 
        }
      );

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/admin/dashboard');
      });
    });
  });

  describe('Convenience Components', () => {
    describe('StudentRoute', () => {
      it('should allow student access', () => {
        renderWithAuth(
          <StudentRoute>
            <TestComponent />
          </StudentRoute>,
          { 
            isLoading: false, 
            isAuthenticated: true, 
            user: { role: 'student' } 
          }
        );

        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });

      it('should redirect non-students', async () => {
        renderWithAuth(
          <StudentRoute>
            <TestComponent />
          </StudentRoute>,
          { 
            isLoading: false, 
            isAuthenticated: true, 
            user: { role: 'instructor' } 
          }
        );

        await waitFor(() => {
          expect(mockRouter.push).toHaveBeenCalledWith('/instructor/dashboard');
        });
      });
    });

    describe('InstructorRoute', () => {
      it('should allow instructor access', () => {
        renderWithAuth(
          <InstructorRoute>
            <TestComponent />
          </InstructorRoute>,
          { 
            isLoading: false, 
            isAuthenticated: true, 
            user: { role: 'instructor' } 
          }
        );

        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });

      it('should redirect non-instructors', async () => {
        renderWithAuth(
          <InstructorRoute>
            <TestComponent />
          </InstructorRoute>,
          { 
            isLoading: false, 
            isAuthenticated: true, 
            user: { role: 'student' } 
          }
        );

        await waitFor(() => {
          expect(mockRouter.push).toHaveBeenCalledWith('/student/dashboard');
        });
      });
    });

    describe('AdminRoute', () => {
      it('should allow admin access', () => {
        renderWithAuth(
          <AdminRoute>
            <TestComponent />
          </AdminRoute>,
          { 
            isLoading: false, 
            isAuthenticated: true, 
            user: { role: 'admin' } 
          }
        );

        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });

      it('should redirect non-admins', async () => {
        renderWithAuth(
          <AdminRoute>
            <TestComponent />
          </AdminRoute>,
          { 
            isLoading: false, 
            isAuthenticated: true, 
            user: { role: 'instructor' } 
          }
        );

        await waitFor(() => {
          expect(mockRouter.push).toHaveBeenCalledWith('/instructor/dashboard');
        });
      });
    });

    describe('InstructorOrAdminRoute', () => {
      it('should allow instructor access', () => {
        renderWithAuth(
          <InstructorOrAdminRoute>
            <TestComponent />
          </InstructorOrAdminRoute>,
          { 
            isLoading: false, 
            isAuthenticated: true, 
            user: { role: 'instructor' } 
          }
        );

        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });

      it('should allow admin access', () => {
        renderWithAuth(
          <InstructorOrAdminRoute>
            <TestComponent />
          </InstructorOrAdminRoute>,
          { 
            isLoading: false, 
            isAuthenticated: true, 
            user: { role: 'admin' } 
          }
        );

        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });

      it('should redirect students', async () => {
        renderWithAuth(
          <InstructorOrAdminRoute>
            <TestComponent />
          </InstructorOrAdminRoute>,
          { 
            isLoading: false, 
            isAuthenticated: true, 
            user: { role: 'student' } 
          }
        );

        await waitFor(() => {
          expect(mockRouter.push).toHaveBeenCalledWith('/student/dashboard');
        });
      });
    });

    describe('AnyAuthenticatedRoute', () => {
      it('should allow any authenticated user', () => {
        renderWithAuth(
          <AnyAuthenticatedRoute>
            <TestComponent />
          </AnyAuthenticatedRoute>,
          { 
            isLoading: false, 
            isAuthenticated: true, 
            user: { role: 'student' } 
          }
        );

        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });

      it('should allow students', () => {
        renderWithAuth(
          <AnyAuthenticatedRoute>
            <TestComponent />
          </AnyAuthenticatedRoute>,
          { 
            isLoading: false, 
            isAuthenticated: true, 
            user: { role: 'student' } 
          }
        );

        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });

      it('should allow instructors', () => {
        renderWithAuth(
          <AnyAuthenticatedRoute>
            <TestComponent />
          </AnyAuthenticatedRoute>,
          { 
            isLoading: false, 
            isAuthenticated: true, 
            user: { role: 'instructor' } 
          }
        );

        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });

      it('should allow admins', () => {
        renderWithAuth(
          <AnyAuthenticatedRoute>
            <TestComponent />
          </AnyAuthenticatedRoute>,
          { 
            isLoading: false, 
            isAuthenticated: true, 
            user: { role: 'admin' } 
          }
        );

        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined user gracefully', async () => {
      renderWithAuth(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>,
        { 
          isLoading: false, 
          isAuthenticated: true, 
          user: undefined 
        }
      );

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/auth/login');
      });
    });

    it('should handle missing role gracefully', async () => {
      renderWithAuth(
        <ProtectedRoute requiredRole="student">
          <TestComponent />
        </ProtectedRoute>,
        { 
          isLoading: false, 
          isAuthenticated: true, 
          user: { role: undefined } 
        }
      );

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/auth/login');
      });
    });
  });
});






