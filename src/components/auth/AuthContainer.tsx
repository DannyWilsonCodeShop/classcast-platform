'use client';

import React, { useState } from 'react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import ResetPasswordForm from './ResetPasswordForm';
import EmailVerificationForm from './EmailVerificationForm';

export type AuthView = 'login' | 'signup' | 'forgot-password' | 'reset-password' | 'verify-email';

interface AuthContainerProps {
  initialView?: AuthView;
  onSuccess?: () => void;
  onClose?: () => void;
}

export default function AuthContainer({ 
  initialView = 'login', 
  onSuccess, 
  onClose 
}: AuthContainerProps) {
  const [currentView, setCurrentView] = useState<AuthView>(initialView);

  const switchToView = (view: AuthView) => {
    setCurrentView(view);
  };

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'login':
        return (
          <LoginForm
            onSuccess={handleSuccess}
            onSwitchToSignup={() => switchToView('signup')}
            onSwitchToForgotPassword={() => switchToView('forgot-password')}
          />
        );
      
      case 'signup':
        return (
          <SignupForm
            onSuccess={handleSuccess}
            onSwitchToLogin={() => switchToView('login')}
          />
        );
      
      case 'forgot-password':
        return (
          <ForgotPasswordForm
            onSuccess={handleSuccess}
            onSwitchToLogin={() => switchToView('login')}
          />
        );
      
      case 'reset-password':
        return (
          <ResetPasswordForm
            onSuccess={handleSuccess}
            onSwitchToLogin={() => switchToView('login')}
          />
        );
      
      case 'verify-email':
        return (
          <EmailVerificationForm
            onSuccess={handleSuccess}
            onSwitchToLogin={() => switchToView('login')}
          />
        );
      
      default:
        return (
          <LoginForm
            onSuccess={handleSuccess}
            onSwitchToSignup={() => switchToView('signup')}
            onSwitchToForgotPassword={() => switchToView('forgot-password')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/80 relative overflow-hidden">
      {/* Background image is applied globally in CSS */}
      
      <div className="relative z-10 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Logo/Brand Section */}
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-[#003366] rounded-2xl flex items-center justify-center mb-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110">
              <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-[#003366] mb-2">
              Welcome to ClassCast
            </h1>
            <p className="text-lg font-normal text-gray-700 max-w-sm mx-auto">
              Join the future of learning with our comprehensive educational platform
            </p>
          </div>

          {/* Close Button (if provided) */}
          {onClose && (
            <div className="absolute top-4 right-4">
              <button
                onClick={onClose}
                className="w-10 h-10 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-600 hover:text-gray-800 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
                aria-label="Close authentication"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Current Auth View */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 p-8 hover:shadow-3xl transition-all duration-300">
            {renderCurrentView()}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm font-normal text-gray-600">
              By using this platform, you agree to our{' '}
              <a href="/terms" className="text-[#003366] hover:text-[#002244] font-medium transition-colors duration-200">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-[#003366] hover:text-[#002244] font-medium transition-colors duration-200">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

