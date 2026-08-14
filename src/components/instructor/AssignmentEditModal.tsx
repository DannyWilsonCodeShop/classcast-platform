'use client';

import React, { useState, useEffect } from 'react';

interface AssignmentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AssignmentEditData) => void;
  courseId?: string;
  assignment: {
    assignmentId: string;
    title: string;
    description: string;
    dueDate: string;
    maxScore: number;
    assignmentType?: string;
    responseDueDate?: string;
    allowLateSubmission?: boolean;
    latePenalty?: number;
    maxSubmissions?: number;
    enablePeerResponses?: boolean;
    minResponsesRequired?: number;
    maxResponsesPerVideo?: number;
    responseWordLimit?: number;
    peerReviewScope?: string;
    requireLiveRecording?: boolean;
    allowYouTubeUrl?: boolean;
    groupAssignment?: boolean;
    maxGroupSize?: number;
    sectionDueDates?: Record<string, string>;
  };
}

export interface AssignmentEditData {
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  responseDueDate?: string;
  allowLateSubmission?: boolean;
  latePenalty?: number;
  maxSubmissions?: number;
  enablePeerResponses?: boolean;
  minResponsesRequired?: number;
  maxResponsesPerVideo?: number;
  responseWordLimit?: number;
  peerReviewScope?: string;
  requireLiveRecording?: boolean;
  allowYouTubeUrl?: boolean;
  groupAssignment?: boolean;
  maxGroupSize?: number;
  sectionDueDates?: Record<string, string>;
}

