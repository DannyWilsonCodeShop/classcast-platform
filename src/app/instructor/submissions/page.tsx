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
  courseName: string;
  courseId: string;
  submittedAt: string;
  status: 'pending' | 'graded' | 'returned';
  grade?: number;
  feedback?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  duration?: number; // in seconds
  fileSize?: number; // in bytes
}

const SubmissionsPage: React.FC = () => {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'graded' | 'returned'>('all');
  const [sortBy, setSortBy] = useState<'submittedAt' | 'studentName' | 'assignmentTitle' | 'grade'>('submittedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Mock submissions data
    const mockSubmissions: Submission[] = [
      {
        id: 'sub1',
        studentName: 'Alice Johnson',
        studentId: 'stu001',
        assignmentTitle: 'Introduction Video Assignment',
        assignmentId: 'assign1',
        courseName: 'Introduction to Computer Science',
        courseId: 'cs-101',
        submittedAt: '2024-01-22T14:30:00Z',
        status: 'pending',
        fileUrl: '/api/placeholder/video',
        thumbnailUrl: '/api/placeholder/150/100',
        duration: 180,
        fileSize: 15728640
      },
      {
        id: 'sub2',
        studentName: 'Bob Smith',
        studentId: 'stu002',
        assignmentTitle: 'Introduction Video Assignment',
        assignmentId: 'assign1',
        courseName: 'Introduction to Computer Science',
        courseId: 'cs-101',
        submittedAt: '2024-01-22T15:45:00Z',
        status: 'graded',
        grade: 85,
        feedback: 'Good work! Consider adding more examples in your explanation.',
        fileUrl: '/api/placeholder/video',
        thumbnailUrl: '/api/placeholder/150/100',
        duration: 195,
        fileSize: 20971520
      },
      {
        id: 'sub3',
        studentName: 'Carol Davis',
        studentId: 'stu003',
        assignmentTitle: 'Algorithm Analysis Project',
        assignmentId: 'assign2',
        courseName: 'Introduction to Computer Science',
        courseId: 'cs-101',
        submittedAt: '2024-01-21T16:20:00Z',
        status: 'graded',
        grade: 92,
        feedback: 'Excellent analysis! Your time complexity explanation was very clear.',
        fileUrl: '/api/placeholder/video',
        thumbnailUrl: '/api/placeholder/150/100',
        duration: 240,
        fileSize: 25165824
      },
      {
        id: 'sub4',
        studentName: 'David Wilson',
        studentId: 'stu004',
        assignmentTitle: 'Introduction Video Assignment',
        assignmentId: 'assign1',
        courseName: 'Introduction to Computer Science',
        courseId: 'cs-101',
        submittedAt: '2024-01-22T17:10:00Z',
        status: 'pending',
        fileUrl: '/api/placeholder/video',
        thumbnailUrl: '/api/placeholder/150/100',
        duration: 165,
        fileSize: 12582912
      },
      {
        id: 'sub5',
        studentName: 'Eva Brown',
        studentId: 'stu005',
        assignmentTitle: 'Creative Writing Exercise',
        assignmentId: 'assign3',
        courseName: 'Creative Writing Workshop',
        courseId: 'eng-102',
        submittedAt: '2024-01-22T18:30:00Z',
        status: 'returned',
        grade: 78,
        feedback: 'Good start! Try to develop your characters more deeply.',
        fileUrl: '/api/placeholder/video',
        thumbnailUrl: '/api/placeholder/150/100',
        duration: 210,
        fileSize: 18874368
      },
      {
        id: 'sub6',
        studentName: 'Frank Miller',
        studentId: 'stu006',
        assignmentTitle: 'Calculus Problem Set',
        assignmentId: 'assign4',
        courseName: 'Calculus II',
        courseId: 'math-201',
        submittedAt: '2024-01-21T19:15:00Z',
        status: 'graded',
        grade: 88,
        feedback: 'Well done! Check your work on problem 3.',
        fileUrl: '/api/placeholder/video',
        thumbnailUrl: '/api/placeholder/150/100',
        duration: 300,
        fileSize: 31457280
      }
    ];

    setSubmissions(mockSubmissions);
    setIsLoading(false);
  }, []);

  const filteredSubmissions = submissions.filter(submission => {
    const matchesFilter = filter === 'all' || submission.status === filter;
    const matchesSearch = searchTerm === '' || 
      submission.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.assignmentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.courseName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'submittedAt':
        comparison = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
        break;
      case 'studentName':
        comparison = a.studentName.localeCompare(b.studentName);
        break;
      case 'assignmentTitle':
        comparison = a.assignmentTitle.localeCompare(b.assignmentTitle);
        break;
      case 'grade':
        comparison = (a.grade || 0) - (b.grade || 0);
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

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
        return 'Pending Review';
      case 'graded':
        return 'Graded';
      case 'returned':
        return 'Returned';
      default:
        return status;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleGradeSubmission = (submissionId: string) => {
    // Navigate to grading page
    router.push(`/instructor/submissions/${submissionId}/grade`);
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
                    Student Submissions
                  </h1>
                  <p className="text-gray-600">
                    Review and grade student submissions
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => router.push('/instructor/grading/bulk')}
                  className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-blue-500 text-white rounded-xl font-bold hover:shadow-lg transition-all duration-300"
                >
                  Bulk Grade
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters and Search */}
          <div className="bg-white rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex space-x-2">
                  {(['all', 'pending', 'graded', 'returned'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilter(status)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filter === status
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="submittedAt">Sort by Date</option>
                  <option value="studentName">Sort by Student</option>
                  <option value="assignmentTitle">Sort by Assignment</option>
                  <option value="grade">Sort by Grade</option>
                </select>
                
                <button
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
              
              <div className="flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search submissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Submissions List */}
          <div className="bg-white rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {filteredSubmissions.length} Submissions
              </h2>
            </div>
            
            <div className="space-y-4">
              {sortedSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-32 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={submission.thumbnailUrl}
                        alt="Video thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-800 text-lg">
                            {submission.studentName}
                          </h3>
                          <p className="text-gray-600 font-medium">
                            {submission.assignmentTitle}
                          </p>
                          <p className="text-sm text-gray-500">
                            {submission.courseName}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(submission.status)}`}>
                            {getStatusText(submission.status)}
                          </span>
                          
                          {submission.grade && (
                            <span className="text-xl font-bold text-gray-800">
                              {submission.grade}%
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <span>
                            Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                          </span>
                          {submission.duration && (
                            <span>Duration: {formatDuration(submission.duration)}</span>
                          )}
                          {submission.fileSize && (
                            <span>Size: {formatFileSize(submission.fileSize)}</span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              // Navigate to submission detail
                              console.log('View submission:', submission.id);
                            }}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                          >
                            View
                          </button>
                          
                          {submission.status === 'pending' && (
                            <button
                              onClick={() => handleGradeSubmission(submission.id)}
                              className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                            >
                              Grade
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {submission.feedback && (
                        <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Feedback:</span> {submission.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {sortedSubmissions.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Submissions Found</h3>
                <p className="text-gray-600">
                  {searchTerm ? 'No submissions match your search criteria.' : 'No submissions available for the selected filter.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </InstructorRoute>
  );
};

export default SubmissionsPage;
