'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface Student {
  userId: string;
  name: string;
  email: string;
  sectionName?: string;
  groupId?: string;
}

interface Group {
  groupId: string;
  groupName: string;
  members: string[]; // userIds
}

export default function GroupBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [saving, setSaving] = useState(false);
  const [maxGroupSize, setMaxGroupSize] = useState(4);

  useEffect(() => {
    fetchData();
  }, [assignmentId]);

  const fetchData = async () => {
    try {
      // Fetch assignment info
      const aRes = await fetch(`/api/assignments/${assignmentId}`);
      if (aRes.ok) {
        const aData = await aRes.json();
        const assignment = aData.data?.assignment || aData.assignment;
        setAssignmentTitle(assignment?.title || 'Group Project');
        setCourseId(assignment?.courseId || '');
        setMaxGroupSize(assignment?.maxGroupSize || 4);

        // Fetch enrolled students
        if (assignment?.courseId) {
          const sRes = await fetch(`/api/courses/enrollment?courseId=${assignment.courseId}`);
          if (sRes.ok) {
            const sData = await sRes.json();
            const enrolled = sData.data?.students || sData.students || [];

            // Fetch user names
            const studentList: Student[] = await Promise.all(
              enrolled.map(async (s: any) => {
                let name = s.email || s.userId;
                try {
                  const uRes = await fetch(`/api/profile?userId=${s.userId}`);
                  if (uRes.ok) {
                    const uData = await uRes.json();
                    const p = uData.data || uData;
                    name = `${p.firstName || ''} ${p.lastName || ''}`.trim() || s.email || s.userId;
                  }
                } catch {}
                return {
                  userId: s.userId,
                  name,
                  email: s.email || '',
                  sectionName: s.sectionName || '',
                  groupId: undefined,
                };
              })
            );
            setStudents(studentList);
          }
        }

        // Fetch existing groups for this assignment
        try {
          const gRes = await fetch(`/api/groups/my-group?assignmentId=${assignmentId}&all=true`);
          if (gRes.ok) {
            const gData = await gRes.json();
            if (gData.groups) {
              setGroups(gData.groups.map((g: any) => ({
                groupId: g.groupId,
                groupName: g.groupName || `Group ${g.groupId.slice(-4)}`,
                members: g.memberIds || g.members?.map((m: any) => m.userId) || [],
              })));
            }
          }
        } catch {}
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const addGroup = () => {
    const groupId = `group_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    setGroups(prev => [...prev, { groupId, groupName: `Group ${prev.length + 1}`, members: [] }]);
  };

  const removeGroup = (groupId: string) => {
    setGroups(prev => prev.filter(g => g.groupId !== groupId));
  };

  const assignStudentToGroup = (userId: string, groupId: string) => {
    // Remove from any existing group
    setGroups(prev => prev.map(g => ({
      ...g,
      members: g.members.filter(m => m !== userId),
    })));
    // Add to new group (unless "unassigned")
    if (groupId) {
      setGroups(prev => prev.map(g =>
        g.groupId === groupId
          ? { ...g, members: [...g.members, userId] }
          : g
      ));
    }
  };

  const autoAssignGroups = () => {
    // Shuffle students and distribute evenly
    const shuffled = [...students].sort(() => Math.random() - 0.5);
    const numGroups = Math.ceil(shuffled.length / maxGroupSize);

    // Ensure we have enough groups
    const newGroups: Group[] = Array.from({ length: numGroups }, (_, i) => ({
      groupId: groups[i]?.groupId || `group_${Date.now()}_${i}`,
      groupName: groups[i]?.groupName || `Group ${i + 1}`,
      members: [],
    }));

    // Distribute students round-robin
    shuffled.forEach((student, i) => {
      newGroups[i % numGroups].members.push(student.userId);
    });

    setGroups(newGroups);
  };

  const getStudentGroup = (userId: string) => {
    return groups.find(g => g.members.includes(userId));
  };

  const unassignedStudents = students.filter(s => !getStudentGroup(s.userId));

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save groups to the module-groups table
      const res = await fetch('/api/groups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId,
          courseId,
          groups: groups.map(g => ({
            groupId: g.groupId,
            groupName: g.groupName,
            memberIds: g.members,
          })),
        }),
      });

      if (res.ok) {
        alert('Groups saved successfully!');
      } else {
        alert('Failed to save groups');
      }
    } catch (err) {
      console.error('Error saving groups:', err);
      alert('Error saving groups');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <InstructorRoute>
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner />
        </div>
      </InstructorRoute>
    );
  }

  return (
    <InstructorRoute>
      <div className="min-h-full overflow-y-auto pb-24 bg-white">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <button onClick={() => router.back()} className="text-gray-400 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-[#005587] truncate">Group Builder</h1>
                <p className="text-[10px] text-gray-500 truncate">{assignmentTitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={autoAssignGroups}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-[10px] font-bold"
              >
                Auto-Assign
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-1.5 bg-[#005587] text-white rounded-full text-[10px] font-bold disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 space-y-4">
          {/* Groups */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#005587]">Groups ({groups.length})</h2>
            <button onClick={addGroup} className="px-3 py-1 bg-[#FFC72C] text-[#005587] rounded-full text-[10px] font-bold">
              + Add Group
            </button>
          </div>

          {groups.map((group, gi) => (
            <div key={group.groupId} className="bg-gray-50 rounded-2xl p-3">
              <div className="flex items-center justify-between mb-2">
                <input
                  type="text"
                  value={group.groupName}
                  onChange={(e) => setGroups(prev => prev.map(g => g.groupId === group.groupId ? { ...g, groupName: e.target.value } : g))}
                  className="text-sm font-bold text-[#005587] bg-transparent border-none focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500">{group.members.length}/{maxGroupSize}</span>
                  <button onClick={() => removeGroup(group.groupId)} className="text-red-400 text-xs">✕</button>
                </div>
              </div>
              {/* Members */}
              <div className="space-y-1">
                {group.members.map(memberId => {
                  const student = students.find(s => s.userId === memberId);
                  return (
                    <div key={memberId} className="flex items-center justify-between bg-white rounded-lg px-2 py-1.5">
                      <span className="text-xs text-gray-800">{student?.name || memberId}</span>
                      <button
                        onClick={() => assignStudentToGroup(memberId, '')}
                        className="text-[10px] text-red-400"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
                {group.members.length === 0 && (
                  <p className="text-[10px] text-gray-400 text-center py-2">No members assigned</p>
                )}
              </div>
            </div>
          ))}

          {groups.length === 0 && (
            <div className="text-center py-6">
              <div className="text-3xl mb-2">👥</div>
              <p className="text-xs text-gray-500">No groups created yet. Add groups or auto-assign.</p>
            </div>
          )}

          {/* Unassigned Students */}
          {unassignedStudents.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-gray-700 mb-2">Unassigned ({unassignedStudents.length})</h2>
              <div className="space-y-1">
                {unassignedStudents.map(student => (
                  <div key={student.userId} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-3 py-2">
                    <div>
                      <span className="text-xs font-medium text-gray-800">{student.name}</span>
                      {student.sectionName && <span className="text-[10px] text-gray-400 ml-2">{student.sectionName}</span>}
                    </div>
                    <select
                      value=""
                      onChange={(e) => assignStudentToGroup(student.userId, e.target.value)}
                      className="text-[10px] border border-gray-200 rounded-lg px-2 py-1 text-gray-600"
                    >
                      <option value="">Assign to...</option>
                      {groups.map(g => (
                        <option key={g.groupId} value={g.groupId} disabled={g.members.length >= maxGroupSize}>
                          {g.groupName} ({g.members.length}/{maxGroupSize})
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </InstructorRoute>
  );
}
