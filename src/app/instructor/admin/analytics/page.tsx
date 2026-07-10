'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface PlatformStats {
  totalStudents: number;
  totalInstructors: number;
  totalCourses: number;
  totalAssignments: number;
  totalSubmissions: number;
  activeStudentsThisWeek: number;
  submissionsThisWeek: number;
  averageGrade: number;
  gradedCount: number;
  ungradedCount: number;
}

interface CourseStats {
  courseId: string;
  courseName: string;
  studentCount: number;
  assignmentCount: number;
  submissionCount: number;
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [courseStats, setCourseStats] = useState<CourseStats[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    // Check admin access
    if (user && !(user as any).isAdmin) {
      router.replace('/instructor/profile');
      return;
    }
    fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/admin/analytics');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
          setCourseStats(data.courseStats || []);
        }
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const headers = ['Course', 'Students', 'Assignments', 'Submissions'];
      const rows = courseStats.map(c => [c.courseName, c.studentCount, c.assignmentCount, c.submissionCount]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `classcast-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Export failed');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <InstructorRoute>
        <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>
      </InstructorRoute>
    );
  }

  return (
    <InstructorRoute>
      <div className="min-h-full overflow-y-auto pb-24 bg-white">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => router.back()} className="text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <h1 className="text-sm font-bold text-[#005587]">Platform Analytics</h1>
            </div>
            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className="px-3 py-1.5 bg-gray-100 rounded-full text-[10px] font-bold text-[#005587] disabled:opacity-50"
            >
              {exporting ? '...' : '📊 Export CSV'}
            </button>
          </div>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* Overview Stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Total Students" value={stats?.totalStudents || 0} icon="👨‍🎓" />
            <StatCard label="Total Instructors" value={stats?.totalInstructors || 0} icon="👩‍🏫" />
            <StatCard label="Courses" value={stats?.totalCourses || 0} icon="📚" />
            <StatCard label="Assignments" value={stats?.totalAssignments || 0} icon="📝" />
            <StatCard label="Submissions" value={stats?.totalSubmissions || 0} icon="🎥" />
            <StatCard label="Active This Week" value={stats?.activeStudentsThisWeek || 0} icon="🟢" />
          </div>

          {/* Grading Summary */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <h2 className="text-sm font-bold text-[#005587] mb-3">Grading</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">{stats?.gradedCount || 0}</div>
                <div className="text-[10px] text-gray-500">Graded</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-orange-500">{stats?.ungradedCount || 0}</div>
                <div className="text-[10px] text-gray-500">Ungraded</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-[#005587]">{stats?.averageGrade ? `${Math.round(stats.averageGrade)}%` : '—'}</div>
                <div className="text-[10px] text-gray-500">Avg Grade</div>
              </div>
            </div>
          </div>

          {/* This Week */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <h2 className="text-sm font-bold text-[#005587] mb-2">This Week</h2>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Submissions received</span>
              <span className="text-sm font-bold text-[#005587]">{stats?.submissionsThisWeek || 0}</span>
            </div>
          </div>

          {/* Per-Course Breakdown */}
          <div>
            <h2 className="text-sm font-bold text-[#005587] mb-2">By Course</h2>
            <div className="space-y-2">
              {courseStats.length > 0 ? courseStats.map(course => (
                <div key={course.courseId} className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-900 truncate">{course.courseName}</p>
                    <p className="text-[10px] text-gray-500">
                      {course.studentCount} students · {course.assignmentCount} assignments
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <div className="text-sm font-bold text-[#005587]">{course.submissionCount}</div>
                    <div className="text-[9px] text-gray-400">submissions</div>
                  </div>
                </div>
              )) : (
                <p className="text-xs text-gray-400 text-center py-4">No course data available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </InstructorRoute>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-3 text-center">
      <div className="text-lg mb-0.5">{icon}</div>
      <div className="text-xl font-bold text-[#005587]">{value}</div>
      <div className="text-[10px] text-gray-500">{label}</div>
    </div>
  );
}
