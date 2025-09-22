'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';

interface Submission {
  id: string;
  studentName: string;
  studentId: string;
  assignmentTitle: string;
  assignmentId: string;
  courseName: string;
  courseCode: string;
  submittedAt: string;
  status: 'pending' | 'graded' | 'returned';
  grade?: number;
  feedback?: string;
  fileUrl: string;
  thumbnailUrl: string;
  duration: number; // in seconds
  fileSize: number; // in bytes
}

const SubmissionsListContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedAssignment, setSelectedAssignment] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    // Get filters from URL params
    const courseFilter = searchParams.get('course');
    const assignmentFilter = searchParams.get('assignment');
    
    if (courseFilter) {
      setSelectedCourse(courseFilter);
    }
    if (assignmentFilter) {
      setSelectedAssignment(assignmentFilter);
    }
  }, [searchParams]);

  useEffect(() => {
    // Comprehensive mock data for video submissions
    const mockSubmissions: Submission[] = [
      {
        id: 'sub1',
        studentName: 'Alex Thompson',
        studentId: 'student_001',
        assignmentTitle: 'Derivatives and Limits - Video Lesson',
        assignmentId: 'assignment_1',
        courseName: 'Introduction to Computer Science',
        courseCode: 'CS101',
        submittedAt: '2024-01-15T10:30:00Z',
        status: 'graded',
        grade: 85,
        feedback: 'Good work on explaining the concepts clearly.',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
        duration: 120,
        fileSize: 15000000
      },
      {
        id: 'sub2',
        studentName: 'Sarah Chen',
        studentId: 'student_002',
        assignmentTitle: 'Derivatives and Limits - Video Lesson',
        assignmentId: 'assignment_1',
        courseName: 'Introduction to Computer Science',
        courseCode: 'CS101',
        submittedAt: '2024-01-15T14:20:00Z',
        status: 'graded',
        grade: 92,
        feedback: 'Excellent explanation and clear presentation.',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg',
        duration: 180,
        fileSize: 22000000
      },
      {
        id: 'sub3',
        studentName: 'Marcus Johnson',
        studentId: 'student_003',
        assignmentTitle: 'Derivatives and Limits - Video Lesson',
        assignmentId: 'assignment_1',
        courseName: 'Introduction to Computer Science',
        courseCode: 'CS101',
        submittedAt: '2024-01-16T09:15:00Z',
        status: 'pending',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg',
        duration: 95,
        fileSize: 12000000
      },
      {
        id: 'sub4',
        studentName: 'Emily Rodriguez',
        studentId: 'student_004',
        assignmentTitle: 'Derivatives and Limits - Video Lesson',
        assignmentId: 'assignment_1',
        courseName: 'Introduction to Computer Science',
        courseCode: 'CS101',
        submittedAt: '2024-01-16T16:45:00Z',
        status: 'graded',
        grade: 78,
        feedback: 'Good effort, but could improve on clarity.',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg',
        duration: 140,
        fileSize: 18000000
      },
      {
        id: 'sub5',
        studentName: 'David Kim',
        studentId: 'student_005',
        assignmentTitle: 'Derivatives and Limits - Video Lesson',
        assignmentId: 'assignment_1',
        courseName: 'Introduction to Computer Science',
        courseCode: 'CS101',
        submittedAt: '2024-01-17T11:30:00Z',
        status: 'pending',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerFun.jpg',
        duration: 200,
        fileSize: 25000000
      }
    ];

    setSubmissions(mockSubmissions);
    setIsLoading(false);
  }, []);

  const filteredSubmissions = submissions.filter(submission => {
    const courseMatch = selectedCourse === 'all' || 
      submission.courseName.toLowerCase().includes(selectedCourse.toLowerCase()) ||
      submission.courseCode.toLowerCase().includes(selectedCourse.toLowerCase()) ||
      submission.courseCode.toLowerCase().replace('-', '').includes(selectedCourse.toLowerCase().replace('-', ''));
    const assignmentMatch = selectedAssignment === 'all' || submission.assignmentId === selectedAssignment;
    const statusMatch = statusFilter === 'all' || submission.status === statusFilter;
    
    return courseMatch && assignmentMatch && statusMatch;
  });

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'graded':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'returned':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <InstructorRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading submissions...</p>
          </div>
        </div>
      </InstructorRoute>
    );
  }

  return (
    <InstructorRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.back()}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ←
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Video Submissions</h1>
                  <p className="text-gray-600">Review and manage student video submissions</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push(`/instructor/grading/bulk?assignment=${selectedAssignment}&course=${selectedCourse}`)}
                  className="px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors"
                >
                  Start Grading →
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Filters */}
          <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search submissions..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="graded">Graded</option>
                <option value="returned">Returned</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4 text-center">
              <div className="text-2xl font-bold text-[#4A90E2]">{filteredSubmissions.length}</div>
              <div className="text-sm text-gray-600">Total Submissions</div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4 text-center">
              <div className="text-2xl font-bold text-[#9B5DE5]">
                {filteredSubmissions.filter(s => s.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4 text-center">
              <div className="text-2xl font-bold text-[#06D6A0]">
                {filteredSubmissions.filter(s => s.status === 'graded').length}
              </div>
              <div className="text-sm text-gray-600">Graded</div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4 text-center">
              <div className="text-2xl font-bold text-[#FF6F61]">
                {filteredSubmissions.filter(s => s.status === 'graded').reduce((sum, s) => sum + (s.grade || 0), 0) / 
                 Math.max(filteredSubmissions.filter(s => s.status === 'graded').length, 1)}
              </div>
              <div className="text-sm text-gray-600">Avg Grade</div>
            </div>
          </div>

          {/* Submissions List */}
          <div className="bg-white rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="space-y-4">
              {filteredSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="p-4 rounded-lg border-2 border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-start space-x-4">
                    {/* Video Thumbnail */}
                    <div className="flex-shrink-0">
                      <div className="w-32 h-20 bg-black rounded-lg overflow-hidden relative">
                        <img
                          src={submission.thumbnailUrl}
                          alt="Video thumbnail"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <span className="text-white text-xs font-medium">
                            {formatTime(submission.duration)}
                          </span>
                        </div>
                        <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                          HD
                        </div>
                      </div>
                    </div>

                    {/* Video Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {submission.studentName}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                          {submission.grade ? `${submission.grade}%` : submission.status}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {submission.assignmentTitle}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>📅 {new Date(submission.submittedAt).toLocaleDateString()}</span>
                        <span>📊 {formatFileSize(submission.fileSize)}</span>
                        <span>🎥 {submission.courseCode}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => router.push(`/instructor/grading/bulk?assignment=${submission.assignmentId}&course=${submission.courseCode.toLowerCase()}&submission=${submission.id}`)}
                        className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-blue-500 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300"
                      >
                        Grade
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

const SubmissionsListPage: React.FC = () => {
  return (
    <Suspense fallback={
      <InstructorRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </InstructorRoute>
    }>
      <SubmissionsListContent />
    </Suspense>
  );
};

export default SubmissionsListPage;