'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { ProblemBank } from '@/types/problemBank';
import { ProblemBankBuilder } from '@/components/instructor/ProblemBankBuilder';
import { HelpTooltip } from '@/components/common/HelpTooltip';

export default function ProblemBanksPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [banks, setBanks] = useState<ProblemBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingBank, setEditingBank] = useState<ProblemBank | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) fetchBanks();
  }, [user?.id]);

  const fetchBanks = async () => {
    try {
      const res = await fetch(`/api/problem-banks?instructorId=${user?.id}`);
      const data = await res.json();
      if (data.success) {
        setBanks(data.data.banks || []);
      }
    } catch (err) {
      console.error('Failed to fetch banks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (bankData: { title: string; description: string; problems: { content: string; imageUrl?: string }[] }) => {
    try {
      const res = await fetch('/api/problem-banks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bankData,
          instructorId: user?.id,
          courseId: '',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowBuilder(false);
        setEditingBank(null);
        fetchBanks();
      }
    } catch (err) {
      console.error('Failed to save bank:', err);
    }
  };

  const handleDuplicate = async (bankId: string) => {
    try {
      const res = await fetch(`/api/problem-banks/${bankId}/duplicate`, { method: 'POST' });
      const data = await res.json();
      if (data.success) fetchBanks();
    } catch (err) {
      console.error('Duplicate failed:', err);
    }
  };

  const handleDelete = async (bankId: string) => {
    try {
      const res = await fetch(`/api/problem-banks/${bankId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setDeleteConfirm(null);
        fetchBanks();
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleExport = (bankId: string) => {
    window.open(`/api/problem-banks/${bankId}/export`, '_blank');
  };

  if (showBuilder || editingBank) {
    return (
      <InstructorRoute>
        <div className="min-h-full overflow-y-auto pb-24">
          <div className="max-w-2xl mx-auto px-4 py-6">
            <h1 className="text-xl font-bold text-[#005587] mb-4">
              {editingBank ? 'Edit Problem Bank' : 'Create Problem Bank'}
            </h1>
            <ProblemBankBuilder
              bankId={editingBank?.bankId}
              courseId={editingBank?.courseId || ''}
              onSave={handleSave}
              onCancel={() => { setShowBuilder(false); setEditingBank(null); }}
              initialTitle={editingBank?.title || ''}
              initialDescription={editingBank?.description || ''}
            />
          </div>
        </div>
      </InstructorRoute>
    );
  }

  return (
    <InstructorRoute>
      <div className="min-h-full overflow-y-auto pb-24">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-bold text-[#005587]">Problem Banks</h1>
              <HelpTooltip text="Problem banks let you create sets of unique questions. Link a bank to an assignment and each student gets a different problem — great for individualized homework and preventing cheating." />
            </div>
            <button
              onClick={() => setShowBuilder(true)}
              className="px-4 py-2 bg-[#005587] text-white rounded-xl text-sm font-medium"
            >
              + New Bank
            </button>
          </div>

          {/* Banks List */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : banks.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl block mb-3">📋</span>
              <p className="text-gray-600 font-medium">No problem banks yet</p>
              <p className="text-gray-400 text-sm mt-1">Create one to distribute unique problems to students</p>
            </div>
          ) : (
            <div className="space-y-3">
              {banks.map(bank => (
                <div key={bank.bankId} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-[#005587] truncate">{bank.title}</h3>
                      {bank.description && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{bank.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-500">
                          📝 {bank.problemCount} problem{bank.problemCount !== 1 ? 's' : ''}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(bank.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => setEditingBank(bank)}
                      className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDuplicate(bank.bankId)}
                      className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700"
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={() => handleExport(bank.bankId)}
                      className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700"
                    >
                      Export
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(bank.bankId)}
                      className="px-3 py-1.5 bg-white border border-red-200 rounded-lg text-xs font-medium text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setDeleteConfirm(null)}>
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative bg-white rounded-2xl p-6 mx-4 max-w-sm w-full" onClick={e => e.stopPropagation()}>
              <h3 className="font-bold text-gray-900 mb-2">Delete Problem Bank?</h3>
              <p className="text-sm text-gray-600 mb-4">This will permanently delete the bank and all its problems. This cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2 bg-gray-100 rounded-xl text-sm font-medium text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-2 bg-red-500 text-white rounded-xl text-sm font-bold"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </InstructorRoute>
  );
}
