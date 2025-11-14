'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AssignmentResources from '@/components/assignments/AssignmentResources';

interface StudentAssignmentResourcesPageProps {
  params: { assignmentId: string };
}

export default function StudentAssignmentResourcesPage({ params }: StudentAssignmentResourcesPageProps) {
  const { user } = useAuth();
  const assignmentId = params.assignmentId;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Assignment Resources</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Files and links provided by your instructor
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-green-600 font-medium">Available Resources</span>
              </div>
            </div>
          </div>
        </div>

        {/* Resources Component - Student View (Read-only) */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <AssignmentResources
              assignmentId={assignmentId}
              canManage={false} // Students cannot manage resources
            />
          </div>
        </div>

        {/* Student Help Section */}
        <div className="bg-green-50 border border-green-200 rounded-lg mt-6">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-green-900 mb-2">📖 How to Use Resources</h3>
            <div className="text-sm text-green-800 space-y-2">
              <p>• <strong>Download files</strong> by clicking the download button next to each file</p>
              <p>• <strong>Open links</strong> by clicking "Open Link" - they will open in a new tab</p>
              <p>• <strong>Check categories</strong> to find specific types of resources (rubrics, templates, etc.)</p>
              <p>• <strong>Read descriptions</strong> to understand what each resource contains</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Assignment
          </button>
        </div>
      </div>
    </div>
  );
}