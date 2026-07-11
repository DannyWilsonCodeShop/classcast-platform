'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { InstructorRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { RubricBuilder } from '@/components/instructor/RubricBuilder';
import { RubricCategory, getRubricMaxScore } from '@/types/rubric';
import { DiscussionSetupWizard } from '@/components/instructor/wizards/DiscussionSetupWizard';
import { AssessmentSetupWizard } from '@/components/instructor/wizards/AssessmentSetupWizard';
import { ModuleSetupWizard } from '@/components/instructor/wizards/ModuleSetupWizard';
import { StudyModuleSetupWizard } from '@/components/instructor/wizards/StudyModuleSetupWizard';
import { AIAssignmentGenerator } from '@/components/instructor/AIAssignmentGenerator';
import { ProblemBankBuilder } from '@/components/instructor/ProblemBankBuilder';
import { ProblemBank } from '@/types/problemBank';
import { DiscussionConfig } from '@/types/discussion';
import { AssessmentQuestion } from '@/types/assessment';
import { ModuleConfig } from '@/types/module';
import { HelpTooltip } from '@/components/common/HelpTooltip';

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
  // Peer Response Settings
  enablePeerResponses?: boolean;
  responseDueDate?: string;
  minResponsesRequired?: number;
  maxResponsesPerVideo?: number;
  responseMinLength?: number;
  responseMaxLength?: number;
  peerResponseRubric?: { name: string; levels: { score: number; description: string }[] }[];
}

