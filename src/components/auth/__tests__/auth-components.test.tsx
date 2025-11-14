import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock components
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Import components
import LoginForm from '../LoginForm';
import SignupForm from '../SignupForm';
import ForgotPasswordForm from '../ForgotPasswordForm';
import ResetPasswordForm from '../ResetPasswordForm';
import EmailVerificationForm from '../EmailVerificationForm';
import AuthContainer from '../AuthContainer';

describe('Authentication Components', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default router mock
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    } as any);
    
    // Setup default search params mock
    mockUseSearchParams.mockReturnValue({
      get: jest.fn(),
      has: jest.fn(),
      forEach: jest.fn(),
      entries: jest.fn(),
      keys: jest.fn(),
      values: jest.fn(),
      toString: jest.fn(),
    } as any);
    
    // Setup default fetch mock
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Success' }),
    } as any);
  });

  describe('LoginForm', () => {
    it('renders login form correctly', () => {
      render(<LoginForm />);
      
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    });

    it('validates required fields', async () => {
      render(<LoginForm />);
      
      const form = document.querySelector('form');
      if (form) {
        fireEvent.submit(form);
      }
      
      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
    });

    it('validates email format', async () => {
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('Email Address');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      
      const form = document.querySelector('form');
      if (form) {
        fireEvent.submit(form);
      }
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    it('validates password length', async () => {
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('Email Address');
      const passwordInput = screen.getByLabelText('Password');
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: '123' } });
      
      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument();
      });
    });

    it('submits form with valid data', async () => {
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('Email Address');
      const passwordInput = screen.getByLabelText('Password');
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      
      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'Password123!',
          }),
        });
      });
    });

    it('handles API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid credentials' }),
      } as any);
      
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('Email Address');
      const passwordInput = screen.getByLabelText('Password');
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      
      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });

    it('toggles password visibility', () => {
      render(<LoginForm />);
      
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
      const toggleButton = screen.getByRole('button', { name: '' }); // Password toggle button
      
      expect(passwordInput.type).toBe('password');
      
      fireEvent.click(toggleButton);
      expect(passwordInput.type).toBe('text');
      
      fireEvent.click(toggleButton);
      expect(passwordInput.type).toBe('password');
    });
  });

  describe('SignupForm', () => {
    it('renders signup form correctly', () => {
      render(<SignupForm />);
      
      expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
      expect(screen.getByLabelText('I am a...')).toBeInTheDocument();
      expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Student ID')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    });

    it('shows student-specific fields when student role is selected', () => {
      render(<SignupForm />);
      
      const roleSelect = screen.getByLabelText('I am a...');
      fireEvent.change(roleSelect, { target: { value: 'student' } });
      
      expect(screen.getByLabelText('Student ID')).toBeInTheDocument();
    });

    it('shows instructor-specific fields when instructor role is selected', () => {
      render(<SignupForm />);
      
      const roleSelect = screen.getByLabelText('I am a...');
      fireEvent.change(roleSelect, { target: { value: 'instructor' } });
      
      expect(screen.getByLabelText('Instructor ID')).toBeInTheDocument();
      expect(screen.getByLabelText('Department')).toBeInTheDocument();
    });

    it('validates password complexity requirements', async () => {
      render(<SignupForm />);
      
      // Fill in all required fields first
      const emailInput = screen.getByLabelText('Email Address');
      const firstNameInput = screen.getByLabelText('First Name');
      const lastNameInput = screen.getByLabelText('Last Name');
      const studentIdInput = screen.getByLabelText('Student ID');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
      fireEvent.change(studentIdInput, { target: { value: '12345' } });
      fireEvent.change(passwordInput, { target: { value: 'weak' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'weak' } });
      
      const submitButton = screen.getByRole('button', { name: 'Create Account' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument();
      });
    });

    it('validates password confirmation match', async () => {
      render(<SignupForm />);
      
      // Fill in all required fields first
      const emailInput = screen.getByLabelText('Email Address');
      const firstNameInput = screen.getByLabelText('First Name');
      const lastNameInput = screen.getByLabelText('Last Name');
      const studentIdInput = screen.getByLabelText('Student ID');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
      fireEvent.change(studentIdInput, { target: { value: '12345' } });
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPassword123!' } });
      
      const submitButton = screen.getByRole('button', { name: 'Create Account' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });

    it('requires terms agreement', async () => {
      render(<SignupForm />);
      
      // Fill in all required fields
      const emailInput = screen.getByLabelText('Email Address');
      const firstNameInput = screen.getByLabelText('First Name');
      const lastNameInput = screen.getByLabelText('Last Name');
      const studentIdInput = screen.getByLabelText('Student ID');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
      fireEvent.change(studentIdInput, { target: { value: '12345' } });
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'Password123!' } });
      
      const submitButton = screen.getByRole('button', { name: 'Create Account' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('You must agree to the terms and conditions')).toBeInTheDocument();
      });
    });
  });

  describe('ForgotPasswordForm', () => {
    it('renders forgot password form correctly', () => {
      render(<ForgotPasswordForm />);
      
      expect(screen.getByText('Forgot Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Send Reset Link' })).toBeInTheDocument();
    });

    it('shows success state after submission', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Success' }),
      } as any);
      
      render(<ForgotPasswordForm />);
      
      const emailInput = screen.getByLabelText('Email Address');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      const submitButton = screen.getByRole('button', { name: 'Send Reset Link' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Check Your Email')).toBeInTheDocument();
      });
    });

    it('allows resending email', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Success' }),
      } as any);
      
      render(<ForgotPasswordForm />);
      
      const emailInput = screen.getByLabelText('Email Address');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      const submitButton = screen.getByRole('button', { name: 'Send Reset Link' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Check Your Email')).toBeInTheDocument();
      });
      
      const resendButton = screen.getByRole('button', { name: 'Resend Email' });
      fireEvent.click(resendButton);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('ResetPasswordForm', () => {
    beforeEach(() => {
      mockUseSearchParams.mockReturnValue({
        get: jest.fn((key: string) => {
          if (key === 'token') return 'valid-token';
          if (key === 'email') return 'test@example.com';
          return null;
        }),
        has: jest.fn(),
        forEach: jest.fn(),
        entries: jest.fn(),
        keys: jest.fn(),
        values: jest.fn(),
        toString: jest.fn(),
      } as any);
    });

    it('renders reset password form correctly', () => {
      render(<ResetPasswordForm />);
      
      expect(screen.getByText('Reset Password')).toBeInTheDocument();
      expect(screen.getByLabelText('New Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
      expect(screen.getByText('Resetting password for: test@example.com')).toBeInTheDocument();
    });

    it('shows error for invalid reset link', () => {
      mockUseSearchParams.mockReturnValue({
        get: jest.fn(() => null),
        has: jest.fn(),
        forEach: jest.fn(),
        entries: jest.fn(),
        keys: jest.fn(),
        values: jest.fn(),
        toString: jest.fn(),
      } as any);
      
      render(<ResetPasswordForm />);
      
      expect(screen.getByText('Invalid Reset Link')).toBeInTheDocument();
      expect(screen.getByText('This password reset link is invalid or has expired. Please request a new one.')).toBeInTheDocument();
    });

    it('shows success state after password reset', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Success' }),
      } as any);
      
      render(<ResetPasswordForm />);
      
      const passwordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
      
      fireEvent.change(passwordInput, { target: { value: 'NewPassword123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123!' } });
      
      const submitButton = screen.getByRole('button', { name: 'Update Password' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Password Reset Successfully')).toBeInTheDocument();
      });
    });
  });

  describe('EmailVerificationForm', () => {
    beforeEach(() => {
      mockUseSearchParams.mockReturnValue({
        get: jest.fn((key: string) => {
          if (key === 'email') return 'test@example.com';
          return null;
        }),
        has: jest.fn(),
        forEach: jest.fn(),
        entries: jest.fn(),
        keys: jest.fn(),
        values: jest.fn(),
        toString: jest.fn(),
      } as any);
    });

    it('renders email verification form correctly', () => {
      render(<EmailVerificationForm />);
      
      expect(screen.getByText('Verify Your Email')).toBeInTheDocument();
      expect(screen.getByText('We\'ve sent a verification code to')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByLabelText('Verification Code')).toBeInTheDocument();
    });

    it('shows error for invalid verification link', () => {
      mockUseSearchParams.mockReturnValue({
        get: jest.fn(() => null),
        has: jest.fn(),
        forEach: jest.fn(),
        entries: jest.fn(),
        keys: jest.fn(),
        values: jest.fn(),
        toString: jest.fn(),
      } as any);
      
      render(<EmailVerificationForm />);
      
      expect(screen.getByText('Invalid Verification Link')).toBeInTheDocument();
    });

    it('validates verification code format', async () => {
      // Mock search params to return an email
      mockUseSearchParams.mockReturnValue({
        get: jest.fn((key) => key === 'email' ? 'test@example.com' : null),
        has: jest.fn(),
        forEach: jest.fn(),
        entries: jest.fn(),
        keys: jest.fn(),
        values: jest.fn(),
        toString: jest.fn(),
      } as any);
      
      render(<EmailVerificationForm />);
      
      const codeInput = screen.getByLabelText('Verification Code');
      // Input a 5-character numeric string to test length validation
      fireEvent.change(codeInput, { target: { value: '12345' } });
      
      const form = document.querySelector('form');
      if (form) {
        fireEvent.submit(form);
      }
      
      await waitFor(() => {
        expect(screen.getByText('Verification code must be 6 characters long')).toBeInTheDocument();
      });
    });

    it('shows success state after verification', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Success' }),
      } as any);
      
      render(<EmailVerificationForm />);
      
      const codeInput = screen.getByLabelText('Verification Code');
      fireEvent.change(codeInput, { target: { value: '123456' } });
      
      const submitButton = screen.getByRole('button', { name: 'Verify Email' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Email Verified Successfully!')).toBeInTheDocument();
      });
    });

    it('allows resending verification code', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Success' }),
      } as any);
      
      render(<EmailVerificationForm />);
      
      const resendButton = screen.getByRole('button', { name: 'Resend verification code' });
      fireEvent.click(resendButton);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/resend-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com' }),
        });
      });
    });
  });

  describe('AuthContainer', () => {
    it('renders login view by default', () => {
      render(<AuthContainer />);
      
      expect(screen.getByText('Welcome to Our Platform')).toBeInTheDocument();
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    });

    it('renders specified initial view', () => {
      render(<AuthContainer initialView="signup" />);
      
      // Use getByRole to get the heading specifically, not the button
      expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
    });

    it('switches between views correctly', () => {
      render(<AuthContainer />);
      
      // Should start with login
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      
      // Switch to signup
      const signupLink = screen.getByRole('button', { name: 'Sign up' });
      fireEvent.click(signupLink);
      
      // Use getByRole to get the heading specifically
      expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
      
      // Switch back to login
      const loginLink = screen.getByRole('button', { name: 'Sign in' });
      fireEvent.click(loginLink);
      
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    });

    it('calls onSuccess callback when authentication succeeds', async () => {
      const mockOnSuccess = jest.fn();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Success' }),
      } as any);
      
      render(<AuthContainer onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('Email Address');
      const passwordInput = screen.getByLabelText('Password');
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      
      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('shows close button when onClose is provided', () => {
      const mockOnClose = jest.fn();
      render(<AuthContainer onClose={mockOnClose} />);
      
      const closeButton = screen.getByLabelText('Close authentication');
      expect(closeButton).toBeInTheDocument();
      
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});

