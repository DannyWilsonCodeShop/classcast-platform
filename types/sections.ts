// Section-related type definitions

export interface Section {
  sectionId: string;
  courseId: string;
  sectionName: string;
  sectionCode?: string;
  classCode?: string; // Unique class code for student enrollment
  description?: string;
  maxEnrollment: number;
  currentEnrollment: number;
  schedule?: SectionSchedule;
  location?: string;
  instructorId: string;
  instructorName?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface SectionSchedule {
  days: string[]; // ['Monday', 'Wednesday', 'Friday']
  startTime: string; // '09:00'
  endTime: string; // '10:30'
  timezone?: string;
}

export interface SectionEnrollment {
  enrollmentId: string;
  sectionId: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  enrolledAt: string;
  status: 'active' | 'dropped' | 'transferred';
}

export interface AssignmentSection {
  assignmentSectionId: string;
  assignmentId: string;
  sectionId: string;
  sectionName?: string;
  createdAt: string;
}

export interface SectionStats {
  totalSections: number;
  activeSections: number;
  totalEnrollments: number;
  averageEnrollmentPerSection: number;
}

export interface CreateSectionRequest {
  courseId: string;
  sectionName: string;
  sectionCode?: string;
  description?: string;
  maxEnrollment?: number;
  schedule?: SectionSchedule;
  location?: string;
}

export interface UpdateSectionRequest {
  sectionName?: string;
  sectionCode?: string;
  description?: string;
  maxEnrollment?: number;
  schedule?: SectionSchedule;
  location?: string;
  isActive?: boolean;
}

export interface EnrollStudentRequest {
  sectionId: string;
  studentId: string;
}

export interface SectionEnrollmentFilters {
  sectionId?: string;
  studentId?: string;
  status?: 'active' | 'dropped' | 'transferred';
  courseId?: string;
  instructorId?: string;
}

export interface SectionFilters {
  courseId?: string;
  instructorId?: string;
  isActive?: boolean;
  search?: string;
}
