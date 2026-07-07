'use client';

import React, { useState, useEffect } from 'react';
import { ModuleConfig, ModuleLesson } from '@/types/module';

interface ModuleWorkspaceProps {
  assignmentId: string;
  studentId: string;
  groupId: string;
  moduleConfig: ModuleConfig;
  groupMembers: { id: string; name: string }[];
}

export function ModuleWorkspace({ assignmentId, studentId, groupId, moduleConfig, groupMembers }: ModuleWorkspaceProps) {
  const [lessons, setLessons] = useState<ModuleLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({ totalRequired: 0, totalUploaded: 0, readyToSubmit: false });

  const fetchLessons = async () => {
    try {
      const res = await fetch(`/api/modules/${assignmentId}/lessons`);
      const data = await res.json();
      if (data.success) {
        setLessons(data.data.lessons || []);
        setProgress(data.data.progress || { totalRequired: moduleConfig.requiredVideos, totalUploaded: 0, readyToSubmit: false });
      }
    } catch (err) {
      console.error('Error fetching lessons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLessons(); }, [assignmentId]);

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Delete this video lesson?')) return;
    try {
      await fetch(`/api/modules/${assignmentId}/lessons?lessonId=${lessonId}&authorId=${studentId}`, { method: 'DELETE' });
      fetchLessons();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#005587]" /></div>;
  }

  return (
    <div className="space-y-4 px-4 py-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-[#005587]">{moduleConfig.topic || 'Module Project'}</h2>
        <p className="text-xs text-gray-500">Group project • {progress.totalUploaded}/{progress.totalRequired} videos</p>
      </div>

      {/* Group Members */}
      <div className="bg-gray-50 rounded-xl p-3">
        <p className="text-xs font-medium text-gray-600 mb-2">Group Members</p>
        <div className="flex flex-wrap gap-2">
          {groupMembers.map(m => (
            <span key={m.id} className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${m.id === studentId ? 'bg-[#005587] text-white' : 'bg-gray-200 text-gray-700'}`}>
              {m.name}{m.id === studentId ? ' (you)' : ''}
            </span>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div className="bg-gray-50 rounded-xl p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-600">Progress</span>
          <span className="text-xs font-bold text-[#005587]">{progress.totalUploaded}/{progress.totalRequired}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-[#005587] rounded-full h-2 transition-all" style={{ width: `${Math.min(100, (progress.totalUploaded / progress.totalRequired) * 100)}%` }} />
        </div>
      </div>

      {/* Lessons List */}
      <div className="space-y-2">
        {lessons.map((lesson, idx) => (
          <div key={lesson.lessonId} className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-[#005587] rounded-lg flex items-center justify-center text-white text-xs font-bold">{idx + 1}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{lesson.title}</p>
              <p className="text-[10px] text-gray-500">{lesson.authorId === studentId ? 'You' : 'Teammate'} • {Math.round(lesson.duration)}s</p>
            </div>
            {lesson.authorId === studentId && (
              <button onClick={() => handleDeleteLesson(lesson.lessonId)} className="text-red-400 text-xs">🗑</button>
            )}
          </div>
        ))}
      </div>

      {/* Add Video Button */}
      <button className="w-full py-3 bg-[#FFC72C] text-[#005587] rounded-xl font-bold text-sm">
        + Add Video Lesson
      </button>

      {/* Submit Button */}
      {progress.readyToSubmit && (
        <button className="w-full py-3 bg-[#005587] text-white rounded-xl font-bold text-sm">
          Submit Module
        </button>
      )}
    </div>
  );
}
