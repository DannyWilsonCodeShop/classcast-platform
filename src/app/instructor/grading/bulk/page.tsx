'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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

const BulkGradingPage: React.FC = () => {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [currentSubmissionIndex, setCurrentSubmissionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isGrading, setIsGrading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Current submission being graded
  const [currentGrade, setCurrentGrade] = useState<number | ''>('');
  const [currentFeedback, setCurrentFeedback] = useState('');
  const [isAutoAdvance, setIsAutoAdvance] = useState(false);

  useEffect(() => {
    // Get course filter from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const courseFilter = urlParams.get('course');
    if (courseFilter) {
      setSelectedCourse(courseFilter);
    }
  }, []);

  useEffect(() => {
    // Comprehensive mock data for video submissions
    const mockSubmissions: Submission[] = [
      {
        id: 'sub1',
        studentName: 'Alex Thompson',
        studentId: 'student_001',
        assignmentTitle: 'Derivatives and Limits - Video Lesson',
        assignmentId: 'assignment_1',
        courseName: 'Introduction to Calculus',
        courseCode: 'MATH101',
        submittedAt: '2024-01-22T14:30:00Z',
        status: 'pending',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
        duration: 320,
        fileSize: 45000000
      },
      {
        id: 'sub2',
        studentName: 'Maria Rodriguez',
        studentId: 'student_002',
        assignmentTitle: 'Binary Tree Implementation - Video Assessment',
        assignmentId: 'assignment_6',
        courseName: 'Data Structures & Algorithms',
        courseCode: 'CS301',
        submittedAt: '2024-01-22T12:15:00Z',
        status: 'pending',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg',
        duration: 480,
        fileSize: 62000000
      },
      {
        id: 'sub3',
        studentName: 'James Wilson',
        studentId: 'student_003',
        assignmentTitle: 'Thermodynamics Concepts - Video Lesson',
        assignmentId: 'assignment_5',
        courseName: 'Physics for Engineers',
        courseCode: 'PHYS201',
        submittedAt: '2024-01-21T10:45:00Z',
        status: 'graded',
        grade: 92,
        feedback: 'Outstanding explanation! Your real-world examples made complex concepts accessible.',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg',
        duration: 420,
        fileSize: 58000000
      },
      {
        id: 'sub4',
        studentName: 'Sarah Kim',
        studentId: 'student_004',
        assignmentTitle: 'Renaissance Period Analysis - Video Discussion',
        assignmentId: 'assignment_10',
        courseName: 'World History',
        courseCode: 'HIST201',
        submittedAt: '2024-01-21T16:20:00Z',
        status: 'pending',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg',
        duration: 380,
        fileSize: 52000000
      },
      {
        id: 'sub5',
        studentName: 'David Chen',
        studentId: 'student_005',
        assignmentTitle: 'Integration Techniques - Video Assessment',
        assignmentId: 'assignment_2',
        courseName: 'Introduction to Calculus',
        courseCode: 'MATH101',
        submittedAt: '2024-01-20T14:10:00Z',
        status: 'graded',
        grade: 95,
        feedback: 'Excellent work! Your explanation of the substitution method was very clear.',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerFun.jpg',
        duration: 350,
        fileSize: 48000000
      },
      {
        id: 'sub6',
        studentName: 'Emma Johnson',
        studentId: 'student_006',
        assignmentTitle: 'Mitosis Process - Video Lesson',
        assignmentId: 'assignment_11',
        courseName: 'Cell Biology',
        courseCode: 'BIO150',
        submittedAt: '2024-01-20T11:30:00Z',
        status: 'pending',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg',
        duration: 290,
        fileSize: 41000000
      },
      {
        id: 'sub7',
        studentName: 'Michael Brown',
        studentId: 'student_007',
        assignmentTitle: 'Technical Documentation - Video Lesson',
        assignmentId: 'assignment_8',
        courseName: 'Technical Writing',
        courseCode: 'ENG101',
        submittedAt: '2024-01-19T15:45:00Z',
        status: 'graded',
        grade: 88,
        feedback: 'Good technical content and clear explanations. Consider improving the visual presentation.',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerMeltdowns.jpg',
        duration: 400,
        fileSize: 55000000
      },
      {
        id: 'sub8',
        studentName: 'Lisa Garcia',
        studentId: 'student_008',
        assignmentTitle: 'Memory Systems - Video Discussion',
        assignmentId: 'assignment_12',
        courseName: 'Introduction to Psychology',
        courseCode: 'PSYC101',
        submittedAt: '2024-01-19T13:20:00Z',
        status: 'pending',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg',
        duration: 310,
        fileSize: 43000000
      }
    ];

    setSubmissions(mockSubmissions);
    setIsLoading(false);
  }, []);

  // Video controls
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Navigation between submissions
  const goToNextSubmission = () => {
    if (currentSubmissionIndex < filteredSubmissions.length - 1) {
      setCurrentSubmissionIndex(currentSubmissionIndex + 1);
      setCurrentGrade('');
      setCurrentFeedback('');
      setIsPlaying(false);
    }
  };

  const goToPreviousSubmission = () => {
    if (currentSubmissionIndex > 0) {
      setCurrentSubmissionIndex(currentSubmissionIndex - 1);
      setCurrentGrade('');
      setCurrentFeedback('');
      setIsPlaying(false);
    }
  };

  const goToSubmission = (index: number) => {
    setCurrentSubmissionIndex(index);
    setCurrentGrade('');
    setCurrentFeedback('');
    setIsPlaying(false);
  };

  // Grading functions
  const handleGradeSubmission = async () => {
    if (!currentGrade || currentSubmissionIndex >= filteredSubmissions.length) return;

    setIsGrading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update submission with grade
      setSubmissions(prev => prev.map(sub => 
        sub.id === filteredSubmissions[currentSubmissionIndex].id
          ? {
              ...sub,
              status: 'graded' as const,
              grade: Number(currentGrade),
              feedback: currentFeedback || 'Graded'
            }
          : sub
      ));
      
      setCurrentGrade('');
      setCurrentFeedback('');
      
      // Auto-advance to next submission if enabled
      if (isAutoAdvance && currentSubmissionIndex < filteredSubmissions.length - 1) {
        setTimeout(() => {
          goToNextSubmission();
        }, 1000);
      }
    } catch (error) {
      console.error('Error grading submission:', error);
      alert('Error grading submission. Please try again.');
    } finally {
      setIsGrading(false);
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    return selectedCourse === 'all' || submission.courseName.toLowerCase().includes(selectedCourse.toLowerCase());
  });

  const currentSubmission = filteredSubmissions[currentSubmissionIndex];

  // Format time helper
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format file size helper
  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
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

  if (filteredSubmissions.length === 0) {
    return (
      <InstructorRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
          <div className="text-center">
            <div className="text-6xl mb-4">📹</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">No Submissions Found</h1>
            <p className="text-gray-600 mb-6">No video submissions match your current filter.</p>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-blue-500 text-white rounded-xl font-bold hover:shadow-lg transition-all duration-300"
            >
              ← Back to Dashboard
            </button>
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.back()}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <span className="text-2xl">←</span>
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 mb-1">
                    Video Grading Interface
                  </h1>
                  <p className="text-gray-600 text-sm">
                    {currentSubmissionIndex + 1} of {filteredSubmissions.length} submissions
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Course Filter */}
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="all">All Courses</option>
                  <option value="calculus">Introduction to Calculus</option>
                  <option value="computer">Data Structures & Algorithms</option>
                  <option value="physics">Physics for Engineers</option>
                  <option value="history">World History</option>
                  <option value="biology">Cell Biology</option>
                  <option value="english">Technical Writing</option>
                  <option value="psychology">Introduction to Psychology</option>
                </select>
                
                {/* Auto-advance toggle */}
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isAutoAdvance}
                    onChange={(e) => setIsAutoAdvance(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span>Auto-advance</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
            
            {/* Video Player - Left Side */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-white/20 p-6">
              {currentSubmission ? (
                <div className="h-full flex flex-col">
                  {/* Video Player */}
                  <div className="flex-1 bg-black rounded-lg overflow-hidden mb-4">
                    <video
                      ref={videoRef}
                      src={currentSubmission.fileUrl}
                      className="w-full h-full object-contain"
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onEnded={() => setIsPlaying(false)}
                    />
                  </div>
                  
                  {/* Video Controls */}
                  <div className="space-y-4">
                    {/* Progress Bar */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600 w-12">{formatTime(currentTime)}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-200"
                          style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-12">{formatTime(duration)}</span>
                    </div>
                    
                    {/* Control Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={handlePlayPause}
                          className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                        >
                          {isPlaying ? '⏸️' : '▶️'}
                        </button>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Speed:</span>
                          {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(speed => (
                            <button
                              key={speed}
                              onClick={() => handleSpeedChange(speed)}
                              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                playbackSpeed === speed
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {speed}x
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        {formatFileSize(currentSubmission.fileSize)} • {formatTime(currentSubmission.duration)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📹</div>
                    <p>No submission selected</p>
                  </div>
                </div>
              )}
            </div>

            {/* Grading Panel - Right Side */}
            <div className="bg-white rounded-2xl shadow-xl border border-white/20 p-6">
              {currentSubmission ? (
                <div className="h-full flex flex-col">
                  {/* Submission Info */}
                  <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-2">
                      {currentSubmission.studentName}
                    </h2>
                    <p className="text-sm text-gray-600 mb-1">
                      {currentSubmission.assignmentTitle}
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      {currentSubmission.courseName} ({currentSubmission.courseCode})
                    </p>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(currentSubmission.status)}`}>
                        {getStatusText(currentSubmission.status)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(currentSubmission.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Grading Form */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Grade (0-100)
                      </label>
                      <input
                        type="number"
                        value={currentGrade}
                        onChange={(e) => setCurrentGrade(e.target.value ? Number(e.target.value) : '')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                        max="100"
                        placeholder="Enter grade"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Feedback
                      </label>
                      <textarea
                        value={currentFeedback}
                        onChange={(e) => setCurrentFeedback(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter detailed feedback for the student..."
                      />
                    </div>
                    
                    <button
                      onClick={handleGradeSubmission}
                      disabled={!currentGrade || isGrading}
                      className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGrading ? 'Grading...' : 'Grade Submission'}
                    </button>
                  </div>

                  {/* Navigation */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={goToPreviousSubmission}
                        disabled={currentSubmissionIndex === 0}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ← Previous
                      </button>
                      <button
                        onClick={goToNextSubmission}
                        disabled={currentSubmissionIndex === filteredSubmissions.length - 1}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next →
                      </button>
                    </div>
                    
                    {/* Submission List */}
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {filteredSubmissions.map((submission, index) => (
                        <button
                          key={submission.id}
                          onClick={() => goToSubmission(index)}
                          className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                            index === currentSubmissionIndex
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate">{submission.studentName}</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              submission.status === 'graded' ? 'bg-green-100 text-green-800' :
                              submission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {submission.grade ? `${submission.grade}%` : submission.status}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📝</div>
                    <p>Select a submission to grade</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </InstructorRoute>
  );
};

export default BulkGradingPage;
