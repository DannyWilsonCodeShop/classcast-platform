'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface Assignment {
  assignmentId: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  courseId: string;
  courseName: string;
  courseCode: string;
}

interface VideoSubmission {
  submissionId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  videoUrl: string;
  thumbnailUrl?: string;
  submittedAt: string;
  duration: number;
  fileSize: number;
  grade?: number;
  feedback?: string;
  status: 'submitted' | 'graded';
}

const AssignmentGradingPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const assignmentId = params.assignmentId as string;
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<VideoSubmission[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Grading state
  const [currentGrade, setCurrentGrade] = useState<number | ''>('');
  const [currentFeedback, setCurrentFeedback] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // Fetch assignment and submissions
  useEffect(() => {
    const fetchData = async () => {
      if (!assignmentId || !user?.id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        console.log('🎯 Fetching assignment grading data for:', assignmentId);
        
        // Fetch assignment details
        const assignmentResponse = await fetch(`/api/assignments/${assignmentId}`, {
          credentials: 'include',
        });
        
        if (!assignmentResponse.ok) {
          throw new Error('Failed to fetch assignment details');
        }
        
        const assignmentData = await assignmentResponse.json();
        if (assignmentData.success && assignmentData.assignment) {
          setAssignment({
            assignmentId: assignmentData.assignment.assignmentId,
            title: assignmentData.assignment.title,
            description: assignmentData.assignment.description,
            dueDate: assignmentData.assignment.dueDate,
            maxScore: assignmentData.assignment.maxScore || 100,
            courseId: assignmentData.assignment.courseId,
            courseName: assignmentData.assignment.courseName || 'Unknown Course',
            courseCode: assignmentData.assignment.courseCode || 'N/A'
          });
        }
        
        // Fetch submissions for this specific assignment
        const submissionsResponse = await fetch(`/api/instructor/video-submissions?assignmentId=${assignmentId}`, {
          credentials: 'include',
        });
        
        if (!submissionsResponse.ok) {
          throw new Error('Failed to fetch submissions');
        }
        
        const submissionsData = await submissionsResponse.json();
        console.log('🎯 Assignment submissions response:', submissionsData);
        
        if (submissionsData.success && submissionsData.submissions) {
          const transformedSubmissions: VideoSubmission[] = submissionsData.submissions.map((sub: any) => ({
            submissionId: sub.submissionId || sub.id,
            studentId: sub.studentId,
            studentName: sub.student?.name || 'Unknown Student',
            studentEmail: sub.student?.email || '',
            videoUrl: sub.videoUrl,
            thumbnailUrl: sub.thumbnailUrl,
            submittedAt: sub.submittedAt || sub.createdAt,
            duration: sub.duration || 0,
            fileSize: sub.fileSize || 0,
            grade: sub.grade,
            feedback: sub.instructorFeedback || sub.feedback,
            status: sub.grade !== null && sub.grade !== undefined ? 'graded' : 'submitted'
          }));
          
          setSubmissions(transformedSubmissions);
          console.log('🎯 Set submissions:', transformedSubmissions.length);
          
          // Load first submission's grade and feedback
          if (transformedSubmissions.length > 0) {
            const firstSubmission = transformedSubmissions[0];
            setCurrentGrade(firstSubmission.grade || '');
            setCurrentFeedback(firstSubmission.feedback || '');
          }
        } else {
          console.log('🎯 No submissions found for assignment');
          setSubmissions([]);
        }
        
      } catch (err) {
        console.error('Error fetching assignment grading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load assignment data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [assignmentId, user?.id]);

  // Current submission
  const currentSubmission = submissions[currentIndex];

  // Navigation functions
  const goToNext = () => {
    if (currentIndex < submissions.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      const nextSubmission = submissions[nextIndex];
      setCurrentGrade(nextSubmission.grade || '');
      setCurrentFeedback(nextSubmission.feedback || '');
      setIsPlaying(false);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      const prevSubmission = submissions[prevIndex];
      setCurrentGrade(prevSubmission.grade || '');
      setCurrentFeedback(prevSubmission.feedback || '');
      setIsPlaying(false);
    }
  };

  const goToSubmission = (index: number) => {
    setCurrentIndex(index);
    const submission = submissions[index];
    setCurrentGrade(submission.grade || '');
    setCurrentFeedback(submission.feedback || '');
    setIsPlaying(false);
  };

  // Save grade function
  const saveGrade = async () => {
    if (!currentSubmission || !currentGrade) {
      alert('Please enter a grade before saving.');
      return;
    }

    setIsSaving(true);
    setSaveStatus('saving');
    
    try {
      const response = await fetch(`/api/submissions/${currentSubmission.submissionId}/grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          grade: Number(currentGrade),
          feedback: currentFeedback || '',
          status: 'graded'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save grade');
      }

      const data = await response.json();
      if (data.success) {
        // Update local state
        setSubmissions(prev => prev.map(sub =>
          sub.submissionId === currentSubmission.submissionId
            ? { ...sub, grade: Number(currentGrade), feedback: currentFeedback, status: 'graded' as const }
            : sub
        ));
        
        setSaveStatus('saved');
        
        // Auto-advance to next submission if available
        if (currentIndex < submissions.length - 1) {
          setTimeout(() => goToNext(), 1000);
        }
      } else {
        throw new Error(data.error || 'Failed to save grade');
      }
    } catch (error) {
      console.error('Error saving grade:', error);
      setSaveStatus('error');
      alert('Failed to save grade. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

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

  if (loading) {
    return (
      <InstructorRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <LoadingSpinner />
        </div>
      </InstructorRoute>
    );
  }

  if (error || !assignment) {
    return (
      <InstructorRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="text-6xl mb-4">😞</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Assignment Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The assignment you are looking for does not exist.'}</p>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </InstructorRoute>
    );
  }

  if (submissions.length === 0) {
    return (
      <InstructorRoute>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={() => router.back()}
                  className="text-gray-500 hover:text-gray-700 transition-colors mb-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 className="text-2xl font-bold text-gray-800">{assignment.title}</h1>
                <p className="text-gray-600">{assignment.courseName} ({assignment.courseCode})</p>
              </div>
            </div>
          </div>

          {/* No submissions message */}
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">No Submissions Yet</h2>
              <p className="text-gray-600 mb-6">Students haven't submitted any videos for this assignment yet.</p>
              <button
                onClick={() => router.back()}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors"
              >
                Back to Course
              </button>
            </div>
          </div>
        </div>
      </InstructorRoute>
    );
  }

  return (
    <InstructorRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{assignment.title}</h1>
                <p className="text-sm text-gray-600">{assignment.courseName} • {submissions.length} submissions</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Navigation */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={goToPrevious}
                  disabled={currentIndex === 0}
                  className="px-3 py-1 bg-gray-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                <span className="text-sm text-gray-600">
                  {currentIndex + 1} of {submissions.length}
                </span>
                <button
                  onClick={goToNext}
                  disabled={currentIndex === submissions.length - 1}
                  className="px-3 py-1 bg-gray-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
              
              {/* Playback Speed */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Speed:</span>
                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(speed => (
                  <button
                    key={speed}
                    onClick={() => handleSpeedChange(speed)}
                    className={`px-2 py-1 rounded text-xs ${
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
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video Player */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">{currentSubmission.studentName}</h2>
                  <p className="text-sm text-gray-600">
                    Submitted: {new Date(currentSubmission.submittedAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="bg-black rounded-lg overflow-hidden mb-4">
                  <video
                    ref={videoRef}
                    src={currentSubmission.videoUrl}
                    className="w-full h-96 object-contain"
                    controls
                    preload="none"
                    muted
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onLoadedMetadata={() => {
                      if (videoRef.current) {
                        videoRef.current.playbackRate = playbackSpeed;
                      }
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            </div>

            {/* Grading Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Grade Submission</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grade (0-{assignment.maxScore})
                    </label>
                    <input
                      type="number"
                      value={currentGrade}
                      onChange={(e) => setCurrentGrade(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      max={assignment.maxScore}
                      placeholder={`Enter grade (max: ${assignment.maxScore})`}
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
                      placeholder="Enter feedback for the student..."
                    />
                  </div>
                  
                  <button
                    onClick={saveGrade}
                    disabled={isSaving || !currentGrade}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : 'Save Grade'}
                  </button>
                  
                  {/* Save Status */}
                  <div className="flex items-center justify-center text-sm">
                    {saveStatus === 'saving' && (
                      <span className="text-blue-600">Saving...</span>
                    )}
                    {saveStatus === 'saved' && (
                      <span className="text-green-600">✓ Saved</span>
                    )}
                    {saveStatus === 'error' && (
                      <span className="text-red-600">✗ Save failed</span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Submission List */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">All Submissions</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {submissions.map((submission, index) => (
                    <button
                      key={submission.submissionId}
                      onClick={() => goToSubmission(index)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        index === currentIndex
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">{submission.studentName}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(submission.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          {submission.status === 'graded' ? (
                            <span className="text-green-600 font-medium">{submission.grade}%</span>
                          ) : (
                            <span className="text-gray-400 text-sm">Not graded</span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </InstructorRoute>
  );
};

export default AssignmentGradingPage;