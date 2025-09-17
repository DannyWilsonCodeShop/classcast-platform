'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Link from 'next/link';

interface Student {
  id: string;
  name: string;
  avatar: string;
  profilePicture?: string;
  grade: string;
  major: string;
  joinDate: string;
  totalAssignments: number;
  averageGrade: string;
  bio: string;
  videoStats: {
    totalViews: number;
    totalLikes: number;
    totalVideos: number;
    publicVideos: number;
  };
  personalInfo: {
    birthday: string;
    hometown: string;
    hobbies: string[];
    favoriteSubject: string;
    careerGoal: string;
    funFacts: string[];
  };
  socialLinks: {
    instagram: string;
    twitter: string;
    linkedin: string;
  };
}

interface VideoSubmission {
  id: string;
  student: Student;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: string;
  submittedAt: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  views: number;
  rating: number;
  isPublic: boolean;
  assignmentId: string;
  assignmentTitle: string;
}

interface Comment {
  id: string;
  student: Student;
  content: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
  replies: Comment[];
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  course: string;
  instructor: string;
  dueDate: string;
  points: number;
  status: 'active' | 'submitted' | 'graded';
  instructions: string;
  rubric: string[];
  videoSubmissions: VideoSubmission[];
  totalSubmissions: number;
  averageGrade: number;
}

export default function AssignmentDetailPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.id as string;
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoSubmission | null>(null);
  const [showProfile, setShowProfile] = useState<Student | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }

    // Mock assignment data - in real app, this would be fetched from API
    const mockAssignment: Assignment = {
      id: assignmentId,
      title: 'Math Problem Solving Video',
      description: 'Create a video explaining how to solve quadratic equations step by step. Include examples and explain your reasoning.',
      course: 'Algebra II',
      instructor: 'Ms. Johnson',
      dueDate: '2024-01-20',
      points: 100,
      status: 'active',
      instructions: 'Record a 3-5 minute video explaining quadratic equations. Show your work clearly and explain each step. Upload your video and respond to at least 3 classmates\' videos.',
      rubric: [
        'Clear explanation of concepts (25 points)',
        'Correct mathematical work (25 points)',
        'Good presentation skills (25 points)',
        'Peer interaction (25 points)'
      ],
      totalSubmissions: 8,
      averageGrade: 87.5,
      videoSubmissions: [
        {
          id: '1',
          student: {
            id: 's1',
            name: 'Sarah Chen',
            avatar: 'SC',
            profilePicture: null,
            grade: '11th Grade',
            major: 'Mathematics',
            joinDate: '2023-09-01',
            totalAssignments: 15,
            averageGrade: 'A-',
            bio: 'Love solving math problems and helping others understand concepts!',
            videoStats: {
              totalViews: 1247,
              totalLikes: 89,
              totalVideos: 12,
              publicVideos: 8
            },
            personalInfo: {
              birthday: '2006-03-15',
              hometown: 'San Francisco, CA',
              hobbies: ['Coding', 'Piano', 'Basketball'],
              favoriteSubject: 'Mathematics',
              careerGoal: 'Data Scientist',
              funFacts: ['I can solve a Rubik\'s cube in under 2 minutes', 'I speak 3 languages fluently']
            },
            socialLinks: {
              instagram: '@sarah_math',
              twitter: '@sarahchen',
              linkedin: 'linkedin.com/in/sarah-chen'
            }
          },
          title: 'Quadratic Equations Made Easy',
          description: 'I break down the quadratic formula and show two different methods to solve these equations.',
          videoUrl: '/videos/quadratic-1.mp4',
          thumbnailUrl: '/thumbnails/quadratic-1.jpg',
          duration: '4:32',
          submittedAt: '2024-01-15T10:30:00Z',
          likes: 12,
          comments: 5,
          isLiked: false,
          views: 45,
          rating: 4.8,
          isPublic: true,
          assignmentId: '1',
          assignmentTitle: 'Math Problem Solving Video'
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
            joinDate: '2023-09-01',
            totalAssignments: 18,
            averageGrade: 'A',
            bio: 'Future engineer who loves problem-solving and building things!',
            videoStats: {
              totalViews: 2156,
              totalLikes: 156,
              totalVideos: 15,
              publicVideos: 12
            },
            personalInfo: {
              birthday: '2005-11-22',
              hometown: 'Austin, TX',
              hobbies: ['Robotics', 'Gaming', 'Soccer'],
              favoriteSubject: 'Physics',
              careerGoal: 'Mechanical Engineer',
              funFacts: ['I built my first robot at age 12', 'I\'m captain of the robotics team']
            },
            socialLinks: {
              instagram: '@marcus_tech',
              twitter: '@marcusrod',
              linkedin: 'linkedin.com/in/marcus-rodriguez'
            }
          },
          title: 'Visual Approach to Quadratics',
          description: 'I use graphs and visual representations to explain quadratic equations.',
          videoUrl: '/videos/quadratic-2.mp4',
          thumbnailUrl: '/thumbnails/quadratic-2.jpg',
          duration: '3:45',
          submittedAt: '2024-01-14T14:20:00Z',
          likes: 18,
          comments: 8,
          isLiked: true,
          views: 62,
          rating: 4.9,
          isPublic: true,
          assignmentId: '1',
          assignmentTitle: 'Math Problem Solving Video'
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
            joinDate: '2023-09-01',
            totalAssignments: 12,
            averageGrade: 'B+',
            bio: 'Passionate about science and math, always eager to learn!',
            videoStats: {
              totalViews: 892,
              totalLikes: 67,
              totalVideos: 9,
              publicVideos: 6
            },
            personalInfo: {
              birthday: '2006-07-08',
              hometown: 'Seattle, WA',
              hobbies: ['Photography', 'Hiking', 'Chemistry'],
              favoriteSubject: 'Chemistry',
              careerGoal: 'Research Scientist',
              funFacts: ['I have a home chemistry lab', 'I won the state science fair last year']
            },
            socialLinks: {
              instagram: '@emma_science',
              twitter: '@emmathompson',
              linkedin: 'linkedin.com/in/emma-thompson'
            }
          },
          title: 'Step-by-Step Quadratic Solutions',
          description: 'I show a systematic approach to solving quadratic equations with clear examples.',
          videoUrl: '/videos/quadratic-3.mp4',
          thumbnailUrl: '/thumbnails/quadratic-3.jpg',
          duration: '5:15',
          submittedAt: '2024-01-13T16:45:00Z',
          likes: 9,
          comments: 3,
          isLiked: false,
          views: 38,
          rating: 4.6,
          isPublic: false,
          assignmentId: '1',
          assignmentTitle: 'Math Problem Solving Video'
        }
      ]
    };

    setAssignment(mockAssignment);
    if (mockAssignment.videoSubmissions.length > 0) {
      setSelectedVideo(mockAssignment.videoSubmissions[0]);
    }
  }, [user, isAuthenticated, isLoading, router, assignmentId]);

  const handleLikeVideo = (videoId: string) => {
    if (!assignment) return;
    
    setAssignment(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        videoSubmissions: prev.videoSubmissions.map(video => 
          video.id === videoId 
            ? { 
                ...video, 
                isLiked: !video.isLiked,
                likes: video.isLiked ? video.likes - 1 : video.likes + 1
              }
            : video
        )
      };
    });
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !selectedVideo || !user) return;
    
    setIsSubmittingComment(true);
    
    // Mock comment submission
    setTimeout(() => {
      setNewComment('');
      setIsSubmittingComment(false);
      // In real app, this would update the video's comments
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <LoadingSpinner text="Loading assignment details..." />
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Assignment Not Found</h1>
          <Link href="/assignments" className="text-blue-600 hover:text-blue-800">
            ← Back to Assignments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link 
              href="/assignments"
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Assignments
            </Link>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                assignment.status === 'active' ? 'bg-green-100 text-green-800' :
                assignment.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                'bg-purple-100 text-purple-800'
              }`}>
                {assignment.status === 'active' ? '📝 Active' :
                 assignment.status === 'submitted' ? '📤 Submitted' :
                 '✅ Graded'}
              </span>
              <span className="text-gray-600 text-sm">
                Due: {new Date(assignment.dueDate).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{assignment.title}</h1>
          <p className="text-gray-600 mb-4">{assignment.course} • {assignment.instructor} • {assignment.points} points</p>
          <p className="text-lg text-gray-700">{assignment.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Video Player and Comments */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            {selectedVideo ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-blue-300/30">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">{selectedVideo.title}</h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>👁️ {selectedVideo.views} views</span>
                    <span>⭐ {selectedVideo.rating}/5</span>
                    <span>⏱️ {selectedVideo.duration}</span>
                    <span>📅 {new Date(selectedVideo.submittedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {/* Video Player Placeholder */}
                <div className="relative bg-gray-900 rounded-xl overflow-hidden mb-4">
                  <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                      <p className="text-lg font-medium">Video Player</p>
                      <p className="text-sm text-gray-300">{selectedVideo.title}</p>
                    </div>
                  </div>
                </div>
                
                {/* Video Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <button
                      onClick={() => handleLikeVideo(selectedVideo.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-full font-bold transition-all duration-300 ${
                        selectedVideo.isLiked 
                          ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <span className="text-xl">{selectedVideo.isLiked ? '❤️' : '🤍'}</span>
                      <span>{selectedVideo.likes}</span>
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-full font-bold hover:bg-gray-200 transition-all duration-300">
                      <span className="text-xl">💬</span>
                      <span>{selectedVideo.comments}</span>
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-full font-bold hover:bg-gray-200 transition-all duration-300">
                      <span className="text-xl">🔄</span>
                      <span>Share</span>
                    </button>
                  </div>
                  
                  <button
                    onClick={() => setShowProfile(selectedVideo.student)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-full font-bold hover:bg-blue-200 transition-all duration-300"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{selectedVideo.student.avatar}</span>
                    </div>
                    <span>View Profile</span>
                  </button>
                </div>
                
                {/* Video Description */}
                <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-bold text-gray-800 mb-2">Description</h3>
                  <p className="text-gray-700">{selectedVideo.description}</p>
                </div>
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 shadow-lg border-2 border-gray-300/30 text-center">
                <div className="text-6xl mb-4">📹</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No Video Selected</h3>
                <p className="text-gray-600">Choose a video from the sidebar to start watching</p>
              </div>
            )}

            {/* Comments Section */}
            {selectedVideo && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-purple-300/30">
                <h3 className="text-lg font-bold text-gray-800 mb-4">💬 Comments ({selectedVideo.comments})</h3>
                
                {/* Add Comment */}
                <div className="mb-6">
                  <div className="flex space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">
                        {user?.firstName?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none resize-none"
                        rows={3}
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={handleSubmitComment}
                          disabled={!newComment.trim() || isSubmittingComment}
                          className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-bold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Comments List */}
                <div className="space-y-4">
                  {[
                    {
                      id: '1',
                      student: {
                        id: 's4',
                        name: 'Alex Kim',
                        avatar: 'AK',
                        grade: '11th Grade',
                        major: 'Computer Science',
                        joinDate: '2023-09-01',
                        totalAssignments: 20,
                        averageGrade: 'A',
                        bio: 'Tech enthusiast and problem solver!'
                      },
                      content: 'Great explanation! I especially liked how you broke down the discriminant part. This really helped me understand when to use the quadratic formula.',
                      timestamp: '2024-01-15T11:30:00Z',
                      likes: 3,
                      isLiked: false,
                      replies: []
                    },
                    {
                      id: '2',
                      student: {
                        id: 's5',
                        name: 'Jordan Lee',
                        avatar: 'JL',
                        grade: '11th Grade',
                        major: 'Mathematics',
                        joinDate: '2023-09-01',
                        totalAssignments: 16,
                        averageGrade: 'A-',
                        bio: 'Math lover and future teacher!'
                      },
                      content: 'Could you explain more about the vertex form? I\'m still a bit confused about how to convert from standard form.',
                      timestamp: '2024-01-15T09:15:00Z',
                      likes: 1,
                      isLiked: true,
                      replies: []
                    }
                  ].map((comment) => (
                    <div key={comment.id} className="flex space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center cursor-pointer" onClick={() => setShowProfile(comment.student)}>
                        <span className="text-white font-bold text-sm">{comment.student.avatar}</span>
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-xl p-3">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-bold text-gray-800">{comment.student.name}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-700">{comment.content}</p>
                        </div>
                        <div className="flex items-center space-x-4 mt-2 ml-3">
                          <button className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors">
                            <span className="text-sm">{comment.isLiked ? '❤️' : '🤍'}</span>
                            <span className="text-sm">{comment.likes}</span>
                          </button>
                          <button className="text-sm text-gray-500 hover:text-blue-500 transition-colors">
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Video List and Assignment Info */}
          <div className="space-y-6">
            {/* Assignment Info */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-yellow-300/30">
              <h3 className="text-lg font-bold text-gray-800 mb-4">📋 Assignment Details</h3>
              <div className="space-y-3">
                <div>
                  <span className="font-bold text-gray-700">Instructions:</span>
                  <p className="text-gray-600 text-sm mt-1">{assignment.instructions}</p>
                </div>
                <div>
                  <span className="font-bold text-gray-700">Rubric:</span>
                  <ul className="text-gray-600 text-sm mt-1 space-y-1">
                    {assignment.rubric.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Submissions:</span>
                    <span className="font-bold text-blue-600">{assignment.totalSubmissions}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Average Grade:</span>
                    <span className="font-bold text-green-600">{assignment.averageGrade}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Submissions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-blue-300/30">
              <h3 className="text-lg font-bold text-gray-800 mb-4">🎥 Student Videos ({assignment.videoSubmissions.length})</h3>
              <div className="space-y-3">
                {assignment.videoSubmissions.map((video) => (
                  <div
                    key={video.id}
                    onClick={() => setSelectedVideo(video)}
                    className={`p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                      selectedVideo?.id === video.id 
                        ? 'bg-blue-100 border-2 border-blue-300' 
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex space-x-3">
                      <div className="w-16 h-12 bg-gray-300 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-800 text-sm truncate">{video.title}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center cursor-pointer" onClick={(e) => { e.stopPropagation(); setShowProfile(video.student); }}>
                            <span className="text-white text-xs font-bold">{video.student.avatar}</span>
                          </div>
                          <span className="text-xs text-gray-600">{video.student.name}</span>
                        </div>
                        <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                          <span>👁️ {video.views}</span>
                          <span>❤️ {video.likes}</span>
                          <span>⭐ {video.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Student Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Student Profile</h3>
              <button
                onClick={() => setShowProfile(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
                {showProfile.profilePicture ? (
                  <img 
                    src={showProfile.profilePicture} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-3xl font-bold">{showProfile.avatar}</span>
                )}
              </div>
              <h4 className="text-xl font-bold text-gray-800">{showProfile.name}</h4>
              <p className="text-gray-600">{showProfile.grade} • {showProfile.major}</p>
            </div>
            
            <div className="space-y-4">
              {/* Bio */}
              <div>
                <span className="font-bold text-gray-700">Bio:</span>
                <p className="text-gray-600 text-sm mt-1">{showProfile.bio}</p>
              </div>
              
              {/* Personal Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600">{showProfile.totalAssignments}</div>
                  <div className="text-xs text-gray-600">Assignments</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{showProfile.averageGrade}</div>
                  <div className="text-xs text-gray-600">Average Grade</div>
                </div>
              </div>

              {/* Video Statistics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600">{showProfile.videoStats.totalViews.toLocaleString()}</div>
                  <div className="text-xs text-gray-600">Total Views</div>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-600">{showProfile.videoStats.totalLikes}</div>
                  <div className="text-xs text-gray-600">Total Likes</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-purple-600">{showProfile.videoStats.totalVideos}</div>
                  <div className="text-xs text-gray-600">Total Videos</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{showProfile.videoStats.publicVideos}</div>
                  <div className="text-xs text-gray-600">Public Videos</div>
                </div>
              </div>

              {/* Hometown and Birthday */}
              {(showProfile.personalInfo.hometown || showProfile.personalInfo.birthday) && (
                <div className="space-y-2">
                  {showProfile.personalInfo.hometown && (
                    <div className="flex items-center text-sm">
                      <span className="text-gray-500 mr-2">🏠</span>
                      <span className="text-gray-700">{showProfile.personalInfo.hometown}</span>
                    </div>
                  )}
                  {showProfile.personalInfo.birthday && (
                    <div className="flex items-center text-sm">
                      <span className="text-gray-500 mr-2">🎂</span>
                      <span className="text-gray-700">
                        {new Date(showProfile.personalInfo.birthday).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Hobbies */}
              {showProfile.personalInfo.hobbies.length > 0 && (
                <div>
                  <span className="font-bold text-gray-700 text-sm">Hobbies:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {showProfile.personalInfo.hobbies.map((hobby, index) => (
                      <span
                        key={index}
                        className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                      >
                        {hobby}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Career Goal */}
              {showProfile.personalInfo.careerGoal && (
                <div>
                  <span className="font-bold text-gray-700 text-sm">Career Goal:</span>
                  <p className="text-gray-600 text-sm mt-1">🎯 {showProfile.personalInfo.careerGoal}</p>
                </div>
              )}

              {/* Fun Facts */}
              {showProfile.personalInfo.funFacts.length > 0 && (
                <div>
                  <span className="font-bold text-gray-700 text-sm">Fun Facts:</span>
                  <div className="space-y-1 mt-1">
                    {showProfile.personalInfo.funFacts.map((fact, index) => (
                      <div key={index} className="flex items-start text-sm">
                        <span className="text-yellow-500 mr-2">⭐</span>
                        <span className="text-gray-600">{fact}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Links */}
              {(showProfile.socialLinks.instagram || showProfile.socialLinks.twitter || showProfile.socialLinks.linkedin) && (
                <div>
                  <span className="font-bold text-gray-700 text-sm">Social Links:</span>
                  <div className="flex space-x-3 mt-1">
                    {showProfile.socialLinks.instagram && (
                      <a href={`https://instagram.com/${showProfile.socialLinks.instagram.replace('@', '')}`} 
                         target="_blank" rel="noopener noreferrer"
                         className="text-pink-500 hover:text-pink-600 text-sm">
                        📷 Instagram
                      </a>
                    )}
                    {showProfile.socialLinks.twitter && (
                      <a href={`https://twitter.com/${showProfile.socialLinks.twitter.replace('@', '')}`} 
                         target="_blank" rel="noopener noreferrer"
                         className="text-blue-500 hover:text-blue-600 text-sm">
                        🐦 Twitter
                      </a>
                    )}
                    {showProfile.socialLinks.linkedin && (
                      <a href={`https://${showProfile.socialLinks.linkedin}`} 
                         target="_blank" rel="noopener noreferrer"
                         className="text-blue-700 hover:text-blue-800 text-sm">
                        💼 LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              )}
              
              <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-200">
                Joined {new Date(showProfile.joinDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
