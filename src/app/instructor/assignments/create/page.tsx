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
}

const STEPS = [
  { number: 1, label: 'Course' },
  { number: 2, label: 'Type' },
  { number: 3, label: 'Details' },
  { number: 4, label: 'Setup' },
  { number: 5, label: 'Problem Bank' },
  { number: 6, label: 'Review' },
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
    if (currentStep < 6) setCurrentStep(currentStep + 1);
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
        return true; // Problem bank is optional
      case 6:
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
          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#005587] focus:outline-none focus:ring-1 focus:ring-[#005587]"
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
            setCurrentStep(6);
          }}
          onBack={() => setCurrentStep(3)}
        />
      );
    }
    if (formData.assignmentType === 'assessment') {
      return (
        <AssessmentSetupWizard
          onComplete={(questions) => {
            setFormData({ ...formData, assessmentQuestions: questions });
            setCurrentStep(6);
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
            setCurrentStep(6);
          }}
          onBack={() => setCurrentStep(3)}
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
            <button onClick={() => setCurrentStep(3)} className="px-4 py-2 text-xs text-gray-600 font-medium">Back</button>
            <button onClick={() => setCurrentStep(5)} className="px-4 py-2 bg-[#005587] text-white rounded-xl text-xs font-medium">Next</button>
          </div>
        </div>
      );
    }
    // Default: Rubric Builder (for video type)
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
      </div>
    );
  };

  const renderStep5 = () => {
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
          <div className="flex items-center gap-1.5">
            <h2 className="text-lg font-bold text-[#005587]">Problem Bank</h2>
            <HelpTooltip text="A problem bank is a set of unique questions you create. When linked to an assignment, each student automatically receives a different problem — ensuring no two students work the same question." />
          </div>
          <button
            type="button"
            onClick={() => setCurrentStep(6)}
            className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
          >
            Skip →
          </button>
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

  const renderStep6 = () => {
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
            {currentStep === 6 && renderStep6()}
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

            {currentStep < 6 ? (
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
