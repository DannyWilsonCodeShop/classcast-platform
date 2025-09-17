'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function CoursesPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }
  }, [user, isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <LoadingSpinner text="Loading your courses..." />
        </div>
      </div>
    );
  }

  const courses = [
    {
      id: 1,
      name: 'Calculus II',
      code: 'MATH 201',
      instructor: 'Dr. Smith',
      progress: 75,
      nextClass: 'Tomorrow 10:00 AM',
      color: 'blue',
      description: 'Advanced calculus concepts including integration, differential equations, and multivariable calculus.',
      assignments: 8,
      completed: 6,
      grade: 'A-',
      semester: 'Fall 2024'
    },
    {
      id: 2,
      name: 'Computer Science 101',
      code: 'CS 101',
      instructor: 'Prof. Johnson',
      progress: 45,
      nextClass: 'Wednesday 2:00 PM',
      color: 'green',
      description: 'Introduction to programming, algorithms, and computer science fundamentals.',
      assignments: 12,
      completed: 5,
      grade: 'B+',
      semester: 'Fall 2024'
    },
    {
      id: 3,
      name: 'Physics 101',
      code: 'PHYS 101',
      instructor: 'Dr. Brown',
      progress: 30,
      nextClass: 'Friday 11:00 AM',
      color: 'purple',
      description: 'Fundamental physics concepts including mechanics, thermodynamics, and waves.',
      assignments: 10,
      completed: 3,
      grade: 'B',
      semester: 'Fall 2024'
    },
    {
      id: 4,
      name: 'English Literature',
      code: 'ENG 201',
      instructor: 'Prof. Davis',
      progress: 60,
      nextClass: 'Thursday 1:00 PM',
      color: 'orange',
      description: 'Study of classic and contemporary literature with focus on critical analysis.',
      assignments: 6,
      completed: 4,
      grade: 'A',
      semester: 'Fall 2024'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-yellow-300/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                🎓 Your Courses
              </h1>
              <p className="text-gray-600">
                Manage your learning journey and track your progress! 🌟
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-blue-500 text-white rounded-xl font-bold hover:shadow-lg transition-all duration-300">
                + Add Course
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-yellow-300/30">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500 mb-2">4</div>
              <div className="text-gray-600 font-medium">Active Courses</div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-green-300/30">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500 mb-2">18</div>
              <div className="text-gray-600 font-medium">Assignments Due</div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-purple-300/30">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-500 mb-2">3.7</div>
              <div className="text-gray-600 font-medium">Average GPA</div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-orange-300/30">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-500 mb-2">52%</div>
              <div className="text-gray-600 font-medium">Overall Progress</div>
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {courses.map((course) => (
            <div key={course.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-gray-200/30 hover:shadow-xl transition-all duration-300">
              {/* Course Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-800">{course.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      course.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                      course.color === 'green' ? 'bg-green-100 text-green-800' :
                      course.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {course.code}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">{course.instructor} • {course.semester}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{course.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-500 mb-1">{course.grade}</div>
                  <div className="text-sm text-gray-500">Current Grade</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Progress</span>
                  <span className="text-sm font-bold text-gray-800">{course.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full bg-gradient-to-r ${
                      course.color === 'blue' ? 'from-blue-400 to-blue-500' :
                      course.color === 'green' ? 'from-green-400 to-green-500' :
                      course.color === 'purple' ? 'from-purple-400 to-purple-500' :
                      'from-orange-400 to-orange-500'
                    }`}
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Course Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-800">{course.completed}/{course.assignments}</div>
                  <div className="text-xs text-gray-500">Assignments</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-800">{course.nextClass}</div>
                  <div className="text-xs text-gray-500">Next Class</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-800">85%</div>
                  <div className="text-xs text-gray-500">Attendance</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <button 
                    onClick={() => router.push(`/student/courses/${course.id}`)}
                    className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-blue-500 text-white rounded-xl font-bold hover:shadow-lg transition-all duration-300"
                  >
                    View Course
                  </button>
                  <button 
                    onClick={() => router.push(`/student/courses/${course.id}`)}
                    className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all duration-300"
                  >
                    Materials
                  </button>
                </div>
                <button className="text-gray-500 hover:text-gray-700 transition-colors">
                  <span className="text-xl">⚙️</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-12 bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border-2 border-yellow-300/30">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">🚀 Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl hover:shadow-lg transition-all duration-300 border-2 border-blue-200">
              <div className="text-center">
                <div className="text-4xl mb-3">📚</div>
                <h4 className="font-bold text-gray-800 mb-2">Browse All Courses</h4>
                <p className="text-sm text-gray-600">Discover new courses to enroll in</p>
              </div>
            </button>
            <button className="p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-xl hover:shadow-lg transition-all duration-300 border-2 border-green-200">
              <div className="text-center">
                <div className="text-4xl mb-3">📊</div>
                <h4 className="font-bold text-gray-800 mb-2">View Analytics</h4>
                <p className="text-sm text-gray-600">Track your learning progress</p>
              </div>
            </button>
            <button className="p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl hover:shadow-lg transition-all duration-300 border-2 border-purple-200">
              <div className="text-center">
                <div className="text-4xl mb-3">👥</div>
                <h4 className="font-bold text-gray-800 mb-2">Study Groups</h4>
                <p className="text-sm text-gray-600">Join or create study groups</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
