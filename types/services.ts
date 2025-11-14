// Service layer interfaces and implementations for DemoProject

import { 
  User, 
  Assignment, 
  AssignmentSubmission, 
  Course,
  CreateUserRequest,
  UpdateUserRequest,
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  CreateSubmissionRequest,
  UpdateSubmissionRequest,
  GradeSubmissionRequest,
  CreateCourseRequest,
  UpdateCourseRequest,
  UserFilters,
  AssignmentFilters,
  SubmissionFilters,
  CourseFilters,
  PaginationInfo,
  ApiResponse,
  ApiError
} from './entities';

import { 
  validateUser, 
  validateAssignment, 
  validateSubmission, 
  validateCourse,
  sanitizeUserInput,
  sanitizeAssignmentInput,
  ValidationResult 
} from './validation';

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

export interface IUserService {
  createUser(userData: CreateUserRequest): Promise<ApiResponse<User>>;
  getUser(userId: string): Promise<ApiResponse<User>>;
  updateUser(userId: string, userData: UpdateUserRequest): Promise<ApiResponse<User>>;
  deleteUser(userId: string): Promise<ApiResponse<void>>;
  listUsers(filters?: UserFilters, pagination?: Partial<PaginationInfo>): Promise<ApiResponse<User[]>>;
  getUserByEmail(email: string): Promise<ApiResponse<User>>;
  getUserByStudentId(studentId: string): Promise<ApiResponse<User>>;
  getUserByInstructorId(instructorId: string): Promise<ApiResponse<User>>;
}

export interface IAssignmentService {
  createAssignment(assignmentData: CreateAssignmentRequest): Promise<ApiResponse<Assignment>>;
  getAssignment(assignmentId: string): Promise<ApiResponse<Assignment>>;
  updateAssignment(assignmentId: string, assignmentData: UpdateAssignmentRequest): Promise<ApiResponse<Assignment>>;
  deleteAssignment(assignmentId: string): Promise<ApiResponse<void>>;
  listAssignments(filters?: AssignmentFilters, pagination?: Partial<PaginationInfo>): Promise<ApiResponse<Assignment[]>>;
  publishAssignment(assignmentId: string): Promise<ApiResponse<Assignment>>;
  archiveAssignment(assignmentId: string): Promise<ApiResponse<Assignment>>;
  getAssignmentsByCourse(courseId: string): Promise<ApiResponse<Assignment[]>>;
}

export interface ISubmissionService {
  createSubmission(submissionData: CreateSubmissionRequest): Promise<ApiResponse<AssignmentSubmission>>;
  getSubmission(submissionId: string): Promise<ApiResponse<AssignmentSubmission>>;
  updateSubmission(submissionId: string, submissionData: UpdateSubmissionRequest): Promise<ApiResponse<AssignmentSubmission>>;
  deleteSubmission(submissionId: string): Promise<ApiResponse<void>>;
  listSubmissions(filters?: SubmissionFilters, pagination?: Partial<PaginationInfo>): Promise<ApiResponse<AssignmentSubmission[]>>;
  gradeSubmission(submissionId: string, gradeData: GradeSubmissionRequest): Promise<ApiResponse<AssignmentSubmission>>;
  getSubmissionsByAssignment(assignmentId: string): Promise<ApiResponse<AssignmentSubmission[]>>;
  getSubmissionsByStudent(studentId: string): Promise<ApiResponse<AssignmentSubmission[]>>;
  submitPeerReview(submissionId: string, reviewData: any): Promise<ApiResponse<void>>;
}

