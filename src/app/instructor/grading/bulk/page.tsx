'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';

interface Submission {
  id: string;
  studentName: string;
  studentId: string;
  assignmentTitle: string;
  assignmentId: string;
  submittedAt: string;
  status: 'pending' | 'graded' | 'returned';
  grade?: number;
  feedback?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
}

const BulkGradingPage: React.FC = () => {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);
  const [bulkGrade, setBulkGrade] = useState('');
  const [bulkFeedback, setBulkFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGrading, setIsGrading] = useState(false);

  useEffect(() => {
    // Mock data for submissions
    const mockSubmissions: Submission[] = [
      {
        id: 'sub1',
        studentName: 'Alice Johnson',
        studentId: 'stu001',
        assignmentTitle: 'Introduction Video Assignment',
        assignmentId: 'assign1',
        submittedAt: '2024-01-20T14:30:00Z',
        status: 'pending',
        fileUrl: '/api/placeholder/video',
        thumbnailUrl: '/api/placeholder/150/100'
      },
      {
        id: 'sub2',
        studentName: 'Bob Smith',
        studentId: 'stu002',
        assignmentTitle: 'Introduction Video Assignment',
        assignmentId: 'assign1',
        submittedAt: '2024-01-20T15:45:00Z',
        status: 'pending',
        fileUrl: '/api/placeholder/video',
        thumbnailUrl: '/api/placeholder/150/100'
      },
      {
        id: 'sub3',
        studentName: 'Carol Davis',
        studentId: 'stu003',
        assignmentTitle: 'Introduction Video Assignment',
        assignmentId: 'assign1',
        submittedAt: '2024-01-20T16:20:00Z',
        status: 'graded',
        grade: 85,
        feedback: 'Good work! Consider adding more examples.',
        fileUrl: '/api/placeholder/video',
        thumbnailUrl: '/api/placeholder/150/100'
      },
      {
        id: 'sub4',
        studentName: 'David Wilson',
        studentId: 'stu004',
        assignmentTitle: 'Introduction Video Assignment',
        assignmentId: 'assign1',
        submittedAt: '2024-01-20T17:10:00Z',
        status: 'pending',
        fileUrl: '/api/placeholder/video',
        thumbnailUrl: '/api/placeholder/150/100'
      },
      {
        id: 'sub5',
        studentName: 'Eva Brown',
        studentId: 'stu005',
        assignmentTitle: 'Introduction Video Assignment',
        assignmentId: 'assign1',
        submittedAt: '2024-01-20T18:30:00Z',
        status: 'pending',
        fileUrl: '/api/placeholder/video',
        thumbnailUrl: '/api/placeholder/150/100'
      }
    ];

    setSubmissions(mockSubmissions);
    setIsLoading(false);
  }, []);

  const handleSelectSubmission = (submissionId: string) => {
    setSelectedSubmissions(prev => 
      prev.includes(submissionId) 
        ? prev.filter(id => id !== submissionId)
        : [...prev, submissionId]
    );
  };

  const handleSelectAll = () => {
    const pendingSubmissions = submissions
      .filter(sub => sub.status === 'pending')
      .map(sub => sub.id);
    
    setSelectedSubmissions(prev => 
      prev.length === pendingSubmissions.length ? [] : pendingSubmissions
    );
  };

  const handleBulkGrade = async () => {
    if (selectedSubmissions.length === 0 || !bulkGrade) return;

    setIsGrading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update submissions with bulk grade
      setSubmissions(prev => prev.map(sub => 
        selectedSubmissions.includes(sub.id)
          ? {
              ...sub,
              status: 'graded' as const,
              grade: parseInt(bulkGrade),
              feedback: bulkFeedback || 'Bulk graded'
            }
          : sub
      ));
      
      setSelectedSubmissions([]);
      setBulkGrade('');
      setBulkFeedback('');
      
      alert(`Successfully graded ${selectedSubmissions.length} submissions!`);
    } catch (error) {
      console.error('Error bulk grading:', error);
      alert('Error grading submissions. Please try again.');
    } finally {
      setIsGrading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'graded':
        return 'bg-green-100 text-green-800';
      case 'returned':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'graded':
        return 'Graded';
      case 'returned':
        return 'Returned';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <InstructorRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading submissions...</p>
          </div>
        </div>
      </InstructorRoute>
    );
  }

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
                  <span className="text-2xl">←</span>
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    Bulk Grading
                  </h1>
                  <p className="text-gray-600">
                    Grade multiple submissions at once
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">
                  {selectedSubmissions.length} selected
                </span>
                <button
                  onClick={handleBulkGrade}
                  disabled={selectedSubmissions.length === 0 || !bulkGrade || isGrading}
                  className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-blue-500 text-white rounded-xl font-bold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGrading ? 'Grading...' : 'Grade Selected'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Bulk Actions */}
          <div className="bg-white rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Bulk Actions</h2>
            
            <div className="flex items-center space-x-4 mb-4">
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {selectedSubmissions.length === submissions.filter(s => s.status === 'pending').length 
                  ? 'Deselect All' 
                  : 'Select All Pending'
                }
              </button>
              <span className="text-sm text-gray-600">
                {submissions.filter(s => s.status === 'pending').length} pending submissions
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade (0-100)
                </label>
                <input
                  type="number"
                  value={bulkGrade}
                  onChange={(e) => setBulkGrade(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  max="100"
                  placeholder="Enter grade"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback (Optional)
                </label>
                <input
                  type="text"
                  value={bulkFeedback}
                  onChange={(e) => setBulkFeedback(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter feedback"
                />
              </div>
            </div>
          </div>

          {/* Submissions List */}
          <div className="bg-white rounded-2xl shadow-xl border border-white/20 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Submissions</h2>
            
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    selectedSubmissions.includes(submission.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedSubmissions.includes(submission.id)}
                      onChange={() => handleSelectSubmission(submission.id)}
                      disabled={submission.status !== 'pending'}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    
                    <div className="w-24 h-16 bg-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={submission.thumbnailUrl}
                        alt="Video thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {submission.studentName}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">
                        {submission.assignmentTitle}
                      </p>
                      <p className="text-xs text-gray-500">
                        Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                        {getStatusText(submission.status)}
                      </span>
                      
                      {submission.grade && (
                        <span className="text-lg font-bold text-gray-800">
                          {submission.grade}%
                        </span>
                      )}
                      
                      <button
                        onClick={() => {
                          // Navigate to individual submission review
                          console.log('Review submission:', submission.id);
                        }}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </InstructorRoute>
  );
};

export default BulkGradingPage;
