'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { VideoSubmission } from '@/components/student/VideoSubmission';

const VideoSubmissionPage: React.FC = () => {
  const router = useRouter();

  const handleSubmissionComplete = (submissionData: any) => {
    console.log('Video submission completed:', submissionData);
    // Redirect to dashboard after successful submission
    router.push('/student/dashboard');
  };

  const handleSubmissionError = (error: string) => {
    console.error('Video submission failed:', error);
    // In a real app, you might show a toast notification or update the UI
  };

  return (
    <StudentRoute>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Back Button */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => router.push('/student/dashboard')}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span>Back to Dashboard</span>
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Video Submission</h1>
          <p className="mt-2 text-gray-600">
            Record or upload your video assignment for review and grading
          </p>
        </div>

        <VideoSubmission
          assignmentId="demo-assignment-123"
          courseId="demo-course-456"
          onSubmissionComplete={handleSubmissionComplete}
          onSubmissionError={handleSubmissionError}
          maxFileSize={100 * 1024 * 1024} // 100MB
          allowedVideoTypes={['video/mp4', 'video/webm', 'video/quicktime']}
          maxDuration={300} // 5 minutes
          showPreview={true}
        />

        {/* Additional Information */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">
            Video Submission Guidelines
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h3 className="font-medium mb-2">Supported Formats</h3>
              <ul className="space-y-1">
                <li>• MP4 (H.264)</li>
                <li>• WebM (VP8/VP9)</li>
                <li>• MOV (QuickTime)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Requirements</h3>
              <ul className="space-y-1">
                <li>• Maximum file size: 100MB</li>
                <li>• Maximum duration: 5 minutes</li>
                <li>• Clear audio and video quality</li>
                <li>• Proper lighting and framing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </StudentRoute>
  );
};

export default VideoSubmissionPage;

