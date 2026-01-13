'use client';

import React, { useState, useEffect } from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/layout/DashboardLayout';
import CourseProgressCard from '@/components/dashboard/widgets/CourseProgressCard';
import ContinueLearning from '@/components/dashboard/widgets/ContinueLearning';
import StudyStreak from '@/components/dashboard/widgets/StudyStreak';
import { 
  AcademicCapIcon, 
  ClockIcon, 
  TrophyIcon, 
  ChartBarIcon,
  BookOpenIcon,
  VideoCameraIcon,
  UserGroupIcon,
  StarIcon
} from '@heroicons/react/24/outline';

// Mock data - in real app, this would come from APIs
const mockCourses = [
  {
    id: '1',
    title: 'Advanced Mathematics',
    instructor: 'Dr. Sarah Johnson',
    progress: 75,
    nextLesson: 'Calculus Integration',
    timeRemaining: '2h 30m',
    thumbnail: '/api/placeholder/200/120',
    difficulty: 'Advanced' as const,
    rating: 4.8,
    totalLessons: 24,
    completedLessons: 18,
    lastAccessed: '2 hours ago'
  },
  {
    id: '2',
    title: 'English Literature',
    instructor: 'Prof. Michael Chen',
    progress: 45,
    nextLesson: 'Shakespeare Analysis',
    timeRemaining: '4h 15m',
    thumbnail: '/api/placeholder/200/120',
    difficulty: 'Intermediate' as const,
    rating: 4.6,
    totalLessons: 20,
    completedLessons: 9,
    lastAccessed: '1 day ago'
  },
  {
    id: '3',
    title: 'Computer Science Fundamentals',
    instructor: 'Dr. Emily Rodriguez',
    progress: 100,
    thumbnail: '/api/placeholder/200/120',
    difficulty: 'Beginner' as const,
    rating: 4.9,
    totalLessons: 16,
    completedLessons: 16,
    lastAccessed: '3 days ago'
  }
];

const mockLearningItems = [
  {
    id: '1',
    type: 'assignment' as const,
    title: 'Calculus Problem Set #5',
    subtitle: 'Integration and Differentiation',
    progress: 60,
    dueDate: 'Tomorrow',
    thumbnail: '/api/placeholder/100/60',
    courseTitle: 'Advanced Mathematics',
    lastAccessed: '30 minutes ago'
  },
  {
    id: '2',
    type: 'video' as const,
    title: 'Shakespeare\'s Hamlet - Act 3 Analysis',
    subtitle: 'Character development and themes',
    progress: 25,
    timeLeft: '45 minutes',
    thumbnail: '/api/placeholder/100/60',
    courseTitle: 'English Literature',
    lastAccessed: '2 hours ago'
  },
  {
    id: '3',
    type: 'course' as const,
    title: 'Data Structures and Algorithms',
    subtitle: 'Binary Trees and Graph Theory',
    progress: 80,
    timeLeft: '1h 20m',
    thumbnail: '/api/placeholder/100/60',
    lastAccessed: '1 day ago'
  }
];

const UdemyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    totalHours: 0,
    averageGrade: 0
  });

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setStats({
        totalCourses: 8,
        completedCourses: 3,
        totalHours: 47,
        averageGrade: 87.5
      });
      setLoading(false);
    }, 1000);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    const firstName = user?.firstName || 'Student';
    
    if (hour < 12) return `Good morning, ${firstName}!`;
    if (hour < 17) return `Good afternoon, ${firstName}!`;
    return `Good evening, ${firstName}!`;
  };

  const quickStats = [
    {
      name: 'Courses Enrolled',
      value: stats.totalCourses,
      icon: BookOpenIcon,
      color: 'bg-blue-500',
      change: '+2 this month'
    },
    {
      name: 'Completed',
      value: stats.completedCourses,
      icon: TrophyIcon,
      color: 'bg-green-500',
      change: '+1 this week'
    },
    {
      name: 'Study Hours',
      value: `${stats.totalHours}h`,
      icon: ClockIcon,
      color: 'bg-purple-500',
      change: '+8h this week'
    },
    {
      name: 'Average Grade',
      value: `${stats.averageGrade}%`,
      icon: ChartBarIcon,
      color: 'bg-orange-500',
      change: '+2.5% improvement'
    }
  ];

  if (loading) {
    return (
      <StudentRoute>
        <DashboardLayout title="Dashboard" subtitle="Loading your learning progress...">
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-200 h-32 rounded-xl"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-gray-200 h-96 rounded-xl"></div>
              <div className="bg-gray-200 h-96 rounded-xl"></div>
            </div>
          </div>
        </DashboardLayout>
      </StudentRoute>
    );
  }

  return (
    <StudentRoute>
      <DashboardLayout 
        title={getGreeting()} 
        subtitle="Ready to continue your learning journey?"
      >
        <div className="space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickStats.map((stat) => (
              <div key={stat.name} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <p className="text-xs text-green-600 mt-1">{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Continue Learning */}
            <div className="lg:col-span-2 space-y-8">
              <ContinueLearning items={mockLearningItems} />
              
              {/* My Courses */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">My Courses</h2>
                      <p className="text-sm text-gray-600 mt-1">Track your progress across all courses</p>
                    </div>
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      View All Courses
                    </button>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  {mockCourses.map((course) => (
                    <CourseProgressCard key={course.id} course={course} size="small" />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar Widgets */}
            <div className="space-y-6">
              {/* Study Streak */}
              <StudyStreak
                currentStreak={7}
                longestStreak={15}
                todayCompleted={true}
                weeklyGoal={5}
                weeklyProgress={4}
                streakHistory={[true, true, false, true, true, true, true]}
              />

              {/* Upcoming Deadlines */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Upcoming Deadlines</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                    <ClockIcon className="w-5 h-5 text-red-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-900">Math Assignment</p>
                      <p className="text-xs text-red-600">Due tomorrow</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                    <ClockIcon className="w-5 h-5 text-yellow-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-900">Literature Essay</p>
                      <p className="text-xs text-yellow-600">Due in 3 days</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <VideoCameraIcon className="w-5 h-5 text-blue-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">Video Presentation</p>
                      <p className="text-xs text-blue-600">Due next week</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <TrophyIcon className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">Completed CS Fundamentals</p>
                      <p className="text-xs text-gray-500">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <StarIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">Received 95% on Math Quiz</p>
                      <p className="text-xs text-gray-500">1 day ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <UserGroupIcon className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">Joined study group</p>
                      <p className="text-xs text-gray-500">2 days ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </StudentRoute>
  );
};

export default UdemyDashboard;