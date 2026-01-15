/**
 * Mobile Upload Integration Example
 * 
 * This shows how to integrate mobile upload into your existing video submission page
 * Copy the relevant parts into your actual video-submission/page.tsx
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { MobileAssignmentUpload } from '@/components/student/MobileAssignmentUpload';
import { shouldUseMobileUpload, logDeviceInfo } from '@/lib/mobileDetection';

// Your existing video submission component
const ExistingVideoSubmissionPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  // Get assignment and course IDs from URL parameters
  const assignmentId = searchParams.get('assignmentId') || '';
  const courseId = searchParams.get('courseId') || '';
  
  // State for mobile detection
  const [useMobileUpload, setUseMobileUpload] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Detect mobile device on client side
  useEffect(() => {
    const isMobile = shouldUseMobileUpload();
    setUseMobileUpload(isMobile);
    setIsLoading(false);
    
    // Log device info for debugging
    logDeviceInfo();
    
    console.log('📱 Mobile upload detection:', {
      shouldUseMobile: isMobile,
      userAgent: navigator.userAgent,
      screenSize: `${window.innerWidth}x${window.innerHeight}`
    });
  }, []);

  // Load assignment data
  useEffect(() => {
    const loadAssignment = async () => {
      if (assignmentId) {
        try {
          const response = await fetch(`/api/assignments/${assignmentId}`, {
            credentials: 'include'
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data?.assignment?.title) {
              setAssignmentTitle(data.data.assignment.title);
            }
          }
        } catch (error) {
          console.error('Error loading assignment:', error);
        }
      }
    };
    
    loadAssignment();
  }, [assignmentId]);

  // Handle mobile upload completion
  const handleMobileUploadComplete = (submissionId: string) => {
    console.log('📱 Mobile upload completed:', submissionId);
    
    // Show success message or redirect
    router.push(`/student/assignments/${assignmentId}?uploaded=true`);
  };

  // Handle mobile upload cancellation
  const handleMobileUploadCancel = () => {
    console.log('📱 Mobile upload cancelled');
    router.back();
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Render mobile-optimized upload for mobile devices
  if (useMobileUpload) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileAssignmentUpload
          assignmentId={assignmentId}
          courseId={courseId}
          assignmentTitle={assignmentTitle || 'Video Assignment'}
          maxFileSize={2 * 1024 * 1024 * 1024} // 2GB
          onUploadComplete={handleMobileUploadComplete}
          onCancel={handleMobileUploadCancel}
        />
      </div>
    );
  }

  // Render your existing desktop upload interface
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Your existing desktop video submission UI */}
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Video Submission</h1>
        
        {/* Add a mobile fallback button */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-800 mb-2">
            Having trouble with the upload? Try our mobile-optimized version:
          </p>
          <button
            onClick={() => setUseMobileUpload(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            📱 Switch to Mobile Upload
          </button>
        </div>
        
        {/* Your existing upload interface goes here */}
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">
            Your existing desktop upload interface...
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExistingVideoSubmissionPage;