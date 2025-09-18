'use client';

import React, { useState, useEffect } from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { CompactAssignmentList } from '@/components/student/CompactAssignmentList';
import AITutoringChat from '@/components/ai/AITutoringChat';
import VideoReels from '@/components/student/VideoReels';
import CourseCard from '@/components/student/CourseCard';
import ProfileEditor from '@/components/student/ProfileEditor';
import PortalIndicator from '@/components/common/PortalIndicator';
import StudentOnboardingWizard from '@/components/wizards/StudentOnboardingWizard';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { LogOut, Wifi, WifiOff } from 'lucide-react';

const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'ai-tutor'>('ai-tutor');
  const [showWizard, setShowWizard] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [stats, setStats] = useState({
    activeCourses: 0,
    assignmentsDue: 0,
    completed: 0
  });
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoadingStats(true);
        setIsLoadingCourses(true);
        setIsLoadingAssignments(true);
        
        // Load stats from API
        const statsResponse = await fetch('/api/student/stats');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        } else {
          // Fallback to empty stats if API fails
          setStats({
            activeCourses: 0,
            assignmentsDue: 0,
            completed: 0
          });
        }
        
        // Load courses from API
        const coursesResponse = await fetch('/api/student/courses');
        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json();
          setCourses(coursesData);
        } else {
          setCourses([]);
        }
        
        // Load assignments from API
        const assignmentsResponse = await fetch('/api/student/assignments');
        if (assignmentsResponse.ok) {
          const assignmentsData = await assignmentsResponse.json();
          setAssignments(assignmentsData);
        } else {
          setAssignments([]);
        }
        
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Set empty data on error
        setStats({ activeCourses: 0, assignmentsDue: 0, completed: 0 });
        setCourses([]);
        setAssignments([]);
      } finally {
        setIsLoadingStats(false);
        setIsLoadingCourses(false);
        setIsLoadingAssignments(false);
      }
    };

    loadDashboardData();
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <StudentRoute>
      <div className="h-screen overflow-hidden flex flex-col bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        {/* Social Media Style Header */}
        <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                {user?.firstName?.charAt(0) || 'S'}
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Hey {user?.firstName || 'Student'}! 👋</h1>
                <div className="flex items-center space-x-2">
                  {isOnline ? (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-600 font-medium">Live</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-xs text-gray-500">Offline</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowProfileEditor(true)}
                className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:scale-110 transition-all duration-200 shadow-lg"
                title="Edit Profile"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              <button
                onClick={handleLogout}
                className="p-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full hover:scale-110 transition-all duration-200 shadow-lg"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
              <PortalIndicator />
            </div>
          </div>
        </div>

        {/* Mobile Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">

            {/* Social Media Style Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-4 text-center shadow-lg hover:scale-105 transition-transform duration-200">
                <div className="text-2xl font-bold text-white">{stats.activeCourses}</div>
                <div className="text-xs text-blue-100 font-medium">Active Courses 📚</div>
              </div>
              <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl p-4 text-center shadow-lg hover:scale-105 transition-transform duration-200">
                <div className="text-2xl font-bold text-white">{stats.assignmentsDue}</div>
                <div className="text-xs text-orange-100 font-medium">Due Soon ⏰</div>
              </div>
              <div className="bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl p-4 text-center shadow-lg hover:scale-105 transition-transform duration-200">
                <div className="text-2xl font-bold text-white">{stats.completed}</div>
                <div className="text-xs text-green-100 font-medium">Completed ✅</div>
              </div>
            </div>

            {/* Social Media Style Video Feed */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">🎬</span>
                  </div>
                  <h2 className="text-white font-bold text-sm">Trending Now</h2>
                </div>
              </div>
              <div className="p-4">
                <VideoReels studentId={user?.id || 'unknown'} />
              </div>
            </div>

            {/* Social Media Style Courses Feed */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-cyan-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-white text-lg">📚</span>
                    </div>
                    <h2 className="text-white font-bold text-sm">My Courses</h2>
                  </div>
                  <button
                    onClick={() => router.push('/student/courses')}
                    className="text-white/80 hover:text-white text-xs font-medium"
                  >
                    See All →
                  </button>
                </div>
              </div>
              <div className="p-4">
                {isLoadingCourses ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl h-20"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {courses.slice(0, 2).map((course) => (
                      <div
                        key={course.id}
                        onClick={() => router.push(`/student/courses/${course.id}`)}
                        className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 hover:shadow-lg cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {course.code?.charAt(0) || 'C'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-gray-900 truncate">{course.name}</h3>
                            <p className="text-xs text-gray-600">{course.code}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300" 
                                  style={{ width: `${course.progress}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-bold text-gray-700">{course.progress}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Social Media Style Assignments Feed */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-orange-500 to-red-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-white text-lg">📝</span>
                    </div>
                    <h2 className="text-white font-bold text-sm">Upcoming Tasks</h2>
                  </div>
                  <button
                    onClick={() => router.push('/student/assignments')}
                    className="text-white/80 hover:text-white text-xs font-medium"
                  >
                    See All →
                  </button>
                </div>
              </div>
              <div className="p-4">
                {isLoadingAssignments ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl h-16"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {assignments.slice(0, 3).map((assignment) => (
                      <div
                        key={assignment.id}
                        onClick={() => router.push(`/student/assignments/${assignment.id}`)}
                        className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 hover:shadow-lg cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-gray-900 truncate">{assignment.title}</h3>
                            <p className="text-xs text-gray-600">{assignment.course}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                              assignment.status === 'due-soon' ? 'bg-red-500 text-white' :
                              assignment.status === 'in-progress' ? 'bg-yellow-500 text-white' :
                              'bg-gray-500 text-white'
                            }`}>
                              {assignment.status === 'due-soon' ? '🔥' : 
                               assignment.status === 'in-progress' ? '⚡' : '📋'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Social Media Style AI Chat */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-500">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">🤖</span>
                  </div>
                  <h2 className="text-white font-bold text-sm">AI Study Buddy</h2>
                </div>
              </div>
              <div className="p-4">
                <AITutoringChat />
              </div>
            </div>
          </div>
        </div>

        {/* Profile Editor Modal */}
        <ProfileEditor
          profile={{
            id: user?.id || '',
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            email: user?.email || '',
            avatar: user?.avatar || '',
            bio: user?.bio || '',
            major: user?.major || '',
            year: user?.year || '',
            phone: user?.phone || '',
            location: user?.location || '',
          }}
          onSave={(updatedProfile) => {
            setShowProfileEditor(false);
            // TODO: Update user data in context
            console.log('Profile updated:', updatedProfile);
          }}
          onCancel={() => setShowProfileEditor(false)}
          isOpen={showProfileEditor}
        />

        {/* Student Onboarding Wizard */}
        <StudentOnboardingWizard
          isOpen={showWizard}
          onClose={() => setShowWizard(false)}
          onComplete={() => {
            setShowWizard(false);
            // Optionally refresh data or show success message
          }}
        />
      </div>
    </StudentRoute>
  );
};

export default StudentDashboard;
