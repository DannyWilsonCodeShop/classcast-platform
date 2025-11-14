'use client';

import React, { useState } from 'react';

interface Course {
  courseId: string;
  courseName: string;
  courseCode: string;
  enrollmentCount: number;
  maxEnrollment?: number;
  createdAt: string;
}

interface Assignment {
  assignmentId: string;
  title: string;
  dueDate: string;
  points: number;
  status: 'draft' | 'published' | 'grading' | 'completed';
  submissionsCount: number;
  gradedCount: number;
  averageGrade?: number;
  createdAt: string;
}

interface Student {
  studentId: string;
  name: string;
  email: string;
  enrollmentDate: string;
  status: 'active' | 'dropped' | 'completed';
  currentGrade?: number;
  assignmentsSubmitted: number;
  assignmentsTotal: number;
  lastActivity: string;
}

interface InstructorCourseAnalyticsProps {
  course: Course;
  assignments: Assignment[];
  students: Student[];
}

export const InstructorCourseAnalytics: React.FC<InstructorCourseAnalyticsProps> = ({ 
  course, 
  assignments, 
  students 
}) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'semester'>('month');
  const [activeTab, setActiveTab] = useState<'overview' | 'assignments' | 'students' | 'engagement'>('overview');

  // Calculate analytics data
  const activeStudents = students.filter(s => s.status === 'active').length;
  const completedStudents = students.filter(s => s.status === 'completed').length;
  const droppedStudents = students.filter(s => s.status === 'dropped').length;
  
  const totalAssignments = assignments.length;
  const publishedAssignments = assignments.filter(a => a.status === 'published').length;
  const completedAssignments = assignments.filter(a => a.status === 'completed').length;
  
  const averageGrade = students
    .filter(s => s.currentGrade !== undefined)
    .reduce((sum, s) => sum + (s.currentGrade || 0), 0) / students.filter(s => s.currentGrade !== undefined).length;

  const totalSubmissions = assignments.reduce((sum, a) => sum + a.submissionsCount, 0);
  const totalGraded = assignments.reduce((sum, a) => sum + a.gradedCount, 0);
  const gradingProgress = totalSubmissions > 0 ? (totalGraded / totalSubmissions) * 100 : 0;

  // Assignment performance data
  const assignmentPerformance = assignments
    .filter(a => a.averageGrade !== undefined)
    .map(a => ({
      title: a.title,
      averageGrade: a.averageGrade || 0,
      submissionsCount: a.submissionsCount,
      points: a.points
    }))
    .sort((a, b) => b.averageGrade - a.averageGrade);

  // Student grade distribution
  const gradeDistribution = {
    A: students.filter(s => s.currentGrade && s.currentGrade >= 90).length,
    B: students.filter(s => s.currentGrade && s.currentGrade >= 80 && s.currentGrade < 90).length,
    C: students.filter(s => s.currentGrade && s.currentGrade >= 70 && s.currentGrade < 80).length,
    D: students.filter(s => s.currentGrade && s.currentGrade >= 60 && s.currentGrade < 70).length,
    F: students.filter(s => s.currentGrade && s.currentGrade < 60).length,
  };

  // Engagement metrics
  const avgAssignmentsPerStudent = activeStudents > 0 ? totalAssignments / activeStudents : 0;
  const avgSubmissionsPerStudent = activeStudents > 0 ? totalSubmissions / activeStudents : 0;
  const completionRate = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-600';
      case 'B': return 'text-blue-600';
      case 'C': return 'text-yellow-600';
      case 'D': return 'text-orange-600';
      case 'F': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getGradeBgColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-100';
      case 'B': return 'bg-blue-100';
      case 'C': return 'bg-yellow-100';
      case 'D': return 'bg-orange-100';
      case 'F': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Course Analytics</h2>
          <p className="text-gray-600">Insights and performance metrics for {course.courseName}</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="semester">This Semester</option>
          </select>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border-2 border-gray-200/30">
        <div className="flex space-x-1">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'assignments', label: 'Assignments', icon: '📝' },
            { id: 'students', label: 'Students', icon: '👥' },
            { id: 'engagement', label: 'Engagement', icon: '📈' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-yellow-400 to-blue-500 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-blue-200/30">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-500 mb-2">{activeStudents}</div>
                <div className="text-gray-600 font-medium">Active Students</div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-green-200/30">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500 mb-2">{totalAssignments}</div>
                <div className="text-gray-600 font-medium">Total Assignments</div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-purple-200/30">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-500 mb-2">
                  {averageGrade ? averageGrade.toFixed(1) : 'N/A'}%
                </div>
                <div className="text-gray-600 font-medium">Average Grade</div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-orange-200/30">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-500 mb-2">{gradingProgress.toFixed(1)}%</div>
                <div className="text-gray-600 font-medium">Grading Progress</div>
              </div>
            </div>
          </div>

          {/* Course Progress */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border-2 border-gray-200/30">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Course Progress</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-medium text-gray-700 mb-4">Assignment Status</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Published</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${totalAssignments > 0 ? (publishedAssignments / totalAssignments) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{publishedAssignments}/{totalAssignments}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Completed</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{completedAssignments}/{totalAssignments}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-4">Student Status</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Active</span>
                    <span className="font-medium text-green-600">{activeStudents}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Completed</span>
                    <span className="font-medium text-blue-600">{completedStudents}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Dropped</span>
                    <span className="font-medium text-red-600">{droppedStudents}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="space-y-6">
          {/* Assignment Performance */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border-2 border-gray-200/30">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Assignment Performance</h3>
            {assignmentPerformance.length > 0 ? (
              <div className="space-y-4">
                {assignmentPerformance.map((assignment, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                    <div>
                      <h4 className="font-semibold text-gray-800">{assignment.title}</h4>
                      <p className="text-sm text-gray-600">{assignment.points} points • {assignment.submissionsCount} submissions</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{assignment.averageGrade.toFixed(1)}%</div>
                      <div className="text-sm text-gray-600">Average Grade</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📊</div>
                <p className="text-gray-600">No assignment performance data available yet.</p>
              </div>
            )}
          </div>

          {/* Submission Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-green-200/30">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500 mb-2">{totalSubmissions}</div>
                <div className="text-gray-600 font-medium">Total Submissions</div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-blue-200/30">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-500 mb-2">{totalGraded}</div>
                <div className="text-gray-600 font-medium">Graded</div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-purple-200/30">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-500 mb-2">{gradingProgress.toFixed(1)}%</div>
                <div className="text-gray-600 font-medium">Grading Progress</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'students' && (
        <div className="space-y-6">
          {/* Grade Distribution */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border-2 border-gray-200/30">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Grade Distribution</h3>
            <div className="grid grid-cols-5 gap-4">
              {Object.entries(gradeDistribution).map(([grade, count]) => (
                <div key={grade} className="text-center">
                  <div className={`text-3xl font-bold mb-2 ${getGradeColor(grade)}`}>{count}</div>
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${getGradeBgColor(grade)} ${getGradeColor(grade)}`}>
                    Grade {grade}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Student Performance */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border-2 border-gray-200/30">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Student Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-medium text-gray-700 mb-4">Grade Statistics</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Average Grade</span>
                    <span className="font-medium">{averageGrade ? averageGrade.toFixed(1) : 'N/A'}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Highest Grade</span>
                    <span className="font-medium">
                      {students.length > 0 ? Math.max(...students.filter(s => s.currentGrade).map(s => s.currentGrade || 0)) : 'N/A'}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Lowest Grade</span>
                    <span className="font-medium">
                      {students.length > 0 ? Math.min(...students.filter(s => s.currentGrade).map(s => s.currentGrade || 0)) : 'N/A'}%
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-4">Completion Rates</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Course Completion</span>
                    <span className="font-medium">{completionRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Assignment Submission</span>
                    <span className="font-medium">
                      {activeStudents > 0 ? (totalSubmissions / activeStudents).toFixed(1) : '0'} per student
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'engagement' && (
        <div className="space-y-6">
          {/* Engagement Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-green-200/30">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500 mb-2">{avgAssignmentsPerStudent.toFixed(1)}</div>
                <div className="text-gray-600 font-medium">Avg Assignments per Student</div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-blue-200/30">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-500 mb-2">{avgSubmissionsPerStudent.toFixed(1)}</div>
                <div className="text-gray-600 font-medium">Avg Submissions per Student</div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-purple-200/30">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-500 mb-2">{completionRate.toFixed(1)}%</div>
                <div className="text-gray-600 font-medium">Course Completion Rate</div>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border-2 border-gray-200/30">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Recent Activity</h3>
            <div className="space-y-4">
              {assignments.slice(0, 5).map((assignment) => (
                <div key={assignment.assignmentId} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                  <div>
                    <h4 className="font-semibold text-gray-800">{assignment.title}</h4>
                    <p className="text-sm text-gray-600">
                      Created {new Date(assignment.createdAt).toLocaleDateString()} • 
                      {assignment.submissionsCount} submissions • 
                      {assignment.gradedCount} graded
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      assignment.status === 'published' ? 'bg-green-100 text-green-800' :
                      assignment.status === 'grading' ? 'bg-yellow-100 text-yellow-800' :
                      assignment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
