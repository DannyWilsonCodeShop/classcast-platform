'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Loader2, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { RubricCategory } from '@/types/rubric';
import { AIGradingPreferences, GradingMode, StrictnessLevel, GradingResult } from '@/types/aiGrading';

interface AIGradingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentId: string;
  assignmentTitle: string;
  rubric: RubricCategory[];
  ungradedCount: number;
  currentSubmissionId?: string;
  onGradingComplete: (results: GradingResult[]) => void;
}

const AIGradingWizard: React.FC<AIGradingWizardProps> = ({
  isOpen,
  onClose,
  assignmentId,
  assignmentTitle,
  rubric,
  ungradedCount,
  currentSubmissionId,
  onGradingComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showUpgradeGate, setShowUpgradeGate] = useState(false);
  const [gradingMode, setGradingMode] = useState<GradingMode | null>(null);
  const [strictness, setStrictness] = useState<StrictnessLevel>('moderate');
  const [keywords, setKeywords] = useState('');
  const [concepts, setConcepts] = useState('');
  const [formality, setFormality] = useState<'casual' | 'professional' | 'academic'>('professional');
  const [feedbackLength, setFeedbackLength] = useState<'brief' | 'standard' | 'detailed'>('standard');
  const [tone, setTone] = useState<'encouraging' | 'constructive' | 'critical'>('constructive');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<GradingResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch saved preferences when wizard opens
  useEffect(() => {
    if (!isOpen || !assignmentId) return;

    const fetchPreferences = async () => {
      try {
        const res = await fetch(`/api/assignments/${assignmentId}/ai-preferences`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.preferences) {
          const prefs = data.preferences;
          if (prefs.gradingMode) setGradingMode(prefs.gradingMode);
          if (prefs.strictnessLevel) setStrictness(prefs.strictnessLevel);
          if (prefs.keywords && Array.isArray(prefs.keywords)) setKeywords(prefs.keywords.join(', '));
          if (prefs.concepts && Array.isArray(prefs.concepts)) setConcepts(prefs.concepts.join(', '));
          if (prefs.feedbackPreferences) {
            if (prefs.feedbackPreferences.formality) setFormality(prefs.feedbackPreferences.formality);
            if (prefs.feedbackPreferences.length) setFeedbackLength(prefs.feedbackPreferences.length);
            if (prefs.feedbackPreferences.tone) setTone(prefs.feedbackPreferences.tone);
          }
        }
      } catch {
        // Silently fail — wizard will use defaults
      }
    };

    fetchPreferences();
  }, [isOpen, assignmentId]);

  const totalSteps = gradingMode === 'rubric_feedback' ? 4 : 3;

  const stepLabels = gradingMode === 'rubric_feedback'
    ? ['Mode', 'Criteria', 'Feedback', 'Review']
    : ['Mode', 'Criteria', 'Review'];

  const handleNext = () => {
    if (currentStep === 1) {
      // Show upgrade gate instead of proceeding
      setShowUpgradeGate(true);
      return;
    }
    if (currentStep === 2 && gradingMode !== 'rubric_feedback') {
      // Skip step 3 (feedback prefs) when mode is not rubric_feedback
      setCurrentStep(totalSteps);
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handleBack = () => {
    if (currentStep === totalSteps && gradingMode !== 'rubric_feedback') {
      // When going back from review step and step 3 was skipped
      setCurrentStep(2);
    } else {
      setCurrentStep((prev) => Math.max(prev - 1, 1));
    }
  };

  const handleApply = async (scope: 'all_ungraded' | 'single') => {
    setIsProcessing(true);
    setError(null);
    try {
      const prefs: AIGradingPreferences = {
        gradingMode: gradingMode!,
        strictnessLevel: strictness,
        keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
        concepts: concepts.split(',').map(c => c.trim()).filter(Boolean),
        ...(gradingMode === 'rubric_feedback' ? {
          feedbackPreferences: { formality, length: feedbackLength, tone }
        } : {}),
        updatedAt: new Date().toISOString(),
      };
      const res = await fetch('/api/ai/grade-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId,
          preferences: prefs,
          scope,
          ...(scope === 'single' ? { submissionId: currentSubmissionId } : {}),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.results);
        onGradingComplete(data.results);
      } else {
        setError(data.error || 'AI grading failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const isNextDisabled = currentStep === 1 && gradingMode === null;

  // Determine the actual display step for the indicator
  const getDisplayStep = () => currentStep;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#005587] font-['Oswald',sans-serif]">
            AI Grading Wizard
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close wizard"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Step Indicator */}
        <WizardStepIndicator
          currentStep={getDisplayStep()}
          totalSteps={totalSteps}
          stepLabels={stepLabels}
        />

        {/* Step Content */}
        <div className="px-6 py-5 min-h-[320px]">
          {showUpgradeGate ? (
            <div className="flex flex-col items-center justify-center text-center h-full min-h-[280px]">
              <div className="w-16 h-16 bg-[#FFC72C]/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">🔒</span>
              </div>
              <h3 className="text-lg font-bold text-[#005587] mb-2" style={{ fontFamily: "'Oswald', sans-serif" }}>
                AI GRADING ASSISTANT
              </h3>
              <p className="text-sm text-gray-600 mb-4 max-w-sm">
                The AI Grading Assistant is a premium feature available on ClassCast Pro and Enterprise plans.
              </p>
              <div className="bg-gray-50 rounded-2xl p-4 mb-4 max-w-sm">
                <p className="text-xs text-gray-700 leading-relaxed">
                  To unlock AI-powered rubric grading, individualized video feedback, and batch auto-grading, please have your <strong>school administrator</strong> contact a ClassCast representative to upgrade your institution&apos;s subscription.
                </p>
              </div>
              <div className="space-y-2 w-full max-w-xs">
                <a
                  href="mailto:support@class-cast.com?subject=AI%20Grading%20Assistant%20Upgrade%20Inquiry"
                  className="block w-full px-4 py-2.5 bg-[#005587] text-white rounded-xl text-sm font-bold text-center hover:bg-[#004470] transition-colors"
                >
                  ✉️ Contact ClassCast Sales
                </a>
                <button
                  onClick={() => { setShowUpgradeGate(false); onClose(); }}
                  className="block w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium text-center hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
          <>
          {currentStep === 1 && (
            <Step1GradingMode
              gradingMode={gradingMode}
              onSelect={setGradingMode}
            />
          )}
          {currentStep === 2 && (
            <Step2StrictnessCriteria
              strictness={strictness}
              onStrictnessChange={setStrictness}
              keywords={keywords}
              onKeywordsChange={setKeywords}
              concepts={concepts}
              onConceptsChange={setConcepts}
            />
          )}
          {currentStep === 3 && gradingMode === 'rubric_feedback' && (
            <Step3FeedbackPreferences
              formality={formality}
              onFormalityChange={setFormality}
              feedbackLength={feedbackLength}
              onFeedbackLengthChange={setFeedbackLength}
              tone={tone}
              onToneChange={setTone}
            />
          )}
          {((currentStep === 4 && gradingMode === 'rubric_feedback') ||
            (currentStep === 3 && gradingMode !== 'rubric_feedback')) && (
            <Step4ReviewApply
              gradingMode={gradingMode!}
              strictness={strictness}
              keywords={keywords}
              concepts={concepts}
              formality={formality}
              feedbackLength={feedbackLength}
              tone={tone}
              ungradedCount={ungradedCount}
              currentSubmissionId={currentSubmissionId}
              isProcessing={isProcessing}
              results={results}
              error={error}
              onApply={handleApply}
              onRetry={() => setError(null)}
            />
          )}
          </>
          )}
        </div>

        {/* Footer Navigation */}
        {!isProcessing && results.length === 0 && !showUpgradeGate && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-600 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            {currentStep < totalSteps && (
              <button
                onClick={handleNext}
                disabled={isNextDisabled}
                className="flex items-center gap-1 px-5 py-2 text-sm font-medium text-white bg-[#005587] rounded-full hover:bg-[#004470] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Step Indicator ─────────────────────────────────────────────────────────────

interface WizardStepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

const WizardStepIndicator: React.FC<WizardStepIndicatorProps> = ({
  currentStep,
  totalSteps,
  stepLabels,
}) => {
  return (
    <div className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-50">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-[#005587] text-white'
                    : isCompleted
                    ? 'bg-[#FFC72C] text-[#005587]'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isCompleted ? '✓' : step}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'text-[#005587]' : 'text-gray-400'}`}>
                {stepLabels[i]}
              </span>
            </div>
            {step < totalSteps && (
              <div
                className={`w-8 h-0.5 mt-[-12px] ${
                  isCompleted ? 'bg-[#FFC72C]' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─── Step 1: Grading Mode Selection ─────────────────────────────────────────────

interface Step1Props {
  gradingMode: GradingMode | null;
  onSelect: (mode: GradingMode) => void;
}

const Step1GradingMode: React.FC<Step1Props> = ({ gradingMode, onSelect }) => {
  const modes: { value: GradingMode; icon: string; title: string; description: string }[] = [
    {
      value: 'rubric_only',
      icon: '📊',
      title: 'Rubric Only',
      description: 'Grade against rubric categories and assign scores',
    },
    {
      value: 'rubric_feedback',
      icon: '📊💬',
      title: 'Rubric + Feedback',
      description: 'Grade with rubric AND write personalized feedback',
    },
    {
      value: 'response_grading',
      icon: '💬',
      title: 'Response Grading',
      description: 'Grade peer responses for quality and engagement',
    },
  ];

  return (
    <div>
      <h3 className="text-base font-bold text-[#005587] font-['Oswald',sans-serif] mb-1">
        Select Grading Mode
      </h3>
      <p className="text-sm text-gray-500 mb-4">Choose how the AI should grade submissions.</p>
      <div className="space-y-3">
        {modes.map((mode) => (
          <button
            key={mode.value}
            onClick={() => onSelect(mode.value)}
            className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
              gradingMode === mode.value
                ? 'border-[#FFC72C] bg-[#FFC72C]/5 shadow-sm'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className="text-2xl mt-0.5">{mode.icon}</span>
            <div>
              <p className="font-semibold text-[#005587] text-sm">{mode.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{mode.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Step 2: Strictness & Criteria ──────────────────────────────────────────────

interface Step2Props {
  strictness: StrictnessLevel;
  onStrictnessChange: (level: StrictnessLevel) => void;
  keywords: string;
  onKeywordsChange: (value: string) => void;
  concepts: string;
  onConceptsChange: (value: string) => void;
}

const Step2StrictnessCriteria: React.FC<Step2Props> = ({
  strictness,
  onStrictnessChange,
  keywords,
  onKeywordsChange,
  concepts,
  onConceptsChange,
}) => {
  const levels: { value: StrictnessLevel; label: string }[] = [
    { value: 'lenient', label: 'Lenient' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'strict', label: 'Strict' },
  ];

  return (
    <div>
      <h3 className="text-base font-bold text-[#005587] font-['Oswald',sans-serif] mb-1">
        Strictness & Criteria
      </h3>
      <p className="text-sm text-gray-500 mb-4">Configure how strictly the AI grades.</p>

      {/* Strictness Toggle */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-gray-600 mb-2">Strictness Level</label>
        <div className="flex rounded-full bg-gray-100 p-1">
          {levels.map((level) => (
            <button
              key={level.value}
              onClick={() => onStrictnessChange(level.value)}
              className={`flex-1 py-2 px-3 text-xs font-medium rounded-full transition-all ${
                strictness === level.value
                  ? 'bg-[#005587] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      {/* Keywords */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Keywords <span className="text-gray-400">(comma-separated)</span>
        </label>
        <input
          type="text"
          value={keywords}
          onChange={(e) => onKeywordsChange(e.target.value)}
          placeholder="e.g. thesis, argument, evidence"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005587]/20 focus:border-[#005587]"
        />
      </div>

      {/* Concepts */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Concepts <span className="text-gray-400">(optional, comma-separated)</span>
        </label>
        <input
          type="text"
          value={concepts}
          onChange={(e) => onConceptsChange(e.target.value)}
          placeholder="e.g. critical thinking, methodology"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005587]/20 focus:border-[#005587]"
        />
      </div>
    </div>
  );
};

// ─── Step 3: Feedback Preferences ───────────────────────────────────────────────

interface Step3Props {
  formality: 'casual' | 'professional' | 'academic';
  onFormalityChange: (value: 'casual' | 'professional' | 'academic') => void;
  feedbackLength: 'brief' | 'standard' | 'detailed';
  onFeedbackLengthChange: (value: 'brief' | 'standard' | 'detailed') => void;
  tone: 'encouraging' | 'constructive' | 'critical';
  onToneChange: (value: 'encouraging' | 'constructive' | 'critical') => void;
}

const Step3FeedbackPreferences: React.FC<Step3Props> = ({
  formality,
  onFormalityChange,
  feedbackLength,
  onFeedbackLengthChange,
  tone,
  onToneChange,
}) => {
  return (
    <div>
      <h3 className="text-base font-bold text-[#005587] font-['Oswald',sans-serif] mb-1">
        Feedback Preferences
      </h3>
      <p className="text-sm text-gray-500 mb-4">Customize how AI writes feedback.</p>

      {/* Formality */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-600 mb-2">Formality</label>
        <div className="flex gap-2">
          {([
            { value: 'casual', label: '😊 Casual' },
            { value: 'professional', label: 'Professional' },
            { value: 'academic', label: 'Academic' },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              onClick={() => onFormalityChange(opt.value)}
              className={`flex-1 py-2 px-2 text-xs font-medium rounded-full border transition-all ${
                formality === opt.value
                  ? 'border-[#FFC72C] bg-[#FFC72C]/10 text-[#005587]'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Length */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-600 mb-2">Feedback Length</label>
        <div className="flex gap-2">
          {([
            { value: 'brief', label: 'Brief' },
            { value: 'standard', label: 'Standard' },
            { value: 'detailed', label: 'Detailed' },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              onClick={() => onFeedbackLengthChange(opt.value)}
              className={`flex-1 py-2 px-2 text-xs font-medium rounded-full border transition-all ${
                feedbackLength === opt.value
                  ? 'border-[#FFC72C] bg-[#FFC72C]/10 text-[#005587]'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tone */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">Tone</label>
        <div className="flex gap-2">
          {([
            { value: 'encouraging', label: 'Encouraging' },
            { value: 'constructive', label: 'Constructive' },
            { value: 'critical', label: 'Critical' },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              onClick={() => onToneChange(opt.value)}
              className={`flex-1 py-2 px-2 text-xs font-medium rounded-full border transition-all ${
                tone === opt.value
                  ? 'border-[#FFC72C] bg-[#FFC72C]/10 text-[#005587]'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Step 4: Review & Apply ─────────────────────────────────────────────────────

interface Step4Props {
  gradingMode: GradingMode;
  strictness: StrictnessLevel;
  keywords: string;
  concepts: string;
  formality: 'casual' | 'professional' | 'academic';
  feedbackLength: 'brief' | 'standard' | 'detailed';
  tone: 'encouraging' | 'constructive' | 'critical';
  ungradedCount: number;
  currentSubmissionId?: string;
  isProcessing: boolean;
  results: GradingResult[];
  error: string | null;
  onApply: (scope: 'all_ungraded' | 'single') => void;
  onRetry: () => void;
}

const modeLabels: Record<GradingMode, string> = {
  rubric_only: 'Rubric Only',
  rubric_feedback: 'Rubric + Feedback',
  response_grading: 'Response Grading',
};

const Step4ReviewApply: React.FC<Step4Props> = ({
  gradingMode,
  strictness,
  keywords,
  concepts,
  formality,
  feedbackLength,
  tone,
  ungradedCount,
  currentSubmissionId,
  isProcessing,
  results,
  error,
  onApply,
  onRetry,
}) => {
  // Success state
  if (results.length > 0) {
    const successCount = results.filter((r) => r.success).length;
    const errorCount = results.filter((r) => !r.success).length;
    return (
      <div className="text-center py-6">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-[#005587] font-['Oswald',sans-serif] mb-2">
          Grading Complete
        </h3>
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-green-600">{successCount} graded</span>
          {errorCount > 0 && (
            <>, <span className="font-semibold text-red-500">{errorCount} errors</span></>
          )}
        </p>
      </div>
    );
  }

  // Processing state
  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Loader2 className="w-10 h-10 text-[#005587] animate-spin mb-3" />
        <p className="text-sm text-gray-600 font-medium">Processing submissions...</p>
        <p className="text-xs text-gray-400 mt-1">This may take a moment</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-6">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <p className="text-sm text-red-600 font-medium mb-3">{error}</p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-[#005587] border border-[#005587] rounded-full hover:bg-[#005587]/5 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  // Review state
  const keywordList = keywords.split(',').map(k => k.trim()).filter(Boolean);
  const conceptList = concepts.split(',').map(c => c.trim()).filter(Boolean);

  return (
    <div>
      <h3 className="text-base font-bold text-[#005587] font-['Oswald',sans-serif] mb-1">
        Review & Apply
      </h3>
      <p className="text-sm text-gray-500 mb-4">Confirm your settings and apply grading.</p>

      {/* Summary Card */}
      <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Mode</span>
          <span className="font-medium text-[#005587]">{modeLabels[gradingMode]}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Strictness</span>
          <span className="font-medium text-[#005587] capitalize">{strictness}</span>
        </div>
        {keywordList.length > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-500">Keywords</span>
            <span className="font-medium text-[#005587] text-right max-w-[200px] truncate">
              {keywordList.join(', ')}
            </span>
          </div>
        )}
        {conceptList.length > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-500">Concepts</span>
            <span className="font-medium text-[#005587] text-right max-w-[200px] truncate">
              {conceptList.join(', ')}
            </span>
          </div>
        )}
        {gradingMode === 'rubric_feedback' && (
          <>
            <div className="border-t border-gray-200 pt-2 mt-2" />
            <div className="flex justify-between">
              <span className="text-gray-500">Formality</span>
              <span className="font-medium text-[#005587] capitalize">{formality}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Length</span>
              <span className="font-medium text-[#005587] capitalize">{feedbackLength}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tone</span>
              <span className="font-medium text-[#005587] capitalize">{tone}</span>
            </div>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={() => onApply('all_ungraded')}
          disabled={ungradedCount === 0}
          className="w-full py-3 px-4 text-sm font-bold text-white bg-[#005587] rounded-full hover:bg-[#004470] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {ungradedCount > 0
            ? `Apply to All Ungraded (${ungradedCount})`
            : 'All submissions already graded'}
        </button>
        {currentSubmissionId && (
          <button
            onClick={() => onApply('single')}
            className="w-full py-3 px-4 text-sm font-medium text-[#005587] border-2 border-[#005587] rounded-full hover:bg-[#005587]/5 transition-colors"
          >
            Apply to This Submission
          </button>
        )}
      </div>
    </div>
  );
};

export default AIGradingWizard;
