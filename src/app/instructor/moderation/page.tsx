'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface ModerationFlag {
  flagId: string;
  contentId: string;
  contentType: 'peer-response' | 'community-post' | 'submission';
  content: string;
  authorId: string;
  authorName: string;
  courseId?: string;
  assignmentId?: string;
  flagReason: string;
  severity: 'low' | 'medium' | 'high';
  categories: string[];
  status: 'pending' | 'approved' | 'removed';
  reviewedBy?: string;
  reviewerName?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
  moderationData?: any;
}

const ModerationDashboard: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [flags, setFlags] = useState<ModerationFlag[]>([]);
  const [filteredFlags, setFilteredFlags] = useState<ModerationFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedFlag, setSelectedFlag] = useState<ModerationFlag | null>(null);
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [processing, setProcessing] = useState<string | null>(null);

  // Redirect if not instructor
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'instructor')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Load flags
  useEffect(() => {
    if (user?.role === 'instructor') {
      loadFlags();
    }
  }, [user]);

  // Filter flags
  useEffect(() => {
    let filtered = flags;

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(f => f.status === selectedStatus);
    }

    if (selectedSeverity !== 'all') {
      filtered = filtered.filter(f => f.severity === selectedSeverity);
    }

    setFilteredFlags(filtered);
  }, [flags, selectedStatus, selectedSeverity]);

  const loadFlags = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/moderation/flag', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setFlags(data.flags || []);
      } else {
        console.error('Failed to load moderation flags');
      }
    } catch (error) {
      console.error('Error loading flags:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (flagId: string, action: 'approved' | 'removed') => {
    if (!user) return;

    try {
      setProcessing(flagId);
      
      const response = await fetch('/api/moderation/flag', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          flagId,
          status: action,
          reviewerId: user.id,
          reviewerName: `${user.firstName} ${user.lastName}`,
          reviewNotes
        })
      });

      if (response.ok) {
        // Update local state
        setFlags(prevFlags =>
          prevFlags.map(f =>
            f.flagId === flagId
              ? {
                  ...f,
                  status: action,
                  reviewedBy: user.id,
                  reviewerName: `${user.firstName} ${user.lastName}`,
                  reviewedAt: new Date().toISOString(),
                  reviewNotes
                }
              : f
          )
        );

        // Close modal
        setSelectedFlag(null);
        setReviewNotes('');

        // Reload flags
        await loadFlags();
      } else {
        alert('Failed to update flag status');
      }
    } catch (error) {
      console.error('Error updating flag:', error);
      alert('Error updating flag status');
    } finally {
      setProcessing(null);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'removed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading moderation dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'instructor') {
    return null;
  }

  const pendingCount = flags.filter(f => f.status === 'pending').length;
  const highSeverityCount = flags.filter(f => f.severity === 'high' && f.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with branding and back button */}
      <div className="bg-white/90 backdrop-blur-md shadow-lg border-b border-indigo-600/20 px-2 sm:px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left Side - Back button and MyClassCast Logo */}
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            <button
              onClick={() => router.push('/instructor/dashboard')}
              className="text-gray-500 hover:text-gray-700 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              title="Back to Dashboard"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <img
              src="/MyClassCast (800 x 200 px).png"
              alt="MyClassCast"
              className="h-6 sm:h-8 w-auto object-contain max-w-[200px] sm:max-w-none"
            />
          </div>
          
          {/* Right Side - User info */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-700">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-500">Content Moderator</p>
            </div>
            {user?.schoolLogo && (
              <img
                src={user.schoolLogo}
                alt="School Logo"
                className="h-6 w-auto object-contain"
              />
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Content Moderation</h1>
          <p className="text-gray-600">Review flagged content and take appropriate action</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">High Severity</p>
                <p className="text-2xl font-bold text-gray-900">{highSeverityCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gray-100 rounded-lg">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Flags</p>
                <p className="text-2xl font-bold text-gray-900">{flags.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="removed">Removed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Severities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
            </div>

        {/* Flags List */}
        <div className="space-y-4">
          {filteredFlags.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Flags Found</h3>
              <p className="text-gray-600">
                {selectedStatus === 'pending'
                  ? 'Great! There are no pending content flags to review.'
                  : 'No flags match the selected filters.'}
              </p>
            </div>
          ) : (
            filteredFlags.map((flag) => (
              <div key={flag.flagId} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(flag.severity)}`}>
                          {flag.severity.toUpperCase()}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(flag.status)}`}>
                          {flag.status.toUpperCase()}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          {flag.contentType}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Author:</span> {flag.authorName}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Flagged:</span> {new Date(flag.createdAt).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Reason:</span> {flag.flagReason}
                      </p>
                    </div>
                    {flag.status === 'pending' && (
                      <button
                        onClick={() => setSelectedFlag(flag)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                      >
                        Review
                      </button>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Flagged Content:</p>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap line-clamp-3">
                      {flag.content}
                    </p>
                  </div>

                  {flag.categories && flag.categories.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {flag.categories.map((category, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  )}

                  {flag.reviewedBy && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Reviewed by:</span> {flag.reviewerName} on{' '}
                        {new Date(flag.reviewedAt!).toLocaleString()}
                      </p>
                      {flag.reviewNotes && (
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Notes:</span> {flag.reviewNotes}
                        </p>
                      )}
                  </div>
                  )}
                </div>
            </div>
            ))
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedFlag && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Review Content</h2>
                <button
                  onClick={() => {
                    setSelectedFlag(null);
                    setReviewNotes('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm font-medium text-gray-700">Author</p>
                  <p className="text-gray-900">{selectedFlag.authorName}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">Content Type</p>
                  <p className="text-gray-900">{selectedFlag.contentType}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">Severity & Categories</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(selectedFlag.severity)}`}>
                      {selectedFlag.severity.toUpperCase()}
                    </span>
                    {selectedFlag.categories.map((category, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Flagged Content</p>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-60 overflow-y-auto">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedFlag.content}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Notes (Optional)
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Add any notes about your decision..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setSelectedFlag(null);
                    setReviewNotes('');
                  }}
                  disabled={processing !== null}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReview(selectedFlag.flagId, 'approved')}
                  disabled={processing !== null}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors"
                >
                  {processing === selectedFlag.flagId ? 'Processing...' : 'Approve Content'}
                </button>
                <button
                  onClick={() => handleReview(selectedFlag.flagId, 'removed')}
                  disabled={processing !== null}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 transition-colors"
                >
                  {processing === selectedFlag.flagId ? 'Processing...' : 'Remove Content'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModerationDashboard;
