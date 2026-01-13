'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import AssignmentCreationForm from '@/components/instructor/AssignmentCreationForm';
import { useAuth } from '@/contexts/AuthContext';

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

// Component that uses useParams - needs to be wrapped in Suspense
const CreateAssignmentContent: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const courseId = params.courseId as string;

  const handleSubmit = async (assignmentData: Partial<Assignment>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!courseId) {
        throw new Error('Course ID is required to create an assignment');
      }

      if (!user?.id) {
        throw new Error('Instructor ID is required to create an assignment');
      }

      // Prepare the assignment data for the API
      const apiData = {
        ...assignmentData,
        courseId,
        instructorId: user?.id,
        dueDate: assignmentData.dueDate && assignmentData.dueDate instanceof Date ? assignmentData.dueDate.toISOString() : undefined,
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
        maxFileSize: assignmentData.maxFileSize || 500 * 1024 * 1024,
        status: assignmentData.status || 'draft'
      };

      console.log('Creating assignment for course:', courseId, apiData);

      // Make API call to create assignment
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      console.log('API Response status:', response.status);
      console.log('API Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error response:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to create assignment`);
      }

      const result = await response.json();
      console.log('Assignment created successfully:', result);
      
      // Redirect back to the course page
      router.push(`/instructor/courses/${courseId}`);
    } catch (error) {
      console.error('Error creating assignment:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/instructor/courses/${courseId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-yellow-300/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <span className="text-2xl">&lt;</span>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  Create Assignment
                </h1>
                <p className="text-gray-600">
                  Set up a new assignment for this course
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
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <AssignmentCreationForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
            courseId={courseId}
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
