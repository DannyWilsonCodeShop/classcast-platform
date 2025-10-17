'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const UnsubscribeSuccessContent: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get('userId');
    setUserId(id);
  }, [searchParams]);

  const handleResubscribe = async () => {
    if (!userId) return;

    try {
      const response = await fetch('/api/notification-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          preferences: {
            isUnsubscribed: false,
            emailNotifications: {
              newAssignments: true,
              gradedAssignments: true,
              peerFeedback: true,
              courseAnnouncements: true,
              discussionReplies: true,
              upcomingDeadlines: true,
            },
          },
        }),
      });

      if (response.ok) {
        alert('Successfully resubscribed to email notifications!');
        router.push('/student/profile');
      } else {
        alert('Failed to resubscribe. Please try again.');
      }
    } catch (error) {
      console.error('Error resubscribing:', error);
      alert('Failed to resubscribe. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-green-600"
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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            You've Been Unsubscribed
          </h1>

          {/* Message */}
          <p className="text-lg text-gray-600 mb-6">
            You will no longer receive email notifications from ClassCast.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <p className="text-sm text-gray-700 mb-4">
              You can still access all course materials and assignments by logging into your account.
              You can also manage your notification preferences in your profile settings.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleResubscribe}
              className="px-6 py-3 bg-[#005587] text-white rounded-lg font-medium hover:bg-[#004466] transition-colors"
            >
              Resubscribe to Emails
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Go to Homepage
            </button>
          </div>

          {/* Footer Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Changed your mind? You can update your email preferences anytime in your profile settings
              or by logging into your account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const UnsubscribeSuccessPage: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <UnsubscribeSuccessContent />
    </Suspense>
  );
};

export default UnsubscribeSuccessPage;

