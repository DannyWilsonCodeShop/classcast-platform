'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ErrorReporter from '@/lib/errorReporting';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BugReportModal: React.FC<BugReportModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [device, setDevice] = useState('');
  const [browser, setBrowser] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setScreenshot(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      ErrorReporter.reportUserBug(
        description,
        user?.id,
        user?.email,
        user?.firstName || 'Unknown',
        [device, browser].filter(item => item.trim())
      );
      
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setDescription('');
        setDevice('');
        setBrowser('');
        setScreenshot(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to submit bug report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h3>
          <p className="text-gray-600">Your bug report has been sent. We'll look into it right away.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Report a Bug 🐛</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
              What went wrong? *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Describe the issue you encountered..."
            />
          </div>

          {/* Device Type */}
          <div>
            <label htmlFor="device" className="block text-sm font-semibold text-gray-700 mb-2">
              What device are you using? (laptop, phone, etc.)
            </label>
            <input
              id="device"
              type="text"
              value={device}
              onChange={(e) => setDevice(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., iPhone, MacBook, Windows laptop, Android tablet..."
            />
          </div>

          {/* Browser Type */}
          <div>
            <label htmlFor="browser" className="block text-sm font-semibold text-gray-700 mb-2">
              What type of browser are you using?
            </label>
            <input
              id="browser"
              type="text"
              value={browser}
              onChange={(e) => setBrowser(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Chrome, Safari, Firefox, Edge..."
            />
          </div>

          {/* Screenshot Upload */}
          <div>
            <label htmlFor="screenshot" className="block text-sm font-semibold text-gray-700 mb-2">
              Upload a screenshot (Optional)
            </label>
            <div className="flex items-center space-x-3">
              <input
                id="screenshot"
                type="file"
                accept="image/*"
                onChange={handleScreenshotUpload}
                className="hidden"
              />
              <label
                htmlFor="screenshot"
                className="flex items-center space-x-2 px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-gray-600">
                  {screenshot ? screenshot.name : 'Choose image file'}
                </span>
              </label>
              {screenshot && (
                <button
                  type="button"
                  onClick={() => setScreenshot(null)}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                  title="Remove screenshot"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {screenshot && (
              <p className="mt-2 text-sm text-green-600">
                ✓ Screenshot selected: {screenshot.name}
              </p>
            )}
          </div>

          {/* User Info Display */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Your Information</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Name:</span> {user?.firstName || 'Not provided'}</p>
              <p><span className="font-medium">Email:</span> {user?.email || 'Not provided'}</p>
              <p><span className="font-medium">Page:</span> {window.location.pathname}</p>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!description.trim() || isSubmitting}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Sending...' : 'Send Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BugReportModal;