const STEPS = [
  { number: 1, label: 'Course' },
  { number: 2, label: 'Type' },
  { number: 3, label: 'Details' },
  { number: 4, label: 'Setup' },
  { number: 5, label: 'Review' },
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

  // Instructor video recording state
  const [showInstructorCamera, setShowInstructorCamera] = useState(false);
  const [instructorRecording, setInstructorRecording] = useState(false);
  const [instructorRecordingTime, setInstructorRecordingTime] = useState(0);
  const [instructionalVideoRecording, setInstructionalVideoRecording] = useState<File | null>(null);
  const [instructionalVideoPreview, setInstructionalVideoPreview] = useState('');
  const instructorVideoRef = useRef<HTMLVideoElement>(null);
  const instructorStreamRef = useRef<MediaStream | null>(null);
  const instructorRecorderRef = useRef<MediaRecorder | null>(null);
  const instructorChunksRef = useRef<Blob[]>([]);
  const instructorTimerRef = useRef<NodeJS.Timeout | null>(null);

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
        return formData.assignmentType !== '' as any;
      case 3:
        return formData.title.trim() !== '' && formData.dueDate !== '';
      case 4:
        return true; // Setup is optional
      case 5:
        return true;
      default:
        return false;
    }
  };

  // Fetch question banks when reaching step 4
  const fetchProblemBanks = async () => {
    try {
      const res = await fetch(`/api/problem-banks?instructorId=${user?.id}`);
      const data = await res.json();
      if (data.success) {
        setProblemBanks(data.data.banks || []);
      }
    } catch (err) {
      console.error('Failed to fetch question banks:', err);
    }
  };

  // Instructor camera functions
  const openInstructorCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      instructorStreamRef.current = stream;
      setShowInstructorCamera(true);
      setTimeout(() => {
        if (instructorVideoRef.current) instructorVideoRef.current.srcObject = stream;
      }, 100);
    } catch (err) {
      alert('Camera access denied. Please allow camera and microphone access.');
    }
  };

  const startInstructorRecording = () => {
    if (!instructorStreamRef.current) return;
    instructorChunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4';
    const recorder = new MediaRecorder(instructorStreamRef.current, { mimeType });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) instructorChunksRef.current.push(e.data); };
    recorder.onstop = async () => {
      const blob = new Blob(instructorChunksRef.current, { type: mimeType });
      const file = new File([blob], `instructor-video-${Date.now()}.webm`, { type: mimeType });
      setInstructionalVideoRecording(file);
      setInstructionalVideoPreview(URL.createObjectURL(blob));
      setShowInstructorCamera(false);
      instructorStreamRef.current?.getTracks().forEach(t => t.stop());
      instructorStreamRef.current = null;
      // Upload the video and set the URL
      try {
        const presignRes = await fetch('/api/upload/presigned', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, contentType: file.type, folder: 'instructional-videos' }),
        });
        const presignData = await presignRes.json();
        if (presignData.success) {
          await fetch(presignData.data.presignedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
          setFormData(prev => ({ ...prev, instructionalVideoUrl: presignData.data.fileUrl }));
        }
      } catch (uploadErr) {
        console.error('Failed to upload instructional video:', uploadErr);
      }
    };
    instructorRecorderRef.current = recorder;
    recorder.start(1000);
    setInstructorRecording(true);
    setInstructorRecordingTime(0);
    instructorTimerRef.current = setInterval(() => setInstructorRecordingTime(t => t + 1), 1000);
  };

  const stopInstructorRecording = () => {
    if (instructorRecorderRef.current && instructorRecorderRef.current.state !== 'inactive') {
      instructorRecorderRef.current.stop();
    }
    setInstructorRecording(false);
    if (instructorTimerRef.current) { clearInterval(instructorTimerRef.current); instructorTimerRef.current = null; }
  };

  const cancelInstructorCamera = () => {
    instructorStreamRef.current?.getTracks().forEach(t => t.stop());
    instructorStreamRef.current = null;
    setShowInstructorCamera(false);
    setInstructorRecording(false);
    if (instructorTimerRef.current) { clearInterval(instructorTimerRef.current); instructorTimerRef.current = null; }
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
          maxScore: formData.rubric.length > 0 ? getRubricMaxScore(formData.rubric) : formData.maxScore,
          rubric: formData.rubric.length > 0 ? formData.rubric : null,
          instructionalVideoUrl: formData.instructionalVideoUrl || '',
          instructorId: user?.id,
          status: 'published',
          discussionConfig: formData.discussionConfig || undefined,
          assessmentQuestions: formData.assessmentQuestions || undefined,
          moduleConfig: formData.moduleConfig || undefined,
          problemBankId: formData.problemBankId || undefined,
          // Peer Response Settings
          enablePeerResponses: formData.enablePeerResponses || false,
          responseDueDate: formData.responseDueDate || undefined,
          minResponsesRequired: formData.minResponsesRequired || 2,
          maxResponsesPerVideo: formData.maxResponsesPerVideo || 3,
          responseWordLimit: formData.responseMinLength || 25,
          responseCharacterLimit: (formData.responseMaxLength || 200) * 6, // approx chars from words
          peerResponseRubric: formData.peerResponseRubric || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // If a question bank is linked, trigger distribution
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

  const [showAIGenerator, setShowAIGenerator] = useState(false);

  const handleAIGenerated = (data: any) => {
    // Pre-fill the form with AI-generated content
    setFormData(prev => ({
      ...prev,
      title: data.title || prev.title,
      description: data.description || prev.description,
      assignmentType: data.assignmentType || prev.assignmentType,
      maxScore: data.maxScore || prev.maxScore,
      rubric: data.rubric || prev.rubric,
      discussionConfig: data.discussionPrompt ? { ...prev.discussionConfig, prompt: data.discussionPrompt } as any : prev.discussionConfig,
      assessmentQuestions: data.assessmentQuestions || prev.assessmentQuestions,
      moduleConfig: data.groupProjectTopic ? { ...prev.moduleConfig, topic: data.groupProjectTopic } as any : prev.moduleConfig,
    }));

    // If AI generated a question bank, save it
    if (data.questionBank && data.questionBank.questions?.length > 0 && user?.id) {
      fetch('/api/problem-banks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.questionBank.bankTitle || `${data.title || data.topic} - Question Bank`,
          description: data.questionBank.bankDescription || '',
          instructorId: user.id,
          courseId: formData.courseId,
          problems: data.questionBank.questions.map((q: any, i: number) => ({
            problemId: q.id || `q_${i}`,
            questionText: q.question,
            questionType: q.type || 'multiple-choice',
            options: q.options || [],
            correctAnswer: q.correctAnswer || '',
            explanation: q.explanation || '',
            difficulty: q.difficulty || 'medium',
            points: q.points || 1,
          })),
        }),
      }).then(res => res.json()).then(bankData => {
        if (bankData.success && bankData.data?.bank?.bankId) {
          setFormData(prev => ({
            ...prev,
            problemBankId: bankData.data.bank.bankId,
            problemBankTitle: bankData.data.bank.title,
          }));
        }
      }).catch(() => {});
    }

    setShowAIGenerator(false);
    // Skip to step 5 (review) since everything is filled
    setCurrentStep(5);
  };

  const renderStep1 = () => {
    if (showAIGenerator) {
      return (
        <AIAssignmentGenerator
          onGenerated={handleAIGenerated}
          onCancel={() => setShowAIGenerator(false)}
          userSubscription={(user as any)?.isAdmin ? 'admin' : (user?.subscription || user?.subscriptionTier || (user as any)?.subscriptionTier)}
          assignmentType={formData.assignmentType}
        />
      );
    }

    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[#005587]">Select a Course</h2>
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

        {/* AI Generate Option */}
        <div className="pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setShowAIGenerator(true)}
            disabled={!formData.courseId}
            className={`w-full flex items-center gap-3 p-3 bg-gradient-to-r from-[#005587]/5 to-[#FFC72C]/10 border border-[#005587]/20 rounded-xl active:scale-[0.98] transition-transform ${!formData.courseId ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <span className="text-xl">✨</span>
            <div className="text-left">
              <p className="text-xs font-bold text-[#005587]">Generate with AI</p>
              <p className="text-[10px] text-gray-500">{!formData.courseId ? 'Select a course first' : 'Enter a topic and AI creates the full assignment'}</p>
            </div>
          </button>
        </div>
      </div>
    );
  };

  const renderStep2 = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-[#005587]">Assignment Type</h2>
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
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-gray-900">Video</span>
                  <HelpTooltip text="Students record themselves answering a prompt or solving a problem, then upload the video for grading. Live recordings are full-screen and abort if the student leaves the screen (anti-cheat)." />
                </div>
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
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-gray-900">Discussion Board</span>
                  <HelpTooltip text="An online forum where students post responses to a question or topic. They can reply to each other, building a class conversation." />
                </div>
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
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-gray-900">Assessment</span>
                  <HelpTooltip text="A timed video exam. Questions appear on screen one at a time, and the student must answer on camera within the time limit. Full upper body and arms must be visible. Recording is full-screen and is immediately aborted if the student navigates away (anti-cheat)." />
                </div>
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
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-gray-900">Group Project</span>
                  <HelpTooltip text="Students are placed into small groups and work together to create a series of short videos on a topic. Groups can be random, manual, or student-selected. Grading can be shared or individual." />
                </div>
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
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-gray-900">Study Module</span>
                  <HelpTooltip text="A self-paced learning experience you build for students. It can include video lessons, reading material, quizzes, and interactive checkpoints. Students progress through at their own pace and earn a completion grade." />
                </div>
                <p className="text-xs text-gray-500">Self-paced lessons with videos, quizzes, and progress tracking</p>
              </div>
            </div>
          </button>
        </div>
    </div>
  );

  const renderStep3 = () => (
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
          rows={3}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#005587] focus:outline-none focus:ring-1 focus:ring-[#005587] resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
        <input
          type="datetime-local"
          value={formData.dueDate}
          onChange={(e) => {
            let val = e.target.value;
            if (!val) { setFormData({ ...formData, dueDate: '' }); return; }
            // If this is the first time setting a date (was empty), force 11:59 PM
            if (!formData.dueDate && val.includes('T')) {
              val = val.split('T')[0] + 'T23:59';
            }
            setFormData({ ...formData, dueDate: val });
          }}
          className="w-full max-w-full min-w-0 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#005587] focus:outline-none focus:ring-1 focus:ring-[#005587]"
          style={{ boxSizing: 'border-box' }}
        />
      </div>

      {/* Instructional Video */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Instructional Video (optional)</label>
        <p className="text-xs text-gray-500 mb-2">Record live or paste a link to a video explaining this assignment</p>
        
        {/* Show recorded video preview or recording UI */}
        {instructionalVideoRecording ? (
          <div className="relative rounded-xl overflow-hidden bg-black mb-2">
            <video 
              src={instructionalVideoPreview} 
              className="w-full aspect-video object-cover" 
              controls 
              onLoadStart={(e) => { (e.target as HTMLVideoElement).poster = ''; }}
            />
            {!formData.instructionalVideoUrl && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-white text-xs">Processing video...</p>
                </div>
              </div>
            )}
            <button
              onClick={() => { setInstructionalVideoRecording(null); setInstructionalVideoPreview(''); setFormData({ ...formData, instructionalVideoUrl: '' }); }}
              className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
            >
              ✕
            </button>
            {formData.instructionalVideoUrl && (
              <div className="absolute bottom-2 left-2 bg-green-500/90 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                ✓ Uploaded
              </div>
            )}
          </div>
        ) : showInstructorCamera ? (
          <div className="relative rounded-xl overflow-hidden bg-black aspect-video mb-2">
            <video ref={instructorVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
            <div className="absolute bottom-3 inset-x-0 flex justify-center gap-3">
              {instructorRecording ? (
                <button onClick={stopInstructorRecording} className="w-14 h-14 bg-red-600 rounded-full border-4 border-white flex items-center justify-center">
                  <div className="w-5 h-5 bg-white rounded-sm" />
                </button>
              ) : (
                <button onClick={startInstructorRecording} className="w-14 h-14 bg-red-500 rounded-full border-4 border-white flex items-center justify-center">
                  <div className="w-10 h-10 bg-red-500 rounded-full border-2 border-white" />
                </button>
              )}
              <button onClick={cancelInstructorCamera} className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white text-xs">✕</button>
            </div>
            {instructorRecording && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded-full">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-white text-xs font-mono">{Math.floor(instructorRecordingTime / 60)}:{(instructorRecordingTime % 60).toString().padStart(2, '0')}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={openInstructorCamera}
              className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:border-[#005587] hover:text-[#005587] transition-colors"
            >
              🎥 Record
            </button>
            <input
              type="url"
              value={formData.instructionalVideoUrl}
              onChange={(e) => setFormData({ ...formData, instructionalVideoUrl: e.target.value })}
              placeholder="Or paste video URL..."
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#005587] focus:outline-none focus:ring-1 focus:ring-[#005587]"
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => {
    if (formData.assignmentType === 'discussion') {
      return (
        <DiscussionSetupWizard
          onComplete={(config) => {
            setFormData({ ...formData, discussionConfig: config });
            setCurrentStep(5);
          }}
          onBack={() => setCurrentStep(3)}
        />
      );
    }
    if (formData.assignmentType === 'assessment') {
      return (
        <AssessmentSetupWizard
          onComplete={(questions, directions) => {
            // Append assessment directions to existing description if user already wrote something
            const desc = formData.description
              ? `${formData.description}\n\n${directions || ''}`
              : (directions || formData.description);
            setFormData({ ...formData, assessmentQuestions: questions, description: desc });
            setCurrentStep(5);
          }}
          onBack={() => setCurrentStep(3)}
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
          onBack={() => setCurrentStep(3)}
        />
      );
    }
    if (formData.assignmentType === 'study-module') {
      return (
        <StudyModuleSetupWizard
          onComplete={(config) => {
            setFormData({ ...formData, moduleConfig: config as any });
            setCurrentStep(5);
          }}
          onBack={() => setCurrentStep(3)}
        />
      );
    }
    // Default: Rubric Builder + Peer Response Settings (for video type)
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#005587]">Rubric</h2>
          <button
            type="button"
            onClick={() => setCurrentStep(5)}
            className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
          >
            Skip →
          </button>
        </div>
        <RubricBuilder
          value={formData.rubric}
          onChange={(rubric) => setFormData({ ...formData, rubric })}
          autoLoadDefault={formData.rubric.length === 0}
        />

        {/* Peer Video Responses */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[#005587]">Peer Video Responses</h3>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enablePeerResponses || false}
                onChange={(e) => setFormData({ ...formData, enablePeerResponses: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-[#005587] transition-colors">
                <div className={`absolute top-[2px] left-[2px] w-4 h-4 rounded-full bg-white transition-transform ${formData.enablePeerResponses ? 'translate-x-4' : ''}`} />
              </div>
            </label>
          </div>
          <p className="text-[10px] text-gray-500 mb-3">Require students to watch and respond to peers' videos. Responses will be graded.</p>

          {formData.enablePeerResponses && (
            <div className="space-y-3 bg-gray-50 rounded-xl p-3">
              {/* Required responses */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-medium text-gray-600 mb-1">Required Responses</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.minResponsesRequired || 2}
                    onChange={(e) => setFormData({ ...formData, minResponsesRequired: Number(e.target.value) || 2 })}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-[#005587] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-600 mb-1">Max Per Video</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={formData.maxResponsesPerVideo || 3}
                    onChange={(e) => setFormData({ ...formData, maxResponsesPerVideo: Number(e.target.value) || 3 })}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-[#005587] focus:outline-none"
                  />
                </div>
              </div>

              {/* Length limits */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-medium text-gray-600 mb-1">Min Words</label>
                  <input
                    type="number"
                    min={10}
                    max={500}
                    value={formData.responseMinLength || 25}
                    onChange={(e) => setFormData({ ...formData, responseMinLength: Number(e.target.value) || 25 })}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-[#005587] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-600 mb-1">Max Words</label>
                  <input
                    type="number"
                    min={25}
                    max={2000}
                    value={formData.responseMaxLength || 200}
                    onChange={(e) => setFormData({ ...formData, responseMaxLength: Number(e.target.value) || 200 })}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-[#005587] focus:outline-none"
                  />
                </div>
              </div>

              {/* Response Due Date */}
              <div>
                <label className="block text-[10px] font-medium text-gray-600 mb-1">Response Due Date</label>
                <input
                  type="datetime-local"
                  value={formData.responseDueDate || ''}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (val && val.includes('T')) {
                      const timePart = val.split('T')[1];
                      if (timePart === '00:00' || timePart === '00:00:00') {
                        val = val.split('T')[0] + 'T23:59';
                      }
                    }
                    setFormData({ ...formData, responseDueDate: val });
                  }}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-[#005587] focus:outline-none"
                />
                <p className="text-[9px] text-gray-400 mt-0.5">When responses are due (after the video submission deadline)</p>
              </div>

              {/* Response Rubric */}
              <div>
                <label className="block text-[10px] font-medium text-gray-600 mb-2">Response Rubric</label>
                <div className="space-y-2">
                  {(formData.peerResponseRubric || [
                    { name: 'Engagement', levels: [{ score: 3, description: 'Thoughtful and specific' }, { score: 2, description: 'Adequate response' }, { score: 1, description: 'Minimal effort' }] },
                    { name: 'Constructiveness', levels: [{ score: 3, description: 'Helpful feedback given' }, { score: 2, description: 'Some useful points' }, { score: 1, description: 'No actionable feedback' }] },
                  ]).map((cat, ci) => (
                    <div key={ci} className="bg-white rounded-lg p-2">
                      <input
                        type="text"
                        value={cat.name}
                        onChange={(e) => {
                          const updated = [...(formData.peerResponseRubric || [{ name: 'Engagement', levels: [{ score: 3, description: 'Thoughtful and specific' }, { score: 2, description: 'Adequate response' }, { score: 1, description: 'Minimal effort' }] }, { name: 'Constructiveness', levels: [{ score: 3, description: 'Helpful feedback given' }, { score: 2, description: 'Some useful points' }, { score: 1, description: 'No actionable feedback' }] }])];
                          updated[ci] = { ...updated[ci], name: e.target.value };
                          setFormData({ ...formData, peerResponseRubric: updated });
                        }}
                        className="text-xs font-bold text-gray-900 bg-transparent border-none focus:outline-none w-full mb-1"
                      />
                      <div className="space-y-0.5">
                        {cat.levels.map((level, li) => (
                          <div key={li} className="flex items-center gap-1.5 text-[9px]">
                            <span className="font-bold text-[#005587] w-3">{level.score}</span>
                            <span className="text-gray-500">{level.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const [showProblemBankSection, setShowProblemBankSection] = useState(false);

  const renderStep5 = () => {
    const selectedCourse = courses.find((c) => c.courseId === formData.courseId);

    // If building a new question bank inline
    if (showBankBuilder) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#005587]">Create Question Bank</h2>
            <button onClick={() => setShowBankBuilder(false)} className="text-sm text-gray-500">Cancel</button>
          </div>
          <ProblemBankBuilder
            courseId={formData.courseId}
            onSave={async (bankData) => {
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
        <h2 className="text-lg font-bold text-[#005587]">Review & Save</h2>

        <div className="bg-gray-50 rounded-2xl p-5 space-y-3 text-sm">
          {/* Course - editable if empty */}
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-600">Course:</span>
            {formData.courseId ? (
              <span className="text-gray-900">{selectedCourse?.title || selectedCourse?.courseName || '—'}</span>
            ) : (
              <select
                value={formData.courseId}
                onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                className="px-2 py-1 border border-orange-300 rounded-lg text-xs focus:border-[#005587] focus:outline-none bg-orange-50 max-w-[60%]"
              >
                <option value="">Select course...</option>
                {courses.map((course) => (
                  <option key={course.courseId} value={course.courseId}>
                    {course.title || course.courseName}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-600">Title:</span>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="text-gray-900 text-sm font-medium text-right bg-transparent border-b border-transparent focus:border-[#005587] focus:outline-none max-w-[65%]"
            />
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-600">Type:</span>
            <span className="text-gray-900 capitalize">{formData.assignmentType === 'group-project' ? 'Group Project' : formData.assignmentType === 'study-module' ? 'Study Module' : formData.assignmentType}</span>
          </div>
          {/* Due Date - always editable */}
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-600">Due Date:</span>
            <input
              type="datetime-local"
              value={formData.dueDate}
              onChange={(e) => {
                let val = e.target.value;
                if (!val) { setFormData({ ...formData, dueDate: '' }); return; }
                // First time setting date → force 11:59 PM
                if (!formData.dueDate && val.includes('T')) {
                  val = val.split('T')[0] + 'T23:59';
                }
                setFormData({ ...formData, dueDate: val });
              }}
              className={`px-2 py-1 border rounded-lg text-xs focus:border-[#005587] focus:outline-none max-w-[60%] min-w-0 ${formData.dueDate ? 'border-gray-200' : 'border-orange-300 bg-orange-50'}`}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-600">Max Points:</span>
            {formData.rubric.length > 0 ? (
              <span className="text-gray-900">{getRubricMaxScore(formData.rubric)} <span className="text-xs text-gray-400">(from rubric)</span></span>
            ) : (
              <input
                type="number"
                value={formData.maxScore}
                onChange={(e) => setFormData({ ...formData, maxScore: Number(e.target.value) || 100 })}
                min={1}
                max={1000}
                className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-sm text-right focus:border-[#005587] focus:outline-none"
              />
            )}
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-600">Rubric:</span>
            <span className="text-gray-900">
              {formData.rubric.length > 0
                ? `${formData.rubric.length} categor${formData.rubric.length === 1 ? 'y' : 'ies'}`
                : 'None'}
            </span>
          </div>
        </div>

        {/* Full Description / Instructions - editable */}
        <div className="bg-gray-50 rounded-2xl p-4">
          <h3 className="text-xs font-bold text-[#005587] uppercase mb-2">Instructions / Prompt</h3>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={5}
            placeholder="Enter assignment instructions..."
            className="w-full text-xs text-gray-800 leading-relaxed bg-white border border-gray-200 rounded-xl p-3 resize-none focus:border-[#005587] focus:outline-none focus:ring-1 focus:ring-[#005587]"
          />
        </div>

        {/* Rubric Details */}
        {formData.rubric.length > 0 && (
          <div className="bg-gray-50 rounded-2xl p-4">
            <h3 className="text-xs font-bold text-[#005587] uppercase mb-2">Rubric</h3>
            <div className="space-y-3">
              {formData.rubric.map((cat: any, ci: number) => (
                <div key={cat.id || ci} className="bg-white rounded-xl p-3">
                  <p className="text-xs font-bold text-gray-900 mb-1">{cat.name}</p>
                  <div className="space-y-1">
                    {(cat.levels || []).map((level: any, li: number) => (
                      <div key={li} className="flex items-start gap-2">
                        <span className="text-[10px] font-bold text-[#005587] bg-[#005587]/10 px-1.5 py-0.5 rounded shrink-0">{level.score}</span>
                        <span className="text-[10px] text-gray-600">{level.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Discussion Prompt */}
        {formData.assignmentType === 'discussion' && formData.discussionConfig && (
          <div className="bg-gray-50 rounded-2xl p-4">
            <h3 className="text-xs font-bold text-[#005587] uppercase mb-2">Discussion</h3>
            {formData.discussionConfig.prompt && (
              <p className="text-xs text-gray-800 mb-2 whitespace-pre-wrap">{formData.discussionConfig.prompt}</p>
            )}
            <div className="flex flex-wrap gap-2 text-[10px] text-gray-500">
              <span>Format: {formData.discussionConfig.format === 'whole-class' ? 'Whole Class' : `Small Groups (${formData.discussionConfig.groupSize})`}</span>
              <span>• Min Posts: {formData.discussionConfig.minPosts}</span>
              <span>• Min Words: {formData.discussionConfig.minWordCount}</span>
            </div>
          </div>
        )}

        {/* Assessment Questions */}
        {formData.assignmentType === 'assessment' && formData.assessmentQuestions && formData.assessmentQuestions.length > 0 && (
          <div className="bg-gray-50 rounded-2xl p-4">
            <h3 className="text-xs font-bold text-[#005587] uppercase mb-2">Assessment Questions ({formData.assessmentQuestions.length})</h3>
            <div className="space-y-2">
              {formData.assessmentQuestions.map((q: any, qi: number) => (
                <div key={q.questionId || qi} className="bg-white rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-bold text-[#005587] shrink-0">Q{qi + 1}.</span>
                    <p className="text-xs text-gray-800">{q.questionText}</p>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 ml-5">⏱ {q.timeLimitSeconds}s</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Group Project Details */}
        {formData.assignmentType === 'group-project' && formData.moduleConfig && (
          <div className="bg-gray-50 rounded-2xl p-4">
            <h3 className="text-xs font-bold text-[#005587] uppercase mb-2">Group Project</h3>
            <p className="text-xs text-gray-800 mb-2">Topic: {formData.moduleConfig.topic}</p>
            <div className="flex flex-wrap gap-2 text-[10px] text-gray-500">
              <span>{formData.moduleConfig.requiredVideos} videos</span>
              <span>• Groups of {formData.moduleConfig.groupSize}</span>
              <span>• {formData.moduleConfig.groupFormation}</span>
              <span>• Grading: {formData.moduleConfig.gradingPolicy}</span>
            </div>
          </div>
        )}

        {/* Peer Response Settings */}
        {formData.enablePeerResponses && (
          <div className="bg-gray-50 rounded-2xl p-4">
            <h3 className="text-xs font-bold text-[#005587] uppercase mb-2">Peer Video Responses</h3>
            <div className="flex flex-wrap gap-3 text-[10px] text-gray-600">
              <span>{formData.minResponsesRequired || 2} required</span>
              <span>• Max {formData.maxResponsesPerVideo || 3} per video</span>
              <span>• {formData.responseMinLength || 25}–{formData.responseMaxLength || 200} words</span>
              {formData.responseDueDate && <span>• Due {new Date(formData.responseDueDate).toLocaleDateString()}</span>}
            </div>
            {formData.peerResponseRubric && formData.peerResponseRubric.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-[10px] font-medium text-gray-500">Response Rubric:</p>
                {formData.peerResponseRubric.map((cat, ci) => (
                  <p key={ci} className="text-[10px] text-gray-600">• {cat.name} (max {cat.levels[0]?.score || 3} pts)</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Question Bank toggle */}
        <div className="border border-gray-200 rounded-xl p-3">
          {formData.problemBankId ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-700">✓ {formData.problemBankTitle}</p>
                <p className="text-[10px] text-gray-500">Each student gets a unique problem</p>
              </div>
              <button onClick={() => setFormData({ ...formData, problemBankId: undefined, problemBankTitle: undefined })} className="text-[10px] text-red-500 font-medium">Remove</button>
            </div>
          ) : !showProblemBankSection ? (
            <button
              type="button"
              onClick={() => { setShowProblemBankSection(true); fetchProblemBanks(); }}
              className="w-full text-left flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-medium text-gray-700">Need individualized problems?</p>
                <p className="text-[10px] text-gray-400">Assign each student a unique question from a question bank</p>
              </div>
              <span className="text-xs text-[#005587] font-medium">Add →</span>
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-700">Link a Question Bank</p>
                <button onClick={() => setShowProblemBankSection(false)} className="text-[10px] text-gray-400">Cancel</button>
              </div>
              {problemBanks.length > 0 && (
                <select
                  value=""
                  onChange={(e) => {
                    const bank = problemBanks.find(b => b.bankId === e.target.value);
                    if (bank) {
                      setFormData({ ...formData, problemBankId: bank.bankId, problemBankTitle: bank.title });
                      setShowProblemBankSection(false);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:border-[#005587] focus:outline-none"
                >
                  <option value="">Select a bank...</option>
                  {problemBanks.map(bank => (
                    <option key={bank.bankId} value={bank.bankId}>{bank.title} ({bank.problemCount} problems)</option>
                  ))}
                </select>
              )}
              <button onClick={() => setShowBankBuilder(true)} className="text-xs text-[#005587] font-medium">+ Create new bank</button>
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
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm overflow-hidden">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
            {currentStep === 5 && renderStep5()}
          </div>

          {/* Navigation - hidden when AI generator or sub-wizard is active */}
          {!showAIGenerator && !(currentStep === 4 && formData.assignmentType !== 'video') && (
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
                disabled={isSubmitting || success || !formData.courseId || !formData.dueDate || !formData.title}
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
          )}
        </div>
      </div>
    </InstructorRoute>
  );
};

export default CreateAssignmentPage;
