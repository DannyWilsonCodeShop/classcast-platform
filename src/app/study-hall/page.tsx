'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface StudentResult {
  name: string;
  homeroom?: string;
  studyHallTeacher?: string;
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

export default function PublicStudyHallPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StudentResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>(null);
  const [customStudentName, setCustomStudentName] = useState('');
  const [pulloutDate, setPulloutDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [teacherName, setTeacherName] = useState('');
  const [customTeacher, setCustomTeacher] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bulkAdding, setBulkAdding] = useState(false);
  const [bulkCount, setBulkCount] = useState(0);
  const [myRequests, setMyRequests] = useState<Array<{ studentName: string; pulloutDate: string }>>([]);

  // Load last selected teacher from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('classcast_studyhall_teacher');
    if (saved) setTeacherName(saved);
  }, []);

  // Save teacher selection to localStorage
  useEffect(() => {
    if (teacherName && teacherName !== 'Other') {
      localStorage.setItem('classcast_studyhall_teacher', teacherName);
    }
  }, [teacherName]);

  // Search students
  useEffect(() => {
    // Don't search if it looks like a comma-separated list (bulk paste)
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

  const submitSingleStudent = useCallback(async (studentName: string) => {
    const teacher = getEffectiveTeacher();
    if (!studentName || !pulloutDate || !teacher) return false;
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
      return data.success;
    } catch { return false; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pulloutDate, teacherName, customTeacher, reason]);

  // Detect comma-separated paste and bulk add
  const handleBulkPaste = useCallback(async (text: string) => {
    const names = text.split(',').map(n => n.trim()).filter(n => n.length >= 2);
    if (names.length < 2) return false; // Not a bulk paste

    const teacher = getEffectiveTeacher();
    if (!teacher) return false;

    setBulkAdding(true);
    setBulkCount(0);
    let added = 0;

    for (const name of names) {
      const ok = await submitSingleStudent(name);
      if (ok) {
        added++;
        setBulkCount(added);
        setMyRequests(prev => [...prev, { studentName: name, pulloutDate }]);
      }
    }

    setBulkAdding(false);
    setSearchQuery('');
    setCustomStudentName('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    return true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pulloutDate, teacherName, customTeacher, reason, submitSingleStudent]);

  const handleSubmit = async () => {
    // Check for comma-separated bulk input
    if (searchQuery.includes(',')) {
      await handleBulkPaste(searchQuery);
      return;
    }

    const studentName = getEffectiveStudent();
    const teacher = getEffectiveTeacher();
    if (!studentName || !pulloutDate || !teacher) return;
    setSubmitting(true);
    try {
      const ok = await submitSingleStudent(studentName);
      if (ok) {
        setMyRequests(prev => [...prev, { studentName, pulloutDate }]);
        setSelectedStudent(null);
        setSearchQuery('');
        setCustomStudentName('');
        setReason('');
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      }
    } finally { setSubmitting(false); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setSelectedStudent(null);
    setCustomStudentName(val);
  };

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col overflow-hidden">
      {/* PWA-style viewport meta handled by Next.js layout, but we add styles for full-screen feel */}
      <style jsx global>{`
        html, body { 
          overflow: hidden; 
          height: 100dvh;
          -webkit-overflow-scrolling: touch;
        }
        /* Hide scrollbar but allow scroll */
        .scroll-area::-webkit-scrollbar { display: none; }
        .scroll-area { -ms-overflow-style: none; scrollbar-width: none; }
        /* Safe area padding for notched phones */
        .safe-top { padding-top: env(safe-area-inset-top, 0px); }
        .safe-bottom { padding-bottom: env(safe-area-inset-bottom, 0px); }
      `}</style>

      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Grand+Hotel&display=swap" rel="stylesheet" />

      {/* Header — fixed app bar */}
      <div className="bg-[#005587] text-white px-4 py-3 flex items-center justify-between safe-top shrink-0">
        <button onClick={() => router.push('/about')} className="flex items-center gap-2">
          <img src="/UpdatedCCLogo.png" alt="" className="w-7 h-7 object-contain brightness-200" />
          <span style={{ fontFamily: "'Grand Hotel', cursive" }} className="text-xl">ClassCast</span>
        </button>
        <button onClick={() => router.push('/about')} className="text-[10px] text-white/70 hover:text-white">
          Learn More →
        </button>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto scroll-area safe-bottom">
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
                      {student.homeroom && <p className="text-[10px] text-gray-500">Homeroom: {student.homeroom}</p>}
                    </button>
                  ))}
                </div>
              )}
              {/* Hint for unlisted students */}
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

          {/* Join CTA */}
          <div className="text-center bg-[#005587]/5 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-[#005587] mb-1">Want the full experience?</h3>
            <p className="text-xs text-gray-500 mb-3">Video assignments, AI grading, peer responses, and more.</p>
            <button onClick={() => router.push('/about')} className="inline-block px-5 py-3 bg-[#FFC72C] text-[#005587] rounded-xl text-sm font-bold active:scale-[0.98] transition-transform">
              Join ClassCast — Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
