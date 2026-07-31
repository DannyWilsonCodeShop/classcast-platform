'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface StudentResult {
  name: string;
  homeroom?: string;
  studyHallTeacher?: string;
}

export default function PublicStudyHallPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StudentResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>(null);
  const [pulloutDate, setPulloutDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [teacherName, setTeacherName] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [myRequests, setMyRequests] = useState<Array<{ studentName: string; pulloutDate: string }>>([]);

  // Search students
  useEffect(() => {
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

  const handleSubmit = async () => {
    if (!selectedStudent || !pulloutDate || !teacherName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/study-hall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: selectedStudent.name,
          pulloutDate,
          requestedBy: 'public_' + teacherName.trim().toLowerCase().replace(/\s+/g, '_'),
          requestedByName: teacherName.trim(),
          reason,
          teamId: '',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMyRequests(prev => [...prev, { studentName: selectedStudent.name, pulloutDate }]);
        setSelectedStudent(null);
        setSearchQuery('');
        setReason('');
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      }
    } catch {} finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Grand+Hotel&display=swap" rel="stylesheet" />

      {/* Header — tapping logo goes to About page */}
      <div className="bg-[#005587] text-white px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.push('/about')} className="flex items-center gap-2">
          <img src="/UpdatedCCLogo.png" alt="" className="w-7 h-7 object-contain brightness-200" />
          <span style={{ fontFamily: "'Grand Hotel', cursive" }} className="text-xl">ClassCast</span>
        </button>
        <button onClick={() => router.push('/about')} className="text-[10px] text-white/70 hover:text-white">
          Learn More →
        </button>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-[#005587]">Study Hall Pullout Request</h1>
          <p className="text-xs text-gray-500 mt-1">Search for a student and add them to the pullout list</p>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 text-center font-medium">
            ✓ Student added to pullout list
          </div>
        )}

        <div className="bg-gray-50 rounded-2xl p-4 mb-6">
          {/* Teacher name */}
          <div className="mb-3">
            <label className="block text-[10px] font-medium text-gray-600 mb-1">Your Name</label>
            <input
              type="text"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              placeholder="e.g., Mr. Wilson"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#005587] focus:border-[#005587]"
            />
          </div>

          {/* Student Search */}
          <div className="relative mb-3">
            <label className="block text-[10px] font-medium text-gray-600 mb-1">Student Name</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSelectedStudent(null); }}
              placeholder="Search by first or last name..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#005587] focus:border-[#005587]"
            />
            {searching && (
              <div className="absolute right-3 top-8">
                <div className="w-4 h-4 border-2 border-[#005587] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {searchResults.length > 0 && !selectedStudent && (
              <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {searchResults.map((student, i) => (
                  <button
                    key={i}
                    onClick={() => { setSelectedStudent(student); setSearchQuery(student.name); setSearchResults([]); }}
                    className="w-full text-left px-3 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <p className="text-sm font-medium text-gray-800">{student.name}</p>
                    {student.homeroom && <p className="text-[10px] text-gray-500">Homeroom: {student.homeroom}</p>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedStudent && (
            <div className="flex items-center gap-2 mb-3 p-2 bg-[#005587]/10 rounded-lg">
              <span className="text-xs font-medium text-[#005587]">{selectedStudent.name}</span>
              {selectedStudent.homeroom && <span className="text-[10px] text-gray-500">({selectedStudent.homeroom})</span>}
              <button onClick={() => { setSelectedStudent(null); setSearchQuery(''); }} className="ml-auto text-gray-400 text-xs">✕</button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-[10px] font-medium text-gray-600 mb-1">Date</label>
              <input type="date" value={pulloutDate} onChange={(e) => setPulloutDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-[#005587]" />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-600 mb-1">Reason (optional)</label>
              <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g., Tutoring"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-[#005587]" />
            </div>
          </div>

          <button onClick={handleSubmit} disabled={!selectedStudent || !teacherName.trim() || submitting}
            className="w-full py-2.5 bg-[#005587] text-white rounded-xl text-sm font-bold disabled:opacity-50">
            {submitting ? 'Adding...' : 'Add to Pullout List'}
          </button>
        </div>

        {/* Session list */}
        {myRequests.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-[#005587] mb-2">Added This Session</h2>
            <div className="space-y-1.5">
              {myRequests.map((req, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-700 flex-1">{req.studentName}</span>
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
          <button onClick={() => router.push('/about')} className="inline-block px-5 py-2.5 bg-[#FFC72C] text-[#005587] rounded-xl text-sm font-bold">
            Join ClassCast — Learn More
          </button>
        </div>
      </div>
    </div>
  );
}
