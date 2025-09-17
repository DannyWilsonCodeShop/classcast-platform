'use client';

import React, { useState, useEffect } from 'react';

interface AnalyticsData {
  userGrowth: { month: string; users: number }[];
  assignmentStats: { total: number; completed: number; pending: number };
  submissionStats: { total: number; graded: number; pending: number };
  courseStats: { total: number; active: number; completed: number };
  systemPerformance: { uptime: number; responseTime: number; errorRate: number };
}

const AdminAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    userGrowth: [],
    assignmentStats: { total: 0, completed: 0, pending: 0 },
    submissionStats: { total: 0, graded: 0, pending: 0 },
    courseStats: { total: 0, active: 0, completed: 0 },
    systemPerformance: { uptime: 99.9, responseTime: 120, errorRate: 0.1 }
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Mock data - replace with actual API calls
      const mockData: AnalyticsData = {
        userGrowth: [
          { month: 'Jan', users: 120 },
          { month: 'Feb', users: 150 },
          { month: 'Mar', users: 180 },
          { month: 'Apr', users: 220 },
          { month: 'May', users: 280 },
          { month: 'Jun', users: 350 }
        ],
        assignmentStats: { total: 45, completed: 38, pending: 7 },
        submissionStats: { total: 1200, graded: 1100, pending: 100 },
        courseStats: { total: 12, active: 10, completed: 2 },
        systemPerformance: { uptime: 99.9, responseTime: 120, errorRate: 0.1 }
      };
      
      setAnalytics(mockData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      // TODO: Implement report generation
      console.log('Generating analytics report...');
      alert('Report generation started. You will receive an email when ready.');
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics & Reports</h2>
          <p className="mt-1 text-sm text-gray-600">
            Monitor platform performance and user engagement
          </p>
        </div>
        <div className="flex space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            onClick={generateReport}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Generate Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900">
                {analytics.userGrowth[analytics.userGrowth.length - 1]?.users || 0}
              </p>
              <p className="text-sm text-green-600">+12% from last month</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <span className="text-2xl">📝</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Assignments</p>
              <p className="text-2xl font-semibold text-gray-900">{analytics.assignmentStats.total}</p>
              <p className="text-sm text-gray-500">{analytics.assignmentStats.completed} completed</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100">
              <span className="text-2xl">📤</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Submissions</p>
              <p className="text-2xl font-semibold text-gray-900">{analytics.submissionStats.total}</p>
              <p className="text-sm text-gray-500">{analytics.submissionStats.graded} graded</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-orange-100">
              <span className="text-2xl">📚</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Courses</p>
              <p className="text-2xl font-semibold text-gray-900">{analytics.courseStats.total}</p>
              <p className="text-sm text-gray-500">{analytics.courseStats.active} active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">User Growth</h3>
          </div>
          <div className="p-6">
            <div className="h-64 flex items-end space-x-2">
              {analytics.userGrowth.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="bg-blue-500 rounded-t w-full"
                    style={{ height: `${(data.users / 400) * 200}px` }}
                  ></div>
                  <div className="text-xs text-gray-500 mt-2">{data.month}</div>
                  <div className="text-xs font-medium text-gray-900">{data.users}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Performance */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">System Performance</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Uptime</span>
              <span className="text-lg font-semibold text-green-600">
                {analytics.systemPerformance.uptime}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${analytics.systemPerformance.uptime}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Response Time</span>
              <span className="text-lg font-semibold text-blue-600">
                {analytics.systemPerformance.responseTime}ms
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Error Rate</span>
              <span className="text-lg font-semibold text-red-600">
                {analytics.systemPerformance.errorRate}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assignment Statistics */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Assignment Statistics</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Assignments</span>
                <span className="font-medium">{analytics.assignmentStats.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Completed</span>
                <span className="font-medium text-green-600">{analytics.assignmentStats.completed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Pending</span>
                <span className="font-medium text-yellow-600">{analytics.assignmentStats.pending}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ 
                    width: `${(analytics.assignmentStats.completed / analytics.assignmentStats.total) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Submission Statistics */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Submission Statistics</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Submissions</span>
                <span className="font-medium">{analytics.submissionStats.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Graded</span>
                <span className="font-medium text-green-600">{analytics.submissionStats.graded}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Pending</span>
                <span className="font-medium text-yellow-600">{analytics.submissionStats.pending}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ 
                    width: `${(analytics.submissionStats.graded / analytics.submissionStats.total) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Course Statistics */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Course Statistics</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Courses</span>
                <span className="font-medium">{analytics.courseStats.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active</span>
                <span className="font-medium text-green-600">{analytics.courseStats.active}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Completed</span>
                <span className="font-medium text-blue-600">{analytics.courseStats.completed}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div
                  className="bg-purple-500 h-2 rounded-full"
                  style={{ 
                    width: `${(analytics.courseStats.active / analytics.courseStats.total) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
