'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { RubricCategory, getRubricMaxScore, generateCategoryId } from '@/types/rubric';
import { ProblemBankBuilder } from '@/components/instructor/ProblemBankBuilder';

interface CourseOption {
  courseId: string;
  title: string;
  courseName?: string;
  gradeLevel?: string;
}

type AssignmentType = 'video' | 'discussion' | 'assessment' | 'group-project' | 'study-module';

interface TypeInfo {
  id: AssignmentType;
  label: string;
  icon: string;
  tooltip: string;
  description: string;
  instructionsPlaceholder: string;
}

const ASSIGNMENT_TYPES: TypeInfo[] = [
  {
    id: 'video',
    label: 'Video',
    icon: '🎥',
    tooltip: 'Students record themselves on camera explaining, presenting, or demonstrating something.',
    description: 'Students record a video response to your prompt. They can record live (anti-cheat enforced) or upload a file. Peers watch and respond.',
    instructionsPlaceholder: 'What should students explain or present on camera? e.g., "Record a 2-3 minute video explaining..."',
  },
  {
    id: 'discussion',
    label: 'Discussion',
    icon: '💬',
    tooltip: 'An online discussion board where students post written or video responses and reply to peers.',
    description: 'Students respond to a prompt in writing or video, then engage with classmates. Great for Socratic seminars and opinion-based topics.',
    instructionsPlaceholder: 'What question or topic should students discuss? e.g., "Do you agree or disagree that..."',
  },
  {
    id: 'assessment',
    label: 'Assessment',
    icon: '📋',
    tooltip: 'A timed on-camera exam. Questions appear one at a time. Full upper body must be visible. Exits abort the recording.',
    description: 'Timed video exam — questions appear on screen, students answer on camera within a time limit. Full-screen, anti-cheat enforced.',
    instructionsPlaceholder: 'Directions for students before the assessment begins. e.g., "You will have 60 seconds per question..."',
  },
  {
    id: 'group-project',
    label: 'Group Project',
    icon: '🎬',
    tooltip: 'Students form groups and collaborate to produce a series of short videos on a topic.',
    description: 'Small groups collaborate to create videos together. You set the topic, group size, and number of required videos. Grading can be shared or individual.',
    instructionsPlaceholder: 'Describe the project topic and what each group should produce. e.g., "Create a 3-part video series about..."',
  },
  {
    id: 'study-module',
    label: 'Study Module',
    icon: '📖',
    tooltip: 'A self-paced learning module with instructor videos, readings, and quizzes students complete at their own pace.',
    description: 'Self-paced lesson with your instructional content, embedded quizzes, and progress tracking. Students earn completion-based grades.',
    instructionsPlaceholder: 'Overview of what students will learn in this module. e.g., "In this module you will learn about..."',
  },
];

const DEFAULT_RUBRIC: RubricCategory[] = [
  { id: 'cat_content', name: 'Content & Understanding', levels: [{ score: 4, description: 'Excellent' }, { score: 3, description: 'Good' }, { score: 2, description: 'Developing' }, { score: 1, description: 'Beginning' }] },
  { id: 'cat_delivery', name: 'Delivery & Communication', levels: [{ score: 4, description: 'Clear, confident' }, { score: 3, description: 'Mostly clear' }, { score: 2, description: 'Somewhat unclear' }, { score: 1, description: 'Difficult to follow' }] },
  { id: 'cat_effort', name: 'Effort & Completeness', levels: [{ score: 4, description: 'Exceeds expectations' }, { score: 3, description: 'Meets requirements' }, { score: 2, description: 'Missing some parts' }, { score: 1, description: 'Incomplete' }] },
];

const CreateAssignmentPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hoveredType, setHoveredType] = useState<AssignmentType | null>(null);

  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignmentType, setAssignmentType] = useState<AssignmentType>('video');
  const [dueDate, setDueDate] = useState('');
  const [rubric, setRubric] = useState<RubricCategory[]>(DEFAULT_RUBRIC);
  const [showRubricDetails, setShowRubricDetails] = useState(false);
  const [peerResponsesEnabled, setPeerResponsesEnabled] = useState(true);
  const [responsesRequired, setResponsesRequired] = useState(2);
  const [responseDueDays, setResponseDueDays] = useState(3);

  // Auto-add/remove "Peer Response Quality" rubric category when peer responses toggle changes
  const PEER_RUBRIC_ID = 'cat_peer_response';
  useEffect(() => {
    if (peerResponsesEnabled) {
      // Add peer response category if not already present
      setRubric(prev => {
        if (prev.some(c => c.id === PEER_RUBRIC_ID)) return prev;
        return [...prev, {
          id: PEER_RUBRIC_ID,
          name: 'Peer Response Quality',
          levels: [
            { score: 4, description: 'Thoughtful, specific, constructive feedback' },
            { score: 3, description: 'Adequate engagement with peer\'s work' },
            { score: 2, description: 'Surface-level or generic response' },
            { score: 1, description: 'Minimal effort or off-topic' },
          ]
        }];
      });
    } else {
      // Remove peer response category
      setRubric(prev => prev.filter(c => c.id !== PEER_RUBRIC_ID));
    }
  }, [peerResponsesEnabled]);
  const [visibility, setVisibility] = useState<'section' | 'all'>('section');
  const [videoVisibility, setVideoVisibility] = useState<'after-submit' | 'immediately'>('after-submit');

  // Type-specific fields
  const [groupSize, setGroupSize] = useState(3);
  const [videosRequired, setVideosRequired] = useState(2);
  const [timePerQuestion, setTimePerQuestion] = useState(60);
  const [questionCount, setQuestionCount] = useState(5);

  // Individual questions
  const [individualQuestionsEnabled, setIndividualQuestionsEnabled] = useState(false);
  const [showQuestionBuilder, setShowQuestionBuilder] = useState(false);
  const [linkedBankId, setLinkedBankId] = useState<string | null>(null);
  const [linkedBankTitle, setLinkedBankTitle] = useState<string | null>(null);
  const [existingBanks, setExistingBanks] = useState<Array<{bankId: string; title: string; problemCount: number}>>([]);
  const [showExistingBanks, setShowExistingBanks] = useState(false);
  const [loadingBanks, setLoadingBanks] = useState(false);

  const selectedTypeInfo = ASSIGNMENT_TYPES.find(t => t.id === assignmentType)!;

  const fetchExistingBanks = async () => {
    if (!user?.id) return;
    setLoadingBanks(true);
    try {
      const res = await fetch(`/api/problem-banks?instructorId=${user.id}`);
      const data = await res.json();
      if (data.success) setExistingBanks(data.data.banks || []);
    } catch (err) { console.error('Failed to fetch banks:', err); }
    finally { setLoadingBanks(false); }
  };

  useEffect(() => { if (user?.id) fetchCourses(); }, [user?.id]);

  const fetchCourses = async () => {
    setLoadingCourses(true);
    try {
      const res = await fetch(`/api/instructor/courses?instructorId=${user?.id}`);
      const data = await res.json();
      if (data.success && data.data?.courses?.length > 0) {
        setCourses(data.data.courses);
        setCourseId(data.data.courses[0].courseId);
      }
    } catch (err) { console.error('Failed to fetch courses:', err); }
    finally { setLoadingCourses(false); }
  };

  const handleAIFill = async () => {
    if (!title.trim()) { setError('Enter a title first.'); return; }
    setIsGenerating(true); setError(null);
    try {
      const res = await fetch('/api/ai/generate-assignment', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: title, gradeLevel: courses.find(c => c.courseId === courseId)?.gradeLevel || '9-12', assignmentType, additionalContext: description || undefined }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const gen = data.data;
        if (gen.description) setDescription(gen.description);
        if (gen.rubric?.length > 0) setRubric(gen.rubric);
        if (gen.suggestedDueInDays && !dueDate) {
          const due = new Date(); due.setDate(due.getDate() + gen.suggestedDueInDays);
          setDueDate(`${due.getFullYear()}-${String(due.getMonth()+1).padStart(2,'0')}-${String(due.getDate()).padStart(2,'0')}T23:59`);
        }
      } else { setError(data.error?.includes('credentials') ? 'AI feature is temporarily unavailable. You can fill in the fields manually.' : (data.error || 'AI generation failed.')); }
    } catch { setError('Network error. Try again.'); }
    finally { setIsGenerating(false); }
  };

  const getResponseDueDate = () => {
    if (!dueDate) return '';
    const d = new Date(dueDate); d.setDate(d.getDate() + responseDueDays);
    return d.toISOString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !title.trim() || !dueDate) { setError('Please fill in title, due date, and select a course.'); return; }
    setIsSubmitting(true); setError(null);
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, description, courseId,
          assignmentType: assignmentType === 'group-project' ? 'module' : assignmentType === 'study-module' ? 'study-module' : assignmentType,
          dueDate,
          maxScore: getRubricMaxScore(rubric),
          rubric: rubric.length > 0 ? rubric : null,
          instructorId: user?.id,
          status: 'published',
          enablePeerResponses: peerResponsesEnabled,
          minResponsesRequired: peerResponsesEnabled ? responsesRequired : 0,
          maxResponsesPerVideo: 5,
          responseDueDate: peerResponsesEnabled ? getResponseDueDate() : undefined,
          peerReviewScope: visibility,
          hidePeerVideosUntilSubmitted: videoVisibility === 'after-submit',
          ...(assignmentType === 'group-project' && { groupSize, videosRequired }),
          ...(assignmentType === 'assessment' && { timePerQuestion, questionCount }),
          ...(linkedBankId && { problemBankId: linkedBankId }),
        }),
      });
      const data = await res.json();
      if (data.success) { setShowSuccess(true); setTimeout(() => router.push('/instructor/dashboard'), 3000); }
      else { setError(data.error || 'Failed to create assignment'); }
    } catch { setError('Network error.'); }
    finally { setIsSubmitting(false); }
  };

  const handleRemoveRubricCategory = (id: string) => setRubric(prev => prev.filter(c => c.id !== id));
  const handleAddRubricCategory = () => setRubric(prev => [...prev, { id: generateCategoryId(), name: '', levels: [{ score: 4, description: 'Excellent' }, { score: 3, description: 'Good' }, { score: 2, description: 'Developing' }, { score: 1, description: 'Beginning' }] }]);
  const handleRubricNameChange = (id: string, name: string) => setRubric(prev => prev.map(c => c.id === id ? { ...c, name } : c));

  return (
    <InstructorRoute>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
        <div className="bg-white w-full max-w-[480px] rounded-2xl p-5 max-h-[92vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-[#005587]">Create Assignment</h2>
            <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
          )}

          {showSuccess ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Assignment Created!</h3>
              <p className="text-xs text-gray-500">It may take a moment to appear in your dashboard.</p>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Course */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Course</label>
              {loadingCourses ? (
                <div className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-400">Loading...</div>
              ) : (
                <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#005587] focus:border-[#005587]">
                  <option value="">Select a course</option>
                  {courses.map((c) => <option key={c.courseId} value={c.courseId}>{c.title || c.courseName}</option>)}
                </select>
              )}
            </div>

            {/* Assignment Type with tooltips */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Type</label>
              <div className="flex gap-1.5 flex-wrap">
                {ASSIGNMENT_TYPES.map((t) => (
                  <div key={t.id} className="relative">
                    <button
                      type="button"
                      onClick={() => setAssignmentType(t.id)}
                      onMouseEnter={() => setHoveredType(t.id)}
                      onMouseLeave={() => setHoveredType(null)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        assignmentType === t.id ? 'bg-[#005587] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <span>{t.icon}</span>
                      <span>{t.label}</span>
                    </button>
                    {/* Tooltip on hover */}
                    {hoveredType === t.id && (
                      <div className="absolute left-0 top-full mt-1 z-50 w-56 p-2.5 bg-gray-900 text-white text-[10px] rounded-lg shadow-lg leading-relaxed pointer-events-none">
                        {t.tooltip}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {/* Selected type description */}
              <p className="mt-2 text-[11px] text-gray-500 leading-relaxed bg-[#005587]/5 rounded-lg px-3 py-2">
                {selectedTypeInfo.description}
              </p>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#005587] focus:border-[#005587]"
                placeholder="e.g., Persuasive Speech Video" />
            </div>

            {/* Instructions with AI button */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-600">
                  {assignmentType === 'discussion' ? 'Discussion Prompt' : assignmentType === 'assessment' ? 'Exam Directions' : 'Instructions'}
                </label>
                <button type="button" onClick={handleAIFill} disabled={isGenerating || !title.trim()}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-[#005587] bg-[#005587]/8 border border-[#005587]/20 rounded-lg hover:bg-[#005587]/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  {isGenerating ? (<><svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Generating...</>) : (<>✨ AI Fill</>)}
                </button>
              </div>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#005587] focus:border-[#005587] resize-none"
                placeholder={selectedTypeInfo.instructionsPlaceholder} />
            </div>

            {/* Type-specific settings */}
            {assignmentType === 'assessment' && (
              <div className="bg-amber-50 rounded-xl p-3">
                <span className="block text-xs font-bold text-amber-800 mb-2">📋 Assessment Settings</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-amber-700 mb-0.5">Questions</label>
                    <input type="number" value={questionCount} onChange={(e) => setQuestionCount(parseInt(e.target.value) || 5)} min={1} max={50}
                      className="w-full px-2 py-1.5 border border-amber-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-amber-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-amber-700 mb-0.5">Seconds per question</label>
                    <select value={timePerQuestion} onChange={(e) => setTimePerQuestion(parseInt(e.target.value))}
                      className="w-full px-2 py-1.5 border border-amber-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-amber-500">
                      <option value={30}>30s</option>
                      <option value={45}>45s</option>
                      <option value={60}>60s</option>
                      <option value={90}>90s</option>
                      <option value={120}>2 min</option>
                      <option value={180}>3 min</option>
                    </select>
                  </div>
                </div>
                <p className="text-[9px] text-amber-600 mt-2">Students must stay on screen. Leaving aborts the recording.</p>
              </div>
            )}

            {assignmentType === 'group-project' && (
              <div className="bg-purple-50 rounded-xl p-3">
                <span className="block text-xs font-bold text-purple-800 mb-2">🎬 Group Settings</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-purple-700 mb-0.5">Students per group</label>
                    <input type="number" value={groupSize} onChange={(e) => setGroupSize(parseInt(e.target.value) || 3)} min={2} max={8}
                      className="w-full px-2 py-1.5 border border-purple-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-purple-700 mb-0.5">Videos required</label>
                    <input type="number" value={videosRequired} onChange={(e) => setVideosRequired(parseInt(e.target.value) || 2)} min={1} max={10}
                      className="w-full px-2 py-1.5 border border-purple-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-purple-500" />
                  </div>
                </div>
                <p className="text-[9px] text-purple-600 mt-2">Groups can be formed randomly, by teacher, or student-selected.</p>
              </div>
            )}

            {assignmentType === 'study-module' && (
              <div className="bg-emerald-50 rounded-xl p-3">
                <span className="block text-xs font-bold text-emerald-800 mb-2">📖 Module Info</span>
                <p className="text-[10px] text-emerald-700 leading-relaxed">
                  After creating, you'll be able to add lessons, embed videos, and insert checkpoint quizzes. Students progress at their own pace and earn a completion grade.
                </p>
              </div>
            )}

            {assignmentType === 'discussion' && (
              <div className="bg-blue-50 rounded-xl p-3">
                <span className="block text-xs font-bold text-blue-800 mb-2">💬 Discussion Settings</span>
                <p className="text-[10px] text-blue-700 leading-relaxed">
                  Students will post their initial response, then respond to classmates. You can require a minimum number of replies and word count in the peer responses section below.
                </p>
              </div>
            )}

            {/* Due Date + Points */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Due Date *</label>
                <input type="datetime-local" value={dueDate} onChange={(e) => {
                  let val = e.target.value;
                  if (val && !dueDate && val.includes('T')) val = val.split('T')[0] + 'T23:59';
                  setDueDate(val);
                }} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#005587] focus:border-[#005587]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Points ({getRubricMaxScore(rubric)})</label>
                <div className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-600">{getRubricMaxScore(rubric)} from rubric</div>
              </div>
            </div>

            {/* Rubric */}
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#005587]">Rubric ({rubric.length} categories, {getRubricMaxScore(rubric)} pts)</span>
                <button type="button" onClick={() => setShowRubricDetails(!showRubricDetails)} className="text-[10px] text-[#005587] font-medium">
                  {showRubricDetails ? 'Collapse' : 'Edit'}
                </button>
              </div>
              {!showRubricDetails ? (
                <div className="flex flex-wrap gap-1.5">
                  {rubric.map((cat) => <span key={cat.id} className="px-2 py-0.5 bg-white border border-gray-200 rounded-md text-[10px] text-gray-700">{cat.name || 'Untitled'}</span>)}
                </div>
              ) : (
                <div className="space-y-2">
                  {rubric.map((cat) => (
                    <div key={cat.id} className="flex items-center gap-2">
                      <input type="text" value={cat.name} onChange={(e) => handleRubricNameChange(cat.id, e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-[#005587]" placeholder="Category name" />
                      <span className="text-[10px] text-gray-400">{cat.levels[0]?.score} pts</span>
                      <button type="button" onClick={() => handleRemoveRubricCategory(cat.id)} className="text-gray-300 hover:text-red-500 p-0.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={handleAddRubricCategory} className="text-[10px] text-[#005587] font-medium">+ Add category</button>
                </div>
              )}
            </div>

            {/* Peer Responses */}
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#005587]">Peer Responses</span>
                <button type="button" onClick={() => setPeerResponsesEnabled(!peerResponsesEnabled)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${peerResponsesEnabled ? 'bg-[#005587]' : 'bg-gray-300'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${peerResponsesEnabled ? 'left-[18px]' : 'left-0.5'}`} />
                </button>
              </div>
              {peerResponsesEnabled && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">Required responses</label>
                    <select value={responsesRequired} onChange={(e) => setResponsesRequired(parseInt(e.target.value))} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#005587]">
                      <option value={1}>1</option><option value={2}>2</option><option value={3}>3</option><option value={4}>4</option><option value={5}>5</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">Due after assignment</label>
                    <select value={responseDueDays} onChange={(e) => setResponseDueDays(parseInt(e.target.value))} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#005587]">
                      <option value={1}>+1 day</option><option value={2}>+2 days</option><option value={3}>+3 days</option><option value={5}>+5 days</option><option value={7}>+7 days</option>
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
                  <select value={visibility} onChange={(e) => setVisibility(e.target.value as 'section' | 'all')} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#005587]">
                    <option value="section">Their section only</option><option value="all">All sections</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-0.5">When visible</label>
                  <select value={videoVisibility} onChange={(e) => setVideoVisibility(e.target.value as 'after-submit' | 'immediately')} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#005587]">
                    <option value="after-submit">After they submit</option><option value="immediately">Immediately</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Individual Questions */}
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <span className="text-xs font-bold text-[#005587]">Individual Questions</span>
                  <p className="text-[9px] text-gray-500">Each student gets a unique problem from a question bank</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIndividualQuestionsEnabled(!individualQuestionsEnabled)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${individualQuestionsEnabled ? 'bg-[#005587]' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${individualQuestionsEnabled ? 'left-[18px]' : 'left-0.5'}`} />
                </button>
              </div>

              {individualQuestionsEnabled && (
                <div className="mt-3 space-y-2">
                  {linkedBankId ? (
                    <div className="flex items-center justify-between bg-white rounded-lg p-2.5 border border-green-200">
                      <div>
                        <p className="text-xs font-medium text-green-700">✓ {linkedBankTitle}</p>
                        <p className="text-[9px] text-gray-500">Each student gets a unique question</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setLinkedBankId(null); setLinkedBankTitle(null); }}
                        className="text-[10px] text-red-500 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ) : showQuestionBuilder ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-3">
                      <ProblemBankBuilder
                        courseId={courseId}
                        onSave={async (bankData) => {
                          try {
                            const res = await fetch('/api/problem-banks', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ ...bankData, instructorId: user?.id, courseId }),
                            });
                            const data = await res.json();
                            if (data.success && data.data?.bank) {
                              setLinkedBankId(data.data.bank.bankId);
                              setLinkedBankTitle(data.data.bank.title);
                              setShowQuestionBuilder(false);
                            }
                          } catch (err) {
                            console.error('Failed to create bank:', err);
                          }
                        }}
                        onCancel={() => setShowQuestionBuilder(false)}
                      />
                    </div>
                  ) : showExistingBanks ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-gray-600">Select a question bank</span>
                        <button type="button" onClick={() => setShowExistingBanks(false)} className="text-[10px] text-gray-400">Cancel</button>
                      </div>
                      {loadingBanks ? (
                        <p className="text-[10px] text-gray-400 text-center py-3">Loading...</p>
                      ) : existingBanks.length === 0 ? (
                        <p className="text-[10px] text-gray-400 text-center py-3">No question banks yet. Create one first.</p>
                      ) : (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {existingBanks.map(bank => (
                            <button
                              key={bank.bankId}
                              type="button"
                              onClick={() => { setLinkedBankId(bank.bankId); setLinkedBankTitle(bank.title); setShowExistingBanks(false); }}
                              className="w-full text-left p-2.5 bg-white border border-gray-200 rounded-lg hover:border-[#005587] transition-colors"
                            >
                              <p className="text-xs font-medium text-gray-800">{bank.title}</p>
                              <p className="text-[9px] text-gray-500">{bank.problemCount} question{bank.problemCount !== 1 ? 's' : ''}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setShowQuestionBuilder(true)}
                        className="w-full py-2.5 border-2 border-dashed border-[#005587]/30 rounded-lg text-xs font-medium text-[#005587] hover:border-[#005587] hover:bg-[#005587]/5 transition-colors"
                      >
                        + Create New Questions
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowExistingBanks(true); fetchExistingBanks(); }}
                        className="w-full py-2.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        📋 Use Existing Question Bank
                      </button>
                      <p className="text-[9px] text-gray-400 text-center">
                        Paste text, upload images, take photos, or import a spreadsheet
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => router.back()} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
              <button type="submit" disabled={isSubmitting || !courseId || !title.trim() || !dueDate}
                className="flex-1 px-4 py-2.5 bg-[#005587] text-white rounded-xl text-sm font-bold hover:bg-[#004470] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmitting ? 'Creating...' : 'Create Assignment'}
              </button>
            </div>
          </form>
          )}
        </div>
      </div>
    </InstructorRoute>
  );
};

export default CreateAssignmentPage;
