import React from 'react';

interface EmailConfirmationModalProps {
  isOpen: boolean;
  email: string;
  onClose: () => void;
}

export const EmailConfirmationModal: React.FC<EmailConfirmationModalProps> = ({
  isOpen,
  email,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Title */}
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Account Created Successfully!
          </h3>

          {/* Message */}
          <div className="text-sm text-gray-600 mb-6">
            <p className="mb-2">
              We've sent a confirmation email to:
            </p>
            <p className="font-medium text-gray-900">{email}</p>
            <p className="mt-3">
              Please check your email and click the confirmation link to verify your account.
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <h4 className="font-medium text-blue-900 mb-2">Next Steps:</h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Check your email inbox (and spam folder)</li>
              <li>2. Click the confirmation link in the email</li>
              <li>3. Return here to log in</li>
            </ol>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Got it, thanks!
            </button>
            <button
              onClick={() => {
                // Open email client
                window.location.href = `mailto:${email}`;
              }}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Open Email
            </button>
          </div>

          {/* Help text */}
          <p className="text-xs text-gray-500 mt-4">
            Didn't receive the email? Check your spam folder or contact support.
          </p>
        </div>
      </div>
    </div>
  );
};
