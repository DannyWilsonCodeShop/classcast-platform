'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import AssignmentCreationForm from '@/components/instructor/AssignmentCreationForm';

interface Assignment {
  id?: string;
  title: string;
  description: string;
  assignmentType: 'video' | 'text' | 'file' | 'quiz';
  dueDate: Date;
  maxScore: number;
  weight: number;
  requirements: string[];
  allowLateSubmission: boolean;
  latePenalty: number;
  maxSubmissions: number;
  groupAssignment: boolean;
  maxGroupSize?: number;
  allowedFileTypes: string[];
  maxFileSize: number;
  status: 'draft' | 'published' | 'grading' | 'completed';
}

// Component that uses useSearchParams - needs to be wrapped in Suspense
const CreateAssignmentContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (assignmentData: Partial<Assignment>) => {
    setIsLoading(true);
    
    try {
      // Get courseId from URL params or assignmentData
      const courseId = searchParams.get('courseId') || assignmentData.courseId;
      
      if (!courseId) {
        throw new Error('Course ID is required to create an assignment');
      }

      // Prepare the assignment data for the API
      const apiData = {
        ...assignmentData,
        courseId,
        instructorId: 'instructor_123', // TODO: Get from auth context
        dueDate: assignmentData.dueDate?.toISOString(),
        assignmentType: assignmentData.assignmentType || 'video',
        maxScore: assignmentData.maxScore || 100,
        weight: assignmentData.weight || 10,
        requirements: assignmentData.requirements || [],
        allowLateSubmission: assignmentData.allowLateSubmission || false,
        latePenalty: assignmentData.latePenalty || 0,
        maxSubmissions: assignmentData.maxSubmissions || 1,
        groupAssignment: assignmentData.groupAssignment || false,
        maxGroupSize: assignmentData.maxGroupSize || 4,
        allowedFileTypes: assignmentData.allowedFileTypes || ['mp4', 'mov', 'avi'],
        maxFileSize: assignmentData.maxFileSize || 100 * 1024 * 1024,
        status: assignmentData.status || 'draft'
      };

      console.log('Creating assignment:', apiData);

      // Make API call to create assignment
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create assignment');
      }

      const result = await response.json();
      console.log('Assignment created successfully:', result);
      
      // Redirect to assignments list or course page
      router.push('/instructor/courses');
    } catch (error) {
      console.error('Error creating assignment:', error);
      // TODO: Show error message to user
      alert(`Error creating assignment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-yellow-300/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <span className="text-2xl">&lt;</span>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  Create Assignment
                </h1>
                <p className="text-gray-600">
                  Set up a new assignment for your students
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <img
                src="/MyClassCast (800 x 200 px).png"
                alt="MyClassCast"
                className="h-8 w-auto object-contain"
              />
              <button
                onClick={() => router.push('/instructor/dashboard')}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
              >
                Home
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl border border-white/20 p-8">
      <AssignmentCreationForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
        courseId={searchParams.get('courseId') || undefined}
      />
        </div>
      </div>
    </div>
  );
};

// Main page component with Suspense boundary
const CreateAssignmentPage: React.FC = () => {
  return (
    <InstructorRoute>
      <Suspense fallback={
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading assignment creator...</p>
          </div>
        </div>
      }>
        <CreateAssignmentContent />
      </Suspense>
    </InstructorRoute>
  );
};

export default CreateAssignmentPage;
