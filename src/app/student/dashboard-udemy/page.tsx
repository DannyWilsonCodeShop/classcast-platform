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

interface Course {
  courseId: string;
  courseName: string;
  courseCode: string;
  instructor: {
    name: string;
    email: string;
  };
  semester: string;
  year: number;
  enrolledAt: string;
}

interface Assignment {
  assignmentId: string;
  title: string;
  description: string;
  dueDate: string;
  courseId: string;
  courseName: string;
  maxScore: number;
  status: string;
}

const UdemyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    totalHours: 0,
    averageGrade: 0
  });

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch enrolled courses
      const coursesResponse = await fetch('/api/student/courses', {
        credentials: 'include'
      });
      
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json();
        if (coursesData.success) {
          setCourses(coursesData.courses || []);
        }
      }

      // Fetch assignments
      const assignmentsResponse = await fetch('/api/student/assignments', {
        credentials: 'include'
      });
      
      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json();
        if (assignmentsData.success) {
          setAssignments(assignmentsData.assignments || []);
        }
      }

      // Calculate stats based on real data
      const totalCourses = courses.length;
      const completedCourses = 0; // Will be calculated based on May 1st end date
      const totalHours = Math.floor(Math.random() * 50) + 20; // Placeholder for now
      const averageGrade = 85 + Math.floor(Math.random() * 10); // Placeholder for now

      setStats({
        totalCourses,
        completedCourses,
        totalHours,
        averageGrade
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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
              <ContinueLearning items={assignments.slice(0, 3).map(assignment => ({
                id: assignment.assignmentId,
                type: 'assignment' as const,
                title: assignment.title,
                subtitle: assignment.description.substring(0, 50) + '...',
                progress: 0, // Will be calculated based on submission status
                dueDate: new Date(assignment.dueDate).toLocaleDateString(),
                thumbnail: '/api/placeholder/100/60',
                courseTitle: assignment.courseName,
                lastAccessed: 'Recently'
              }))} />
              
              {/* My Courses */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">My Courses</h2>
                      <p className="text-sm text-gray-600 mt-1">Track your progress across all courses</p>
                    </div>
                    <button 
                      onClick={() => window.location.href = '/student/courses'}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View All Courses
                    </button>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  {courses.length > 0 ? (
                    courses.map((course) => (
                      <CourseProgressCard 
                        key={course.courseId} 
                        course={{
                          id: course.courseId,
                          title: course.courseName,
                          instructor: course.instructor.name,
                          thumbnail: '/api/placeholder/200/120',
                          difficulty: 'Intermediate' as const,
                          rating: 4.5,
                          lastAccessed: new Date(course.enrolledAt).toLocaleDateString(),
                          endDate: '2025-05-01' // Course ends May 1st, 2025
                        }} 
                        size="small" 
                      />
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <BookOpenIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No courses enrolled yet</p>
                      <button 
                        onClick={() => window.location.href = '/student/courses'}
                        className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Browse Available Courses
                      </button>
                    </div>
                  )}
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