'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface GroupMember {
  userId: string;
  firstName: string;
  lastName: string;
  joinedAt: string;
  role: 'leader' | 'member';
}

interface Group {
  groupId: string;
  groupName: string;
  joinCode: string;
  leaderId: string;
  members: GroupMember[];
  currentSize: number;
  maxSize: number;
  status: 'forming' | 'ready' | 'submitted';
}

interface GroupAssignmentModalProps {
  assignmentId: string;
  assignmentTitle: string;
  maxGroupSize: number;
  onClose: () => void;
  onGroupFormed: (group: Group) => void;
}

export const GroupAssignmentModal: React.FC<GroupAssignmentModalProps> = ({
  assignmentId,
  assignmentTitle,
  maxGroupSize,
  onClose,
  onGroupFormed
}) => {
  const { user } = useAuth();
  const [mode, setMode] = useState<'choice' | 'create' | 'join'>('choice');
  const [groupName, setGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdGroup, setCreatedGroup] = useState<Group | null>(null);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/groups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId,
          userId: user?.id,
          groupName: groupName.trim(),
          userFirstName: user?.firstName,
          userLastName: user?.lastName
        })
      });

      const data = await response.json();

      if (data.success) {
        setCreatedGroup(data.group);
      } else {
        setError(data.error || 'Failed to create group');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!joinCode.trim()) {
      setError('Please enter a join code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          joinCode: joinCode.toUpperCase(),
          userId: user?.id,
          userFirstName: user?.firstName,
          userLastName: user?.lastName
        })
      });

      const data = await response.json();

      if (data.success) {
        onGroupFormed(data.group);
        onClose();
      } else {
        setError(data.error || 'Failed to join group');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (createdGroup) {
      navigator.clipboard.writeText(createdGroup.joinCode);
      alert('Join code copied! Share it with your groupmates.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Group Assignment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          {assignmentTitle} - Groups of {maxGroupSize} students
        </p>

        {/* Choice Screen */}
        {mode === 'choice' && !createdGroup && (
          <div className="space-y-3">
            <button
              onClick={() => setMode('create')}
              className="w-full p-4 bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Create a New Group</p>
                  <p className="text-sm text-gray-600">Start a group and get a join code</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode('join')}
              className="w-full p-4 bg-green-50 border-2 border-green-200 rounded-lg hover:bg-green-100 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Join Existing Group</p>
                  <p className="text-sm text-gray-600">Enter a join code from a classmate</p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Create Group Screen */}
        {mode === 'create' && !createdGroup && (
          <div>
            <button
              onClick={() => setMode('choice')}
              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 mb-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </button>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Study Squad, Team Alpha"
                  maxLength={50}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                onClick={handleCreateGroup}
                disabled={loading || !groupName.trim()}
                className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </div>
        )}

        {/* Join Group Screen */}
        {mode === 'join' && (
          <div>
            <button
              onClick={() => setMode('choice')}
              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 mb-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </button>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Join Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-2xl font-mono tracking-widest uppercase"
                  placeholder="ABC123"
                  maxLength={6}
                />
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Get this code from your group leader
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                onClick={handleJoinGroup}
                disabled={loading || joinCode.length !== 6}
                className="w-full py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Joining...' : 'Join Group'}
              </button>
            </div>
          </div>
        )}

        {/* Group Created Success */}
        {createdGroup && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">Group Created!</h3>
            <p className="text-sm text-gray-600 mb-4">{createdGroup.groupName}</p>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-4">
              <p className="text-sm text-gray-700 mb-2">Share this code with your group members:</p>
              <div className="flex items-center justify-center space-x-2">
                <div className="text-4xl font-mono font-bold text-blue-600 tracking-widest">
                  {createdGroup.joinCode}
                </div>
                <button
                  onClick={handleCopyCode}
                  className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                  title="Copy code"
                >
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
              <p className="text-sm font-medium text-gray-700 mb-2">Current Members ({createdGroup.currentSize}/{createdGroup.maxSize}):</p>
              {createdGroup.members.map((member) => (
                <div key={member.userId} className="flex items-center space-x-2 py-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                  <span className="text-sm text-gray-900">
                    {member.firstName} {member.lastName}
                    {member.role === 'leader' && <span className="text-blue-600 ml-2">(Leader)</span>}
                  </span>
                </div>
              ))}
              {createdGroup.currentSize < createdGroup.maxSize && (
                <p className="text-xs text-gray-500 mt-2 italic">
                  Waiting for {createdGroup.maxSize - createdGroup.currentSize} more {createdGroup.maxSize - createdGroup.currentSize === 1 ? 'member' : 'members'}...
                </p>
              )}
            </div>

            <button
              onClick={() => {
                onGroupFormed(createdGroup);
                onClose();
              }}
              className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

