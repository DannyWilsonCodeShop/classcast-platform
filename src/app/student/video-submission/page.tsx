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
      <div className="h-screen overflow-hidden flex flex-col bg-[#F5F5F5]">
        {/* Branded Header */}
        <div className="bg-white/90 backdrop-blur-md shadow-lg border-b border-[#4A90E2]/20 px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left Side - Back Button and MyClassCast Logo */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Go back"
              >
                <span className="text-xl">&lt;</span>
              </button>
              <img
                src="/MyClassCast (800 x 200 px).png"
                alt="MyClassCast"
                className="h-8 w-auto object-contain"
              />
            </div>
            
            {/* Right Side - Home Button */}
            <div className="flex items-center">
              <button
                onClick={() => router.push('/student/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Home Dashboard"
              >
                <span className="text-xl">🏠</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
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
              enableLiveRecording={true}
            />

            {/* Additional Information */}
            <div className="mt-12 bg-[#4A90E2]/10 border border-[#4A90E2]/20 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-[#4A90E2] mb-3">
                Video Submission Guidelines
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[#4A90E2]">
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
        </div>
      </div>
    </StudentRoute>
  );
};

export default VideoSubmissionPage;

