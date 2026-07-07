'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { RubricBuilder } from '@/components/instructor/RubricBuilder';
import { RubricCategory } from '@/types/rubric';
import { DiscussionSetupWizard } from '@/components/instructor/wizards/DiscussionSetupWizard';
import { AssessmentSetupWizard } from '@/components/instructor/wizards/AssessmentSetupWizard';
import { ModuleSetupWizard } from '@/components/instructor/wizards/ModuleSetupWizard';
import { ProblemBankBuilder } from '@/components/instructor/ProblemBankBuilder';
import { ProblemBank } from '@/types/problemBank';
import { DiscussionConfig } from '@/types/discussion';
import { AssessmentQuestion } from '@/types/assessment';
import { ModuleConfig } from '@/types/module';

interface CourseOption {
  id: string;
  courseId: string;
  title: string;
  courseName: string;
}

interface AssignmentFormData {
  courseId: string;
  title: string;
  description: string;
  assignmentType: 'video' | 'discussion' | 'assessment' | 'group-project' | 'study-module';
  dueDate: string;
  maxScore: number;
  rubric: RubricCategory[];
  instructionalVideoUrl: string;
  discussionConfig?: DiscussionConfig;
  assessmentQuestions?: AssessmentQuestion[];
  moduleConfig?: ModuleConfig;
  problemBankId?: string;
  problemBankTitle?: string;
}

const STEPS = [
  { number: 1, label: 'Course Selection' },
  { number: 2, label: 'Assignment Details' },
  { number: 3, label: 'Rubric Builder' },
  { number: 4, label: 'Problem Bank' },
  { number: 5, label: 'Review & Save' },
];

const CreateAssignmentPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [problemBanks, setProblemBanks] = useState<ProblemBank[]>([]);
  const [showBankBuilder, setShowBankBuilder] = useState(false);

  const [formData, setFormData] = useState<AssignmentFormData>({
    courseId: '',
    title: '',
    description: '',
    assignmentType: 'video',
    dueDate: '',
    maxScore: 100,
    rubric: [],
    instructionalVideoUrl: '',
  });

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
      if (data.success && data.data?.courses) {
        setCourses(data.data.courses);
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return formData.courseId !== '';
      case 2:
        return formData.title.trim() !== '' && formData.dueDate !== '';
      case 3:
        return true; // Rubric is optional
      case 4:
        return true; // Problem bank is optional
      case 5:
        return true;
      default:
        return false;
    }
  };

  // Fetch problem banks when reaching step 4
  const fetchProblemBanks = async () => {
    try {
      const res = await fetch(`/api/problem-banks?instructorId=${user?.id}`);
      const data = await res.json();
      if (data.success) {
        setProblemBanks(data.data.banks || []);
      }
    } catch (err) {
      console.error('Failed to fetch problem banks:', err);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          courseId: formData.courseId,
          assignmentType: formData.assignmentType === 'group-project' ? 'module' : formData.assignmentType === 'study-module' ? 'study-module' : formData.assignmentType,
          dueDate: formData.dueDate,
          maxScore: formData.maxScore,
          rubric: formData.rubric.length > 0 ? formData.rubric : null,
          instructionalVideoUrl: formData.instructionalVideoUrl || '',
          instructorId: user?.id,
          status: 'published',
          discussionConfig: formData.discussionConfig || undefined,
          assessmentQuestions: formData.assessmentQuestions || undefined,
          moduleConfig: formData.moduleConfig || undefined,
          problemBankId: formData.problemBankId || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // If a problem bank is linked, trigger distribution
        if (formData.problemBankId && data.data?.assignmentId) {
          try {
            await fetch('/api/problem-assignments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                assignmentId: data.data.assignmentId,
                bankId: formData.problemBankId,
                courseId: formData.courseId,
              }),
            });
          } catch (distErr) {
            console.warn('Problem distribution failed:', distErr);
          }
        }
        setSuccess(true);
        setTimeout(() => {
          router.push('/instructor/dashboard');
        }, 2000);
      } else {
        setError(data.error || 'Failed to create assignment');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderProgressIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((step, index) => (
        <React.Fragment key={step.number}>
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                currentStep >= step.number
                  ? 'bg-[#005587] text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step.number}
            </div>
            <span
              className={`mt-1 text-xs font-medium ${
                currentStep >= step.number ? 'text-[#005587]' : 'text-gray-400'
              }`}
              
            >
              {step.label}
            </span>
          </div>
          {index < STEPS.length - 1 && (
            <div
              className={`w-12 h-0.5 mx-2 mt-[-16px] ${
                currentStep > step.number ? 'bg-[#005587]' : 'bg-gray-200'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <h2
        className="text-lg font-bold text-[#005587]"
      >
        Select a Course
      </h2>
      {loadingCourses ? (
        <div className="text-center py-8 text-gray-500">Loading courses...</div>
      ) : courses.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No courses found. Create a course first.
        </div>
      ) : (
        <select
          value={formData.courseId}
          onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#005587] focus:outline-none focus:ring-1 focus:ring-[#005587]"
        >
          <option value="">-- Select a course --</option>
          {courses.map((course) => (
            <option key={course.courseId} value={course.courseId}>
              {course.title || course.courseName}
            </option>
          ))}
        </select>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-[#005587]">Assignment Details</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Assignment title"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#005587] focus:outline-none focus:ring-1 focus:ring-[#005587]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description / Instructions</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the assignment, include prompts or questions..."
          rows={4}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#005587] focus:outline-none focus:ring-1 focus:ring-[#005587] resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Type</label>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, assignmentType: 'video' })}
            className={`w-full p-3 rounded-xl border text-left transition-colors ${
              formData.assignmentType === 'video'
                ? 'border-[#005587] bg-[#005587]/5'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🎥</span>
              <div>
                <span className="text-sm font-bold text-gray-900">Video</span>
                <p className="text-xs text-gray-500">Students record or upload a video submission</p>
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, assignmentType: 'discussion' })}
            className={`w-full p-3 rounded-xl border text-left transition-colors ${
              formData.assignmentType === 'discussion'
                ? 'border-[#005587] bg-[#005587]/5'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">💬</span>
              <div>
                <span className="text-sm font-bold text-gray-900">Discussion Board</span>
                <p className="text-xs text-gray-500">Students dialog around a topic — whole class or small groups</p>
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, assignmentType: 'assessment' })}
            className={`w-full p-3 rounded-xl border text-left transition-colors ${
              formData.assignmentType === 'assessment'
                ? 'border-[#005587] bg-[#005587]/5'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">📋</span>
              <div>
                <span className="text-sm font-bold text-gray-900">Assessment</span>
                <p className="text-xs text-gray-500">Live recording with timed on-screen questions, full upper body required</p>
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, assignmentType: 'group-project' })}
            className={`w-full p-3 rounded-xl border text-left transition-colors ${
              formData.assignmentType === 'group-project'
                ? 'border-[#005587] bg-[#005587]/5'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🎬</span>
              <div>
                <span className="text-sm font-bold text-gray-900">Group Project</span>
                <p className="text-xs text-gray-500">Student groups collaborate to produce videos on a topic</p>
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, assignmentType: 'study-module' })}
            className={`w-full p-3 rounded-xl border text-left transition-colors ${
              formData.assignmentType === 'study-module'
                ? 'border-[#005587] bg-[#005587]/5'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">📖</span>
              <div>
                <span className="text-sm font-bold text-gray-900">Study Module</span>
                <p className="text-xs text-gray-500">Self-paced lessons with videos, quizzes, and progress tracking</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Discussion Board options */}
      {formData.assignmentType === 'discussion' && (
        <div className="bg-gray-50 rounded-xl p-3">
          <label className="block text-xs font-medium text-gray-600 mb-2">Discussion Format</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, description: formData.description })}
              className="flex-1 px-3 py-2 bg-[#005587] text-white rounded-lg text-xs font-medium"
            >
              Whole Class
            </button>
            <button
              type="button"
              className="flex-1 px-3 py-2 bg-gray-200 text-gray-500 rounded-lg text-xs font-medium"
              disabled
            >
              Small Groups (Coming soon)
            </button>
          </div>
        </div>
      )}

      {/* Assessment info */}
      {formData.assignmentType === 'assessment' && (
        <div className="bg-blue-50 rounded-xl p-3">
          <p className="text-xs text-blue-800">
            <strong>Assessment mode:</strong> Questions appear on screen with a timer. Students must show full upper body and arms in frame. Each question auto-advances when time expires.
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
        <input
          type="datetime-local"
          value={formData.dueDate}
          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#005587] focus:outline-none focus:ring-1 focus:ring-[#005587]"
        />
      </div>

      {/* Instructional Video */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Instructional Video (optional)</label>
        <p className="text-xs text-gray-500 mb-2">Record or paste a link to a video explaining this assignment</p>
        <input
          type="url"
          value={formData.instructionalVideoUrl}
          onChange={(e) => setFormData({ ...formData, instructionalVideoUrl: e.target.value })}
          placeholder="Paste YouTube, Google Drive, or video URL..."
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#005587] focus:outline-none focus:ring-1 focus:ring-[#005587]"
        />
      </div>
    </div>
  );

  const renderStep3 = () => {
    if (formData.assignmentType === 'discussion') {
      return (
        <DiscussionSetupWizard
          onComplete={(config) => {
            setFormData({ ...formData, discussionConfig: config });
            setCurrentStep(5);
          }}
          onBack={() => setCurrentStep(2)}
        />
      );
    }
    if (formData.assignmentType === 'assessment') {
      return (
        <AssessmentSetupWizard
          onComplete={(questions) => {
            setFormData({ ...formData, assessmentQuestions: questions });
            setCurrentStep(5);
          }}
          onBack={() => setCurrentStep(2)}
        />
      );
    }
    if (formData.assignmentType === 'group-project') {
      return (
        <ModuleSetupWizard
          onComplete={(config) => {
            setFormData({ ...formData, moduleConfig: config });
            setCurrentStep(5);
          }}
          onBack={() => setCurrentStep(2)}
        />
      );
    }
    if (formData.assignmentType === 'study-module') {
      return (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#005587]">Study Module Setup</h2>
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              <strong>Study modules</strong> are self-paced learning experiences with videos, quizzes, and progress tracking. 
              The module builder is coming soon — for now, create the assignment and add lesson content later from the course detail page.
            </p>
          </div>
          <div className="flex justify-between pt-2">
            <button onClick={() => setCurrentStep(2)} className="px-4 py-2 text-xs text-gray-600 font-medium">Back</button>
            <button onClick={() => setCurrentStep(4)} className="px-4 py-2 bg-[#005587] text-white rounded-xl text-xs font-medium">Next</button>
          </div>
        </div>
      );
    }
    // Default: Rubric Builder (for video type)
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2
            className="text-lg font-bold text-[#005587]"
          >
            Rubric Builder
          </h2>
          <span className="text-xs text-gray-400 italic">Optional — skip if not needed</span>
        </div>
        <RubricBuilder
          value={formData.rubric}
          onChange={(rubric) => setFormData({ ...formData, rubric })}
        />
      </div>
    );
  };

  const renderStep4 = () => {
    // Problem Bank linking step (optional)
    if (showBankBuilder) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#005587]">Create Problem Bank</h2>
            <button onClick={() => setShowBankBuilder(false)} className="text-sm text-gray-500">Cancel</button>
          </div>
          <ProblemBankBuilder
            courseId={formData.courseId}
            onSave={async (bankData) => {
              // Create the bank, then select it
              try {
                const res = await fetch('/api/problem-banks', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ...bankData, instructorId: user?.id, courseId: formData.courseId }),
                });
                const data = await res.json();
                if (data.success) {
                  setFormData({ ...formData, problemBankId: data.data.bank.bankId, problemBankTitle: data.data.bank.title });
                  setShowBankBuilder(false);
                  fetchProblemBanks();
                }
              } catch (err) {
                console.error('Failed to create bank:', err);
              }
            }}
            onCancel={() => setShowBankBuilder(false)}
          />
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#005587]">Problem Bank</h2>
          <span className="text-xs text-gray-400 italic">Optional — for individualized problems</span>
        </div>

        <p className="text-sm text-gray-600">
          Link a problem bank to assign each student a unique problem from the set.
        </p>

        {/* Current selection */}
        {formData.problemBankId && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">✓ {formData.problemBankTitle}</p>
              <p className="text-xs text-green-600">Problems will be distributed when assignment is created</p>
            </div>
            <button
              onClick={() => setFormData({ ...formData, problemBankId: undefined, problemBankTitle: undefined })}
              className="text-xs text-red-500 font-medium"
            >
              Remove
            </button>
          </div>
        )}

        {!formData.problemBankId && (
          <>
            {/* Bank selector */}
            {problemBanks.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Select existing bank</label>
                <select
                  value=""
                  onChange={(e) => {
                    const bank = problemBanks.find(b => b.bankId === e.target.value);
                    if (bank) {
                      setFormData({ ...formData, problemBankId: bank.bankId, problemBankTitle: bank.title });
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#005587] focus:outline-none"
                >
                  <option value="">-- Select a problem bank --</option>
                  {problemBanks.map(bank => (
                    <option key={bank.bankId} value={bank.bankId}>
                      {bank.title} ({bank.problemCount} problems)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Create new bank button */}
            <button
              onClick={() => { setShowBankBuilder(true); fetchProblemBanks(); }}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:border-[#005587] hover:text-[#005587] transition-colors"
            >
              + Create New Problem Bank
            </button>

            {problemBanks.length === 0 && (
              <button
                onClick={fetchProblemBanks}
                className="text-xs text-[#005587] font-medium"
              >
                Load existing banks
              </button>
            )}
          </>
        )}
      </div>
    );
  };

  const renderStep5 = () => {
    const selectedCourse = courses.find((c) => c.courseId === formData.courseId);

    return (
      <div className="space-y-4">
        <h2
          className="text-lg font-bold text-[#005587]"
          
        >
          Review & Save
        </h2>

        <div className="bg-gray-50 rounded-2xl p-5 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="font-medium text-gray-600">Course:</span>
            <span className="text-gray-900">{selectedCourse?.title || selectedCourse?.courseName || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-600">Title:</span>
            <span className="text-gray-900">{formData.title || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-600">Type:</span>
            <span className="text-gray-900 capitalize">{formData.assignmentType === 'group-project' ? 'Group Project' : formData.assignmentType === 'study-module' ? 'Study Module' : formData.assignmentType}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-600">Due Date:</span>
            <span className="text-gray-900">
              {formData.dueDate ? new Date(formData.dueDate).toLocaleString() : '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-600">Max Points:</span>
            <span className="text-gray-900">{formData.maxScore}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-600">Rubric:</span>
            <span className="text-gray-900">
              {formData.rubric.length > 0
                ? `${formData.rubric.length} categor${formData.rubric.length === 1 ? 'y' : 'ies'}`
                : 'None'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-600">Problem Bank:</span>
            <span className="text-gray-900">{formData.problemBankTitle || 'None'}</span>
          </div>
          {formData.assignmentType === 'discussion' && formData.discussionConfig && (
            <div className="pt-2 border-t border-gray-200 space-y-1">
              <span className="font-medium text-gray-600 block mb-1">Discussion Config:</span>
              <p className="text-gray-700 text-xs">Format: {formData.discussionConfig.format === 'whole-class' ? 'Whole Class' : `Small Groups (${formData.discussionConfig.groupSize})`}</p>
              <p className="text-gray-700 text-xs">Min Posts: {formData.discussionConfig.minPosts} | Min Words: {formData.discussionConfig.minWordCount}</p>
              <p className="text-gray-700 text-xs">Response: {formData.discussionConfig.allowedResponseTypes}</p>
            </div>
          )}
          {formData.assignmentType === 'assessment' && formData.assessmentQuestions && (
            <div className="pt-2 border-t border-gray-200 space-y-1">
              <span className="font-medium text-gray-600 block mb-1">Assessment:</span>
              <p className="text-gray-700 text-xs">{formData.assessmentQuestions.length} question{formData.assessmentQuestions.length !== 1 ? 's' : ''} | Total: {Math.floor(formData.assessmentQuestions.reduce((s, q) => s + q.timeLimitSeconds, 0) / 60)}m</p>
            </div>
          )}
          {formData.assignmentType === 'group-project' && formData.moduleConfig && (
            <div className="pt-2 border-t border-gray-200 space-y-1">
              <span className="font-medium text-gray-600 block mb-1">Group Project:</span>
              <p className="text-gray-700 text-xs">Topic: {formData.moduleConfig.topic}</p>
              <p className="text-gray-700 text-xs">{formData.moduleConfig.requiredVideos} videos | Groups of {formData.moduleConfig.groupSize} ({formData.moduleConfig.groupFormation})</p>
              <p className="text-gray-700 text-xs">Grading: {formData.moduleConfig.gradingPolicy}</p>
            </div>
          )}
          {formData.description && (
            <div className="pt-2 border-t border-gray-200">
              <span className="font-medium text-gray-600 block mb-1">Description:</span>
              <p className="text-gray-900 whitespace-pre-wrap">{formData.description}</p>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm p-3 rounded-xl">{error}</div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 text-sm p-3 rounded-xl">
            Assignment created successfully! Redirecting to dashboard...
          </div>
        )}
      </div>
    );
  };

  return (
    <InstructorRoute>
      <link
        href="https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <div className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1
              className="text-2xl font-bold text-[#005587]"
              
            >
              Create Assignment
            </h1>
            <button
              onClick={() => router.back()}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>

          {/* Progress Indicator */}
          {renderProgressIndicator()}

          {/* Step Content */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
            {currentStep === 5 && renderStep5()}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Back
            </button>

            {currentStep < 5 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-5 py-2.5 text-sm font-bold text-white bg-[#005587] rounded-xl hover:bg-[#004470] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || success}
                className="px-5 py-2.5 text-sm font-bold text-[#005587] bg-[#FFC72C] rounded-xl hover:bg-[#e6b225] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating...
                  </>
                ) : (
                  'Create Assignment'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </InstructorRoute>
  );
};

export default CreateAssignmentPage;
