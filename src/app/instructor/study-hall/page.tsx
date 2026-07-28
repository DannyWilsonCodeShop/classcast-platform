'use client';

import React, { useState, useEffect } from 'react';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface StudentResult {
  name: string;
  studentId?: string;
  homeroom?: string;
  studyHallTeacher?: string;
  email?: string;
}

interface PulloutRequest {
  pulloutId: string;
  studentName: string;
  pulloutDate: string;
  requestedByName: string;
  reason: string;
  status: string;
  createdAt: string;
}

export default function StudyHallPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StudentResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Pullout form state
  const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>(null);
  const [pulloutDate, setPulloutDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // My requests
  const [myRequests, setMyRequests] = useState<PulloutRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Fetch my requests
  useEffect(() => {
    if (user?.id) fetchMyRequests();
  }, [user?.id]);

  const fetchMyRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await fetch(`/api/study-hall?requestedBy=${user?.id}`);
      const data = await res.json();
      if (data.success) {
        setMyRequests(data.pullouts || []);
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Search students
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/study-hall/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data.success) setSearchResults(data.students || []);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Submit pullout request
  const handleSubmit = async () => {
    if (!selectedStudent || !pulloutDate || !user?.id) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/study-hall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: selectedStudent.name,
          studentId: selectedStudent.studentId || '',
          pulloutDate,
          requestedBy: user.id,
          requestedByName: `${user.firstName} ${user.lastName}`,
          reason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedStudent(null);
        setSearchQuery('');
        setReason('');
        fetchMyRequests();
      }
    } catch (err) {
      console.error('Failed to submit:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete request
  const handleDelete = async (pulloutId: string) => {
    try {
      await fetch(`/api/study-hall?pulloutId=${pulloutId}`, { method: 'DELETE' });
      setMyRequests(prev => prev.filter(r => r.pulloutId !== pulloutId));
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  // Group requests by date
  const requestsByDate = myRequests.reduce((acc, req) => {
    const date = req.pulloutDate;
    if (!acc[date]) acc[date] = [];
    acc[date].push(req);
    return acc;
  }, {} as Record<string, PulloutRequest[]>);

  const sortedDates = Object.keys(requestsByDate).sort();

  return (
    <InstructorRoute>
      <div className="min-h-full overflow-y-auto pb-24 bg-white px-4 py-6">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-[#005587]">Study Hall Pullouts</h1>
              <p className="text-xs text-gray-500">Request students for study hall</p>
            </div>
            {(user as any)?.isAdmin && (
              <button
                onClick={() => router.push('/instructor/study-hall/admin')}
                className="px-3 py-1.5 bg-[#005587] text-white rounded-lg text-xs font-bold"
              >
                Admin View
              </button>
            )}
          </div>

          {/* Add Pullout Request */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-6">
            <h2 className="text-sm font-bold text-[#005587] mb-3">Request a Student</h2>

            {/* Student Search */}
            <div className="relative mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSelectedStudent(null); }}
                placeholder="Search student name..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#005587] focus:border-[#005587]"
              />
              {searching && (
                <div className="absolute right-3 top-3">
                  <div className="w-4 h-4 border-2 border-[#005587] border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* Search results dropdown */}
              {searchResults.length > 0 && !selectedStudent && (
                <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {searchResults.map((student, i) => (
                    <button
                      key={i}
                      onClick={() => { setSelectedStudent(student); setSearchQuery(student.name); setSearchResults([]); }}
                      className="w-full text-left px-3 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <p className="text-sm font-medium text-gray-800">{student.name}</p>
                      {student.homeroom && (
                        <p className="text-[10px] text-gray-500">Homeroom: {student.homeroom}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected student badge */}
            {selectedStudent && (
              <div className="flex items-center gap-2 mb-3 p-2 bg-[#005587]/10 rounded-lg">
                <span className="text-xs font-medium text-[#005587]">{selectedStudent.name}</span>
                {selectedStudent.homeroom && (
                  <span className="text-[10px] text-gray-500">({selectedStudent.homeroom})</span>
                )}
                <button onClick={() => { setSelectedStudent(null); setSearchQuery(''); }} className="ml-auto text-gray-400 text-xs">✕</button>
              </div>
            )}

            {/* Date picker */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[10px] font-medium text-gray-600 mb-1">Pullout Date</label>
                <input
                  type="date"
                  value={pulloutDate}
                  onChange={(e) => setPulloutDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-[#005587]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-600 mb-1">Reason (optional)</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Math tutoring"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-[#005587]"
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={!selectedStudent || submitting}
              className="w-full py-2.5 bg-[#005587] text-white rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Adding...' : 'Add to Pullout List'}
            </button>
          </div>

          {/* My Requests */}
          <div>
            <h2 className="text-sm font-bold text-[#005587] mb-3">My Requests</h2>

            {loadingRequests ? (
              <p className="text-xs text-gray-400 text-center py-4">Loading...</p>
            ) : myRequests.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">No pullout requests yet.</p>
            ) : (
              <div className="space-y-4">
                {sortedDates.map(date => (
                  <div key={date}>
                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">
                      {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </p>
                    <div className="space-y-1.5">
                      {requestsByDate[date].map(req => (
                        <div key={req.pulloutId} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate">{req.studentName}</p>
                            {req.reason && <p className="text-[10px] text-gray-500 truncate">{req.reason}</p>}
                          </div>
                          <button
                            onClick={() => handleDelete(req.pulloutId)}
                            className="text-gray-300 hover:text-red-500 p-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </InstructorRoute>
  );
}
