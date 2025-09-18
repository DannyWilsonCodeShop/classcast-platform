'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';

interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions: string;
  dueDate: string;
  points: number;
  status: 'not-started' | 'in-progress' | 'submitted' | 'graded';
  grade?: number;
  feedback?: string;
  submissionType: 'text' | 'file' | 'video';
  allowedFileTypes?: string[];
  maxFileSize?: number;
  maxDuration?: number;
  rubric?: {
    criteria: string;
    points: number;
    description: string;
  }[];
  course: {
    id: string;
    name: string;
    code: string;
    instructor: {
      name: string;
      email: string;
    };
  };
  submissions: {
    id: string;
    submittedAt: string;
    content: string;
    files: {
      name: string;
      url: string;
      type: string;
      size: number;
    }[];
    grade?: number;
    feedback?: string;
    status: 'draft' | 'submitted' | 'graded';
  }[];
  createdAt: string;
  updatedAt: string;
}

const StudentAssignmentDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'submit' | 'feedback'>('overview');

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

      // TODO: Replace with actual API call
      // const response = await fetch(`/api/student/assignments/${assignmentId}`, {
      //   credentials: 'include',
      // });

      // Mock data for now
      const mockAssignment: Assignment = {
        id: assignmentId,
        title: 'Programming Assignment 3: Data Structures',
        description: 'Implement a binary search tree with insertion, deletion, and traversal operations.',
        instructions: `
# Assignment Instructions

## Objective
Implement a complete binary search tree (BST) data structure with the following operations:
- Insert a new node
- Delete a node
- Search for a node
- In-order traversal
- Pre-order traversal
- Post-order traversal

## Requirements
1. Create a BST class with proper encapsulation
2. Implement all required methods
3. Include comprehensive error handling
4. Write unit tests for all methods
5. Include proper documentation

## Submission
- Submit your code as a single Python file
- Include a README with setup instructions
- Provide example usage of your BST implementation

## Grading Criteria
- Correctness (40 points)
- Code quality and style (20 points)
- Documentation (20 points)
- Testing (20 points)
        `,
        dueDate: '2024-12-15T23:59:59Z',
        points: 100,
        status: 'in-progress',
        submissionType: 'file',
        allowedFileTypes: ['.py', '.txt', '.md'],
        maxFileSize: 10 * 1024 * 1024, // 10MB
        rubric: [
          {
            criteria: 'Correctness',
            points: 40,
            description: 'All methods work correctly and handle edge cases'
          },
          {
            criteria: 'Code Quality',
            points: 20,
            description: 'Clean, readable code with proper naming conventions'
          },
          {
            criteria: 'Documentation',
            points: 20,
            description: 'Clear comments and comprehensive README'
          },
          {
            criteria: 'Testing',
            points: 20,
            description: 'Thorough unit tests covering all scenarios'
          }
        ],
        course: {
          id: '1',
          name: 'Introduction to Computer Science',
          code: 'CS101',
          instructor: {
            name: 'Dr. Sarah Johnson',
            email: 'sarah.johnson@university.edu'
          }
        },
        submissions: [
          {
            id: 'sub1',
            submittedAt: '2024-12-10T14:30:00Z',
            content: 'Initial implementation with basic functionality',
            files: [
              {
                name: 'bst_implementation.py',
                url: '/api/files/sub1/bst_implementation.py',
                type: 'application/python',
                size: 2048
              },
              {
                name: 'README.md',
                url: '/api/files/sub1/README.md',
                type: 'text/markdown',
                size: 512
              }
            ],
            status: 'submitted'
          }
        ],
        createdAt: '2024-11-20T00:00:00Z',
        updatedAt: '2024-12-10T14:30:00Z'
      };

      setAssignment(mockAssignment);
    } catch (err) {
      console.error('Error fetching assignment details:', err);
      setError('Failed to load assignment details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not-started':
        return 'bg-gray-100 text-gray-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'graded':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'not-started':
        return '📋';
      case 'in-progress':
        return '⚡';
      case 'submitted':
        return '📤';
      case 'graded':
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
      <div className="h-screen overflow-hidden flex flex-col bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push(`/student/courses/${assignment.course.id}`)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <span className="text-xl">←</span>
              </button>
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                📝
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-gray-900 truncate">{assignment.title}</h1>
                <p className="text-xs text-gray-600 truncate">
                  {assignment.course.code} • {assignment.course.instructor.name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(assignment.status)}`}>
                {getStatusIcon(assignment.status)} {assignment.status.replace('-', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white/90 backdrop-blur-sm px-4 py-2 flex-shrink-0">
          <div className="flex space-x-1">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'submit', label: 'Submit', icon: '📤' },
              { id: 'feedback', label: 'Feedback', icon: '💬' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-3 py-2 rounded-xl font-bold text-xs transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Assignment Info */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                      {assignment.submissions.length}
                    </div>
                    <div className="text-sm text-gray-600">Submissions</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700">{assignment.description}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Due Date</h3>
                    <p className="text-gray-700">{formatDate(assignment.dueDate)}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Submission Type</h3>
                    <p className="text-gray-700 capitalize">{assignment.submissionType}</p>
                    {assignment.allowedFileTypes && (
                      <p className="text-sm text-gray-600 mt-1">
                        Allowed: {assignment.allowedFileTypes.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructions</h3>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-gray-700 font-sans">
                    {assignment.instructions}
                  </pre>
                </div>
              </div>

              {/* Rubric */}
              {assignment.rubric && (
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Grading Rubric</h3>
                  <div className="space-y-3">
                    {assignment.rubric.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">{item.criteria}</h4>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-blue-600">{item.points} pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'submit' && (
            <div className="space-y-6">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit Assignment</h3>
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📤</div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">Submission Form Coming Soon</h4>
                  <p className="text-gray-600 mb-4">
                    The submission interface will be available here once implemented.
                  </p>
                  <button
                    onClick={() => router.push('/student/video-submission')}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
                  >
                    Go to Video Submission
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="space-y-6">
              {assignment.submissions.length > 0 ? (
                <div className="space-y-4">
                  {assignment.submissions.map((submission) => (
                    <div key={submission.id} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Submission #{submission.id}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          submission.status === 'graded' ? 'bg-green-100 text-green-800' :
                          submission.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {submission.status}
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-600">Submitted: {formatDate(submission.submittedAt)}</p>
                        </div>
                        
                        {submission.grade && (
                          <div className="p-4 bg-green-50 rounded-lg">
                            <h4 className="font-semibold text-green-800 mb-2">Grade: {submission.grade}/{assignment.points}</h4>
                            {submission.feedback && (
                              <p className="text-green-700">{submission.feedback}</p>
                            )}
                          </div>
                        )}
                        
                        {submission.files.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Submitted Files:</h4>
                            <div className="space-y-2">
                              {submission.files.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <span className="text-sm text-gray-700">{file.name}</span>
                                  <span className="text-xs text-gray-500">
                                    {(file.size / 1024).toFixed(1)} KB
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📝</div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">No Submissions Yet</h4>
                    <p className="text-gray-600 mb-4">
                      Submit your assignment to see feedback here.
                    </p>
                    <button
                      onClick={() => setActiveTab('submit')}
                      className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
                    >
                      Submit Assignment
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </StudentRoute>
  );
};

export default StudentAssignmentDetailPage;
