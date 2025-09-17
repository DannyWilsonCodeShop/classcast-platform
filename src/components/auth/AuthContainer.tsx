'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
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
            <div className="mx-auto h-20 w-20 mb-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110">
              <img 
                src="/UpdatedCCLogo.png" 
                alt="ClassCast Logo" 
                className="h-full w-full object-contain rounded-2xl"
              />
            </div>
            <h1 className="text-4xl font-bold text-[#003366] mb-2">
              Welcome to ClassCast
            </h1>
            <p className="text-lg font-normal text-gray-700 max-w-sm mx-auto">
              Join the future of learning with our comprehensive educational platform
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="absolute top-4 right-4 flex items-center space-x-2">
            {/* Home Button */}
            <button
              onClick={() => router.push('/')}
              className="w-10 h-10 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-600 hover:text-gray-800 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
              aria-label="Go to home page"
              title="Go to home page"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
            
            {/* Close Button (if provided) */}
            {onClose && (
              <button
                onClick={onClose}
                className="w-10 h-10 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-600 hover:text-gray-800 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
                aria-label="Close authentication"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Current Auth View */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 p-8 hover:shadow-3xl transition-all duration-300">
            {renderCurrentView()}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center space-y-4">
            {/* Home Button */}
            <div>
              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-400 to-blue-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Back to Home
              </button>
            </div>
            
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

