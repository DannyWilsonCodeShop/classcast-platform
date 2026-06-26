'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface PasswordResetProps {
  onClose: () => void;
}

export const PasswordReset: React.FC<PasswordResetProps> = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();

  const handleSendResetEmail = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user?.email,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error?.message || 'Failed to send reset email');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-2xl shadow-lg max-w-[380px] w-full mx-4">
          <div className="text-center">
            <div className="text-green-500 text-4xl mb-4">✉️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Reset Email Sent</h3>
            <p className="text-gray-600 text-sm mb-4">
              A password reset link has been sent to <strong>{user?.email}</strong>. Check your inbox and follow the instructions.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[#005587] text-white rounded-full text-sm font-medium"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-5 rounded-2xl shadow-lg max-w-[380px] w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          We&apos;ll send a password reset link to your email address (<strong>{user?.email}</strong>). Use it to set a new password.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSendResetEmail}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-[#005587] text-white rounded-lg hover:bg-[#004470] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sending...' : 'Send Reset Email'}
          </button>
        </div>
      </div>
    </div>
  );
};
