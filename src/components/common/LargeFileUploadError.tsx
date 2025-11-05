'use client';

import React from 'react';

interface LargeFileUploadErrorProps {
  error: string;
  fileName?: string;
  onRetry?: () => void;
  onClose?: () => void;
}

const LargeFileUploadError: React.FC<LargeFileUploadErrorProps> = ({
  error,
  fileName,
  onRetry,
  onClose
}) => {
  const isFileSizeError = error.includes('size') || error.includes('corrupted');
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 max-w-md w-full">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Upload Failed</h3>
            {fileName && <p className="text-sm text-gray-600">{fileName}</p>}
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-4">{error}</p>
          
          {isFileSizeError && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">💡 Try these solutions:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Refresh the page and try again</li>
                <li>• Use a different browser (Chrome or Firefox work best)</li>
                <li>• Try uploading from a different device</li>
                <li>• Check if your file is corrupted by opening it first</li>
                <li>• For very large files (>1GB), try uploading during off-peak hours</li>
              </ul>
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          {onClose && (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
            >
              Close
            </button>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LargeFileUploadError;