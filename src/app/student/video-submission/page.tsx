'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { VideoSubmission } from '@/components/student/VideoSubmission';

interface Assignment {
  assignmentId: string;
  title: string;
  description: string;
  requirements: string[];
  maxFileSize: number;
  allowedFileTypes: string[];
  maxDuration: number;
  requireLiveRecording: boolean;
}

const VideoSubmissionContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get assignment ID from URL params or use default
  const assignmentId = searchParams.get('assignment') || 'demo-assignment-123';

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/assignments/${assignmentId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch assignment');
        }
        
        const data = await response.json();
        setAssignment(data.data);
      } catch (err) {
        console.error('Error fetching assignment:', err);
        setError(err instanceof Error ? err.message : 'Failed to load assignment');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignment();
  }, [assignmentId]);

  const handleSubmissionComplete = (submissionData: any) => {
    console.log('Video submission completed:', submissionData);
    // Redirect to dashboard after successful submission
    router.push('/student/dashboard');
  };

  const handleSubmissionError = (error: string) => {
    console.error('Video submission failed:', error);
    // In a real app, you might show a toast notification or update the UI
  };

  if (isLoading) {
    return (
      <StudentRoute>
        <div className="h-screen overflow-hidden flex flex-col bg-[#F5F5F5]">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A90E2] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading assignment details...</p>
            </div>
          </div>
        </div>
      </StudentRoute>
    );
  }

  if (error || !assignment) {
    return (
      <StudentRoute>
        <div className="h-screen overflow-hidden flex flex-col bg-[#F5F5F5]">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Assignment Not Found</h2>
              <p className="text-gray-600 mb-4">{error || 'The assignment you\'re looking for doesn\'t exist.'}</p>
              <button
                onClick={() => router.push('/student/dashboard')}
                className="px-4 py-2 bg-[#4A90E2] text-white rounded-lg hover:bg-[#9B5DE5] transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </StudentRoute>
    );
  }

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
            {/* Assignment Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-3xl">{assignment.emoji || '🎥'}</span>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{assignment.title}</h1>
                  <p className="text-gray-600 mt-1">{assignment.description}</p>
                </div>
              </div>
            </div>

            <VideoSubmission
              assignmentId={assignment.assignmentId}
              courseId="demo-course-456"
              onSubmissionComplete={handleSubmissionComplete}
              onSubmissionError={handleSubmissionError}
              maxFileSize={assignment.maxFileSize}
              allowedVideoTypes={assignment.allowedFileTypes.map(type => `video/${type}`)}
              maxDuration={assignment.maxDuration}
              showPreview={true}
              enableLiveRecording={!assignment.requireLiveRecording}
              assignmentRequirements={assignment.requirements}
            />

            {/* Technical Guidelines */}
            <div className="mt-12 bg-[#4A90E2]/10 border border-[#4A90E2]/20 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-[#4A90E2] mb-3">
                Technical Guidelines
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[#4A90E2]">
                <div>
                  <h3 className="font-medium mb-2">Supported Formats</h3>
                  <ul className="space-y-1">
                    {assignment.allowedFileTypes.map(type => (
                      <li key={type}>• {type.toUpperCase()}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">File Limits</h3>
                  <ul className="space-y-1">
                    <li>• Maximum file size: {Math.round(assignment.maxFileSize / (1024 * 1024))}MB</li>
                    <li>• Maximum duration: {Math.floor(assignment.maxDuration / 60)} minutes</li>
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

