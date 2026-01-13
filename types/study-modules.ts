export interface StudyModule {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string; // e.g., "45 minutes"
  totalLessons: number;
  completedLessons: number;
  progress: number; // 0-100
  rating: number;
  enrolledCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lessons: StudyLesson[];
  isEnrolled?: boolean;
  lastAccessedLesson?: string;
}

export interface StudyLesson {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  type: 'video' | 'quiz' | 'reading' | 'interactive';
  order: number;
  duration?: string; // for videos
  videoUrl?: string;
  content?: string; // for reading materials
  quiz?: Quiz;
  isCompleted: boolean;
  isLocked: boolean;
  completedAt?: string;
}

export interface Quiz {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  passingScore: number; // percentage
  timeLimit?: number; // minutes
  attempts: QuizAttempt[];
  maxAttempts: number;
}

export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'drag-drop';
  question: string;
  options?: string[]; // for multiple choice
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
  timeInVideo?: number; // for video-embedded questions (seconds)
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  answers: Record<string, string | string[]>;
  score: number;
  passed: boolean;
  startedAt: string;
  completedAt: string;
  timeSpent: number; // seconds
}

export interface ModuleProgress {
  userId: string;
  moduleId: string;
  enrolledAt: string;
  lastAccessedAt: string;
  currentLessonId: string;
  completedLessons: string[];
  totalTimeSpent: number; // minutes
  overallProgress: number; // 0-100
  certificateEarned?: boolean;
  certificateEarnedAt?: string;
}

export interface InteractiveVideoMarker {
  id: string;
  videoId: string;
  timeStamp: number; // seconds
  type: 'question' | 'note' | 'resource' | 'checkpoint';
  title: string;
  content: string;
  question?: QuizQuestion;
  isRequired: boolean;
  completed: boolean;
}