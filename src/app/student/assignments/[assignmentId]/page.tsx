'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import AssignmentResourcesDisplay from '@/components/common/AssignmentResourcesDisplay';

interface Assignment {
  assignmentId: string;
  title: string;
  description: string;
  dueDate: string;
  points: number;
  status: 'upcoming' | 'past_due' | 'completed';
  submissionType: 'text' | 'file' | 'video';
  assignmentType: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  instructor: string;
  createdAt: string;
  resources?: any[];
  isSubmitted: boolean;
  submittedAt?: string;
  grade?: number;
  feedback?: string;
}

const StudentAssignmentDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const assignmentId = params.assignmentId as string;

  useEffect(() => {
    if (assignmentId) {
      fetchAssignmentDetails();
    }
  }, [assignmentId]);

  const fetchAssignmentDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // First try to get assignment from student assignments API
      const response = await fetch(`/api/student/assignments?userId=${user?.id}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const foundAssignment = data.assignments?.find((a: Assignment) => a.assignmentId === assignmentId);
        
        if (foundAssignment) {
          setAssignment(foundAssignment);
          return;
        }
      }

      // If not found in student assignments, try the general assignments API
      const generalResponse = await fetch(`/api/assignments?courseId=all`, {
        credentials: 'include',
      });

      if (generalResponse.ok) {
        const generalData = await generalResponse.json();
        const foundAssignment = generalData.data?.assignments?.find((a: any) => a.assignmentId === assignmentId);
        
        if (foundAssignment) {
          // Transform the assignment to match our interface
          const transformedAssignment: Assignment = {
            assignmentId: foundAssignment.assignmentId,
            title: foundAssignment.title,
            description: foundAssignment.description,
            dueDate: foundAssignment.dueDate,
            points: foundAssignment.maxScore || 100,
            status: 'upcoming',
            submissionType: foundAssignment.assignmentType === 'video' ? 'video' : 'file',
            assignmentType: foundAssignment.assignmentType,
            courseId: foundAssignment.courseId,
            courseName: 'Unknown Course',
            courseCode: 'N/A',
            instructor: 'Unknown Instructor',
            createdAt: foundAssignment.createdAt,
            resources: foundAssignment.resources || [],
            isSubmitted: false,
          };
          setAssignment(transformedAssignment);
          return;
        }
      }

      throw new Error('Assignment not found');
    } catch (err) {
      console.error('Error fetching assignment details:', err);
      setError('Failed to load assignment details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'past_due':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming':
        return '📋';
      case 'past_due':
        return '⚠️';
      case 'completed':
        return '✅';
      default:
        return '📝';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due.getTime() - now.getTime();
    
    if (diff <= 0) return 'Overdue';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} days, ${hours} hours`;
    return `${hours} hours`;
  };

  if (loading) {
    return (
      <StudentRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
          <LoadingSpinner text="Loading assignment..." />
        </div>
      </StudentRoute>
    );
  }

  if (error || !assignment) {
    return (
      <StudentRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
          <EmptyState
            icon="📝"
            title="Assignment Not Found"
            description="The requested assignment could not be found or you don't have access to it."
            action={
              <button
                onClick={() => router.push('/student/assignments')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Assignments
              </button>
            }
          />
        </div>
      </StudentRoute>
    );
  }

  return (
    <StudentRoute>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 px-4 py-3 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/student/assignments')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <span className="text-xl">&lt;</span>
              </button>
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                📝
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-gray-900 truncate">{assignment.title}</h1>
                <p className="text-xs text-gray-600 truncate">
                  {assignment.courseCode} • {assignment.instructor}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(assignment.status)}`}>
                {getStatusIcon(assignment.status)} {assignment.status.replace('_', ' ')}
              </span>
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
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            {/* Assignment Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{assignment.points}</div>
                <div className="text-sm text-gray-600">Points</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {getTimeRemaining(assignment.dueDate)}
                </div>
                <div className="text-sm text-gray-600">Time Remaining</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {assignment.isSubmitted ? '1' : '0'}
                </div>
                <div className="text-sm text-gray-600">Submissions</div>
              </div>
            </div>

            {/* Assignment Details */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Instructions</h3>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-gray-700 font-sans">
                    {assignment.description}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Due Date</h3>
                <p className="text-gray-700">{formatDate(assignment.dueDate)}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Submission Type</h3>
                <p className="text-gray-700 capitalize">{assignment.submissionType}</p>
              </div>

              {assignment.resources && assignment.resources.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Resources</h3>
                  <AssignmentResourcesDisplay resources={assignment.resources} />
                </div>
              )}

              {/* Submission Status */}
              {assignment.isSubmitted ? (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Submitted</h3>
                  <p className="text-green-700">
                    You submitted this assignment on {assignment.submittedAt ? formatDate(assignment.submittedAt) : 'Unknown date'}.
                  </p>
                  {assignment.grade && (
                    <div className="mt-2">
                      <p className="text-green-700 font-medium">Grade: {assignment.grade}/{assignment.points}</p>
                      {assignment.feedback && (
                        <p className="text-green-700 mt-1">Feedback: {assignment.feedback}</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">📝 Not Submitted</h3>
                  <p className="text-yellow-700 mb-4">
                    You haven't submitted this assignment yet. Make sure to submit before the due date.
                  </p>
                  <button
                    onClick={() => router.push(`/student/video-submission?assignmentId=${assignmentId}&courseId=${assignment.courseId}`)}
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
                  >
                    <span className="mr-2">🎥</span>
                    Submit Assignment
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </StudentRoute>
  );
};

export default StudentAssignmentDetailPage;