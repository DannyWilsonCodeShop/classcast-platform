'use client';

import React, { useState, useEffect } from 'react';

interface AssignmentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AssignmentEditData) => void;
  assignment: {
    assignmentId: string;
    title: string;
    description: string;
    dueDate: string;
    maxScore: number;
    assignmentType?: string;
  };
}

export interface AssignmentEditData {
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
}

export function AssignmentEditModal({ isOpen, onClose, onSave, assignment }: AssignmentEditModalProps) {
  const [title, setTitle] = useState(assignment.title);
  const [description, setDescription] = useState(assignment.description);
  const [dueDate, setDueDate] = useState('');
  const [maxScore, setMaxScore] = useState(assignment.maxScore);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle(assignment.title);
      setDescription(assignment.description);
      setMaxScore(assignment.maxScore);
      // Format date for datetime-local input
      try {
        const d = new Date(assignment.dueDate);
        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        setDueDate(local.toISOString().slice(0, 16));
      } catch {
        setDueDate('');
      }
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
      const res = await fetch(`/api/assignments/${assignment.assignmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          dueDate: new Date(dueDate).toISOString(),
          maxScore,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onSave({ title: title.trim(), description: description.trim(), dueDate: new Date(dueDate).toISOString(), maxScore });
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl w-[90%] max-w-md max-h-[80vh] overflow-y-auto p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-[#005587]">Edit Assignment</h2>
          <button onClick={onClose} className="text-gray-400 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-[#005587] focus:outline-none focus:ring-1 focus:ring-[#005587]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:border-[#005587] focus:outline-none focus:ring-1 focus:ring-[#005587]"
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-[#005587] focus:outline-none focus:ring-1 focus:ring-[#005587]"
            />
          </div>

          {/* Max Score */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Max Score</label>
            <input
              type="number"
              value={maxScore}
              onChange={(e) => setMaxScore(Number(e.target.value))}
              min={1}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-[#005587] focus:outline-none focus:ring-1 focus:ring-[#005587]"
            />
          </div>

          {/* Error */}
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 bg-[#005587] text-white rounded-xl text-sm font-bold disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
