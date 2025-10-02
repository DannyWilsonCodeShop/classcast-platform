export interface Course {
  courseId: string;
  title: string;
  description: string;
  code: string; // e.g., "CS-101", "MATH-201"
  department: string;
  credits: number;
  semester: string; // e.g., "Fall 2024", "Spring 2025"
  year: number;
  backgroundColor: string;
  instructorId: string;
  instructorName: string;
  instructorEmail: string;
  status: 'draft' | 'published' | 'archived';
  startDate: string;
  endDate: string;
  maxStudents?: number;
  currentEnrollment: number;
  prerequisites?: string[];
  learningObjectives: string[];
  gradingPolicy: {
    assignments: number;
    quizzes: number;
    exams: number;
    participation: number;
    final: number;
  };
  schedule: {
    days: string[]; // e.g., ["Monday", "Wednesday", "Friday"]
    time: string; // e.g., "10:00 AM - 11:00 AM"
    location: string; // e.g., "Room 101", "Online"
  };
  resources: {
    textbooks: Array<{
      title: string;
      author: string;
      isbn?: string;
      required: boolean;
    }>;
    materials: Array<{
      name: string;
      type: 'link' | 'file' | 'video';
      url?: string;
      description: string;
    }>;
  };
  settings: {
    allowLateSubmissions: boolean;
    latePenalty: number; // percentage
    allowResubmissions: boolean;
    requireAttendance: boolean;
    enableDiscussions: boolean;
    enableAnnouncements: boolean;
    privacy: 'public' | 'private'; // public = searchable, private = code-only access
  };
  enrollment: {
    students: Array<{
      userId: string;
      email: string;
      firstName: string;
      lastName: string;
      enrolledAt: string;
      status: 'active' | 'dropped' | 'completed';
    }>;
    waitlist: Array<{
      userId: string;
      email: string;
      firstName: string;
      lastName: string;
      addedAt: string;
    }>;
  };
  statistics: {
    totalAssignments: number;
    totalSubmissions: number;
    averageGrade: number;
    completionRate: number;
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface CreateCourseData {
  title: string;
  description: string;
  code: string;
  classCode?: string;
  department: string;
  semester: string;
  year: number;
  backgroundColor: string;
  startDate: string;
  endDate: string;
  maxStudents?: number;
  prerequisites?: string[];
  learningObjectives: string[];
  gradingPolicy: {
    assignments: number;
    quizzes: number;
    exams: number;
    participation: number;
    final: number;
  };
  resources: {
    textbooks: Array<{
      title: string;
      author: string;
      isbn?: string;
      required: boolean;
    }>;
    materials: Array<{
      name: string;
      type: 'link' | 'file' | 'video';
      url?: string;
      description: string;
    }>;
  };
  settings: {
    allowLateSubmissions: boolean;
    latePenalty: number;
    allowResubmissions: boolean;
    requireAttendance: boolean;
    enableDiscussions: boolean;
    enableAnnouncements: boolean;
    privacy: 'public' | 'private';
  };
  instructorId?: string;
  courseId?: string;
  courseName?: string;
}

export interface UpdateCourseData extends Partial<CreateCourseData> {
  status?: 'draft' | 'published' | 'archived';
}

export interface CourseEnrollment {
  courseId: string;
  studentId: string;
  enrolledAt: string;
  status: 'active' | 'dropped' | 'completed';
}

export interface CourseStats {
  totalCourses: number;
  activeCourses: number;
  totalStudents: number;
  averageEnrollment: number;
  popularDepartments: Array<{
    department: string;
    count: number;
  }>;
}
