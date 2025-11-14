'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ErrorReporter from '@/lib/errorReporting';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundaryClass extends Component<Props & { user?: any }, State> {
  constructor(props: Props & { user?: any }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Report the error
    ErrorReporter.reportReactError(
      error,
      errorInfo,
      this.props.user?.id,
      this.props.user?.email,
      this.props.user?.name || this.props.user?.firstName
    );
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-8 max-w-lg w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Oops! Something went wrong
            </h2>
            
            <p className="text-gray-600 mb-6">
              We've encountered an unexpected error. Don't worry - we've been automatically notified and will fix this soon.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Refresh Page
              </button>
              
              <button
                onClick={() => window.history.back()}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Go Back
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-4">
              Error ID: {this.state.error?.message?.slice(0, 8) || 'Unknown'}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper component to inject user context
const ErrorBoundary: React.FC<Props> = ({ children, fallback }) => {
  return (
    <ErrorBoundaryWrapper fallback={fallback}>
      {children}
    </ErrorBoundaryWrapper>
  );
};

const ErrorBoundaryWrapper: React.FC<Props> = ({ children, fallback }) => {
  const { user } = useAuth();
  
  return (
    <ErrorBoundaryClass user={user} fallback={fallback}>
      {children}
    </ErrorBoundaryClass>
  );
};

export default ErrorBoundary;