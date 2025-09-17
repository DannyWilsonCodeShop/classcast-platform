'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import VideoInteractions from '@/components/video/VideoInteractions';
import { testDataGenerator, TestAssignment, TestVideoSubmission, TestUser } from '@/lib/testDataGenerator';
import Link from 'next/link';

type TabType = 'dashboard' | 'assignments' | 'community' | 'courses' | 'profile';

interface Reel {
  id: string;
  title: string;
  author: string;
  authorAvatar: string;
  thumbnailUrl: string;
  duration: string;
  likes: number;
  comments: number;
  views: number;
  isLiked: boolean;
  assignmentTitle: string;
  course: string;
  timestamp: string;
}

export default function MobileTestApp() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [showModal, setShowModal] = useState<string | null>(null);
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null);
  const [assignments, setAssignments] = useState<TestAssignment[]>([]);
  const [videos, setVideos] = useState<TestVideoSubmission[]>([]);
  const [students, setStudents] = useState<TestUser[]>([]);

  // Convert videos to reels format
  const reels: Reel[] = videos.map(video => ({
    id: video.id,
    title: video.title,
    author: `${video.student.firstName} ${video.student.lastName}`,
    authorAvatar: video.student.profilePicture || video.student.firstName.charAt(0),
    thumbnailUrl: video.thumbnailUrl,
    duration: video.duration,
    likes: video.likes,
    comments: video.comments,
    views: video.views,
    isLiked: video.isLiked,
    assignmentTitle: video.assignment.title,
    course: video.assignment.course.title,
    timestamp: new Date(video.submittedAt).toLocaleDateString()
  }));

  const handleReelLike = (reelId: string) => {
    console.log('Liked reel:', reelId);
  };

  const handleReelComment = (reelId: string, comment: string) => {
    console.log('Commented on reel:', reelId, comment);
  };

  const handleReelResponse = (reelId: string, response: string) => {
    console.log('Graded response submitted for reel:', reelId, response);
  };

  const handleReelShare = (reelId: string, type: 'internal' | 'external') => {
    if (type === 'internal') {
      console.log('Sharing reel internally:', reelId);
    } else {
      console.log('Sharing reel externally:', reelId);
      navigator.clipboard.writeText(`https://classcast.app/reel/${reelId}`);
      alert('Reel link copied to clipboard!');
    }
  };

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }

    try {
      // Generate test data
      testDataGenerator.generateAllData();
      
      // Get data
      setAssignments(testDataGenerator.getAssignments());
      setVideos(testDataGenerator.getVideos());
      setStudents(testDataGenerator.getUsersByRole('student'));
    } catch (error) {
      console.error('Error loading test data:', error);
    }
  }, [user, isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
        <LoadingSpinner text="Loading..." />
      </div>
    );
  }

  const recentAssignments = assignments.slice(0, 3);
  const recentVideos = videos.slice(0, 5);

  return (
    <div className="h-screen bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">ClassCast</h1>
            <p className="text-sm text-gray-600">Welcome back, {user?.firstName || 'Student'}!</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce"></div>
            <span className="text-sm text-gray-600 font-medium">Online</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'dashboard' && (
          <div className="h-full overflow-y-auto">
            {/* Quick Stats */}
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <div className="text-2xl font-bold text-blue-600">{assignments.length}</div>
                  <div className="text-sm text-gray-600">Assignments</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <div className="text-2xl font-bold text-green-600">{videos.length}</div>
                  <div className="text-sm text-gray-600">Videos</div>
                </div>
              </div>

              {/* Reels Section */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-gray-800">📹 Peer Reels</h2>
                  <span className="text-sm text-gray-500">Swipe to explore</span>
                </div>
                <div className="flex space-x-3 overflow-x-auto pb-2">
                  {reels.map((reel) => (
                    <div
                      key={reel.id}
                      onClick={() => setSelectedReel(reel)}
                      className="flex-shrink-0 w-32 bg-white rounded-xl shadow-sm border border-gray-200 active:scale-95 transition-transform"
                    >
                      <div className="relative">
                        <div className="aspect-video bg-gray-200 rounded-t-xl overflow-hidden">
                          <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                            <div className="text-center text-gray-600">
                              <div className="w-8 h-8 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z"/>
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
                          {reel.duration}
                        </div>
                      </div>
                      <div className="p-2">
                        <h3 className="font-bold text-gray-800 text-xs line-clamp-2 mb-1">{reel.title}</h3>
                        <p className="text-xs text-gray-500 mb-1">by {reel.author}</p>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-1">
                            <span className="text-red-500">❤️</span>
                            <span className="font-bold text-gray-700">{reel.likes}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-blue-500">👁️</span>
                            <span className="font-bold text-gray-700">{reel.views}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Assignments */}
              <div className="p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3">📝 Recent Assignments</h2>
                <div className="space-y-3">
                  {recentAssignments.map((assignment) => (
                    <Link
                      key={assignment.id}
                      href={`/mobile/assignment/${assignment.id}`}
                      className="block bg-white rounded-xl p-4 shadow-sm border border-gray-200 active:scale-95 transition-transform"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-gray-800 text-sm">{assignment.title}</h3>
                        <span className="text-xs text-blue-600 font-bold">{assignment.points} pts</span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{assignment.course.title}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {assignment.submissions.length} submissions
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="h-full overflow-y-auto p-4">
            <h2 className="text-lg font-bold text-gray-800 mb-4">📝 All Assignments</h2>
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <Link
                  key={assignment.id}
                  href={`/mobile/assignment/${assignment.id}`}
                  className="block bg-white rounded-xl p-4 shadow-sm border border-gray-200 active:scale-95 transition-transform"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-800">{assignment.title}</h3>
                    <span className="text-sm text-blue-600 font-bold">{assignment.points} pts</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{assignment.course.title}</p>
                  <p className="text-xs text-gray-500 mb-3">{assignment.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {assignment.submissions.length} submissions
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'community' && (
          <div className="h-full overflow-y-auto p-4">
            <h2 className="text-lg font-bold text-gray-800 mb-4">👥 Community</h2>
            <div className="space-y-4">
              {videos.map((video) => (
                <div key={video.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{video.student.profilePicture}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm">{video.student.firstName} {video.student.lastName}</h3>
                      <p className="text-xs text-gray-500">{video.assignment.title}</p>
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">{video.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">{video.description}</p>
                  
                  <div className="aspect-video bg-gray-200 rounded-lg mb-3 overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                      <div className="text-center text-gray-600">
                        <div className="w-12 h-12 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-2">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                        <p className="text-sm font-medium">{video.title}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <span className="text-red-500">❤️</span>
                        <span className="font-bold">{video.likes}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-blue-500">💬</span>
                        <span className="font-bold">{video.comments}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-500">👁️</span>
                        <span className="font-bold">{video.views}</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{video.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="h-full overflow-y-auto p-4">
            <h2 className="text-lg font-bold text-gray-800 mb-4">📚 My Courses</h2>
            <div className="space-y-4">
              {testDataGenerator.getCourses().map((course) => (
                <div key={course.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold ${course.color === 'blue' ? 'bg-blue-500' : 'bg-purple-500'}`}>
                      {course.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">{course.title}</h3>
                      <p className="text-sm text-gray-600">{course.instructor.firstName} {course.instructor.lastName}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{course.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${(course.completedAssignments / course.totalAssignments) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{course.completedAssignments}/{course.totalAssignments}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="h-full overflow-y-auto p-4">
            <h2 className="text-lg font-bold text-gray-800 mb-4">👤 Profile</h2>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="text-center mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold text-2xl">{user?.firstName?.charAt(0) || 'U'}</span>
                </div>
                <h3 className="font-bold text-gray-800 text-lg">{user?.firstName} {user?.lastName}</h3>
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600">{videos.length}</div>
                  <div className="text-xs text-gray-600">Videos</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{assignments.length}</div>
                  <div className="text-xs text-gray-600">Assignments</div>
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  href="/profile/edit"
                  className="block w-full text-center py-3 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-colors"
                >
                  Edit Profile
                </Link>
                <Link
                  href="/profile/videos"
                  className="block w-full text-center py-3 border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                >
                  My Videos
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-around">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              activeTab === 'dashboard' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'
            }`}
          >
            <span className="text-xl mb-1">🏠</span>
            <span className="text-xs font-medium">Home</span>
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              activeTab === 'assignments' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'
            }`}
          >
            <span className="text-xl mb-1">📝</span>
            <span className="text-xs font-medium">Assignments</span>
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              activeTab === 'community' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'
            }`}
          >
            <span className="text-xl mb-1">👥</span>
            <span className="text-xs font-medium">Community</span>
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              activeTab === 'courses' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'
            }`}
          >
            <span className="text-xl mb-1">📚</span>
            <span className="text-xs font-medium">Courses</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              activeTab === 'profile' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'
            }`}
          >
            <span className="text-xl mb-1">👤</span>
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </div>

      {/* Reel Detail Modal */}
      {selectedReel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Video Reel</h3>
              <button
                onClick={() => setSelectedReel(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Video Player */}
            <div className="aspect-video bg-gray-200 rounded-xl mb-4 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                <div className="text-center text-gray-600">
                  <div className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                  <p className="text-sm font-medium">{selectedReel.title}</p>
                </div>
              </div>
            </div>

            {/* Video Info */}
            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-gray-800 mb-1">{selectedReel.title}</h4>
                <p className="text-sm text-gray-600">{selectedReel.assignmentTitle}</p>
                <p className="text-xs text-gray-500">{selectedReel.course} • {selectedReel.duration}</p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{selectedReel.authorAvatar}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{selectedReel.author}</p>
                    <p className="text-xs text-gray-500">{selectedReel.timestamp}</p>
                  </div>
                </div>
              </div>

              {/* Video Interactions */}
              <VideoInteractions
                videoId={selectedReel.id}
                initialLikes={selectedReel.likes}
                initialComments={selectedReel.comments}
                initialViews={selectedReel.views}
                isLiked={selectedReel.isLiked}
                onLike={handleReelLike}
                onComment={handleReelComment}
                onResponse={handleReelResponse}
                onShare={handleReelShare}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
