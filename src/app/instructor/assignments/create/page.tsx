'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { RubricCategory, getRubricMaxScore } from '@/types/rubric';

interface CourseOption {
  courseId: string;
  title: string;
  courseName?: string;
}

type AssignmentType = 'video' | 'discussion' | 'assessment' | 'group-project' | 'study-module';

const ASSIGNMENT_TYPES: { id: AssignmentType; label: string; icon: string }[] = [
  { id: 'video', label: 'Video', icon: '🎥' },
  { id: 'discussion', label: 'Discussion', icon: '💬' },
  { id: 'assessment', label: 'Assessment', icon: '📋' },
  { id: 'group-project', label: 'Group Project', icon: '🎬' },
  { id: 'study-module', label: 'Study Module', icon: '📖' },
];

const CreateAssignmentPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignmentType, setAssignmentType] = useState<AssignmentType>('video');
  const [dueDate, setDueDate] = useState('');
  const [maxScore, setMaxScore] = useState(100);
  const [rubric, setRubric] = useState<RubricCategory[]>([]);

  // Fetch courses and auto-select the most recent one
  useEffect(() => {
    if (user?.id) {
      fetchCourses();
    }
  }, [user?.id]);

  const fetchCourses = async () => {
    setLoadingCourses(true);
    try {
      const res = await fetch(`/api/instructor/courses?instructorId=${user?.id}`);
      const data = await res.json();
      if (data.success && data.data?.courses?.length > 0) {
        const courseList = data.data.courses;
        setCourses(courseList);
        // Auto-select the first (most recent) course
        setCourseId(courseList[0].courseId);
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoadingCourses(false);
    }
  };

  // AI fill: takes the title and fills description, rubric, due date, etc.
  const handleAIFill = async () => {
    if (!title.trim()) {
      setError('Enter an assignment title first so AI knows what to generate.');
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/generate-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: title,
          gradeLevel: 'College',
          assignmentType,
          additionalContext: description || undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const gen = data.data;
        if (gen.description) setDescription(gen.description);
        if (gen.rubric && gen.rubric.length > 0) {
          setRubric(gen.rubric);
          setMaxScore(getRubricMaxScore(gen.rubric));
        }
        if (gen.maxScore && !gen.rubric?.length) setMaxScore(gen.maxScore);
        if (gen.suggestedDueInDays && !dueDate) {
          const due = new Date();
          due.setDate(due.getDate() + gen.suggestedDueInDays);
          const year = due.getFullYear();
          const month = String(due.getMonth() + 1).padStart(2, '0');
          const day = String(due.getDate()).padStart(2, '0');
          setDueDate(`${year}-${month}-${day}T23:59`);
        }
      } else {
        setError(data.error || 'AI generation failed. Try again.');
      }
    } catch (err) {
      setError('Network error calling AI. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !title.trim() || !dueDate) {
      setError('Please fill in the title, due date, and select a course.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          courseId,
          assignmentType: assignmentType === 'group-project' ? 'module' : assignmentType === 'study-module' ? 'study-module' : assignmentType,
          dueDate,
          maxScore: rubric.length > 0 ? getRubricMaxScore(rubric) : maxScore,
          rubric: rubric.length > 0 ? rubric : null,
          instructorId: user?.id,
          status: 'published',
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/instructor/dashboard');
      } else {
        setError(data.error || 'Failed to create assignment');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <InstructorRoute>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
        <div className="bg-white w-full max-w-[460px] rounded-2xl p-5 max-h-[92vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-[#005587]">Create Assignment</h2>
            <button
              onClick={() => router.back()}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Course selector */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Course</label>
              {loadingCourses ? (
                <div className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-400">Loading...</div>
              ) : (
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#005587] focus:border-[#005587]"
                >
                  <option value="">Select a course</option>
                  {courses.map((c) => (
                    <option key={c.courseId} value={c.courseId}>
                      {c.title || c.courseName}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Assignment Type */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Type</label>
              <div className="flex gap-1.5 flex-wrap">
                {ASSIGNMENT_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setAssignmentType(t.id)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      assignmentType === t.id
                        ? 'bg-[#005587] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#005587] focus:border-[#005587]"
                placeholder="e.g., Persuasive Speech Video"
              />
            </div>

            {/* Description with AI button */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-600">
                  Description / Instructions
                </label>
                <button
                  type="button"
                  onClick={handleAIFill}
                  disabled={isGenerating || !title.trim()}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-[#005587] bg-[#005587]/8 border border-[#005587]/20 rounded-lg hover:bg-[#005587]/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>✨ AI Fill</>
                  )}
                </button>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#005587] focus:border-[#005587] resize-none"
                placeholder="Describe the assignment or click AI Fill to generate from the title..."
              />
            </div>

            {/* Due Date + Points row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Due Date *</label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (val && !dueDate && val.includes('T')) {
                      val = val.split('T')[0] + 'T23:59';
                    }
                    setDueDate(val);
                  }}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#005587] focus:border-[#005587]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Points</label>
                <input
                  type="number"
                  value={rubric.length > 0 ? getRubricMaxScore(rubric) : maxScore}
                  onChange={(e) => setMaxScore(parseInt(e.target.value) || 100)}
                  disabled={rubric.length > 0}
                  min={1}
                  max={1000}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#005587] focus:border-[#005587] disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>

            {/* AI-generated rubric preview */}
            {rubric.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#005587]">Rubric ({rubric.length} categories)</span>
                  <button
                    type="button"
                    onClick={() => { setRubric([]); setMaxScore(100); }}
                    className="text-[10px] text-red-500 font-medium"
                  >
                    Remove
                  </button>
                </div>
                <div className="space-y-1.5">
                  {rubric.map((cat, i) => (
                    <div key={cat.id || i} className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#005587] bg-[#005587]/10 px-1.5 py-0.5 rounded">
                        {cat.levels?.[0]?.score || 4}
                      </span>
                      <span className="text-xs text-gray-700">{cat.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info note */}
            <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl">
              <span className="text-sm">💡</span>
              <p className="text-xs text-gray-500">
                Type a title and hit <span className="font-medium text-[#005587]">AI Fill</span> to auto-generate instructions, rubric, and due date. You can edit everything before creating.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !courseId || !title.trim() || !dueDate}
                className="flex-1 px-4 py-2.5 bg-[#005587] text-white rounded-xl text-sm font-bold hover:bg-[#004470] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Assignment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </InstructorRoute>
  );
};

export default CreateAssignmentPage;
