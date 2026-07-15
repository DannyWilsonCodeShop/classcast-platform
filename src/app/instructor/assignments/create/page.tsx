'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { RubricCategory, getRubricMaxScore, generateCategoryId } from '@/types/rubric';

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

const DEFAULT_RUBRIC: RubricCategory[] = [
  {
    id: 'cat_content',
    name: 'Content & Understanding',
    levels: [
      { score: 4, description: 'Excellent — thorough, accurate, insightful' },
      { score: 3, description: 'Good — solid understanding shown' },
      { score: 2, description: 'Developing — partially addresses the topic' },
      { score: 1, description: 'Beginning — minimal understanding shown' },
    ]
  },
  {
    id: 'cat_delivery',
    name: 'Delivery & Communication',
    levels: [
      { score: 4, description: 'Clear, confident, well-organized' },
      { score: 3, description: 'Mostly clear with minor issues' },
      { score: 2, description: 'Somewhat unclear or disorganized' },
      { score: 1, description: 'Difficult to follow' },
    ]
  },
  {
    id: 'cat_effort',
    name: 'Effort & Completeness',
    levels: [
      { score: 4, description: 'Exceeds expectations, polished work' },
      { score: 3, description: 'Meets all requirements' },
      { score: 2, description: 'Missing some requirements' },
      { score: 1, description: 'Incomplete or minimal effort' },
    ]
  },
];

const CreateAssignmentPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Core fields
  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignmentType, setAssignmentType] = useState<AssignmentType>('video');
  const [dueDate, setDueDate] = useState('');

  // Rubric (default ON)
  const [rubric, setRubric] = useState<RubricCategory[]>(DEFAULT_RUBRIC);
  const [showRubricDetails, setShowRubricDetails] = useState(false);

  // Peer Responses (default ON)
  const [peerResponsesEnabled, setPeerResponsesEnabled] = useState(true);
  const [responsesRequired, setResponsesRequired] = useState(2);
  const [responseDueDays, setResponseDueDays] = useState(3);

  // Visibility settings
  const [visibility, setVisibility] = useState<'section' | 'all'>('section');
  const [videoVisibility, setVideoVisibility] = useState<'after-submit' | 'immediately'>('after-submit');

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
        setCourseId(courseList[0].courseId);
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoadingCourses(false);
    }
  };

  // AI fill
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
        }
        if (gen.suggestedDueInDays && !dueDate) {
          const due = new Date();
          due.setDate(due.getDate() + gen.suggestedDueInDays);
          setDueDate(`${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}-${String(due.getDate()).padStart(2, '0')}T23:59`);
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

  // Calculate response due date from assignment due date
  const getResponseDueDate = () => {
    if (!dueDate) return '';
    const due = new Date(dueDate);
    due.setDate(due.getDate() + responseDueDays);
    return due.toISOString();
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
          maxScore: getRubricMaxScore(rubric),
          rubric: rubric.length > 0 ? rubric : null,
          instructorId: user?.id,
          status: 'published',
          // Peer response settings
          enablePeerResponses: peerResponsesEnabled,
          minResponsesRequired: peerResponsesEnabled ? responsesRequired : 0,
          maxResponsesPerVideo: 5,
          responseDueDate: peerResponsesEnabled ? getResponseDueDate() : undefined,
          // Visibility settings
          peerReviewScope: visibility,
          hidePeerVideosUntilSubmitted: videoVisibility === 'after-submit',
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

  const handleRemoveRubricCategory = (id: string) => {
    setRubric(prev => prev.filter(c => c.id !== id));
  };

  const handleAddRubricCategory = () => {
    setRubric(prev => [...prev, {
      id: generateCategoryId(),
      name: '',
      levels: [
        { score: 4, description: 'Excellent' },
        { score: 3, description: 'Good' },
        { score: 2, description: 'Developing' },
        { score: 1, description: 'Beginning' },
      ]
    }]);
  };

  const handleRubricNameChange = (id: string, name: string) => {
    setRubric(prev => prev.map(c => c.id === id ? { ...c, name } : c));
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
                <label className="text-xs font-medium text-gray-600">Instructions</label>
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
                placeholder="Describe the assignment or click AI Fill..."
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
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Points <span className="text-gray-400 font-normal">({getRubricMaxScore(rubric)})</span>
                </label>
                <div className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-600">
                  {getRubricMaxScore(rubric)} from rubric
                </div>
              </div>
            </div>

            {/* Rubric */}
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#005587]">Rubric ({rubric.length} categories, {getRubricMaxScore(rubric)} pts)</span>
                <button
                  type="button"
                  onClick={() => setShowRubricDetails(!showRubricDetails)}
                  className="text-[10px] text-[#005587] font-medium"
                >
                  {showRubricDetails ? 'Collapse' : 'Edit'}
                </button>
              </div>

              {!showRubricDetails ? (
                <div className="flex flex-wrap gap-1.5">
                  {rubric.map((cat) => (
                    <span key={cat.id} className="px-2 py-0.5 bg-white border border-gray-200 rounded-md text-[10px] text-gray-700">
                      {cat.name || 'Untitled'}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {rubric.map((cat) => (
                    <div key={cat.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={cat.name}
                        onChange={(e) => handleRubricNameChange(cat.id, e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-[#005587]"
                        placeholder="Category name"
                      />
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">{cat.levels[0]?.score} pts</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRubricCategory(cat.id)}
                        className="text-gray-300 hover:text-red-500 p-0.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddRubricCategory}
                    className="text-[10px] text-[#005587] font-medium"
                  >
                    + Add category
                  </button>
                </div>
              )}
            </div>

            {/* Peer Responses */}
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#005587]">Peer Responses</span>
                <button
                  type="button"
                  onClick={() => setPeerResponsesEnabled(!peerResponsesEnabled)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${peerResponsesEnabled ? 'bg-[#005587]' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${peerResponsesEnabled ? 'left-[18px]' : 'left-0.5'}`} />
                </button>
              </div>

              {peerResponsesEnabled && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">Required responses</label>
                    <select
                      value={responsesRequired}
                      onChange={(e) => setResponsesRequired(parseInt(e.target.value))}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#005587]"
                    >
                      <option value={1}>1 response</option>
                      <option value={2}>2 responses</option>
                      <option value={3}>3 responses</option>
                      <option value={4}>4 responses</option>
                      <option value={5}>5 responses</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">Due after assignment</label>
                    <select
                      value={responseDueDays}
                      onChange={(e) => setResponseDueDays(parseInt(e.target.value))}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#005587]"
                    >
                      <option value={1}>+1 day</option>
                      <option value={2}>+2 days</option>
                      <option value={3}>+3 days</option>
                      <option value={5}>+5 days</option>
                      <option value={7}>+7 days</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Visibility */}
            <div className="bg-gray-50 rounded-xl p-3">
              <span className="block text-xs font-bold text-[#005587] mb-2">Visibility</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-500 mb-0.5">Who sees videos</label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as 'section' | 'all')}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#005587]"
                  >
                    <option value="section">Their section only</option>
                    <option value="all">All sections</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-0.5">When visible</label>
                  <select
                    value={videoVisibility}
                    onChange={(e) => setVideoVisibility(e.target.value as 'after-submit' | 'immediately')}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#005587]"
                  >
                    <option value="after-submit">After they submit</option>
                    <option value="immediately">Immediately</option>
                  </select>
                </div>
              </div>
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
