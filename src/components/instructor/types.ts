// Enhanced types for instructor view
export interface InstructorSubmissionData {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentAvatar?: string;
  assignmentId: string;
  assignmentTitle: string;
  courseId: string;
  courseName: string;
  status: 'submitted' | 'in_progress' | 'completed';
  submittedAt: string;
  processedAt?: string;
  dueDate: string;
  isLate: boolean;
  grade?: number;
  maxScore: number;
  feedback?: string;
  instructorNotes?: string;
  videoDuration?: number;
  videoResolution?: {
    width: number;
    height: number;
  };
  processingDuration?: number;
  files: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: string;
  }>;
  likes: Array<{
    userId: string;
    userName: string;
    createdAt: string;
  }>;
  comments: Array<{
    id: string;
    text: string;
    authorId: string;
    authorName: string;
    authorType: 'student' | 'instructor';
    createdAt: string;
    isEdited?: boolean;
  }>;
  peerReviews?: Array<{
    reviewerId: string;
    reviewerName: string;
    score: number;
    maxScore: number;
    feedback: string;
    submittedAt: string;
  }>;
  // Instructor-specific fields
  priority: 'low' | 'medium' | 'high';
  reviewStatus: 'pending' | 'in_progress' | 'completed';
  estimatedGradingTime?: number; // in minutes
  lastViewedBy?: string;
  lastViewedAt?: string;
  tags: string[];
}






