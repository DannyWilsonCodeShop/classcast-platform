'use client';

import React, { useState, useEffect, useRef } from 'react';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface PulloutRequest {
  pulloutId: string;
  studentName: string;
  studentId?: string;
  pulloutDate: string;
  requestedBy: string;
  requestedByName: string;
  reason: string;
  status: string;
  homeroom: string;
  studyHallTeacher: string;
  createdAt: string;
}

interface RosterEntry {
  rosterId: string;
  studentName: string;
  homeroom: string;
  studyHallTeacher: string;
  grade: string;
}

export default function StudyHallAdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'pullouts' | 'roster'>('pullouts');
  const [pullouts, setPullouts] = useState<PulloutRequest[]>([]);
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [loadingPullouts, setLoadingPullouts] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState('');

  // Date filter - default to tomorrow
  const [filterDate, setFilterDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });

  // Fetch pullouts for the selected date
  useEffect(() => {
    fetchPullouts();
  }, [filterDate]);

  const fetchPullouts = async () => {
    setLoadingPullouts(true);
    try {
      const res = await fetch(`/api/study-hall?date=${filterDate}`);
      const data = await res.json();
      if (data.success) setPullouts(data.pullouts || []);
    } catch (err) {
      console.error('Failed to fetch pullouts:', err);
    } finally {
      setLoadingPullouts(false);
    }
  };

  // Fetch roster
  const fetchRoster = async () => {
    setLoadingRoster(true);
    try {
      const res = await fetch('/api/study-hall/roster');
      const data = await res.json();
      if (data.success) setRoster(data.roster || []);
    } catch (err) {
      console.error('Failed to fetch roster:', err);
    } finally {
      setLoadingRoster(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'roster') fetchRoster();
  }, [activeTab]);

  // Upload spreadsheet
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResult('');

    try {
      // Parse CSV client-side
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim());

      // Skip header row
      const header = lines[0].toLowerCase();
      const hasHeader = header.includes('name') || header.includes('student') || header.includes('homeroom');
      const dataLines = hasHeader ? lines.slice(1) : lines;

      const entries = dataLines.map(line => {
        // Handle CSV with commas inside quotes
        const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
        return {
          studentName: parts[0] || '',
          homeroom: parts[1] || '',
          studyHallTeacher: parts[2] || '',
          grade: parts[3] || '',
        };
      }).filter(e => e.studentName);

      if (entries.length === 0) {
        setUploadResult('No valid entries found. Check your file format.');
        setUploading(false);
        return;
      }

      const res = await fetch('/api/study-hall/roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      });
      const data = await res.json();
      if (data.success) {
        setUploadResult(`Uploaded ${data.count} students successfully.`);
        fetchRoster();
      } else {
        setUploadResult(data.error || 'Upload failed.');
      }
    } catch (err) {
      setUploadResult('Failed to parse file.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Group pullouts by homeroom
  const pulloutsByHomeroom = pullouts.reduce((acc, p) => {
    const hr = p.homeroom || 'Unassigned';
    if (!acc[hr]) acc[hr] = [];
    acc[hr].push(p);
    return acc;
  }, {} as Record<string, PulloutRequest[]>);

  const sortedHomerooms = Object.keys(pulloutsByHomeroom).sort();

  return (
    <InstructorRoute>
      <div className="min-h-full overflow-y-auto pb-24 bg-white px-4 py-6">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-[#005587]">Study Hall Admin</h1>
              <p className="text-xs text-gray-500">Manage pullout lists and rosters</p>
            </div>
            <button
              onClick={() => router.push('/instructor/study-hall')}
              className="text-xs text-[#005587] font-medium"
            >
              ← Back
            </button>
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
            <button
              onClick={() => setActiveTab('pullouts')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'pullouts' ? 'bg-[#005587] text-white' : 'text-gray-600'
              }`}
            >
              Pullout List
            </button>
            <button
              onClick={() => setActiveTab('roster')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'roster' ? 'bg-[#005587] text-white' : 'text-gray-600'
              }`}
            >
              Roster Upload
            </button>
          </div>

          {/* PULLOUT LIST TAB */}
          {activeTab === 'pullouts' && (
            <div>
              {/* Date filter */}
              <div className="flex items-center gap-3 mb-4">
                <label className="text-xs font-medium text-gray-600">Date:</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-[#005587]"
                />
                <span className="text-xs text-gray-400">
                  {pullouts.length} student{pullouts.length !== 1 ? 's' : ''}
                </span>
              </div>

              {loadingPullouts ? (
                <p className="text-xs text-gray-400 text-center py-8">Loading...</p>
              ) : pullouts.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-3xl block mb-2">📋</span>
                  <p className="text-sm text-gray-500">No pullout requests for this date.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedHomerooms.map(homeroom => (
                    <div key={homeroom} className="bg-gray-50 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-[#005587] uppercase">{homeroom}</h3>
                        <span className="text-[10px] text-gray-400">{pulloutsByHomeroom[homeroom].length} student{pulloutsByHomeroom[homeroom].length !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="space-y-1.5">
                        {pulloutsByHomeroom[homeroom].map(p => (
                          <div key={p.pulloutId} className="flex items-center gap-2 p-2 bg-white rounded-lg">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-800">{p.studentName}</p>
                              <p className="text-[10px] text-gray-500">
                                Requested by {p.requestedByName}{p.reason ? ` · ${p.reason}` : ''}
                              </p>
                            </div>
                            <span className="text-[9px] text-gray-400 shrink-0">
                              {p.studyHallTeacher !== 'Unknown' ? p.studyHallTeacher : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ROSTER TAB */}
          {activeTab === 'roster' && (
            <div>
              {/* Upload section */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                <h3 className="text-sm font-bold text-[#005587] mb-2">Upload Student Roster</h3>
                <p className="text-[10px] text-gray-500 mb-3">
                  Upload a CSV with columns: Student Name, Homeroom Teacher, Study Hall Teacher, Grade
                </p>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full py-3 border-2 border-dashed border-[#005587]/30 rounded-xl text-xs font-medium text-[#005587] hover:border-[#005587] hover:bg-[#005587]/5 transition-colors disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : '📄 Choose CSV File'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                {uploadResult && (
                  <p className={`text-xs mt-2 ${uploadResult.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                    {uploadResult}
                  </p>
                )}

                <div className="mt-3 p-2.5 bg-white rounded-lg border border-gray-200">
                  <p className="text-[10px] font-medium text-gray-600 mb-1">Example format:</p>
                  <pre className="text-[9px] text-gray-500 font-mono">
{`Student Name,Homeroom,Study Hall Teacher,Grade
John Smith,Ms. Johnson,Mr. Davis,9
Jane Doe,Mr. Williams,Ms. Brown,10`}
                  </pre>
                </div>
              </div>

              {/* Current roster */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-[#005587]">Current Roster</h3>
                  <span className="text-[10px] text-gray-400">{roster.length} students</span>
                </div>

                {loadingRoster ? (
                  <p className="text-xs text-gray-400 text-center py-4">Loading...</p>
                ) : roster.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-8">No roster uploaded yet.</p>
                ) : (
                  <div className="space-y-1.5 max-h-80 overflow-y-auto">
                    {roster.map((entry, i) => (
                      <div key={entry.rosterId || i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">{entry.studentName}</p>
                          <p className="text-[10px] text-gray-500">HR: {entry.homeroom} · SH: {entry.studyHallTeacher}</p>
                        </div>
                        {entry.grade && <span className="text-[10px] text-gray-400 shrink-0">Gr {entry.grade}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </InstructorRoute>
  );
}
