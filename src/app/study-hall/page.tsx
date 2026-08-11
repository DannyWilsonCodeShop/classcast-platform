'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface StudentResult {
  name: string;
  homeroom?: string;
  studyHallTeacher?: string;
}

interface PulloutEntry {
  pulloutId: string;
  studentName: string;
  pulloutDate: string;
  requestedByName: string;
  reason?: string;
  homeroom?: string;
  studyHallTeacher?: string;
  status: string;
}

const TEACHERS = [
  'Dr. Diaz',
  'Ms. Marlar',
  'Ms. Tate',
  'Ms. Alvarado',
  'Mr. Wilson',
  'Mr. Barrow',
  'Mr. Gordon',
  'Ms. King',
  'Ms. Brown',
  'Dean Stevens',
  'Mr. Johnson (CWS)',
  'IT Service Desk',
  'Other',
];

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

export default function PublicStudyHallPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'request' | 'today'>('request');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StudentResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>(null);
  const [customStudentName, setCustomStudentName] = useState('');
  const [pulloutDate, setPulloutDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    while (tomorrow.getDay() === 0 || tomorrow.getDay() === 6) {
      tomorrow.setDate(tomorrow.getDate() + 1);
    }
    return tomorrow.toISOString().split('T')[0];
  });
  const [teacherName, setTeacherName] = useState('');
  const [customTeacher, setCustomTeacher] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bulkAdding, setBulkAdding] = useState(false);
  const [bulkCount, setBulkCount] = useState(0);
  const [bumpedMessage, setBumpedMessage] = useState('');
  const [myRequests, setMyRequests] = useState<Array<{ studentName: string; pulloutDate: string }>>([]);

  // Today's list state
  const [todayList, setTodayList] = useState<PulloutEntry[]>([]);
  const [loadingToday, setLoadingToday] = useState(false);
  const [viewDate, setViewDate] = useState(getTodayStr());

  // Load last selected teacher from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('classcast_studyhall_teacher');
    if (saved) setTeacherName(saved);
    const savedReason = localStorage.getItem('classcast_studyhall_reason');
    if (savedReason) setReason(savedReason);
  }, []);

  // Save teacher selection to localStorage
  useEffect(() => {
    if (teacherName && teacherName !== 'Other') {
      localStorage.setItem('classcast_studyhall_teacher', teacherName);
    }
  }, [teacherName]);

  // Save reason to localStorage
  useEffect(() => {
    if (reason) {
      localStorage.setItem('classcast_studyhall_reason', reason);
    }
  }, [reason]);

  // Fetch pickup list when tab is active, date changes, or after adding
  const [todayRefreshKey, setTodayRefreshKey] = useState(0);
  useEffect(() => {
    if (activeTab !== 'today') return;
    const fetchList = async () => {
      setLoadingToday(true);
      try {
        const res = await fetch(`/api/study-hall?date=${viewDate}`);
        const data = await res.json();
        if (data.success) setTodayList(data.pullouts || []);
      } catch {} finally { setLoadingToday(false); }
    };
    fetchList();
  }, [activeTab, todayRefreshKey, viewDate]); // re-fetch after a successful add

  // Search students
  useEffect(() => {
    if (searchQuery.includes(',')) return;
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/study-hall/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data.success) setSearchResults(data.students || []);
      } catch {} finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const getEffectiveTeacher = () => teacherName === 'Other' ? customTeacher.trim() : teacherName;
  const getEffectiveStudent = () => selectedStudent?.name || customStudentName.trim();

  const submitSingleStudent = useCallback(async (studentName: string): Promise<{ success: boolean; bumped?: boolean; message?: string; effectiveDate?: string }> => {
    const teacher = getEffectiveTeacher();
    if (!studentName || !pulloutDate || !teacher) return { success: false };
    try {
      const res = await fetch('/api/study-hall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName,
          pulloutDate,
          requestedBy: 'public_' + teacher.toLowerCase().replace(/\s+/g, '_'),
          requestedByName: teacher,
          reason,
          teamId: '',
        }),
      });
      const data = await res.json();
      return {
        success: data.success,
        bumped: data.bumped,
        message: data.message,
        effectiveDate: data.pullout?.pulloutDate,
      };
    } catch { return { success: false }; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pulloutDate, teacherName, customTeacher, reason]);

  const handleBulkPaste = useCallback(async (text: string) => {
    const names = text.split(',').map(n => n.trim()).filter(n => n.length >= 2);
    if (names.length < 2) return false;

    const teacher = getEffectiveTeacher();
    if (!teacher) return false;

    setBulkAdding(true);
    setBulkCount(0);
    setBumpedMessage('');
    let added = 0;
    const bumpedNames: string[] = [];

    for (const name of names) {
      const result = await submitSingleStudent(name);
      if (result.success) {
        added++;
        setBulkCount(added);
        setMyRequests(prev => [...prev, { studentName: name, pulloutDate: result.effectiveDate || pulloutDate }]);
        if (result.bumped && result.message) {
          bumpedNames.push(name);
        }
      }
    }

    setBulkAdding(false);
    setSearchQuery('');
    setCustomStudentName('');
    setSuccess(true);
    if (bumpedNames.length > 0) {
      setBumpedMessage(`${bumpedNames.join(', ')} already requested — moved to next school day.`);
    }
    setTimeout(() => setSuccess(false), 3000);
    setTodayRefreshKey(k => k + 1);
    return true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pulloutDate, teacherName, customTeacher, reason, submitSingleStudent]);

  const handleSubmit = async () => {
    if (searchQuery.includes(',')) {
      await handleBulkPaste(searchQuery);
      return;
    }

    const studentName = getEffectiveStudent();
    const teacher = getEffectiveTeacher();
    if (!studentName || !pulloutDate || !teacher) return;
    setSubmitting(true);
    setBumpedMessage('');
    try {
      const result = await submitSingleStudent(studentName);
      if (result.success) {
        setMyRequests(prev => [...prev, { studentName, pulloutDate: result.effectiveDate || pulloutDate }]);
        setSelectedStudent(null);
        setSearchQuery('');
        setCustomStudentName('');
        setSuccess(true);
        if (result.bumped && result.message) {
          setBumpedMessage(result.message);
        }
        setTimeout(() => setSuccess(false), 2000);
        setTodayRefreshKey(k => k + 1);
      }
    } finally { setSubmitting(false); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setSelectedStudent(null);
    setCustomStudentName(val);
  };

  // Group today's list by Study Hall (studyHallTeacher field)
  const groupedByStudyHall = todayList.reduce((acc, entry) => {
    const sh = entry.studyHallTeacher || entry.homeroom || 'Unassigned';
    if (!acc[sh]) acc[sh] = [];
    acc[sh].push(entry);
    return acc;
  }, {} as Record<string, PulloutEntry[]>);

  const sortedStudyHalls = Object.keys(groupedByStudyHall).sort((a, b) => {
    if (a === 'Unassigned') return 1;
    if (b === 'Unassigned') return -1;
    return a.localeCompare(b);
  });

  const handleDeletePullout = async (pulloutId: string) => {
    try {
      const res = await fetch(`/api/study-hall?pulloutId=${pulloutId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setTodayList(prev => prev.filter(p => p.pulloutId !== pulloutId));
        setMyRequests(prev => prev.filter((_, i) => i !== prev.findIndex(r => (r as any).pulloutId === pulloutId)));
      }
    } catch {}
  };

  return (
    <div className="h-[100dvh] bg-white flex flex-col">
      <style jsx global>{`
        .scroll-area::-webkit-scrollbar { display: none; }
        .scroll-area { -ms-overflow-style: none; scrollbar-width: none; }
        .safe-top { padding-top: env(safe-area-inset-top, 0px); }
        .safe-bottom { padding-bottom: env(safe-area-inset-bottom, 0px); }
      `}</style>

      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Grand+Hotel&display=swap" rel="stylesheet" />

      {/* Header */}
      <div className="bg-[#005587] text-white px-4 py-3 flex items-center justify-between safe-top shrink-0">
        <button onClick={() => router.push('/about')} className="flex items-center gap-2">
          <img src="/UpdatedCCLogo.png" alt="" className="w-7 h-7 object-contain brightness-200" />
          <span style={{ fontFamily: "'Grand Hotel', cursive" }} className="text-xl">ClassCast</span>
        </button>
        <button onClick={() => router.push('/about')} className="text-[10px] text-white/70 hover:text-white">
          Learn More →
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-200 shrink-0 bg-white">
        <button
          onClick={() => setActiveTab('request')}
          className={`flex-1 py-3 text-xs font-bold text-center transition-colors ${activeTab === 'request' ? 'text-[#005587] border-b-2 border-[#005587]' : 'text-gray-400'}`}
        >
          Request Pullout
        </button>
        <button
          onClick={() => { setActiveTab('today'); setTodayRefreshKey(k => k + 1); }}
          className={`flex-1 py-3 text-xs font-bold text-center transition-colors relative ${activeTab === 'today' ? 'text-[#005587] border-b-2 border-[#005587]' : 'text-gray-400'}`}
        >
          Today&apos;s List
          {todayList.length > 0 && (
            <span className="absolute top-2 right-[calc(50%-40px)] bg-[#005587] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
              {todayList.length}
            </span>
          )}
        </button>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto scroll-area safe-bottom">
        {activeTab === 'request' ? (
          /* ===== REQUEST TAB ===== */
          <div className="max-w-md mx-auto px-4 py-5">
            <div className="text-center mb-5">
              <h1 className="text-lg font-bold text-[#005587]">Study Hall Pullout</h1>
              <p className="text-[11px] text-gray-500 mt-0.5">Add students to the pullout list</p>
            </div>

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 text-center font-medium animate-pulse">
                {bulkCount > 1 ? `✓ ${bulkCount} students added` : '✓ Student added to pullout list'}
              </div>
            )}

            {bumpedMessage && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 text-center font-medium">
                ⚠️ {bumpedMessage}
              </div>
            )}

            {bulkAdding && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 text-center font-medium">
                Adding students... ({bulkCount} added so far)
              </div>
            )}

            <div className="bg-gray-50 rounded-2xl p-4 mb-4">
              {/* Teacher dropdown */}
              <div className="mb-3">
                <label className="block text-[10px] font-medium text-gray-600 mb-1">Your Name</label>
                <select
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-[#005587] focus:border-[#005587] appearance-none"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                >
                  <option value="">Select your name...</option>
                  {TEACHERS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {teacherName === 'Other' && (
                  <input
                    type="text"
                    value={customTeacher}
                    onChange={(e) => setCustomTeacher(e.target.value)}
                    placeholder="Enter your name..."
                    className="w-full mt-2 px-3 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#005587] focus:border-[#005587]"
                  />
                )}
              </div>

              {/* Student Search */}
              <div className="relative mb-3">
                <label className="block text-[10px] font-medium text-gray-600 mb-1">Student Name(s)</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleInputChange}
                  placeholder="Search name or paste comma-separated list..."
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#005587] focus:border-[#005587]"
                />
                {searching && (
                  <div className="absolute right-3 top-9">
                    <div className="w-4 h-4 border-2 border-[#005587] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {searchResults.length > 0 && !selectedStudent && (
                  <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {searchResults.map((student, i) => (
                      <button
                        key={i}
                        onClick={() => { setSelectedStudent(student); setSearchQuery(student.name); setCustomStudentName(''); setSearchResults([]); }}
                        className="w-full text-left px-3 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 active:bg-gray-100"
                      >
                        <p className="text-sm font-medium text-gray-800">{student.name}</p>
                        {student.homeroom && <p className="text-[10px] text-gray-500">Study Hall: {student.homeroom}</p>}
                      </button>
                    ))}
                  </div>
                )}
                {searchQuery.length >= 2 && !searchQuery.includes(',') && searchResults.length === 0 && !searching && !selectedStudent && (
                  <p className="text-[9px] text-gray-400 mt-1">Not found? Type the full name and submit, or paste multiple names separated by commas.</p>
                )}
                {searchQuery.includes(',') && (
                  <p className="text-[9px] text-[#005587] mt-1 font-medium">
                    Bulk mode: {searchQuery.split(',').map(n => n.trim()).filter(n => n.length >= 2).length} names detected
                  </p>
                )}
              </div>

              {selectedStudent && (
                <div className="flex items-center gap-2 mb-3 p-2.5 bg-[#005587]/10 rounded-xl">
                  <span className="text-xs font-medium text-[#005587]">{selectedStudent.name}</span>
                  {selectedStudent.homeroom && <span className="text-[10px] text-gray-500">({selectedStudent.homeroom})</span>}
                  <button onClick={() => { setSelectedStudent(null); setSearchQuery(''); }} className="ml-auto text-gray-400 text-sm">✕</button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[10px] font-medium text-gray-600 mb-1">Date</label>
                  <input type="date" value={pulloutDate} onChange={(e) => setPulloutDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-[#005587] bg-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-600 mb-1">Reason (optional)</label>
                  <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g., Tutoring"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-[#005587]" />
                </div>
              </div>

              <button onClick={handleSubmit} disabled={!getEffectiveStudent() || !getEffectiveTeacher() || submitting || bulkAdding}
                className="w-full py-3 bg-[#005587] text-white rounded-xl text-sm font-bold disabled:opacity-50 active:scale-[0.98] transition-transform">
                {bulkAdding ? `Adding... (${bulkCount})` : submitting ? 'Adding...' : searchQuery.includes(',') ? `Add ${searchQuery.split(',').map(n => n.trim()).filter(n => n.length >= 2).length} Students` : 'Add to Pullout List'}
              </button>
            </div>

            {/* Session list */}
            {myRequests.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-bold text-[#005587]">Added This Session</h2>
                  <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{myRequests.length}</span>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto scroll-area">
                  {myRequests.map((req, i) => (
                    <div key={i} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl">
                      <div className="w-6 h-6 bg-[#005587]/10 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-[9px] text-[#005587] font-bold">{req.studentName.charAt(0)}</span>
                      </div>
                      <span className="text-xs text-gray-700 flex-1 truncate">{req.studentName}</span>
                      <span className="text-[10px] text-gray-400">{new Date(req.pulloutDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Join CTA removed */}
          </div>
        ) : (
          /* ===== TODAY'S LIST TAB ===== */
          <div className="max-w-md mx-auto px-4 py-5">
            <div className="text-center mb-4">
              <h1 className="text-lg font-bold text-[#005587]">Pickup List</h1>
              {/* Date navigation */}
              <div className="flex items-center justify-center gap-3 mt-2">
                <button
                  onClick={() => {
                    const d = new Date(viewDate + 'T12:00:00');
                    d.setDate(d.getDate() - 1);
                    // Skip weekends going backward
                    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
                    setViewDate(d.toISOString().split('T')[0]);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 active:bg-gray-200"
                >
                  ‹
                </button>
                <div className="text-center min-w-[140px]">
                  <p className="text-xs font-medium text-gray-700">
                    {viewDate === getTodayStr() ? 'Today' : new Date(viewDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  {viewDate !== getTodayStr() && (
                    <button onClick={() => setViewDate(getTodayStr())} className="text-[9px] text-[#005587] font-medium mt-0.5">
                      Back to Today
                    </button>
                  )}
                </div>
                <button
                  onClick={() => {
                    const d = new Date(viewDate + 'T12:00:00');
                    d.setDate(d.getDate() + 1);
                    // Skip weekends going forward
                    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
                    setViewDate(d.toISOString().split('T')[0]);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 active:bg-gray-200"
                >
                  ›
                </button>
              </div>
            </div>

            {loadingToday ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-2 border-[#005587] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : todayList.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl">📋</span>
                </div>
                <p className="text-sm text-gray-500">No students on the pullout list for {viewDate === getTodayStr() ? 'today' : new Date(viewDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                <button onClick={() => setActiveTab('request')} className="mt-3 text-xs text-[#005587] font-medium">
                  + Add a student
                </button>
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="flex items-center justify-between mb-4 p-3 bg-[#005587]/5 rounded-xl">
                  <span className="text-xs font-medium text-[#005587]">Total Students</span>
                  <span className="text-sm font-bold text-[#005587]">{todayList.length}</span>
                </div>

                {/* Grouped by Study Hall */}
                <div className="space-y-4">
                  {sortedStudyHalls.map(studyHall => (
                    <div key={studyHall}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 bg-[#005587] rounded-full flex items-center justify-center shrink-0">
                          <span className="text-[8px] text-white font-bold">{groupedByStudyHall[studyHall].length}</span>
                        </div>
                        <h3 className="text-xs font-bold text-gray-700">{studyHall} Study Hall</h3>
                      </div>
                      <div className="space-y-1.5 ml-7">
                        {groupedByStudyHall[studyHall].map((entry) => (
                          <div key={entry.pulloutId} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-800 truncate">{entry.studentName}</p>
                              <p className="text-[10px] text-gray-400">
                                {entry.requestedByName}{entry.reason ? ` · ${entry.reason}` : ''}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeletePullout(entry.pulloutId)}
                              className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                              title="Remove student"
                            >
                              <span className="text-sm">✕</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