export interface ICourseService {
  createCourse(courseData: CreateCourseRequest): Promise<ApiResponse<Course>>;
  getCourse(courseId: string): Promise<ApiResponse<Course>>;
  updateCourse(courseId: string, courseData: UpdateCourseRequest): Promise<ApiResponse<Course>>;
  deleteCourse(courseId: string): Promise<ApiResponse<void>>;
  listCourses(filters?: CourseFilters, pagination?: Partial<PaginationInfo>): Promise<ApiResponse<Course[]>>;
  publishCourse(courseId: string): Promise<ApiResponse<Course>>;
  archiveCourse(courseId: string): Promise<ApiResponse<Course>>;
  enrollStudent(courseId: string, studentId: string): Promise<ApiResponse<void>>;
  unenrollStudent(courseId: string, studentId: string): Promise<ApiResponse<void>>;
  getEnrolledStudents(courseId: string): Promise<ApiResponse<User[]>>;
  getCoursesByInstructor(instructorId: string): Promise<ApiResponse<Course[]>>;
}

// ============================================================================
// SERVICE IMPLEMENTATIONS
// ============================================================================

export class UserService implements IUserService {
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string) {
    this.apiBaseUrl = apiBaseUrl;
  }

  async createUser(userData: CreateUserRequest): Promise<ApiResponse<User>> {
    try {
      // Validate input
      const validation = validateUser(userData);
      if (!validation.isValid) {
        return this.createErrorResponse('Validation failed', validation.errors.join(', '));
      }

      // Sanitize input
      const sanitizedData = sanitizeUserInput(userData);

      // Make API call
      const response = await fetch(`${this.apiBaseUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return this.createErrorResponse('Failed to create user', errorData.message || 'Unknown error');
      }

      const data = await response.json();
      return this.createSuccessResponse(data.user);
    } catch (error) {
      return this.createErrorResponse('Service error', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async getUser(userId: string): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/users/${userId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        return this.createErrorResponse('Failed to get user', errorData.message || 'Unknown error');
      }

      const data = await response.json();
      return this.createSuccessResponse(data.user);
    } catch (error) {
      return this.createErrorResponse('Service error', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async updateUser(userId: string, userData: UpdateUserRequest): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return this.createErrorResponse('Failed to update user', errorData.message || 'Unknown error');
      }

      const data = await response.json();
      return this.createSuccessResponse(data.user);
    } catch (error) {
      return this.createErrorResponse('Service error', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async deleteUser(userId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        return this.createErrorResponse('Failed to delete user', errorData.message || 'Unknown error');
      }

      return this.createSuccessResponse(undefined);
    } catch (error) {
      return this.createErrorResponse('Service error', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async listUsers(filters?: UserFilters, pagination?: Partial<PaginationInfo>): Promise<ApiResponse<User[]>> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
          }
        });
      }

      if (pagination) {
        if (pagination.page) params.append('page', String(pagination.page));
        if (pagination.limit) params.append('limit', String(pagination.limit));
      }

      const response = await fetch(`${this.apiBaseUrl}/users?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        return this.createErrorResponse('Failed to list users', errorData.message || 'Unknown error');
      }

      const data = await response.json();
      return this.createSuccessResponse(data.users);
    } catch (error) {
      return this.createErrorResponse('Service error', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async getUserByEmail(email: string): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/users?email=${encodeURIComponent(email)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        return this.createErrorResponse('Failed to get user by email', errorData.message || 'Unknown error');
      }

      const data = await response.json();
      return this.createSuccessResponse(data.users[0]);
    } catch (error) {
      return this.createErrorResponse('Service error', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async getUserByStudentId(studentId: string): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/users?studentId=${encodeURIComponent(studentId)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        return this.createErrorResponse('Failed to get user by student ID', errorData.message || 'Unknown error');
      }

      const data = await response.json();
      return this.createSuccessResponse(data.users[0]);
    } catch (error) {
      return this.createErrorResponse('Service error', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async getUserByInstructorId(instructorId: string): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/users?instructorId=${encodeURIComponent(instructorId)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        return this.createErrorResponse('Failed to get user by instructor ID', errorData.message || 'Unknown error');
      }

      const data = await response.json();
      return this.createSuccessResponse(data.users[0]);
    } catch (error) {
      return this.createErrorResponse('Service error', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private createSuccessResponse<T>(data: T): ApiResponse<T> {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  private createErrorResponse(error: string, message: string): ApiResponse<any> {
    return {
      success: false,
      error,
      message,
      timestamp: new Date().toISOString(),
    };
  }
}

export class AssignmentService implements IAssignmentService {
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string) {
    this.apiBaseUrl = apiBaseUrl;
  }

  async createAssignment(assignmentData: CreateAssignmentRequest): Promise<ApiResponse<Assignment>> {
    try {
      // Validate input
      const validation = validateAssignment(assignmentData);
      if (!validation.isValid) {
        return this.createErrorResponse('Validation failed', validation.errors.join(', '));
      }

      // Sanitize input
      const sanitizedData = sanitizeAssignmentInput(assignmentData);

      const response = await fetch(`${this.apiBaseUrl}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return this.createErrorResponse('Failed to create assignment', errorData.message || 'Unknown error');
      }

      const data = await response.json();
      return this.createSuccessResponse(data.assignment);
    } catch (error) {
      return this.createErrorResponse('Service error', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async getAssignment(assignmentId: string): Promise<ApiResponse<Assignment>> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/assignments/${assignmentId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        return this.createErrorResponse('Failed to get assignment', errorData.message || 'Unknown error');
      }

      const data = await response.json();
      return this.createSuccessResponse(data.assignment);
    } catch (error) {
      return this.createErrorResponse('Service error', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async updateAssignment(assignmentId: string, assignmentData: UpdateAssignmentRequest): Promise<ApiResponse<Assignment>> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignmentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return this.createErrorResponse('Failed to update assignment', errorData.message || 'Unknown error');
      }

      const data = await response.json();
      return this.createSuccessResponse(data.assignment);
    } catch (error) {
      return this.createErrorResponse('Service error', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async deleteAssignment(assignmentId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/assignments/${assignmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        return this.createErrorResponse('Failed to delete assignment', errorData.message || 'Unknown error');
      }

      return this.createSuccessResponse(undefined);
    } catch (error) {
      return this.createErrorResponse('Service error', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async listAssignments(filters?: AssignmentFilters, pagination?: Partial<PaginationInfo>): Promise<ApiResponse<Assignment[]>> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (key === 'dueDateRange' && value.start && value.end) {
              params.append('startDate', value.start.toISOString());
              params.append('endDate', value.end.toISOString());
            } else {
              params.append(key, String(value));
            }
          }
        });
      }

      if (pagination) {
        if (pagination.page) params.append('page', String(pagination.page));
        if (pagination.limit) params.append('limit', String(pagination.limit));
      }

      const response = await fetch(`${this.apiBaseUrl}/assignments?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        return this.createErrorResponse('Failed to list assignments', errorData.message || 'Unknown error');
      }

      const data = await response.json();
      return this.createSuccessResponse(data.assignments);
    } catch (error) {
      return this.createErrorResponse('Service error', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async publishAssignment(assignmentId: string): Promise<ApiResponse<Assignment>> {
    return this.updateAssignment(assignmentId, { status: 'published' });
  }

  async archiveAssignment(assignmentId: string): Promise<ApiResponse<Assignment>> {
    return this.updateAssignment(assignmentId, { status: 'archived' });
  }

  async getAssignmentsByCourse(courseId: string): Promise<ApiResponse<Assignment[]>> {
    return this.listAssignments({ courseId });
  }

  private createSuccessResponse<T>(data: T): ApiResponse<T> {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  private createErrorResponse(error: string, message: string): ApiResponse<any> {
    return {
      success: false,
      error,
      message,
      timestamp: new Date().toISOString(),
    };
  }
}

export class SubmissionService implements ISubmissionService {
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string) {
    this.apiBaseUrl = apiBaseUrl;
  }

  async createSubmission(submissionData: CreateSubmissionRequest): Promise<ApiResponse<AssignmentSubmission>> {
    try {
      // Validate input
      const validation = validateSubmission(submissionData);
      if (!validation.isValid) {
        return this.createErrorResponse('Validation failed', validation.errors.join(', '));
      }

      const response = await fetch(`${this.apiBaseUrl}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return this.createErrorResponse('Failed to create submission', errorData.message || 'Unknown error');
      }

      const data = await response.json();
      return this.createSuccessResponse(data.submission);
    } catch (error) {
      return this.createErrorResponse('Service error', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async getSubmission(submissionId: string): Promise<ApiResponse<AssignmentSubmission>> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/submissions/${submissionId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        return this.createErrorResponse('Failed to get submission', errorData.message || 'Unknown error');
      }

      const data = await response.json();
      return this.createSuccessResponse(data.submission);
    } catch (error) {
      return this.createErrorResponse('Service error', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async updateSubmission(submissionId: string, submissionData: UpdateSubmissionRequest): Promise<ApiResponse<AssignmentSubmission>> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/submissions/${submissionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return this.createErrorResponse('Failed to update submission', errorData.message || 'Unknown error');
      }

      const data = await response.json();
      return this.createSuccessResponse(data.submission);
    } catch (error) {
      return this.createErrorResponse('Service error', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async deleteSubmission(submissionId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/submissions/${submissionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        return this.createErrorResponse('Failed to delete submission', errorData.message || 'Unknown error');
      }

      return this.createSuccessResponse(undefined);
    } catch (error) {
      return this.createErrorResponse('Service error', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async listSubmissions(filters?: SubmissionFilters, pagination?: Partial<PaginationInfo>): Promise<ApiResponse<AssignmentSubmission[]>> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (key === 'submittedDateRange' && value.start && value.end) {
              params.append('startDate', value.start.toISOString());
              params.append('endDate', value.end.toISOString());
            } else {
              params.append(key, String(value));
            }
          }
        });
      }

      if (pagination) {
        if (pagination.page) params.append('page', String(pagination.page));
        if (pagination.limit) params.append('limit', String(pagination.limit));
      }

      const response = await fetch(`${this.apiBaseUrl}/submissions?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        return this.createErrorResponse('Failed to list submissions', errorData.message || 'Unknown error');
      }

      const data = await response.json();
      return this.createSuccessResponse(data.submissions);
    } catch (error) {
      return this.createErrorResponse('Service error', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async gradeSubmission(submissionId: string, gradeData: GradeSubmissionRequest): Promise<ApiResponse<AssignmentSubmission>> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/submissions/${submissionId}/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gradeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return this.createErrorResponse('Failed to grade submission', errorData.message || 'Unknown error');
      }

      const data = await response.json();
      return this.createSuccessResponse(data.submission);
    } catch (error) {
      return this.createErrorResponse('Service error', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async getSubmissionsByAssignment(assignmentId: string): Promise<ApiResponse<AssignmentSubmission[]>> {
    return this.listSubmissions({ assignmentId });
  }

  async getSubmissionsByStudent(studentId: string): Promise<ApiResponse<AssignmentSubmission[]>> {
    return this.listSubmissions({ studentId });
  }

  async submitPeerReview(submissionId: string, reviewData: any): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/submissions/${submissionId}/peer-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return this.createErrorResponse('Failed to submit peer review', errorData.message || 'Unknown error');
      }

      return this.createSuccessResponse(undefined);
    } catch (error) {
      return this.createErrorResponse('Service error', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private createSuccessResponse<T>(data: T): ApiResponse<T> {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  private createErrorResponse(error: string, message: string): ApiResponse<any> {
    return {
      success: false,
      error,
      message,
      timestamp: new Date().toISOString(),
    };
  }
}

export class CourseService implements ICourseService {
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string) {
    this.apiBaseUrl = apiBaseUrl;
  }

  async createCourse(courseData: CreateCourseRequest): Promise<ApiResponse<Course>> {
    try {
      // Validate input
      const validation = validateCourse(courseData);
      if (!validation.isValid) {
        return this.createErrorResponse('Validation failed', validation.errors.join(', '));
      }

      const response = await fetch(`${this.apiBaseUrl}/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return this.createErrorResponse('Failed to create course', errorData.message || 'Unknown error');
      }

      const data = await response.json();
      return this.createSuccessResponse(data.course);
    } catch (error) {
      return this.createErrorResponse('Service error', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async getCourse(courseId: string): Promise<ApiResponse<Course>> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/courses/${courseId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        return this.createErrorResponse('Failed to get course', errorData.message || 'Unknown error');
      }

      const data = await response.json();
      return this.createSuccessResponse(data.course);
    } catch (error) {
      return this.createErrorResponse('Service error', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async updateCourse(courseId: string, courseData: UpdateCourseRequest): Promise<ApiResponse<Course>> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return this.createErrorResponse('Failed to update course', errorData.message || 'Unknown error');
      }

      const data = await response.json();
      return this.createSuccessResponse(data.course);
    } catch (error) {
      return this.createErrorResponse('Service error', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async deleteCourse(courseId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/courses/${courseId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        return this.createErrorResponse('Failed to delete course', errorData.message || 'Unknown error');
      }

      return this.createSuccessResponse(undefined);
    } catch (error) {
      return this.createErrorResponse('Service error', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async listCourses(filters?: CourseFilters, pagination?: Partial<PaginationInfo>): Promise<ApiResponse<Course[]>> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
          }
        });
      }

      if (pagination) {
        if (pagination.page) params.append('page', String(pagination.page));
        if (pagination.limit) params.append('limit', String(pagination.limit));
      }

      const response = await fetch(`${this.apiBaseUrl}/courses?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        return this.createErrorResponse('Failed to list courses', errorData.message || 'Unknown error');
      }

      const data = await response.json();
      return this.createSuccessResponse(data.courses);
    } catch (error) {
      return this.createErrorResponse('Service error', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async publishCourse(courseId: string): Promise<ApiResponse<Course>> {
    return this.updateCourse(courseId, { status: 'published' });
  }

  async archiveCourse(courseId: string): Promise<ApiResponse<Course>> {
    return this.updateCourse(courseId, { status: 'archived' });
  }

  async enrollStudent(courseId: string, studentId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return this.createErrorResponse('Failed to enroll student', errorData.message || 'Unknown error');
      }

      return this.createSuccessResponse(undefined);
    } catch (error) {
      return this.createErrorResponse('Service error', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async unenrollStudent(courseId: string, studentId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/courses/${courseId}/enroll/${studentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        return this.createErrorResponse('Failed to unenroll student', errorData.message || 'Unknown error');
      }

      return this.createSuccessResponse(undefined);
    } catch (error) {
      return this.createErrorResponse('Service error', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async getEnrolledStudents(courseId: string): Promise<ApiResponse<User[]>> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/courses/${courseId}/students`);
      
      if (!response.ok) {
        const errorData = await response.json();
        return this.createErrorResponse('Failed to get enrolled students', errorData.message || 'Unknown error');
      }

      const data = await response.json();
      return this.createSuccessResponse(data.students);
    } catch (error) {
      return this.createErrorResponse('Service error', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async getCoursesByInstructor(instructorId: string): Promise<ApiResponse<Course[]>> {
    return this.listCourses({ instructorId });
  }

  private createSuccessResponse<T>(data: T): ApiResponse<T> {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  private createErrorResponse(error: string, message: string): ApiResponse<any> {
    return {
      success: false,
      error,
      message,
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================================================
// SERVICE FACTORY
// ============================================================================

export class ServiceFactory {
  private static instance: ServiceFactory;
  private apiBaseUrl: string;

  private constructor(apiBaseUrl: string) {
    this.apiBaseUrl = apiBaseUrl;
  }

  static getInstance(apiBaseUrl: string): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory(apiBaseUrl);
    }
    return ServiceFactory.instance;
  }

  getUserService(): IUserService {
    return new UserService(this.apiBaseUrl);
  }

  getAssignmentService(): IAssignmentService {
    return new AssignmentService(this.apiBaseUrl);
  }

  getSubmissionService(): ISubmissionService {
    return new SubmissionService(this.apiBaseUrl);
  }

  getCourseService(): ICourseService {
    return new CourseService(this.apiBaseUrl);
  }
}
