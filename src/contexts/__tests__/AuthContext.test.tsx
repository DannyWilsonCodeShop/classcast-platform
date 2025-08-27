import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../AuthContext';
import { useRouter } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

const mockRouter = {
  push: jest.fn(),
};

(useRouter as jest.Mock).mockReturnValue(mockRouter);

// Test component to access context
const TestComponent: React.FC = () => {
  const auth = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{auth.isLoading.toString()}</div>
      <div data-testid="authenticated">{auth.isAuthenticated.toString()}</div>
      <div data-testid="user-role">{auth.user?.role || 'none'}</div>
      <div data-testid="error">{auth.error || 'none'}</div>
      <button onClick={() => auth.login('test@example.com', 'password')}>
        Login
      </button>
      <button onClick={() => auth.logout()}>Logout</button>
      <button onClick={() => auth.signup({
        email: 'test@example.com',
        password: 'password',
        firstName: 'Test',
        lastName: 'User',
        role: 'student'
      })}>
        Signup
      </button>
      <button onClick={() => auth.refreshToken()}>Refresh</button>
      <button onClick={() => auth.clearError()}>Clear Error</button>
    </div>
  );
};

const renderWithAuth = (component: React.ReactElement) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Initial State', () => {
    it('should start with loading state', () => {
      renderWithAuth(<TestComponent />);
      
      expect(screen.getByTestId('loading')).toHaveTextContent('true');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('user-role')).toHaveTextContent('none');
      expect(screen.getByTestId('error')).toHaveTextContent('none');
    });

    it('should check auth status on mount', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      renderWithAuth(<TestComponent />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/me', {
          credentials: 'include',
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
    });
  });

  describe('Authentication Status Check', () => {
    it('should set authenticated state when user is valid', async () => {
      const mockUser = {
        sub: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'student' as const,
        emailVerified: true,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser }),
      });

      renderWithAuth(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
        expect(screen.getByTestId('user-role')).toHaveTextContent('student');
      });
    });

    it('should handle auth check errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      renderWithAuth(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
        expect(screen.getByTestId('error')).toHaveTextContent('Failed to check authentication status');
      });
    });
  });

  describe('Login Functionality', () => {
    it('should successfully login and redirect student', async () => {
      const mockUser = {
        sub: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'student' as const,
        emailVerified: true,
      };

      // Mock the initial auth check
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        })
        // Mock the login fetch call
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockUser }),
        });

      renderWithAuth(<TestComponent />);

      // Wait for initial auth check to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      const loginButton = screen.getByText('Login');
      await act(async () => {
        await userEvent.click(loginButton);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
        });
      });

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/student/dashboard');
      });
    });

    it('should redirect instructor to instructor dashboard', async () => {
      const mockUser = {
        sub: '123',
        email: 'instructor@example.com',
        firstName: 'Test',
        lastName: 'Instructor',
        role: 'instructor' as const,
        emailVerified: true,
      };

      // Mock the initial auth check
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        })
        // Mock the login fetch call
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockUser }),
        });

      renderWithAuth(<TestComponent />);

      // Wait for initial auth check to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      const loginButton = screen.getByText('Login');
      await act(async () => {
        await userEvent.click(loginButton);
      });

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/instructor/dashboard');
      });
    });

    it('should redirect admin to admin dashboard', async () => {
      const mockUser = {
        sub: '123',
        email: 'admin@example.com',
        firstName: 'Test',
        lastName: 'Admin',
        role: 'admin' as const,
        emailVerified: true,
      };

      // Mock the initial auth check
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        })
        // Mock the login fetch call
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockUser }),
        });

      renderWithAuth(<TestComponent />);

      // Wait for initial auth check to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      const loginButton = screen.getByText('Login');
      await act(async () => {
        await userEvent.click(loginButton);
      });

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/admin/dashboard');
      });
    });

    it('should handle login errors', async () => {
      // Mock the initial auth check
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        })
        // Mock the login fetch call with error
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ error: { message: 'Invalid credentials' } }),
        });

      renderWithAuth(<TestComponent />);

      // Wait for initial auth check to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      const loginButton = screen.getByText('Login');
      
      // Wrap the click in act to handle the async state updates
      await act(async () => {
        await userEvent.click(loginButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
      });
    });

    it('should handle network errors during login', async () => {
      // Mock the initial auth check
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        })
        // Mock the login fetch call with network error
        .mockRejectedValueOnce(new Error('Network error'));

      renderWithAuth(<TestComponent />);

      // Wait for initial auth check to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      const loginButton = screen.getByText('Login');
      
      // Wrap the click in act to handle the async state updates
      await act(async () => {
        await userEvent.click(loginButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Network error');
      });
    });
  });

  describe('Signup Functionality', () => {
    it('should successfully signup and redirect to verification', async () => {
      // Mock the initial auth check
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        })
        // Mock the signup fetch call
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'User created successfully' }),
        });

      renderWithAuth(<TestComponent />);

      // Wait for initial auth check to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      const signupButton = screen.getByText('Signup');
      await act(async () => {
        await userEvent.click(signupButton);
      });

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/auth/verify?email=test%40example.com');
      });
    });

    it('should handle signup errors', async () => {
      // Mock the initial auth check
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        })
        // Mock the signup fetch call with error
        .mockResolvedValueOnce({
          ok: false,
          status: 409,
          json: async () => ({ error: { message: 'Email already exists' } }),
        });

      renderWithAuth(<TestComponent />);

      // Wait for initial auth check to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      const signupButton = screen.getByText('Signup');
      
      // Wrap the click in act to handle the async state updates
      await act(async () => {
        await userEvent.click(signupButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Email already exists');
      });
    });
  });

  describe('Logout Functionality', () => {
    it('should successfully logout and redirect to login', async () => {
      // Mock the initial auth check
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        })
        // Mock the logout fetch call
        .mockResolvedValueOnce({
          ok: true,
        });

      renderWithAuth(<TestComponent />);

      // Wait for initial auth check to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      const logoutButton = screen.getByText('Logout');
      await act(async () => {
        await userEvent.click(logoutButton);
      });

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/auth/login');
      });
    });
  });

  describe('Error Handling', () => {
    it('should clear errors when clearError is called', async () => {
      // Mock the initial auth check
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        })
        // Mock the login fetch call with error
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ error: { message: 'Login failed' } }),
        });

      renderWithAuth(<TestComponent />);

      // Wait for initial auth check to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      const loginButton = screen.getByText('Login');
      
      // Wrap the click in act to handle the async state updates
      await act(async () => {
        await userEvent.click(loginButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Login failed');
      });

      // Then clear it
      const clearErrorButton = screen.getByText('Clear Error');
      await act(async () => {
        await userEvent.click(clearErrorButton);
      });

      expect(screen.getByTestId('error')).toHaveTextContent('none');
    });
  });
});