export function AssignmentEditModal({ isOpen, onClose, onSave, courseId, assignment }: AssignmentEditModalProps) {
  const [title, setTitle] = useState(assignment.title);
  const [description, setDescription] = useState(assignment.description);
  const [dueDate, setDueDate] = useState('');
  const [maxScore, setMaxScore] = useState(assignment.maxScore);
  const [responseDueDate, setResponseDueDate] = useState('');
  const [allowLateSubmission, setAllowLateSubmission] = useState(assignment.allowLateSubmission || false);
  const [latePenalty, setLatePenalty] = useState(assignment.latePenalty || 10);
  const [maxSubmissions, setMaxSubmissions] = useState(assignment.maxSubmissions || 1);
  const [enablePeerResponses, setEnablePeerResponses] = useState(assignment.enablePeerResponses || false);
  const [minResponsesRequired, setMinResponsesRequired] = useState(assignment.minResponsesRequired || 2);
  const [maxResponsesPerVideo, setMaxResponsesPerVideo] = useState(assignment.maxResponsesPerVideo || 3);
  const [responseWordLimit, setResponseWordLimit] = useState(assignment.responseWordLimit || 50);
  const [peerReviewScope, setPeerReviewScope] = useState(assignment.peerReviewScope || 'section');
  const [requireLiveRecording, setRequireLiveRecording] = useState(assignment.requireLiveRecording || false);
  const [allowYouTubeUrl, setAllowYouTubeUrl] = useState(assignment.allowYouTubeUrl || false);
  const [groupAssignment, setGroupAssignment] = useState(assignment.groupAssignment || false);
  const [maxGroupSize, setMaxGroupSize] = useState(assignment.maxGroupSize || 4);
  const [sectionDueDates, setSectionDueDates] = useState<Record<string, string>>(assignment.sectionDueDates || {});
  const [sections, setSections] = useState<Array<{ sectionId: string; sectionName: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState<'basic' | 'submissions' | 'peer' | 'video'>('basic');

  // Fetch sections for this course
  useEffect(() => {
    if (isOpen && courseId) {
      fetch(`/api/sections?courseId=${courseId}`)
        .then(r => r.json())
        .then(data => {
          if (data.success) setSections(data.data || []);
        })
        .catch(() => {});
    }
  }, [isOpen, courseId]);

  useEffect(() => {
    if (isOpen) {
      setTitle(assignment.title);
      setDescription(assignment.description);
      setMaxScore(assignment.maxScore);
      setAllowLateSubmission(assignment.allowLateSubmission || false);
      setLatePenalty(assignment.latePenalty || 10);
      setMaxSubmissions(assignment.maxSubmissions || 1);
      setEnablePeerResponses(assignment.enablePeerResponses || false);
      setMinResponsesRequired(assignment.minResponsesRequired || 2);
      setMaxResponsesPerVideo(assignment.maxResponsesPerVideo || 3);
      setResponseWordLimit(assignment.responseWordLimit || 50);
      setPeerReviewScope(assignment.peerReviewScope || 'section');
      setRequireLiveRecording(assignment.requireLiveRecording || false);
      setAllowYouTubeUrl(assignment.allowYouTubeUrl || false);
      setGroupAssignment(assignment.groupAssignment || false);
      setMaxGroupSize(assignment.maxGroupSize || 4);
      setSectionDueDates(assignment.sectionDueDates || {});
      try {
        const d = new Date(assignment.dueDate);
        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        setDueDate(local.toISOString().slice(0, 16));
      } catch { setDueDate(''); }
      try {
        if (assignment.responseDueDate) {
          const d = new Date(assignment.responseDueDate);
          const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
          setResponseDueDate(local.toISOString().slice(0, 16));
        } else { setResponseDueDate(''); }
      } catch { setResponseDueDate(''); }
      setError('');
    }
  }, [isOpen, assignment]);

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    if (!dueDate) { setError('Due date is required'); return; }
    if (maxScore <= 0) { setError('Max score must be positive'); return; }

    setSaving(true);
    setError('');

    try {
      const payload: any = {
        title: title.trim(),
        description: description.trim(),
        dueDate: new Date(dueDate).toISOString(),
        maxScore,
        allowLateSubmission,
        latePenalty: allowLateSubmission ? latePenalty : 0,
        maxSubmissions,
        enablePeerResponses,
        requireLiveRecording,
        allowYouTubeUrl,
        groupAssignment,
      };

      if (responseDueDate) payload.responseDueDate = new Date(responseDueDate).toISOString();
      if (enablePeerResponses) {
        payload.minResponsesRequired = minResponsesRequired;
        payload.maxResponsesPerVideo = maxResponsesPerVideo;
        payload.responseWordLimit = responseWordLimit;
        payload.peerReviewScope = peerReviewScope;
      }
      if (groupAssignment) payload.maxGroupSize = maxGroupSize;

      // Add section-specific due dates (only non-empty ones)
      const filteredSectionDueDates: Record<string, string> = {};
      for (const [secId, secDate] of Object.entries(sectionDueDates)) {
        if (secDate) filteredSectionDueDates[secId] = new Date(secDate).toISOString();
      }
      if (Object.keys(filteredSectionDueDates).length > 0) {
        payload.sectionDueDates = filteredSectionDueDates;
      }

      const res = await fetch(`/api/assignments/${assignment.assignmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onSave(payload);
        onClose();
      } else {
        setError(data.error || 'Failed to save changes');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'basic' as const, label: 'Basic', icon: '📝' },
    { id: 'submissions' as const, label: 'Submissions', icon: '📤' },
    { id: 'peer' as const, label: 'Peer Review', icon: '👥' },
    { id: 'video' as const, label: 'Video', icon: '🎬' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-[92%] max-w-lg max-h-[85vh] overflow-hidden shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-bold text-[#005587]">Assignment Settings</h2>
          <button onClick={onClose} className="text-gray-400 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-gray-100 px-3 shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex-1 py-2.5 text-[10px] font-bold text-center transition-colors ${activeSection === tab.id ? 'text-[#005587] border-b-2 border-[#005587]' : 'text-gray-400'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* BASIC TAB */}
          {activeSection === 'basic' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#005587] focus:outline-none focus:ring-1 focus:ring-[#005587]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:border-[#005587] focus:outline-none focus:ring-1 focus:ring-[#005587]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Due Date</label>
                  <input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#005587] focus:outline-none focus:ring-1 focus:ring-[#005587]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Max Score</label>
                  <input type="number" value={maxScore} onChange={(e) => setMaxScore(Number(e.target.value))} min={1}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#005587] focus:outline-none focus:ring-1 focus:ring-[#005587]" />
                </div>
              </div>

              {/* Section-specific due dates */}
              {sections.length > 1 && (
                <div className="mt-1">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-gray-700">Due dates by section</label>
                    <span className="text-[9px] text-gray-400">Leave blank to use default</span>
                  </div>
                  <div className="space-y-2 bg-gray-50 rounded-xl p-3">
                    {sections.map(sec => {
                      const secDateVal = sectionDueDates[sec.sectionId] || '';
                      let formattedSecDate = '';
                      if (secDateVal) {
                        try {
                          const d = new Date(secDateVal);
                          const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
                          formattedSecDate = local.toISOString().slice(0, 16);
                        } catch { formattedSecDate = ''; }
                      }
                      return (
                        <div key={sec.sectionId} className="flex items-center gap-2">
                          <span className="text-[11px] font-medium text-gray-600 w-20 truncate shrink-0">{sec.sectionName}</span>
                          <input
                            type="datetime-local"
                            value={formattedSecDate}
                            onChange={(e) => {
                              setSectionDueDates(prev => ({
                                ...prev,
                                [sec.sectionId]: e.target.value ? new Date(e.target.value).toISOString() : '',
                              }));
                            }}
                            className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-[#005587] focus:outline-none focus:ring-1 focus:ring-[#005587]"
                          />
                          {formattedSecDate && (
                            <button
                              onClick={() => setSectionDueDates(prev => { const n = {...prev}; delete n[sec.sectionId]; return n; })}
                              className="text-gray-300 hover:text-red-400 text-sm"
                            >✕</button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* SUBMISSIONS TAB */}
          {activeSection === 'submissions' && (
            <>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-xs font-medium text-gray-800">Allow Late Submissions</p>
                  <p className="text-[10px] text-gray-500">Students can submit after the due date</p>
                </div>
                <button onClick={() => setAllowLateSubmission(!allowLateSubmission)}
                  className={`w-10 h-6 rounded-full transition-colors ${allowLateSubmission ? 'bg-[#005587]' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${allowLateSubmission ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
              {allowLateSubmission && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Late Penalty (% per day)</label>
                  <input type="number" value={latePenalty} onChange={(e) => setLatePenalty(Number(e.target.value))} min={0} max={100}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#005587] focus:outline-none focus:ring-1 focus:ring-[#005587]" />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Max Submissions Allowed</label>
                <input type="number" value={maxSubmissions} onChange={(e) => setMaxSubmissions(Number(e.target.value))} min={1} max={10}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#005587] focus:outline-none focus:ring-1 focus:ring-[#005587]" />
                <p className="text-[10px] text-gray-400 mt-1">How many times a student can resubmit</p>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-xs font-medium text-gray-800">Group Assignment</p>
                  <p className="text-[10px] text-gray-500">Students work in teams</p>
                </div>
                <button onClick={() => setGroupAssignment(!groupAssignment)}
                  className={`w-10 h-6 rounded-full transition-colors ${groupAssignment ? 'bg-[#005587]' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${groupAssignment ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
              {groupAssignment && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Max Group Size</label>
                  <input type="number" value={maxGroupSize} onChange={(e) => setMaxGroupSize(Number(e.target.value))} min={2} max={10}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#005587] focus:outline-none focus:ring-1 focus:ring-[#005587]" />
                </div>
              )}
            </>
          )}

          {/* PEER REVIEW TAB */}
          {activeSection === 'peer' && (
            <>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-xs font-medium text-gray-800">Enable Peer Responses</p>
                  <p className="text-[10px] text-gray-500">Students respond to each other&apos;s videos</p>
                </div>
                <button onClick={() => setEnablePeerResponses(!enablePeerResponses)}
                  className={`w-10 h-6 rounded-full transition-colors ${enablePeerResponses ? 'bg-[#005587]' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${enablePeerResponses ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
              {enablePeerResponses && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Response Due Date</label>
                    <input type="datetime-local" value={responseDueDate} onChange={(e) => setResponseDueDate(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#005587] focus:outline-none focus:ring-1 focus:ring-[#005587]" />
                    <p className="text-[10px] text-gray-400 mt-1">When peer responses are due (can differ from assignment due date)</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Min Responses Required</label>
                      <input type="number" value={minResponsesRequired} onChange={(e) => setMinResponsesRequired(Number(e.target.value))} min={0} max={10}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#005587] focus:outline-none focus:ring-1 focus:ring-[#005587]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Max Per Video</label>
                      <input type="number" value={maxResponsesPerVideo} onChange={(e) => setMaxResponsesPerVideo(Number(e.target.value))} min={1} max={20}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#005587] focus:outline-none focus:ring-1 focus:ring-[#005587]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Min Word Count</label>
                    <input type="number" value={responseWordLimit} onChange={(e) => setResponseWordLimit(Number(e.target.value))} min={0}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#005587] focus:outline-none focus:ring-1 focus:ring-[#005587]" />
                    <p className="text-[10px] text-gray-400 mt-1">Minimum words per response (0 = no minimum)</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Review Scope</label>
                    <select value={peerReviewScope} onChange={(e) => setPeerReviewScope(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#005587] focus:outline-none focus:ring-1 focus:ring-[#005587]">
                      <option value="section">Within same section only</option>
                      <option value="course">Entire course (all sections)</option>
                    </select>
                  </div>
                </>
              )}
            </>
          )}

          {/* VIDEO TAB */}
          {activeSection === 'video' && (
            <>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-xs font-medium text-gray-800">Require Live Recording</p>
                  <p className="text-[10px] text-gray-500">Students must record in-app (no file uploads)</p>
                </div>
                <button onClick={() => setRequireLiveRecording(!requireLiveRecording)}
                  className={`w-10 h-6 rounded-full transition-colors ${requireLiveRecording ? 'bg-[#005587]' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${requireLiveRecording ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-xs font-medium text-gray-800">Allow Video Links</p>
                  <p className="text-[10px] text-gray-500">YouTube &amp; Google Drive links accepted</p>
                </div>
                <button onClick={() => setAllowYouTubeUrl(!allowYouTubeUrl)}
                  className={`w-10 h-6 rounded-full transition-colors ${allowYouTubeUrl ? 'bg-[#005587]' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${allowYouTubeUrl ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 shrink-0">
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-2">{error}</p>}
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-[#005587] text-white rounded-xl text-sm font-bold disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
