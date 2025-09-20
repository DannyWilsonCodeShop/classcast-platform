'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';

interface AnalyticsData {
  overview: {
    totalStudents: number;
    totalAssignments: number;
    averageGrade: number;
    completionRate: number;
  };
  courseStats: Array<{
    courseId: string;
    courseName: string;
    students: number;
    assignments: number;
    averageGrade: number;
    completionRate: number;
  }>;
  assignmentStats: Array<{
    assignmentId: string;
    title: string;
    submissions: number;
    averageGrade: number;
    completionRate: number;
    dueDate: string;
  }>;
  studentEngagement: Array<{
    studentId: string;
    studentName: string;
    assignmentsCompleted: number;
    averageGrade: number;
    lastActivity: string;
  }>;
  gradeDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
}

const AnalyticsPage: React.FC = () => {
  const router = useRouter();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'semester'>('month');

  useEffect(() => {
    // Mock analytics data
    const mockData: AnalyticsData = {
      overview: {
        totalStudents: 156,
        totalAssignments: 24,
        averageGrade: 87.3,
        completionRate: 92.5
      },
      courseStats: [
        {
          courseId: 'cs-101',
          courseName: 'Introduction to Computer Science',
          students: 45,
          assignments: 8,
          averageGrade: 89.2,
          completionRate: 94.1
        },
        {
          courseId: 'math-201',
          courseName: 'Calculus II',
          students: 38,
          assignments: 12,
          averageGrade: 82.7,
          completionRate: 88.9
        },
        {
          courseId: 'eng-102',
          courseName: 'Creative Writing Workshop',
          students: 28,
          assignments: 6,
          averageGrade: 91.8,
          completionRate: 96.4
        }
      ],
      assignmentStats: [
        {
          assignmentId: 'assign1',
          title: 'Introduction Video Assignment',
          submissions: 42,
          averageGrade: 88.5,
          completionRate: 95.2,
          dueDate: '2024-01-25T23:59:59Z'
        },
        {
          assignmentId: 'assign2',
          title: 'Algorithm Analysis Project',
          submissions: 38,
          averageGrade: 85.3,
          completionRate: 86.4,
          dueDate: '2024-02-01T23:59:59Z'
        },
        {
          assignmentId: 'assign3',
          title: 'Data Structures Lab',
          submissions: 41,
          averageGrade: 90.1,
          completionRate: 93.2,
          dueDate: '2024-02-08T23:59:59Z'
        }
      ],
      studentEngagement: [
        {
          studentId: 'stu001',
          studentName: 'Alice Johnson',
          assignmentsCompleted: 8,
          averageGrade: 92.5,
          lastActivity: '2024-01-22T14:30:00Z'
        },
        {
          studentId: 'stu002',
          studentName: 'Bob Smith',
          assignmentsCompleted: 7,
          averageGrade: 85.7,
          lastActivity: '2024-01-21T16:45:00Z'
        },
        {
          studentId: 'stu003',
          studentName: 'Carol Davis',
          assignmentsCompleted: 8,
          averageGrade: 89.3,
          lastActivity: '2024-01-22T10:20:00Z'
        }
      ],
      gradeDistribution: [
        { range: '90-100', count: 45, percentage: 28.8 },
        { range: '80-89', count: 67, percentage: 42.9 },
        { range: '70-79', count: 32, percentage: 20.5 },
        { range: '60-69', count: 10, percentage: 6.4 },
        { range: 'Below 60', count: 2, percentage: 1.3 }
      ]
    };

    setAnalyticsData(mockData);
    setIsLoading(false);
  }, [selectedTimeframe]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-green-600';
    if (grade >= 80) return 'text-blue-600';
    if (grade >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <InstructorRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading analytics...</p>
          </div>
        </div>
      </InstructorRoute>
    );
  }

  if (!analyticsData) {
    return (
      <InstructorRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
          <div className="text-center">
            <div className="text-6xl mb-4">📊</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">No Data Available</h1>
            <p className="text-gray-600">Analytics data will appear here once you have student submissions.</p>
          </div>
        </div>
      </InstructorRoute>
    );
  }

  return (
    <InstructorRoute>
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-yellow-300/30 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.back()}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <span className="text-2xl">←</span>
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    Analytics Dashboard
                  </h1>
                  <p className="text-gray-600">
                    Insights into student performance and engagement
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="semester">This Semester</option>
                </select>
                <button className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-blue-500 text-white rounded-xl font-bold hover:shadow-lg transition-all duration-300">
                  Export Report
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-3xl font-bold text-gray-900">{analyticsData.overview.totalStudents}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Assignments</p>
                  <p className="text-3xl font-bold text-gray-900">{analyticsData.overview.totalAssignments}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📝</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Grade</p>
                  <p className="text-3xl font-bold text-gray-900">{analyticsData.overview.averageGrade}%</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-3xl font-bold text-gray-900">{analyticsData.overview.completionRate}%</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Course Performance */}
            <div className="bg-white rounded-2xl shadow-xl border border-white/20 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Course Performance</h2>
              <div className="space-y-4">
                {analyticsData.courseStats.map((course) => (
                  <div key={course.courseId} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-800">{course.courseName}</h3>
                      <span className={`text-lg font-bold ${getGradeColor(course.averageGrade)}`}>
                        {course.averageGrade}%
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">{course.students}</span> students
                      </div>
                      <div>
                        <span className="font-medium">{course.assignments}</span> assignments
                      </div>
                      <div>
                        <span className="font-medium">{course.completionRate}%</span> completion
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Grade Distribution */}
            <div className="bg-white rounded-2xl shadow-xl border border-white/20 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Grade Distribution</h2>
              <div className="space-y-3">
                {analyticsData.gradeDistribution.map((range) => (
                  <div key={range.range} className="flex items-center space-x-3">
                    <div className="w-16 text-sm font-medium text-gray-600">{range.range}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                        style={{ width: `${range.percentage}%` }}
                      ></div>
                    </div>
                    <div className="w-12 text-sm text-gray-600 text-right">
                      {range.count} ({range.percentage}%)
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Assignment Performance */}
            <div className="bg-white rounded-2xl shadow-xl border border-white/20 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Assignment Performance</h2>
              <div className="space-y-4">
                {analyticsData.assignmentStats.map((assignment) => (
                  <div key={assignment.assignmentId} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-800">{assignment.title}</h3>
                      <span className={`text-lg font-bold ${getGradeColor(assignment.averageGrade)}`}>
                        {assignment.averageGrade}%
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">{assignment.submissions}</span> submissions
                      </div>
                      <div>
                        <span className="font-medium">{assignment.completionRate}%</span> completion
                      </div>
                      <div>
                        Due: {formatDate(assignment.dueDate)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Students */}
            <div className="bg-white rounded-2xl shadow-xl border border-white/20 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Top Performing Students</h2>
              <div className="space-y-4">
                {analyticsData.studentEngagement.map((student, index) => (
                  <div key={student.studentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{student.studentName}</h3>
                        <p className="text-sm text-gray-600">
                          {student.assignmentsCompleted} assignments completed
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getGradeColor(student.averageGrade)}`}>
                        {student.averageGrade}%
                      </div>
                      <div className="text-xs text-gray-500">
                        Last active: {formatDate(student.lastActivity)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </InstructorRoute>
  );
};

export default AnalyticsPage;
