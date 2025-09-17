'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import VideoInteractions from '@/components/video/VideoInteractions';
import Link from 'next/link';

type TabType = 'dashboard' | 'assignments' | 'community' | 'courses' | 'profile';

interface Assignment {
  id: string;
  title: string;
  course: string;
  instructor: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  progress: number;
  points: number;
}

interface Post {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  type: 'text' | 'video' | 'image';
}

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

export default function MobileApp() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [showModal, setShowModal] = useState<string | null>(null);
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null);

  // Mock data
  const assignments: Assignment[] = [
    {
      id: '1',
      title: 'Math Problem Video',
      course: 'Mathematics',
      instructor: 'Dr. Smith',
      dueDate: '2024-01-25',
      status: 'in_progress',
      progress: 60,
      points: 100
    },
    {
      id: '2',
      title: 'Science Lab Report',
      course: 'Chemistry',
      instructor: 'Prof. Johnson',
      dueDate: '2024-01-28',
      status: 'pending',
      progress: 0,
      points: 150
    }
  ];

  const posts: Post[] = [
    {
      id: '1',
      author: 'Sarah Chen',
      avatar: 'SC',
      content: 'Just finished my math video assignment! Check it out!',
      timestamp: '2h ago',
      likes: 12,
      comments: 5,
      isLiked: false,
      type: 'video'
    },
    {
      id: '2',
      author: 'Marcus Rodriguez',
      avatar: 'MR',
      content: 'Anyone else struggling with the chemistry lab?',
      timestamp: '4h ago',
      likes: 8,
      comments: 12,
      isLiked: true,
      type: 'text'
    }
  ];

  const reels: Reel[] = [
    {
      id: '1',
      title: 'Quadratic Formula Explained',
      author: 'Sarah Chen',
      authorAvatar: 'SC',
      thumbnailUrl: '/thumbnails/quadratic-1.jpg',
      duration: '4:32',
      likes: 24,
      comments: 8,
      views: 156,
      isLiked: false,
      assignmentTitle: 'Math Problem Solving',
      course: 'Mathematics',
      timestamp: '2h ago'
    },
    {
      id: '2',
      title: 'Physics Lab: Pendulum Motion',
      author: 'Marcus Rodriguez',
      authorAvatar: 'MR',
      thumbnailUrl: '/thumbnails/physics-1.jpg',
      duration: '6:20',
      likes: 31,
      comments: 12,
      views: 203,
      isLiked: true,
      assignmentTitle: 'Physics Lab Report',
      course: 'Physics',
      timestamp: '4h ago'
    },
    {
      id: '3',
      title: 'Chemistry: Acid-Base Reactions',
      author: 'Emma Thompson',
      authorAvatar: 'ET',
      thumbnailUrl: '/thumbnails/chemistry-1.jpg',
      duration: '7:45',
      likes: 18,
      comments: 6,
      views: 134,
      isLiked: false,
      assignmentTitle: 'Chemistry Lab Video',
      course: 'Chemistry',
      timestamp: '6h ago'
    },
    {
      id: '4',
      title: 'English: Poetry Analysis',
      author: 'Alex Johnson',
      authorAvatar: 'AJ',
      thumbnailUrl: '/thumbnails/english-1.jpg',
      duration: '8:10',
      likes: 15,
      comments: 4,
      views: 98,
      isLiked: false,
      assignmentTitle: 'Poetry Analysis Video',
      course: 'English',
      timestamp: '8h ago'
    },
    {
      id: '5',
      title: 'History: World War II Timeline',
      author: 'Maya Patel',
      authorAvatar: 'MP',
      thumbnailUrl: '/thumbnails/history-1.jpg',
      duration: '5:30',
      likes: 22,
      comments: 9,
      views: 167,
      isLiked: true,
      assignmentTitle: 'History Presentation',
      course: 'History',
      timestamp: '1d ago'
    }
  ];

  const handleReelLike = (reelId: string) => {
    // In a real app, this would update the backend
    console.log('Liked reel:', reelId);
  };

  const handleReelComment = (reelId: string, comment: string) => {
    console.log('Commented on reel:', reelId, comment);
    // In a real app, this would save the comment to the backend
  };

  const handleReelResponse = (reelId: string, response: string) => {
    console.log('Graded response submitted for reel:', reelId, response);
    // In a real app, this would submit the response for grading
  };

  const handleReelShare = (reelId: string, type: 'internal' | 'external') => {
    if (type === 'internal') {
      console.log('Sharing reel internally:', reelId);
      // In a real app, this would open a student selection modal
    } else {
      console.log('Sharing reel externally:', reelId);
      // In a real app, this would copy link or open social sharing
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
  }, [user, isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
        <LoadingSpinner text="Loading..." />
      </div>
    );
  }

  const renderDashboard = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 rounded-b-2xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold">Welcome back!</h1>
            <p className="text-blue-100 text-sm">{user?.firstName || 'Student'}</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold">{user?.firstName?.charAt(0) || 'U'}</span>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/20 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{assignments.length}</div>
            <div className="text-xs">Assignments</div>
          </div>
          <div className="bg-white/20 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">A-</div>
            <div className="text-xs">Average</div>
          </div>
          <div className="bg-white/20 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">12</div>
            <div className="text-xs">Videos</div>
          </div>
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
      <div className="flex-1 p-4 space-y-3">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Recent Assignments</h2>
        {assignments.slice(0, 2).map((assignment) => (
          <Link
            key={assignment.id}
            href={`/mobile/assignment/${assignment.id}`}
            className="block bg-white rounded-xl p-4 shadow-sm border border-gray-200 active:scale-95 transition-transform"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-gray-800 text-sm">{assignment.title}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                assignment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                assignment.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              }`}>
                {assignment.status === 'pending' ? 'Due Soon' :
                 assignment.status === 'in_progress' ? 'In Progress' :
                 'Completed'}
              </span>
            </div>
            <p className="text-xs text-gray-600 mb-2">{assignment.course} • {assignment.points} pts</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-yellow-400 to-blue-500"
                style={{ width: `${assignment.progress}%` }}
              ></div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );

  const renderAssignments = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-4 rounded-b-2xl">
        <h1 className="text-xl font-bold mb-2">Assignments</h1>
        <p className="text-green-100 text-sm">Track your progress</p>
      </div>

      {/* Assignments List */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {assignments.map((assignment) => (
          <Link
            key={assignment.id}
            href={`/mobile/assignment/${assignment.id}`}
            className="block bg-white rounded-xl p-4 shadow-sm border border-gray-200 active:scale-95 transition-transform"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-gray-800">{assignment.title}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                assignment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                assignment.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              }`}>
                {assignment.status === 'pending' ? 'Due Soon' :
                 assignment.status === 'in_progress' ? 'In Progress' :
                 'Completed'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">{assignment.course} • {assignment.instructor}</p>
            <p className="text-xs text-gray-500 mb-3">Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-yellow-400 to-blue-500"
                style={{ width: `${assignment.progress}%` }}
              ></div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );

  const renderCommunity = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-b-2xl">
        <h1 className="text-xl font-bold mb-2">Community</h1>
        <p className="text-purple-100 text-sm">Connect with classmates</p>
      </div>

      {/* Posts Feed */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {posts.map((post) => (
          <div
            key={post.id}
            onClick={() => setShowModal(`post-${post.id}`)}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 active:scale-95 transition-transform"
          >
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">{post.avatar}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-bold text-gray-800 text-sm">{post.author}</h3>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-500">{post.timestamp}</span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{post.content}</p>
                <div className="flex items-center space-x-4">
                  <button className="flex items-center space-x-1 text-gray-500 hover:text-red-500">
                    <span className="text-lg">{post.isLiked ? '❤️' : '🤍'}</span>
                    <span className="text-xs">{post.likes}</span>
                  </button>
                  <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-500">
                    <span className="text-lg">💬</span>
                    <span className="text-xs">{post.comments}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCourses = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-b-2xl">
        <h1 className="text-xl font-bold mb-2">Courses</h1>
        <p className="text-orange-100 text-sm">Your enrolled courses</p>
      </div>

      {/* Courses List */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {['Mathematics', 'Chemistry', 'English', 'Physics'].map((course, index) => (
          <div
            key={index}
            onClick={() => setShowModal(`course-${index}`)}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 active:scale-95 transition-transform"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-800">{course}</h3>
                <p className="text-sm text-gray-600">Dr. Smith</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">A-</div>
                <div className="text-xs text-gray-500">Grade</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-4 rounded-b-2xl">
        <div className="flex items-center space-x-3">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold">{user?.firstName?.charAt(0) || 'U'}</span>
          </div>
          <div>
            <h1 className="text-xl font-bold">{user?.firstName} {user?.lastName}</h1>
            <p className="text-indigo-100 text-sm">11th Grade • Computer Science</p>
          </div>
        </div>
      </div>

      {/* Profile Stats */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <div className="text-2xl font-bold text-blue-600">1,247</div>
            <div className="text-xs text-gray-600">Total Views</div>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <div className="text-2xl font-bold text-red-600">89</div>
            <div className="text-xs text-gray-600">Total Likes</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <button
            onClick={() => setShowModal('edit-profile')}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-bold active:scale-95 transition-transform"
          >
            Edit Profile
          </button>
          <Link
            href="/mobile/videos"
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-xl font-bold active:scale-95 transition-transform text-center block"
          >
            My Videos
          </Link>
        </div>
      </div>
    </div>
  );

  const renderModal = () => {
    if (!showModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">Details</h3>
            <button
              onClick={() => setShowModal(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📱</div>
            <p className="text-gray-600">Modal content for {showModal}</p>
            <p className="text-sm text-gray-500 mt-2">This would show detailed information</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50 overflow-hidden">
      {/* Main Content */}
      <div className="h-full">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'assignments' && renderAssignments()}
        {activeTab === 'community' && renderCommunity()}
        {activeTab === 'courses' && renderCourses()}
        {activeTab === 'profile' && renderProfile()}
      </div>

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="grid grid-cols-5 h-16">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center space-y-1 ${
              activeTab === 'dashboard' ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <span className="text-xl">🏠</span>
            <span className="text-xs font-medium">Home</span>
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`flex flex-col items-center justify-center space-y-1 ${
              activeTab === 'assignments' ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <span className="text-xl">📚</span>
            <span className="text-xs font-medium">Assignments</span>
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`flex flex-col items-center justify-center space-y-1 ${
              activeTab === 'community' ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <span className="text-xl">👥</span>
            <span className="text-xs font-medium">Community</span>
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`flex flex-col items-center justify-center space-y-1 ${
              activeTab === 'courses' ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <span className="text-xl">🎓</span>
            <span className="text-xs font-medium">Courses</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center justify-center space-y-1 ${
              activeTab === 'profile' ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <span className="text-xl">👤</span>
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </div>

      {/* Modal */}
      {renderModal()}

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
