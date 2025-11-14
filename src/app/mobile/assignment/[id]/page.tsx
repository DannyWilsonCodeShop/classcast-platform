'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import VideoInteractions from '@/components/video/VideoInteractions';
import Link from 'next/link';

interface Student {
  id: string;
  name: string;
  avatar: string;
  profilePicture?: string;
  grade: string;
  major: string;
  videoStats: {
    totalViews: number;
    totalLikes: number;
    totalVideos: number;
    publicVideos: number;
  };
}

interface VideoSubmission {
  id: string;
  student: Student;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: string;
  submittedAt: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  views: number;
  rating: number;
  isPublic: boolean;
}

export default function MobileAssignmentDetailPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  
  const [assignment, setAssignment] = useState<any>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoSubmission | null>(null);
  const [showStudentProfile, setShowStudentProfile] = useState<Student | null>(null);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }

    // Mock assignment data
    const mockAssignment = {
      id: '1',
      title: 'The Science of Climate Change: Video Essay',
      course: 'Environmental Science 101',
      instructor: 'Dr. Anya Sharma',
      dueDate: '2024-10-26',
      points: 100,
      description: 'Create a 3-5 minute video essay explaining a specific aspect of climate change, its impacts, and potential solutions.',
      submissions: [
        {
          id: '1',
          student: {
            id: 's1',
            name: 'Sarah Chen',
            avatar: 'SC',
            profilePicture: null,
            grade: '11th Grade',
            major: 'Mathematics',
            videoStats: {
              totalViews: 1247,
              totalLikes: 89,
              totalVideos: 12,
              publicVideos: 8
            }
          },
          title: 'Rising Tides: Impact on Coastal Cities',
          description: 'I break down the quadratic formula and show two different methods to solve these equations.',
          thumbnailUrl: '/thumbnails/quadratic-1.jpg',
          duration: '4:32',
          submittedAt: '2024-01-15T10:30:00Z',
          likes: 12,
          comments: 5,
          isLiked: false,
          views: 45,
          rating: 4.8,
          isPublic: true
        },
        {
          id: '2',
          student: {
            id: 's2',
            name: 'Marcus Rodriguez',
            avatar: 'MR',
            profilePicture: null,
            grade: '11th Grade',
            major: 'Engineering',
            videoStats: {
              totalViews: 2156,
              totalLikes: 156,
              totalVideos: 15,
              publicVideos: 12
            }
          },
          title: 'The Greenhouse Effect Explained',
          description: 'I use graphs and visual representations to explain quadratic equations.',
          thumbnailUrl: '/thumbnails/quadratic-2.jpg',
          duration: '3:45',
          submittedAt: '2024-01-14T14:20:00Z',
          likes: 18,
          comments: 8,
          isLiked: true,
          views: 62,
          rating: 4.9,
          isPublic: true
        },
        {
          id: '3',
          student: {
            id: 's3',
            name: 'Emma Thompson',
            avatar: 'ET',
            profilePicture: null,
            grade: '11th Grade',
            major: 'Science',
            videoStats: {
              totalViews: 892,
              totalLikes: 67,
              totalVideos: 9,
              publicVideos: 6
            }
          },
          title: 'Renewable Energy Solutions for a Greener Future',
          description: 'I show a systematic approach to solving quadratic equations with clear examples.',
          thumbnailUrl: '/thumbnails/quadratic-3.jpg',
          duration: '5:15',
          submittedAt: '2024-01-13T16:45:00Z',
          likes: 9,
          comments: 3,
          isLiked: false,
          views: 38,
          rating: 4.6,
          isPublic: false
        }
      ]
    };

    setAssignment(mockAssignment);
    setSelectedVideo(mockAssignment.submissions[0]);
  }, [id, user, isAuthenticated, isLoading, router]);

  const handleLike = (submissionId: string) => {
    setAssignment(prev => {
      if (!prev) return null;
      const updatedSubmissions = prev.submissions.map(sub =>
        sub.id === submissionId
          ? { ...sub, likes: sub.isLiked ? sub.likes - 1 : sub.likes + 1, isLiked: !sub.isLiked }
          : sub
      );
      return { ...prev, submissions: updatedSubmissions };
    });
  };

  const handleVideoLike = (videoId: string) => {
    console.log('Liked video:', videoId);
    // In a real app, this would update the backend
  };

  const handleVideoComment = (videoId: string, comment: string) => {
    console.log('Commented on video:', videoId, comment);
    // In a real app, this would save the comment to the backend
  };

  const handleVideoResponse = (videoId: string, response: string) => {
    console.log('Graded response submitted for video:', videoId, response);
    // In a real app, this would submit the response for grading
  };

  const handleVideoShare = (videoId: string, type: 'internal' | 'external') => {
    if (type === 'internal') {
      console.log('Sharing video internally:', videoId);
      // In a real app, this would open a student selection modal
    } else {
      console.log('Sharing video externally:', videoId);
      // In a real app, this would copy link or open social sharing
      navigator.clipboard.writeText(`https://classcast.app/video/${videoId}`);
      alert('Video link copied to clipboard!');
    }
  };

  if (isLoading || !assignment) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
        <LoadingSpinner text="Loading..." />
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50 flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-4 rounded-b-2xl flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <Link 
            href="/mobile"
            className="flex items-center text-green-100 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <h1 className="text-lg font-bold text-center flex-1">Assignment</h1>
          <div className="w-6"></div>
        </div>
        
        <div className="text-center">
          <h2 className="text-xl font-bold mb-1">{assignment.title}</h2>
          <p className="text-green-100 text-sm">{assignment.course} • {assignment.points} points</p>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Assignment Info */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-2">Instructions</h3>
            <p className="text-sm text-gray-600 mb-3">{assignment.description}</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
              <span className="text-gray-500">Instructor: {assignment.instructor}</span>
            </div>
          </div>

          {/* Video Player */}
          {selectedVideo && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="aspect-video bg-gray-200 rounded-lg mb-3 overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                  <div className="text-center text-gray-600">
                    <div className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                    <p className="text-sm font-medium">{selectedVideo.title}</p>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="font-bold text-gray-800 mb-2">{selectedVideo.title}</h4>
                <p className="text-sm text-gray-600 mb-3">{selectedVideo.description}</p>
                
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setShowStudentProfile(selectedVideo.student)}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{selectedVideo.student.avatar}</span>
                    </div>
                    <span className="font-semibold text-sm">{selectedVideo.student.name}</span>
                  </button>
                  <div className="flex items-center space-x-1 text-yellow-500">
                    <span className="text-sm">⭐</span>
                    <span className="text-sm font-bold">{selectedVideo.rating}</span>
                  </div>
                </div>
              </div>

              {/* Video Interactions */}
              <VideoInteractions
                videoId={selectedVideo.id}
                initialLikes={selectedVideo.likes}
                initialComments={selectedVideo.comments}
                initialViews={selectedVideo.views}
                isLiked={selectedVideo.isLiked}
                onLike={handleVideoLike}
                onComment={handleVideoComment}
                onResponse={handleVideoResponse}
                onShare={handleVideoShare}
              />
            </div>
          )}

          {/* Student Submissions List */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-3">Student Submissions ({assignment.submissions.length})</h3>
            <div className="space-y-3">
              {assignment.submissions.map((submission: VideoSubmission) => (
                <div
                  key={submission.id}
                  onClick={() => setSelectedVideo(submission)}
                  className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedVideo?.id === submission.id ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="w-16 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-800 text-sm truncate">{submission.title}</h4>
                    <p className="text-xs text-gray-600 truncate">by {submission.student.name}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-red-500">❤️ {submission.likes}</span>
                      <span className="text-xs text-blue-500">👁️ {submission.views}</span>
                      <span className="text-xs text-yellow-500">⭐ {submission.rating}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {submission.duration}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Student Profile Modal */}
      {showStudentProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Student Profile</h3>
              <button
                onClick={() => setShowStudentProfile(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">{showStudentProfile.avatar}</span>
              </div>
              <h4 className="text-xl font-bold text-gray-800">{showStudentProfile.name}</h4>
              <p className="text-gray-600">{showStudentProfile.grade} • {showStudentProfile.major}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{showStudentProfile.videoStats.totalViews.toLocaleString()}</div>
                <div className="text-xs text-gray-600">Total Views</div>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-600">{showStudentProfile.videoStats.totalLikes}</div>
                <div className="text-xs text-gray-600">Total Likes</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-600">{showStudentProfile.videoStats.totalVideos}</div>
                <div className="text-xs text-gray-600">Total Videos</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{showStudentProfile.videoStats.publicVideos}</div>
                <div className="text-xs text-gray-600">Public Videos</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
