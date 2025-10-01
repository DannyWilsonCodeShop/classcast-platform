'use client';

import React, { useState } from 'react';
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

const CreateAssignmentPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (assignmentData: Partial<Assignment>) => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Creating assignment:', assignmentData);
      
      // Redirect to assignments list or course page
      router.push('/instructor/courses');
    } catch (error) {
      console.error('Error creating assignment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <InstructorRoute>
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
    </InstructorRoute>
  );
};

export default CreateAssignmentPage;
