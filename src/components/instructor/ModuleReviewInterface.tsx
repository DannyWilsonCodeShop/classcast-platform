'use client';

import React, { useState } from 'react';
import { ModuleLesson } from '@/types/module';

interface ModuleReviewInterfaceProps {
  lessons: ModuleLesson[];
  groupMembers: { id: string; name: string }[];
  gradingPolicy: 'shared' | 'individual';
}

export function ModuleReviewInterface({ lessons, groupMembers, gradingPolicy }: ModuleReviewInterfaceProps) {
  const [currentLessonIdx, setCurrentLessonIdx] = useState(0);
  const currentLesson = lessons[currentLessonIdx];

  return (
    <div className="space-y-3">
      {/* Video Player */}
      {currentLesson && (
        <div className="bg-black rounded-xl overflow-hidden">
          <video src={currentLesson.videoUrl} controls playsInline className="w-full" style={{ maxHeight: '250px' }} />
        </div>
      )}

      {/* Lesson Info */}
      {currentLesson && (
        <div className="bg-gray-50 rounded-xl p-3">
          <h3 className="text-sm font-bold text-[#005587]">{currentLesson.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{currentLesson.description}</p>
          <p className="text-[10px] text-gray-400 mt-1">By: {groupMembers.find(m => m.id === currentLesson.authorId)?.name || 'Unknown'} • {Math.round(currentLesson.duration)}s</p>
        </div>
      )}

      {/* Playlist */}
      <div className="bg-gray-50 rounded-xl p-3">
        <p className="text-xs font-bold text-[#005587] mb-2">Lessons ({lessons.length})</p>
        <div className="space-y-1">
          {lessons.map((lesson, idx) => (
            <button
              key={lesson.lessonId}
              onClick={() => setCurrentLessonIdx(idx)}
              className={`w-full text-left p-2 rounded-lg text-xs ${idx === currentLessonIdx ? 'bg-[#005587]/10' : 'hover:bg-gray-100'}`}
            >
              <span className="font-medium">{idx + 1}. {lesson.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grading Info */}
      <div className="bg-gray-50 rounded-xl p-3">
        <p className="text-xs font-bold text-[#005587] mb-1">Grading: {gradingPolicy === 'shared' ? 'Same grade for all' : 'Individual grades'}</p>
        <div className="space-y-1">
          {groupMembers.map(m => (
            <div key={m.id} className="flex items-center justify-between text-[10px]">
              <span className="text-gray-700">{m.name}</span>
              <span className="text-gray-400">{lessons.filter(l => l.authorId === m.id).length} videos</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
