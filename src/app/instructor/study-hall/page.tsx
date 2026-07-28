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
  const [myTeamId, setMyTeamId] = useState<string>('');
  const [myTeam, setMyTeam] = useState<any>(null);
  const [loadingTeam, setLoadingTeam] = useState(true);

  // Pickup roster view
  const [showPickupRoster, setShowPickupRoster] = useState(false);
  const [pickupPullouts, setPickupPullouts] = useState<any[]>([]);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [pickupDate, setPickupDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });

  // Wizard state
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1); // 1: name, 2: teachers, 3: roster
  const [wizardTeamName, setWizardTeamName] = useState('');
  const [wizardMembers, setWizardMembers] = useState<Array<{email: string; name?: string; userId?: string}>>([]);
  const [wizardMemberEmail, setWizardMemberEmail] = useState('');
  const [wizardUploading, setWizardUploading] = useState(false);
  const [wizardRosterCount, setWizardRosterCount] = useState(0);
  const [wizardCreating, setWizardCreating] = useState(false);
  const wizardFileRef = React.useRef<HTMLInputElement>(null);

  // Fetch my team
  useEffect(() => {
    if (user?.id) {
      setLoadingTeam(true);
      fetch(`/api/teams?memberId=${user.id}`)
        .then(r => r.json())
        .then(data => {
          if (data.success && data.teams?.length > 0) {
            setMyTeam(data.teams[0]);
            setMyTeamId(data.teams[0].teamId);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingTeam(false));
    }
  }, [user?.id]);

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

  // Wizard functions
  const handleWizardAddMember = () => {
    if (!wizardMemberEmail.trim()) return;
    if (wizardMembers.some(m => m.email === wizardMemberEmail.trim())) return;
    setWizardMembers(prev => [...prev, { email: wizardMemberEmail.trim() }]);
    setWizardMemberEmail('');
  };

  const handleWizardRemoveMember = (email: string) => {
    setWizardMembers(prev => prev.filter(m => m.email !== email));
  };

  const handleWizardRosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setWizardUploading(true);
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

      if (entries.length > 0) {
        const res = await fetch('/api/study-hall/roster', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entries }),
        });
        const data = await res.json();
        if (data.success) setWizardRosterCount(data.count);
      }
    } catch (err) { console.error('Roster upload failed:', err); }
    finally { setWizardUploading(false); if (wizardFileRef.current) wizardFileRef.current.value = ''; }
  };

  const handleWizardFinish = async () => {
    if (!wizardTeamName.trim() || !user?.id) return;
    setWizardCreating(true);
    try {
      // Resolve member emails to user records
      const resolvedMembers = [];
      for (const member of wizardMembers) {
        try {
          const res = await fetch(`/api/users/search?email=${encodeURIComponent(member.email)}&role=instructor`);
          const data = await res.json();
          if (data.users?.[0]) {
            resolvedMembers.push({ userId: data.users[0].id, name: data.users[0].name, email: member.email });
          } else {
            resolvedMembers.push({ userId: '', name: member.email, email: member.email });
          }
        } catch { resolvedMembers.push({ userId: '', name: member.email, email: member.email }); }
      }

      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: wizardTeamName,
          leadId: user.id,
          leadName: `${user.firstName} ${user.lastName}`,
          members: resolvedMembers,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMyTeam(data.team);
        setMyTeamId(data.team.teamId);
        setShowWizard(false);
        setWizardStep(1);
      }
    } catch (err) { console.error('Failed to create team:', err); }
    finally { setWizardCreating(false); }
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
          teamId: myTeamId,
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

  // Fetch pickup roster for a date (all pullouts for the team, grouped by study hall)
  const fetchPickupRoster = async (date: string) => {
    setPickupLoading(true);
    try {
      let url = `/api/study-hall?date=${date}`;
      if (myTeamId) url += `&teamId=${myTeamId}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setPickupPullouts(data.pullouts || []);
    } catch (err) { console.error('Failed to fetch pickup roster:', err); }
    finally { setPickupLoading(false); }
  };

  useEffect(() => {
    if (showPickupRoster) fetchPickupRoster(pickupDate);
  }, [showPickupRoster, pickupDate, myTeamId]);

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
              <p className="text-xs text-gray-500">
                {myTeam ? `Team: ${myTeam.name}` : 'Request students for study hall'}
              </p>
            </div>
            <div className="flex gap-2">
              {myTeam?.leadId === user?.id && (
                <button
                  onClick={() => router.push('/instructor/study-hall/admin')}
                  className="px-3 py-1.5 bg-[#005587] text-white rounded-lg text-xs font-bold"
                >
                  Admin View
                </button>
              )}
            </div>
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

          {/* Pickup Roster View */}
          <div className="mt-6">
            <button
              onClick={() => setShowPickupRoster(!showPickupRoster)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl"
            >
              <span className="text-sm font-bold text-[#005587]">📋 View Pickup Roster</span>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${showPickupRoster ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showPickupRoster && (
              <div className="mt-3 space-y-3">
                {/* Date filter */}
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-medium text-gray-600">Date:</label>
                  <input
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#005587]"
                  />
                  <span className="text-[10px] text-gray-400">{pickupPullouts.length} students</span>
                </div>

                {pickupLoading ? (
                  <p className="text-xs text-gray-400 text-center py-4">Loading...</p>
                ) : pickupPullouts.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No pullouts for this date.</p>
                ) : (
                  <div className="space-y-3">
                    {/* Group by study hall teacher */}
                    {Object.entries(
                      pickupPullouts.reduce((acc: Record<string, any[]>, p: any) => {
                        const sh = p.studyHallTeacher || 'Unassigned';
                        if (!acc[sh]) acc[sh] = [];
                        acc[sh].push(p);
                        return acc;
                      }, {})
                    ).sort(([a], [b]) => a.localeCompare(b)).map(([studyHall, students]) => (
                      <div key={studyHall} className="bg-white border border-gray-200 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-bold text-[#005587]">{studyHall}</h4>
                          <span className="text-[9px] text-gray-400">{(students as any[]).length} student{(students as any[]).length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="space-y-1">
                          {(students as any[]).map((p: any) => (
                            <div key={p.pulloutId} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-b-0">
                              <span className="text-xs text-gray-700">{p.studentName}</span>
                              <span className="text-[9px] text-gray-400">{p.requestedByName}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Team Setup Wizard */}
      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
          <div className="bg-white w-full max-w-[400px] rounded-2xl p-5 max-h-[85vh] overflow-y-auto">
            {/* Wizard Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#005587]">Set Up Your Team</h2>
              <button onClick={() => { setShowWizard(false); setWizardStep(1); }} className="text-gray-400 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Progress */}
            <div className="flex gap-1 mb-5">
              {[1, 2, 3].map(s => (
                <div key={s} className={`flex-1 h-1 rounded-full ${wizardStep >= s ? 'bg-[#005587]' : 'bg-gray-200'}`} />
              ))}
            </div>

            {/* Step 1: Team Name */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <span className="text-3xl block mb-2">👥</span>
                  <h3 className="text-sm font-bold text-gray-900">Name your team</h3>
                  <p className="text-xs text-gray-500">This groups your teachers together for study hall coordination.</p>
                </div>
                <input
                  type="text"
                  value={wizardTeamName}
                  onChange={(e) => setWizardTeamName(e.target.value)}
                  placeholder="e.g., 9th Grade Team, Wilson Pod"
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#005587] focus:border-[#005587] text-center"
                  autoFocus
                />
                <button
                  onClick={() => setWizardStep(2)}
                  disabled={!wizardTeamName.trim()}
                  className="w-full py-2.5 bg-[#005587] text-white rounded-xl text-sm font-bold disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}

            {/* Step 2: Add Teachers */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <div className="text-center mb-2">
                  <span className="text-3xl block mb-2">📧</span>
                  <h3 className="text-sm font-bold text-gray-900">Add teachers to your team</h3>
                  <p className="text-xs text-gray-500">These teachers can submit pullout requests to you.</p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="email"
                    value={wizardMemberEmail}
                    onChange={(e) => setWizardMemberEmail(e.target.value)}
                    placeholder="teacher@school.edu"
                    className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-[#005587]"
                    onKeyDown={(e) => e.key === 'Enter' && handleWizardAddMember()}
                  />
                  <button onClick={handleWizardAddMember} disabled={!wizardMemberEmail.trim()} className="px-3 py-2.5 bg-[#005587] text-white rounded-xl text-xs font-bold disabled:opacity-50">
                    Add
                  </button>
                </div>

                {wizardMembers.length > 0 && (
                  <div className="space-y-1.5">
                    {wizardMembers.map(m => (
                      <div key={m.email} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <span className="flex-1 text-xs text-gray-700">{m.email}</span>
                        <button onClick={() => handleWizardRemoveMember(m.email)} className="text-gray-300 hover:text-red-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button onClick={() => setWizardStep(1)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium">Back</button>
                  <button onClick={() => setWizardStep(3)} className="flex-1 py-2.5 bg-[#005587] text-white rounded-xl text-sm font-bold">
                    {wizardMembers.length === 0 ? 'Skip' : 'Next'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Upload Roster */}
            {wizardStep === 3 && (
              <div className="space-y-4">
                <div className="text-center mb-2">
                  <span className="text-3xl block mb-2">📄</span>
                  <h3 className="text-sm font-bold text-gray-900">Upload homeroom roster</h3>
                  <p className="text-xs text-gray-500">CSV with: Student Name, Homeroom Teacher, Study Hall Teacher, Grade</p>
                </div>

                <button
                  onClick={() => wizardFileRef.current?.click()}
                  disabled={wizardUploading}
                  className="w-full py-3 border-2 border-dashed border-[#005587]/30 rounded-xl text-xs font-medium text-[#005587] hover:border-[#005587] hover:bg-[#005587]/5"
                >
                  {wizardUploading ? 'Uploading...' : wizardRosterCount > 0 ? `✓ ${wizardRosterCount} students uploaded` : '📄 Choose CSV File'}
                </button>
                <input ref={wizardFileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleWizardRosterUpload} />

                <div className="p-2.5 bg-gray-50 rounded-lg">
                  <p className="text-[9px] font-mono text-gray-500">
                    Student Name,Homeroom,Study Hall Teacher,Grade{'\n'}
                    John Smith,Ms. Johnson,Mr. Davis,9
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button onClick={() => setWizardStep(2)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium">Back</button>
                  <button
                    onClick={handleWizardFinish}
                    disabled={wizardCreating}
                    className="flex-1 py-2.5 bg-[#005587] text-white rounded-xl text-sm font-bold disabled:opacity-50"
                  >
                    {wizardCreating ? 'Creating...' : wizardRosterCount > 0 ? 'Finish' : 'Skip & Finish'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </InstructorRoute>
  );
}
