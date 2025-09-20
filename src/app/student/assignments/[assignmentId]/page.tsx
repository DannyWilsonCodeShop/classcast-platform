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
  const [activeTab, setActiveTab] = useState<'details' | 'attachments' | 'feedback'>('details');

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
      <div className="h-screen overflow-hidden flex flex-col bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push(`/student/courses/${assignment.course.id}`)}
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
                  {assignment.course.code} • {assignment.course.instructor.name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(assignment.status)}`}>
                {getStatusIcon(assignment.status)} {assignment.status.replace('-', ' ')}
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

        {/* Navigation Tabs */}
        <div className="bg-white/90 backdrop-blur-sm px-4 py-2 flex-shrink-0">
          <div className="flex space-x-1">
            {[
              { id: 'details', label: 'Details', icon: '📋' },
              { id: 'attachments', label: 'Attachments', icon: '📎' },
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
            <button
              onClick={() => router.push('/student/video-submission')}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold text-xs hover:shadow-lg transition-all duration-200"
            >
              <span className="mr-1">🎥</span>
              Record Video
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'details' && (
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Instructions</h3>
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-gray-700 font-sans">
                        {assignment.instructions}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Details</h3>
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

          {activeTab === 'attachments' && (
            <div className="space-y-6">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment Attachments</h3>
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📎</div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">Attachments</h4>
                  <p className="text-gray-600 mb-4">
                    View and download assignment materials and resources.
                  </p>
                  <div className="text-sm text-gray-500">
                    No attachments available for this assignment.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="space-y-6">
              {assignment.submissions.length > 0 ? (
                <div className="space-y-6">
                  {/* Instructor Feedback */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-3">
                        👨‍🏫
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Instructor Feedback</h3>
                    </div>
                    
                    {assignment.submissions[0]?.grade && assignment.submissions[0]?.feedback ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-green-800">Grade: {assignment.submissions[0].grade}/{assignment.points}</h4>
                            <span className="text-sm text-green-600">
                              {((assignment.submissions[0].grade / assignment.points) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-green-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(assignment.submissions[0].grade / assignment.points) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="font-semibold text-blue-800 mb-2">Feedback</h4>
                          <p className="text-blue-700 whitespace-pre-wrap">{assignment.submissions[0].feedback}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">⏳</div>
                        <p className="text-gray-600">Waiting for instructor feedback...</p>
                      </div>
                    )}
                  </div>

                  {/* Peer Feedback */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-3">
                        👥
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Peer Feedback</h3>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Mock peer feedback data */}
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              SC
                            </div>
                            <span className="font-medium text-gray-800">Sarah Chen</span>
                          </div>
                          <span className="text-sm text-gray-500">2 days ago</span>
                        </div>
                        <p className="text-gray-700 text-sm">
                          "Great work on the implementation! Your code is well-structured and the comments are helpful. 
                          One suggestion: consider adding error handling for edge cases in the delete function."
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>👍 3</span>
                          <span>💬 Reply</span>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              MR
                            </div>
                            <span className="font-medium text-gray-800">Marcus Rodriguez</span>
                          </div>
                          <span className="text-sm text-gray-500">1 day ago</span>
                        </div>
                        <p className="text-gray-700 text-sm">
                          "Excellent algorithm choice! The time complexity is optimal. I learned a lot from your approach. 
                          Maybe you could add some test cases to demonstrate the functionality?"
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>👍 5</span>
                          <span>💬 Reply</span>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              ET
                            </div>
                            <span className="font-medium text-gray-800">Emma Thompson</span>
                          </div>
                          <span className="text-sm text-gray-500">3 hours ago</span>
                        </div>
                        <p className="text-gray-700 text-sm">
                          "Really impressive work! Your code is clean and easy to follow. The visualization you added 
                          really helps understand the tree structure. Keep it up!"
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>👍 2</span>
                          <span>💬 Reply</span>
                        </div>
                      </div>
                    </div>
                  </div>
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
                      onClick={() => setActiveTab('details')}
                      className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
                    >
                      View Assignment Details
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
