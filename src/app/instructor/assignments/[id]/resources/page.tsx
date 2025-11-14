'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AssignmentResources from '@/components/assignments/AssignmentResources';

interface AssignmentResourcesPageProps {
  params: { id: string };
}

export default function AssignmentResourcesPage({ params }: AssignmentResourcesPageProps) {
  const { user } = useAuth();
  const assignmentId = params.id;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Assignment Resources</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Manage files and links for this assignment
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Assignment ID: {assignmentId}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Resources Component */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <AssignmentResources
              assignmentId={assignmentId}
              canManage={user?.isInstructor || user?.isAdmin}
            />
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg mt-6">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-2">Resource Types</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <h4 className="font-medium mb-2">📚 Resources</h4>
                <p>General materials, readings, and supplementary content</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">📋 Rubrics</h4>
                <p>Grading criteria and evaluation guidelines</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">📝 Instructions</h4>
                <p>Detailed assignment instructions and requirements</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">📄 Templates</h4>
                <p>Starter files, forms, and document templates</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">🔗 References</h4>
                <p>External websites, articles, and online resources</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">🛠️ Tools/Software</h4>
                <p>Links to required software, platforms, and tools</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}