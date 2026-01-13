'use client';

import React, { useState, useEffect } from 'react';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/layout/DashboardLayout';
import DemoModeBanner from '@/components/common/DemoModeBanner';
import { 
  ChartBarIcon, 
  TrophyIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface Grade {
  id: string;
  assignmentTitle: string;
  courseName: string;
  courseCode: string;
  grade: number;
  maxPoints: number;
  submittedAt: string;
  gradedAt: string;
  feedback?: string;
  status: 'graded' | 'pending' | 'late';
}

const StudentGrades: React.FC = () => {
  const { user } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    averageGrade: 0,
    totalAssignments: 0,
    completedAssignments: 0,
    pendingGrades: 0
  });

  useEffect(() => {
    if (user?.id) {
      fetchGrades();
    }
  }, [user?.id]);

  const fetchGrades = async () => {
    try {
      console.log('🎯 Fetching real grades for user:', user?.id);
      
      const response = await fetch(`/api/student/grades?userId=${user?.id}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Fetched grades successfully:', data.grades.length, 'grades');
        setGrades(data.grades);
        setStats(data.stats);
      } else {
        console.error('❌ API returned error:', data.error);
        // Fall back to empty state instead of mock data
        setGrades([]);
        setStats({
          averageGrade: 0,
          totalAssignments: 0,
          completedAssignments: 0,
          pendingGrades: 0
        });
      }
    } catch (error) {
      console.error('❌ Error fetching grades:', error);
      // Fall back to empty state instead of mock data
      setGrades([]);
      setStats({
        averageGrade: 0,
        totalAssignments: 0,
        completedAssignments: 0,
        pendingGrades: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: number, maxPoints: number) => {
    const percentage = (grade / maxPoints) * 100;
    if (percentage >= 90) return 'text-green-600 bg-green-50';
    if (percentage >= 80) return 'text-blue-600 bg-blue-50';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not graded yet';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <StudentRoute>
        <DemoModeBanner />
        <DashboardLayout title="Loading..." subtitle="Getting your grades...">
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-200 h-24 rounded-xl"></div>
              <div className="bg-gray-200 h-24 rounded-xl"></div>
              <div className="bg-gray-200 h-24 rounded-xl"></div>
              <div className="bg-gray-200 h-24 rounded-xl"></div>
            </div>
            <div className="bg-gray-200 h-64 rounded-xl"></div>
          </div>
        </DashboardLayout>
      </StudentRoute>
    );
  }

  return (
    <StudentRoute>
      <DemoModeBanner />
      <DashboardLayout 
        title="Recent Grades" 
        subtitle="Track your academic performance and progress"
      >
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Grade</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageGrade}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedAssignments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingGrades}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrophyIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Assignments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAssignments}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Grades List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Submissions</h3>
            <p className="text-sm text-gray-600">Your latest assignment grades and feedback</p>
          </div>

          <div className="divide-y divide-gray-200">
            {grades.map((grade) => (
              <div key={grade.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {grade.assignmentTitle}
                      </h4>
                      {grade.status === 'pending' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <ClockIcon className="w-3 h-3 mr-1" />
                          Pending
                        </span>
                      ) : (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(grade.grade, grade.maxPoints)}`}>
                          {grade.grade}/{grade.maxPoints} ({Math.round((grade.grade / grade.maxPoints) * 100)}%)
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <span className="font-medium">{grade.courseName}</span>
                      <span>•</span>
                      <span>{grade.courseCode}</span>
                      <span>•</span>
                      <span>Submitted {formatDate(grade.submittedAt)}</span>
                      {grade.gradedAt && (
                        <>
                          <span>•</span>
                          <span>Graded {formatDate(grade.gradedAt)}</span>
                        </>
                      )}
                    </div>

                    {grade.feedback && (
                      <div className="bg-gray-50 rounded-lg p-3 mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Instructor Feedback:</p>
                        <p className="text-sm text-gray-600">{grade.feedback}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {grades.length === 0 && (
            <div className="p-12 text-center">
              <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Grades Yet</h3>
              <p className="text-gray-600">Your assignment grades will appear here once they're available.</p>
            </div>
          )}
        </div>
      </DashboardLayout>
    </StudentRoute>
  );
};

export default StudentGrades;