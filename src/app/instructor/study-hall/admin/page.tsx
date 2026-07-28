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

  const [activeTab, setActiveTab] = useState<'pullouts' | 'roster' | 'team'>('pullouts');
  const [pullouts, setPullouts] = useState<PulloutRequest[]>([]);
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [loadingPullouts, setLoadingPullouts] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState('');
  const [homeroomTeacher, setHomeroomTeacher] = useState('');
  const bulkFileRef = useRef<HTMLInputElement>(null);

  // Team state
  const [myTeam, setMyTeam] = useState<any>(null);
  const [teamName, setTeamName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  // Date filter - default to tomorrow
  const [filterDate, setFilterDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });

  // Fetch pullouts for the selected date (filtered by team)
  useEffect(() => {
    fetchPullouts();
  }, [filterDate, myTeam]);

  // Fetch my team
  useEffect(() => {
    if (user?.id) {
      fetch(`/api/teams?leadId=${user.id}`)
        .then(r => r.json())
        .then(data => {
          if (data.success && data.teams?.length > 0) {
            setMyTeam(data.teams[0]);
          }
        })
        .catch(() => {});
    }
  }, [user?.id]);

  const fetchPullouts = async () => {
    setLoadingPullouts(true);
    try {
      let url = `/api/study-hall?date=${filterDate}`;
      if (myTeam?.teamId) url += `&teamId=${myTeam.teamId}`;
      const res = await fetch(url);
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

  // Upload a single homeroom's class list
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !homeroomTeacher.trim()) return;

    setUploading(true);
    setUploadResult('');

    try {
      let studentNames: string[] = [];
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
        // Parse CSV
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        // Skip header if it looks like one
        const firstLine = lines[0]?.toLowerCase() || '';
        const startIdx = (firstLine.includes('name') || firstLine.includes('student') || firstLine.includes('#')) ? 1 : 0;
        studentNames = lines.slice(startIdx).map(line => {
          const parts = line.split(',');
          return parts[0]?.trim().replace(/^"|"$/g, '') || '';
        }).filter(n => n && n.length > 1);
      } else {
        // For .xls/.xlsx — read as text and extract names (basic approach)
        // Send to server for proper parsing, or try text extraction
        const text = await file.text();
        // Try to extract readable names from binary
        const namePattern = /[A-Z][a-z]+(?:\s[A-Z][a-z]+)+/g;
        const matches = text.match(namePattern) || [];
        studentNames = [...new Set(matches)].filter(n => n.length > 3 && n.length < 40);

        if (studentNames.length === 0) {
          setUploadResult('Could not read names from Excel file. Please save as CSV first.');
          setUploading(false);
          return;
        }
      }

      if (studentNames.length === 0) {
        setUploadResult('No student names found in file.');
        setUploading(false);
        return;
      }

      // Upload all students with this homeroom teacher
      const entries = studentNames.map(name => ({
        studentName: name,
        homeroom: homeroomTeacher.trim(),
        studyHallTeacher: '',
        grade: '',
      }));

      const res = await fetch('/api/study-hall/roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      });
      const data = await res.json();
      if (data.success) {
        setUploadResult(`Added ${data.count} students to ${homeroomTeacher.trim()}'s homeroom.`);
        setHomeroomTeacher('');
        fetchRoster();
      } else {
        setUploadResult(data.error || 'Upload failed.');
      }
    } catch (err) {
      setUploadResult('Failed to parse file. Try saving as CSV.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Bulk CSV upload (old method — all classes at once)
  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadResult('');
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      const header = lines[0].toLowerCase();
      const hasHeader = header.includes('name') || header.includes('student') || header.includes('homeroom');
      const dataLines = hasHeader ? lines.slice(1) : lines;
      const entries = dataLines.map(line => {
        const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
        return { studentName: parts[0] || '', homeroom: parts[1] || '', studyHallTeacher: parts[2] || '', grade: parts[3] || '' };
      }).filter(e => e.studentName);
      if (entries.length === 0) { setUploadResult('No valid entries found.'); setUploading(false); return; }
      const res = await fetch('/api/study-hall/roster', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entries }) });
      const data = await res.json();
      if (data.success) { setUploadResult(`Uploaded ${data.count} students.`); fetchRoster(); }
      else { setUploadResult(data.error || 'Upload failed.'); }
    } catch { setUploadResult('Failed to parse file.'); }
    finally { setUploading(false); if (bulkFileRef.current) bulkFileRef.current.value = ''; }
  };

  // Team management
  const handleCreateTeam = async () => {
    if (!teamName.trim() || !user?.id) return;
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: teamName, leadId: user.id, leadName: `${user.firstName} ${user.lastName}` }),
      });
      const data = await res.json();
      if (data.success) { setMyTeam(data.team); setTeamName(''); }
    } catch (err) { console.error('Failed to create team:', err); }
  };

  const handleAddMember = async () => {
    if (!newMemberEmail.trim() || !myTeam) return;
    setAddingMember(true);
    try {
      // Search for instructor by email
      const searchRes = await fetch(`/api/users/search?email=${encodeURIComponent(newMemberEmail)}&role=instructor`);
      const searchData = await searchRes.json();
      const found = searchData.users?.[0];
      if (!found) { alert('No instructor found with that email.'); setAddingMember(false); return; }

      const updatedMembers = [...(myTeam.members || []), { userId: found.id, name: found.name, email: found.email }];
      const res = await fetch('/api/teams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: myTeam.teamId, members: updatedMembers }),
      });
      if ((await res.json()).success) {
        setMyTeam({ ...myTeam, members: updatedMembers });
        setNewMemberEmail('');
      }
    } catch (err) { console.error('Failed to add member:', err); }
    finally { setAddingMember(false); }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!myTeam) return;
    const updatedMembers = (myTeam.members || []).filter((m: any) => m.userId !== userId);
    try {
      await fetch('/api/teams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: myTeam.teamId, members: updatedMembers }),
      });
      setMyTeam({ ...myTeam, members: updatedMembers });
    } catch (err) { console.error('Failed to remove member:', err); }
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
              Roster
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'team' ? 'bg-[#005587] text-white' : 'text-gray-600'
              }`}
            >
              My Team
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
                <h3 className="text-sm font-bold text-[#005587] mb-2">Add a Homeroom Class</h3>
                <p className="text-[10px] text-gray-500 mb-3">
                  Upload one teacher's spreadsheet at a time. Student names are pulled from the first column.
                </p>

                {/* Homeroom teacher name */}
                <input
                  type="text"
                  value={homeroomTeacher}
                  onChange={(e) => setHomeroomTeacher(e.target.value)}
                  placeholder="Homeroom teacher name (e.g., Ms. Johnson)"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-[#005587] mb-3"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || !homeroomTeacher.trim()}
                  className="w-full py-3 border-2 border-dashed border-[#005587]/30 rounded-xl text-xs font-medium text-[#005587] hover:border-[#005587] hover:bg-[#005587]/5 transition-colors disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : '📄 Upload Class Roster (CSV or Excel)'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,.xls,.xlsx"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                {uploadResult && (
                  <p className={`text-xs mt-2 ${uploadResult.includes('success') || uploadResult.includes('Added') ? 'text-green-600' : 'text-red-600'}`}>
                    {uploadResult}
                  </p>
                )}

                <p className="text-[9px] text-gray-400 mt-2">Supports .csv, .xls, .xlsx — reads student names from the first column.</p>
              </div>

              {/* Bulk CSV upload (old method) */}
              <details className="bg-gray-50 rounded-2xl p-4 mb-4">
                <summary className="text-xs font-medium text-gray-600 cursor-pointer">Advanced: Bulk CSV Upload (all classes at once)</summary>
                <div className="mt-3">
                  <p className="text-[10px] text-gray-500 mb-2">
                    CSV with columns: Student Name, Homeroom Teacher, Study Hall Teacher, Grade
                  </p>
                  <button
                    onClick={() => bulkFileRef.current?.click()}
                    disabled={uploading}
                    className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-xs font-medium text-gray-500 hover:border-gray-400"
                  >
                    📄 Choose Bulk CSV
                  </button>
                  <input ref={bulkFileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleBulkUpload} />
                </div>
              </details>

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

          {/* TEAM TAB */}
          {activeTab === 'team' && (
            <div>
              {!myTeam ? (
                <div className="bg-gray-50 rounded-2xl p-4">
                  <h3 className="text-sm font-bold text-[#005587] mb-2">Create Your Team</h3>
                  <p className="text-[10px] text-gray-500 mb-3">Teachers on your team will have their pullout requests routed to you.</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Team name (e.g., 9th Grade Team)"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-[#005587]"
                    />
                    <button onClick={handleCreateTeam} disabled={!teamName.trim()} className="px-4 py-2 bg-[#005587] text-white rounded-xl text-xs font-bold disabled:opacity-50">
                      Create
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-bold text-[#005587]">{myTeam.name}</h3>
                      <span className="text-[10px] text-gray-400">{(myTeam.members || []).length} members</span>
                    </div>
                    <p className="text-[10px] text-gray-500">Lead: {myTeam.leadName || 'You'}</p>
                  </div>

                  {/* Members list */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 mb-2">Team Members</h4>
                    {(myTeam.members || []).length === 0 ? (
                      <p className="text-xs text-gray-400 py-4 text-center">No members yet. Add teachers below.</p>
                    ) : (
                      <div className="space-y-1.5 mb-3">
                        {(myTeam.members || []).map((m: any) => (
                          <div key={m.userId} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-800">{m.name}</p>
                              <p className="text-[10px] text-gray-500">{m.email}</p>
                            </div>
                            <button onClick={() => handleRemoveMember(m.userId)} className="text-gray-300 hover:text-red-500 p-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add member */}
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        placeholder="Teacher email..."
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-[#005587]"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
                      />
                      <button onClick={handleAddMember} disabled={!newMemberEmail.trim() || addingMember} className="px-3 py-2 bg-[#005587] text-white rounded-xl text-xs font-bold disabled:opacity-50">
                        {addingMember ? '...' : 'Add'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </InstructorRoute>
  );
}
