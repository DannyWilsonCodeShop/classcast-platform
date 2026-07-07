'use client';

import React, { useState, useRef } from 'react';
import { AssessmentSession, AssessmentQuestion } from '@/types/assessment';

interface AssessmentReviewPlayerProps {
  session: AssessmentSession;
  questions: AssessmentQuestion[];
}

export function AssessmentReviewPlayer({ session, questions }: AssessmentReviewPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);

  const seekToQuestion = (idx: number) => {
    if (videoRef.current && session.questionTimestamps[idx]) {
      videoRef.current.currentTime = session.questionTimestamps[idx].timestampSeconds;
      setCurrentQuestionIdx(idx);
    }
  };

  return (
    <div className="space-y-3">
      {/* Video Player */}
      <div className="bg-black rounded-xl overflow-hidden">
        <video
          ref={videoRef}
          src={session.videoUrl || ''}
          controls
          playsInline
          className="w-full"
          style={{ maxHeight: '250px' }}
        />
      </div>

      {/* Question Timeline */}
      <div className="bg-gray-50 rounded-xl p-3">
        <p className="text-xs font-bold text-[#005587] mb-2">Questions</p>
        <div className="space-y-1">
          {questions.map((q, idx) => (
            <button
              key={q.questionId}
              onClick={() => seekToQuestion(idx)}
              className={`w-full text-left p-2 rounded-lg text-xs transition-colors ${
                idx === currentQuestionIdx ? 'bg-[#005587]/10 border border-[#005587]/20' : 'hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">Q{idx + 1}: {q.questionText.substring(0, 40)}{q.questionText.length > 40 ? '...' : ''}</span>
                <span className="text-[9px] text-gray-400">
                  {session.questionTimestamps[idx] ? `${Math.floor(session.questionTimestamps[idx].timestampSeconds)}s` : '—'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Integrity Events */}
      {session.integrityEvents && session.integrityEvents.length > 0 && (
        <div className="bg-red-50 rounded-xl p-3">
          <p className="text-xs font-bold text-red-700 mb-2">⚠ Integrity Events ({session.integrityEvents.length})</p>
          <div className="space-y-1">
            {session.integrityEvents.map((event, idx) => (
              <div key={idx} className="flex items-center justify-between text-[10px]">
                <span className="text-red-700">{event.description}</span>
                <span className="text-red-400">{Math.floor(event.timestampSeconds)}s</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student Info */}
      <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600">
        <div className="flex justify-between"><span>Started:</span><span>{new Date(session.startedAt).toLocaleString()}</span></div>
        {session.completedAt && <div className="flex justify-between"><span>Completed:</span><span>{new Date(session.completedAt).toLocaleString()}</span></div>}
        <div className="flex justify-between"><span>Status:</span><span className="font-medium">{session.status}</span></div>
      </div>
    </div>
  );
}
