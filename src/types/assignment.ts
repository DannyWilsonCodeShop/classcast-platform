export interface Assignment {
  assignmentId: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  points: number;
  status: 'draft' | 'published' | 'grading' | 'completed';
  submissionType: 'text' | 'file' | 'video';
  submissionsCount: number;
  gradedCount: number;
  averageGrade?: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  instructions?: string;
  attachments?: AssignmentAttachment[];
  rubric?: AssignmentRubric;
  settings?: AssignmentSettings;
}

export interface AssignmentAttachment {
  attachmentId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
}

export interface AssignmentRubric {
  rubricId: string;
  criteria: RubricCriteria[];
  totalPoints: number;
}

export interface RubricCriteria {
  criteriaId: string;
  title: string;
  description: string;
  points: number;
  levels: RubricLevel[];
}

export interface RubricLevel {
  levelId: string;
  title: string;
  description: string;
  points: number;
}

export interface AssignmentSettings {
  allowLateSubmissions: boolean;
  latePenalty: number; // percentage
  maxAttempts: number;
  requireApproval: boolean;
  allowGroupSubmissions: boolean;
  plagiarismCheck: boolean;
  peerReview: boolean;
  anonymousGrading: boolean;
  allowYouTubeUrl?: boolean; // Allow students to submit YouTube URLs instead of uploading
  maxFileSize?: number; // Maximum file size for uploads
}

export interface AssignmentSubmission {
  submissionId: string;
  assignmentId: string;
  studentId: string;
  content: string;
  attachments: SubmissionAttachment[];
  submittedAt: string;
  status: 'draft' | 'submitted' | 'graded' | 'returned';
  grade?: number;
  feedback?: string;
  gradedBy?: string;
  gradedAt?: string;
  attemptNumber: number;
  isLate: boolean;
  latePenalty?: number;
  youtubeUrl?: string; // YouTube video URL for submissions
  googleDriveUrl?: string; // Google Drive video link
  googleDriveOriginalUrl?: string;
  submissionMethod?: 'upload' | 'youtube' | 'google-drive' | 'record'; // How the video was submitted
}

export interface SubmissionAttachment {
  attachmentId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
}

export interface CreateAssignmentData {
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  points: number;
  submissionType: 'text' | 'file' | 'video';
  instructions?: string;
  attachments?: File[];
  rubric?: AssignmentRubric;
  settings?: Partial<AssignmentSettings>;
}

export interface UpdateAssignmentData {
  title?: string;
  description?: string;
  dueDate?: string;
  points?: number;
  status?: 'draft' | 'published' | 'grading' | 'completed';
  submissionType?: 'text' | 'file' | 'video';
  instructions?: string;
  rubric?: AssignmentRubric;
  settings?: Partial<AssignmentSettings>;
}

export interface AssignmentFilter {
  courseId?: string;
  status?: 'draft' | 'published' | 'grading' | 'completed';
  submissionType?: 'text' | 'file' | 'video';
  dueDateFrom?: string;
  dueDateTo?: string;
  pointsMin?: number;
  pointsMax?: number;
  search?: string;
}

export interface AssignmentStats {
  totalAssignments: number;
  publishedAssignments: number;
  completedAssignments: number;
  totalSubmissions: number;
  gradedSubmissions: number;
  averageGrade: number;
  overdueAssignments: number;
}
