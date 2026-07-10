'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface Lesson {
  lessonId: string;
  moduleId: string;
  title: string;
  description: string;
  type: 'video' | 'reading' | 'quiz';
  videoUrl?: string;
  content?: string;
  duration?: number;
  order: number;
  quiz?: QuizData;
  createdAt: string;
}

interface QuizData {
  questions: QuizQuestion[];
}

interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false';
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

export default function LessonBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params?.id as string;

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  // New lesson form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState<'video' | 'reading' | 'quiz'>('video');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newQuiz, setNewQuiz] = useState<QuizQuestion[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [assignmentId]);

  const fetchData = async () => {
    try {
      // Fetch assignment info
      const aRes = await fetch(`/api/assignments/${assignmentId}`);
      if (aRes.ok) {
        const aData = await aRes.json();
        setAssignmentTitle(aData.data?.assignment?.title || aData.assignment?.title || 'Study Module');
      }

      // Fetch lessons
      const lRes = await fetch(`/api/instructor/lesson-modules/${assignmentId}/lessons`);
      if (lRes.ok) {
        const lData = await lRes.json();
        setLessons(lData.lessons || []);
      }
    } catch (err) {
      console.error('Error fetching lessons:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLesson = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);

    try {
      const body: any = {
        title: newTitle.trim(),
        description: newDescription.trim(),
        type: newType,
      };

      if (newType === 'video') {
        body.videoUrl = newVideoUrl.trim();
      } else if (newType === 'reading') {
        body.content = newContent.trim();
      } else if (newType === 'quiz') {
        body.quiz = { questions: newQuiz };
      }

      const res = await fetch(`/api/instructor/lesson-modules/${assignmentId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setLessons(prev => [...prev, data.lesson]);
        resetForm();
        setShowAddLesson(false);
      }
    } catch (err) {
      console.error('Error adding lesson:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Delete this lesson?')) return;

    try {
      const res = await fetch(`/api/instructor/lesson-modules/${assignmentId}/lessons/${lessonId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setLessons(prev => prev.filter(l => l.lessonId !== lessonId));
      }
    } catch (err) {
      console.error('Error deleting lesson:', err);
    }
  };

  const handleReorder = (index: number, direction: 'up' | 'down') => {
    const newLessons = [...lessons];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newLessons.length) return;
    [newLessons[index], newLessons[targetIdx]] = [newLessons[targetIdx], newLessons[index]];
    // Update order values
    newLessons.forEach((l, i) => { l.order = i + 1; });
    setLessons(newLessons);
    // TODO: persist order to backend
  };

  const addQuizQuestion = () => {
    setNewQuiz(prev => [...prev, {
      id: `q_${Date.now()}`,
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
    }]);
  };

  const updateQuizQuestion = (index: number, updates: Partial<QuizQuestion>) => {
    setNewQuiz(prev => prev.map((q, i) => i === index ? { ...q, ...updates } : q));
  };

  const removeQuizQuestion = (index: number) => {
    setNewQuiz(prev => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setNewTitle('');
    setNewDescription('');
    setNewType('video');
    setNewVideoUrl('');
    setNewContent('');
    setNewQuiz([]);
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
                <h1 className="text-sm font-bold text-[#005587] truncate">Lesson Builder</h1>
                <p className="text-[10px] text-gray-500 truncate">{assignmentTitle}</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddLesson(true)}
              className="px-3 py-1.5 bg-[#FFC72C] text-[#005587] rounded-full text-xs font-bold shrink-0"
            >
              + Add Lesson
            </button>
          </div>
        </div>

        {/* Lesson List */}
        <div className="px-4 py-3 space-y-2">
          {lessons.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📖</div>
              <h3 className="text-base font-bold text-gray-800 mb-1">No lessons yet</h3>
              <p className="text-xs text-gray-500 mb-4">Add video, reading, or quiz lessons for students to complete.</p>
              <button
                onClick={() => setShowAddLesson(true)}
                className="px-4 py-2 bg-[#FFC72C] text-[#005587] rounded-xl text-sm font-bold"
              >
                + Add First Lesson
              </button>
            </div>
          ) : (
            lessons.map((lesson, index) => (
              <div key={lesson.lessonId} className="bg-gray-50 rounded-2xl p-3 flex items-center gap-3">
                {/* Order + Reorder */}
                <div className="flex flex-col items-center gap-0.5 shrink-0">
                  <button onClick={() => handleReorder(index, 'up')} disabled={index === 0} className="text-gray-300 disabled:opacity-30">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                  </button>
                  <span className="text-[10px] font-bold text-[#005587] w-5 h-5 bg-white rounded-full flex items-center justify-center">{index + 1}</span>
                  <button onClick={() => handleReorder(index, 'down')} disabled={index === lessons.length - 1} className="text-gray-300 disabled:opacity-30">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                </div>

                {/* Lesson Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">
                      {lesson.type === 'video' ? '🎥' : lesson.type === 'quiz' ? '📝' : '📖'}
                    </span>
                    <h3 className="text-sm font-bold text-gray-900 truncate">{lesson.title}</h3>
                  </div>
                  {lesson.description && (
                    <p className="text-[10px] text-gray-500 truncate mt-0.5">{lesson.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] px-1.5 py-0.5 bg-white rounded-full text-gray-500 capitalize">{lesson.type}</span>
                    {lesson.videoUrl && <span className="text-[9px] text-blue-500">🔗 Video</span>}
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={() => handleDeleteLesson(lesson.lessonId)}
                  className="text-red-400 shrink-0 p-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add Lesson Modal */}
        {showAddLesson && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => { setShowAddLesson(false); resetForm(); }} />
            <div className="relative bg-white rounded-t-2xl w-full max-h-[85vh] overflow-y-auto p-5 pb-8 shadow-xl animate-[modalSlideUp_280ms_ease-out_both]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-[#005587]">Add Lesson</h2>
                <button onClick={() => { setShowAddLesson(false); resetForm(); }} className="text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="space-y-3">
                {/* Type Selector */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Lesson Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['video', 'reading', 'quiz'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setNewType(type)}
                        className={`p-2 rounded-xl border text-center transition-colors ${newType === type ? 'border-[#005587] bg-[#005587]/5' : 'border-gray-200'}`}
                      >
                        <span className="text-lg">{type === 'video' ? '🎥' : type === 'quiz' ? '📝' : '📖'}</span>
                        <p className="text-[10px] font-medium text-gray-700 capitalize mt-0.5">{type}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Lesson title..."
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#005587] focus:outline-none"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description (optional)</label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Brief description..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:border-[#005587] focus:outline-none"
                  />
                </div>

                {/* Video URL (for video type) */}
                {newType === 'video' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Video URL</label>
                    <input
                      type="url"
                      value={newVideoUrl}
                      onChange={(e) => setNewVideoUrl(e.target.value)}
                      placeholder="YouTube or direct video URL..."
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#005587] focus:outline-none"
                    />
                  </div>
                )}

                {/* Reading Content (for reading type) */}
                {newType === 'reading' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Content</label>
                    <textarea
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      placeholder="Write lesson content here..."
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:border-[#005587] focus:outline-none"
                    />
                  </div>
                )}

                {/* Quiz Builder (for quiz type) */}
                {newType === 'quiz' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-gray-700">Questions</label>
                      <button onClick={addQuizQuestion} className="text-[10px] text-[#005587] font-bold">+ Add Question</button>
                    </div>
                    {newQuiz.map((q, i) => (
                      <div key={q.id} className="bg-gray-50 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-gray-500">Q{i + 1}</span>
                          <div className="flex items-center gap-2">
                            <select
                              value={q.type}
                              onChange={(e) => updateQuizQuestion(i, { type: e.target.value as any, options: e.target.value === 'true-false' ? ['True', 'False'] : ['', '', '', ''] })}
                              className="text-[10px] border border-gray-200 rounded-lg px-1.5 py-0.5"
                            >
                              <option value="multiple-choice">Multiple Choice</option>
                              <option value="true-false">True/False</option>
                            </select>
                            <button onClick={() => removeQuizQuestion(i)} className="text-red-400 text-xs">✕</button>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={q.question}
                          onChange={(e) => updateQuizQuestion(i, { question: e.target.value })}
                          placeholder="Enter question..."
                          className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-xs focus:border-[#005587] focus:outline-none"
                        />
                        {/* Options */}
                        <div className="space-y-1.5">
                          {q.options.map((opt, oi) => (
                            <div key={oi} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct_${q.id}`}
                                checked={q.correctAnswer === opt && opt !== ''}
                                onChange={() => updateQuizQuestion(i, { correctAnswer: opt })}
                                className="shrink-0"
                              />
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const newOptions = [...q.options];
                                  newOptions[oi] = e.target.value;
                                  updateQuizQuestion(i, { options: newOptions });
                                }}
                                placeholder={q.type === 'true-false' ? (oi === 0 ? 'True' : 'False') : `Option ${oi + 1}`}
                                disabled={q.type === 'true-false'}
                                className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-[11px] focus:border-[#005587] focus:outline-none disabled:bg-gray-100"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {newQuiz.length === 0 && (
                      <p className="text-center text-gray-400 text-xs py-3">No questions yet. Add one above.</p>
                    )}
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleAddLesson}
                  disabled={saving || !newTitle.trim() || (newType === 'video' && !newVideoUrl.trim())}
                  className="w-full py-3 bg-[#005587] text-white rounded-xl text-sm font-bold disabled:opacity-50 mt-2"
                >
                  {saving ? 'Adding...' : 'Add Lesson'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </InstructorRoute>
  );
}
