'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StudentRoute } from '@/components/auth/ProtectedRoute';
import { getAssignmentColor } from '@/lib/assignmentColors';

interface Assignment {
  assignmentId: string;
  title: string;
  description?: string;
  courseName?: string;
  courseInitials?: string;
  dueDate: string;
  maxScore?: number;
  isSubmitted?: boolean;
  type?: string;
}

export default function StudentAssignmentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (user?.id) fetchAssignments();
  }, [user?.id]);

  const fetchAssignments = async () => {
    try {
      const res = await fetch(`/api/student/assignments?userId=${user?.id}`);
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
      }
    } catch (e) {
      console.error('Error fetching assignments:', e);
    } finally {
      setLoading(false);
    }
  };

  // Get current week days
  const getWeekDays = () => {
    const now = selectedDate;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return day;
    });
  };

  const weekDays = getWeekDays();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const today = new Date();

  // Check if a date has assignments due
  const getDotsForDate = (date: Date) => {
    return assignments.filter(a => {
      const due = new Date(a.dueDate);
      return due.toDateString() === date.toDateString();
    }).length;
  };

  // Categorize assignments
  const now = new Date();
  const overdue = assignments.filter(a => {
    const due = new Date(a.dueDate);
    return due < now && !a.isSubmitted;
  });
  const todayAssignments = assignments.filter(a => {
    const due = new Date(a.dueDate);
    return due.toDateString() === now.toDateString() && !a.isSubmitted;
  });
  const thisWeek = assignments.filter(a => {
    const due = new Date(a.dueDate);
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (6 - now.getDay()));
    return due > now && due <= endOfWeek && due.toDateString() !== now.toDateString() && !a.isSubmitted;
  });

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return `${Math.abs(diff)} Days late`;
    if (diff === 0) return 'Due Today';
    return `${diff} Day${diff > 1 ? 's' : ''}`;
  };

  const getCourseColor = (courseName?: string) => {
    if (!courseName) return 'bg-blue-50 border-blue-200';
    const name = courseName.toLowerCase();
    if (name.includes('bio') || name.includes('science')) return 'bg-yellow-50 border-yellow-200';
    if (name.includes('algebra') || name.includes('math')) return 'bg-green-50 border-green-200';
    if (name.includes('art') || name.includes('perform')) return 'bg-blue-50 border-blue-200';
    if (name.includes('eng') || name.includes('lit')) return 'bg-purple-50 border-purple-200';
    if (name.includes('hist') || name.includes('social')) return 'bg-orange-50 border-orange-200';
    return 'bg-green-50 border-green-200';
  };

  const getBadgeColor = (dueDate: string) => {
    const due = new Date(dueDate);
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'bg-red-100 text-red-700 border border-red-300';
    if (diff === 0) return 'bg-orange-100 text-orange-700 border border-orange-300';
    return 'bg-gray-100 text-gray-700 border border-gray-300';
  };

  const AssignmentCard = ({ assignment }: { assignment: Assignment }) => (
    <div className={`rounded-xl p-4 mb-3 ${getAssignmentColor(assignment.assignmentId)}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Course name */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">📖</span>
            <span className="font-bold text-sm uppercase tracking-wide text-gray-700 italic">
              {assignment.courseName || assignment.courseInitials || 'Course'}
            </span>
          </div>
          {/* Title */}
          <p className="font-bold text-sm text-[#005587] mb-0.5">
            {assignment.title}
          </p>
          {/* Description */}
          {assignment.description && (
            <p className="text-xs text-gray-600 line-clamp-2 mb-1">
              {assignment.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 100)}
            </p>
          )}
          {/* Due date */}
          <p className="text-xs text-gray-500">
            {new Date(assignment.dueDate).toLocaleDateString('en-US', { 
              weekday: 'long', month: 'short', day: 'numeric', year: 'numeric',
              hour: 'numeric', minute: '2-digit'
            })}
          </p>
          {/* Points */}
          {assignment.maxScore && (
            <p className="text-xs text-blue-600 font-medium mt-0.5">
              {assignment.maxScore} points
            </p>
          )}
        </div>
        {/* Right side: badge + action button */}
        <div className="flex flex-col items-end gap-2 ml-3">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getBadgeColor(assignment.dueDate)}`}>
            {getDaysUntilDue(assignment.dueDate)}
          </span>
          <button
            onClick={() => router.push(`/student/assignments/${assignment.assignmentId}`)}
            className="w-10 h-10 bg-gray-400/70 rounded-full flex items-center justify-center"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <StudentRoute>
      <div className="h-full flex flex-col bg-white overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-3 pb-2 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <img src="/UpdatedCCLogo.png" alt="ClassCast" className="w-8 h-8 object-contain" />
              <div>
                <h1 className="text-2xl font-light">
                  <span className="text-[#2196C9] italic">{monthNames[selectedDate.getMonth()]}</span>
                  {' '}<span className="font-bold text-gray-900">{selectedDate.getFullYear()}</span>
                </h1>
              </div>
            </div>
            <button className="p-2">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>

          {/* Weekly calendar strip - swipeable */}
          <div className="flex items-center gap-1">
            <button onClick={() => setSelectedDate(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; })} className="p-1 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="flex-1 flex justify-between items-center">
              {weekDays.map((day, i) => {
                const isToday = day.toDateString() === today.toDateString();
                const dots = getDotsForDate(day);
                return (
                  <div key={i} className="flex flex-col items-center w-9">
                    <span className="text-[10px] text-gray-500 mb-0.5">{dayNames[i]}</span>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                      isToday ? 'bg-[#005587] text-white shadow-md shadow-blue-300' : 'text-gray-700'
                    }`}>
                      {day.getDate()}
                    </div>
                    <div className="flex gap-0.5 mt-0.5 h-1.5">
                      {dots > 0 && Array.from({ length: Math.min(dots, 3) }).map((_, j) => (
                        <div key={j} className="w-1.5 h-1.5 rounded-full bg-[#FFC72C]" />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setSelectedDate(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; })} className="p-1 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-200 mx-4" />

        {/* Assignment sections - scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Overdue */}
              {overdue.length > 0 && (
                <div className="mb-4">
                  <h2 className="text-base font-bold text-gray-900 mb-2">Overdue</h2>
                  {overdue.map(a => <AssignmentCard key={a.assignmentId} assignment={a} />)}
                </div>
              )}

              {/* Today */}
              {todayAssignments.length > 0 && (
                <div className="mb-4">
                  <h2 className="text-base font-bold text-gray-900 mb-2">Today</h2>
                  {todayAssignments.map(a => <AssignmentCard key={a.assignmentId} assignment={a} />)}
                </div>
              )}

              {/* This Week */}
              {thisWeek.length > 0 && (
                <div className="mb-4">
                  <h2 className="text-base font-bold text-gray-900 mb-2">This Week</h2>
                  {thisWeek.map(a => <AssignmentCard key={a.assignmentId} assignment={a} />)}
                </div>
              )}

              {/* All upcoming (if no categorized ones show) */}
              {overdue.length === 0 && todayAssignments.length === 0 && thisWeek.length === 0 && (
                <div className="mb-4">
                  <h2 className="text-base font-bold text-gray-900 mb-2">All Assignments</h2>
                  {assignments.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No assignments yet</p>
                    </div>
                  ) : (
                    assignments.map(a => <AssignmentCard key={a.assignmentId} assignment={a} />)
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Nav */}
        <nav className="flex-shrink-0 border-t border-gray-200 bg-white">
          <div className="flex items-center justify-around h-14 px-4">
            <a href="/student/dashboard" className="flex flex-col items-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-[10px] text-gray-400">Home</span>
            </a>
            <a href="/student/assignments" className="flex flex-col items-center">
              <svg className="w-6 h-6 text-[#005587]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-[10px] text-[#005587] font-medium">Assignments</span>
            </a>
            <a href="/student/record" className="-mt-6">
              <div className="w-14 h-14 bg-gradient-to-br from-[#005587] to-[#0088cc] rounded-full flex items-center justify-center shadow-xl border-4 border-white ring-2 ring-[#FFC72C]">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </a>
            <a href="/student/notifications" className="flex flex-col items-center relative">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute -top-0.5 right-0 w-4 h-4 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold">1</span>
              <span className="text-[10px] text-gray-400">Alerts</span>
            </a>
            <a href="/student/profile" className="flex flex-col items-center">
              <div className="w-6 h-6 rounded-full border-2 border-[#FFC72C] overflow-hidden">
                <img src="/headshot.jpeg" alt="Profile" className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] text-gray-400">Profile</span>
            </a>
          </div>
        </nav>
      </div>
    </StudentRoute>
  );
}
