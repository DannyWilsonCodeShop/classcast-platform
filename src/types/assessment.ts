/**
 * Timed Video Assessment types for ClassCast
 */

export interface AssessmentQuestion {
  questionId: string;
  questionText: string;
  timeLimitSeconds: number;              // 15–300
  orderIndex: number;
  imageUrl?: string;                     // Optional image for the question
}

export interface QuestionTimestamp {
  questionId: string;
  timestampSeconds: number;
}

export interface IntegrityEvent {
  type: 'camera-lost' | 'tab-navigation' | 'camera-restored';
  timestampSeconds: number;
  description: string;
}

export interface AssessmentSession {
  sessionId: string;
  assessmentId: string;
  studentId: string;
  videoUrl: string | null;
  questionTimestamps: QuestionTimestamp[];
  integrityEvents: IntegrityEvent[];
  status: 'in-progress' | 'completed' | 'reset';
  startedAt: string;
  completedAt: string | null;
  gradingData: AssessmentGradingData | null;
}

export interface AssessmentGradingData {
  questionScores: Record<string, number>;  // { [questionId]: score }
  totalScore: number;
  gradedAt: string;
  gradedBy: string;
}
