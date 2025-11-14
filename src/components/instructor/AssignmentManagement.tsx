'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { Assignment, AssignmentStatus, AssignmentType } from '@/types/dynamodb';
import AssignmentCreationForm from './AssignmentCreationForm';

export interface AssignmentWithStats extends Partial<Assignment> {
  assignmentId: string;
  title: string;
  description?: string;
  assignmentType?: AssignmentType;
  status: AssignmentStatus;
  dueDate?: string; // ISO
  maxScore?: number;
  createdAt?: string;
  updatedAt?: string;
  // Stats
  totalSubmissions: number;
  gradedSubmissions: number;
  averageScore?: number; // 0..maxScore
  completionRate?: number; // 0..100
}

interface AssignmentManagementProps {
  assignments: AssignmentWithStats[];
  className?: string;
  onStatusChange?: (assignmentId: string, newStatus: AssignmentStatus) => Promise<void> | void;
  onUpdateAssignment?: (assignmentId: string, updated: Partial<Assignment>) => Promise<void> | void;
}

const statusOptions: AssignmentStatus[] = [
  AssignmentStatus.DRAFT,
  AssignmentStatus.PUBLISHED,
  AssignmentStatus.ARCHIVED,
];

const AssignmentManagement: React.FC<AssignmentManagementProps> = ({
  assignments,
  className = '',
  onStatusChange,
  onUpdateAssignment,
}) => {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AssignmentStatus>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'title' | 'status'>('dueDate');
  const [editingAssignment, setEditingAssignment] = useState<AssignmentWithStats | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const filtered = useMemo(() => {
    let data = [...assignments];
    if (statusFilter !== 'all') {
      data = data.filter(a => a.status === statusFilter);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      data = data.filter(a => a.title.toLowerCase().includes(q));
    }
    data.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      const ad = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const bd = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      return ad - bd;
    });
    return data;
  }, [assignments, query, statusFilter, sortBy]);

  const formatDate = (iso?: string): string => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString();
  };

  const percent = (value?: number): number => {
    if (typeof value !== 'number' || isNaN(value)) return 0;
    return Math.min(100, Math.max(0, Math.round(value)));
  };

  const handleStatusChange = async (assignmentId: string, newStatus: AssignmentStatus) => {
    if (onStatusChange) await onStatusChange(assignmentId, newStatus);
  };

  const handleEdit = (assignment: AssignmentWithStats) => setEditingAssignment(assignment);

  const handleEditCancel = () => setEditingAssignment(null);

  const handleEditSubmit = useCallback(async (updatedPartial: Partial<Assignment>) => {
    if (!editingAssignment) return;
    try {
      setIsSaving(true);
      await onUpdateAssignment?.(editingAssignment.assignmentId, updatedPartial);
      setEditingAssignment(null);
    } finally {
      setIsSaving(false);
    }
  }, [editingAssignment, onUpdateAssignment]);

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Assignments</h2>
        <p className="text-gray-600">Manage assignments, track progress, and update statuses.</p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3" role="region" aria-label="assignment-filters">
          <input
            aria-label="Search assignments"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search by title..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            aria-label="Filter by status"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">All statuses</option>
            {statusOptions.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <select
            aria-label="Sort assignments"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="dueDate">Sort by due date</option>
            <option value="title">Sort by title</option>
            <option value="status">Sort by status</option>
          </select>
          <div className="hidden md:block" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200" role="table" aria-label="assignments-table">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submissions</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average</th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.map(a => {
              const completion = percent(a.completionRate);
              const avgPercent = a.averageScore && a.maxScore ? percent((a.averageScore / a.maxScore) * 100) : 0;
              return (
                <tr key={a.assignmentId} role="row">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{a.title}</div>
                    <div className="text-xs text-gray-500">{a.assignmentType ? a.assignmentType.replace('_', ' ') : '—'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      aria-label={`Status for ${a.title}`}
                      className="px-2 py-1 border border-gray-300 rounded"
                      value={a.status}
                      onChange={(e) => handleStatusChange(a.assignmentId, e.target.value as AssignmentStatus)}
                    >
                      {statusOptions.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(a.dueDate)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{a.gradedSubmissions}/{a.totalSubmissions}</td>
                  <td className="px-4 py-3">
                    <div className="w-32" aria-label={`Completion ${completion}%`}>
                      <div className="w-full bg-gray-200 rounded h-2" role="progressbar" aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100}>
                        <div className="bg-green-500 h-2 rounded" style={{ width: `${completion}%` }} />
                      </div>
                      <div className="text-xs text-gray-600 mt-1">{completion}%</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-32" aria-label={`Average ${avgPercent}%`}>
                      <div className="w-full bg-gray-200 rounded h-2" role="progressbar" aria-valuenow={avgPercent} aria-valuemin={0} aria-valuemax={100}>
                        <div className="bg-blue-500 h-2 rounded" style={{ width: `${avgPercent}%` }} />
                      </div>
                      <div className="text-xs text-gray-600 mt-1">{avgPercent}%</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="px-3 py-1 text-sm text-blue-700 hover:bg-blue-50 rounded"
                      onClick={() => handleEdit(a)}
                      aria-label={`Edit ${a.title}`}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan={7}>No assignments found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-label="Edit assignment">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Edit Assignment</h3>
              <button
                type="button"
                className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 rounded"
                onClick={handleEditCancel}
                aria-label="Close edit"
              >
                Close
              </button>
            </div>
            <div className="p-6">
              <AssignmentCreationForm
                onSubmit={handleEditSubmit}
                onCancel={handleEditCancel}
                isLoading={isSaving}
                initialData={{
                  title: editingAssignment.title,
                  description: editingAssignment.description || '',
                  assignmentType: editingAssignment.assignmentType || AssignmentType.ESSAY,
                  dueDate: editingAssignment.dueDate,
                  maxScore: editingAssignment.maxScore || 100,
                  weight: 10,
                  requirements: [],
                  status: editingAssignment.status,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentManagement;
