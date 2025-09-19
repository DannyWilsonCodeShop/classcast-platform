import React from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { SubmissionHistory } from '@/components/student/SubmissionHistory';
import Link from 'next/link';

const StudentSubmissionsPage: React.FC = () => {
  return (
    <StudentRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100">
        {/* Header with Back Button */}
        <div className="bg-white/90 backdrop-blur-md shadow-lg border-b border-white/20 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/student/dashboard"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                title="Back to Dashboard"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  📝
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">My Submissions</h1>
                  <p className="text-xs text-gray-600">
                    View and manage your assignment submissions
                  </p>
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              ClassCast
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Submission History</h2>
            <p className="mt-2 text-gray-600">
              View and manage all your assignment submissions, grades, and feedback
            </p>
          </div>

        <SubmissionHistory
          title="Submission History"
          showFilters={true}
          showSort={true}
        />

        {/* Additional Information */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">
            Understanding Your Submissions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-800">
            <div>
              <h3 className="font-medium mb-2">Submission Statuses</h3>
              <ul className="space-y-1">
                <li>• <span className="font-medium">Submitted</span> - Your work has been received</li>
                <li>• <span className="font-medium">Graded</span> - Instructor has provided feedback and score</li>
                <li>• <span className="font-medium">Late</span> - Submitted after the due date</li>
                <li>• <span className="font-medium">Returned</span> - Needs revision or resubmission</li>
                <li>• <span className="font-medium">Draft</span> - Saved but not yet submitted</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Features</h3>
              <ul className="space-y-1">
                <li>• <span className="font-medium">Video Playback</span> - Review your video submissions</li>
                <li>• <span className="font-medium">Grade Display</span> - View scores and letter grades</li>
                <li>• <span className="font-medium">Feedback Review</span> - Read instructor comments</li>
                <li>• <span className="font-medium">File Management</span> - Access all submitted materials</li>
                <li>• <span className="font-medium">Filtering & Sorting</span> - Find specific submissions quickly</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </StudentRoute>
  );
};

export default StudentSubmissionsPage;





