export interface Course {
  courseId: string;
  courseName: string;
  courseCode: string;
  description: string;
  instructorId: string;
  department: string;
  semester: string;
  year: number;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  studentCount?: number;
  assignmentCount?: number;
}

export interface CreateCourseData {
  courseId?: string;
  courseName: string;
  courseCode: string;
  description: string;
  department: string;
  semester: string;
  year: number;
}

export interface UpdateCourseData {
  courseName?: string;
  courseCode?: string;
  description?: string;
  department?: string;
  semester?: string;
  year?: number;
  status?: 'draft' | 'published' | 'archived';
}

export interface CourseFilters {
  department?: string;
  semester?: string;
  year?: number;
  status?: string;
  search?: string;
}
