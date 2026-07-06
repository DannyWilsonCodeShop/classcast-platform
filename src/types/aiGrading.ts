/**
 * Shared types for AI Grading Wizard
 */

// Union types for preferences
export type GradingMode = 'rubric_only' | 'rubric_feedback' | 'response_grading';
export type StrictnessLevel = 'lenient' | 'moderate' | 'strict';
export type FormalityLevel = 'casual' | 'professional' | 'academic';
export type FeedbackLength = 'brief' | 'standard' | 'detailed';
export type FeedbackTone = 'encouraging' | 'constructive' | 'critical';

// AI Grading Preferences (stored per-assignment in DynamoDB)
export interface AIGradingPreferences {
  gradingMode: GradingMode;
  strictnessLevel: StrictnessLevel;
  keywords: string[];
  concepts: string[];
  feedbackPreferences?: {
    formality: FormalityLevel;
    length: FeedbackLength;
    tone: FeedbackTone;
  };
  updatedAt: string;
}

// Grading result for a single submission
export interface GradingResult {
  submissionId: string;
  success: boolean;
  grade?: number;
  rubricScores?: Record<string, number>;
  feedback?: string;
  error?: string;
}

// Batch grading API request
export interface GradeBatchRequest {
  assignmentId: string;
  preferences: AIGradingPreferences;
  scope: 'all_ungraded' | 'single';
  submissionId?: string;
}

// Batch grading API response
export interface GradeBatchResponse {
  success: boolean;
  results: GradingResult[];
  totalProcessed: number;
  totalErrors: number;
  preferenceSaved: boolean;
}

// GET /api/assignments/[id]/ai-preferences response
export interface GetAIPreferencesResponse {
  success: boolean;
  preferences: AIGradingPreferences | null;
}

// PUT /api/assignments/[id]/ai-preferences response
export interface PutAIPreferencesResponse {
  success: boolean;
  updatedAt: string;
}

// Enhanced auto-grade request payload
export interface PeerResponseSummary {
  responseId: string;
  reviewerName: string;
  content: string;
  wordCount: number;
  submittedAt: string;
}

export interface EnhancedAutoGradeRequest {
  submission: {
    id: string;
    studentId: string;
    videoUrl: string;
    duration: number;
    assignmentTitle: string;
    peerResponses?: PeerResponseSummary[];
  };
  rubric: {
    id: string;
    name: string;
    criteria: { id: string; name: string; maxPoints: number; description?: string }[];
    totalPoints: number;
  };
  preferences: {
    gradingMode: GradingMode;
    strictnessLevel: StrictnessLevel;
    keywords: string[];
    concepts: string[];
    feedbackPreferences?: {
      formality: FormalityLevel;
      length: FeedbackLength;
      tone: FeedbackTone;
    };
  };
}
