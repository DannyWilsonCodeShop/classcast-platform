// ============================================================================
// COURSE SERVICE - Handles all course-related business logic
// ============================================================================

import { BaseService } from './BaseService';
import { 
  Course, 
  CourseDBItem, 
  CreateCourseRequest,
  ApiResponse 
} from '../types';

export class CourseService extends BaseService {
  constructor() {
    super(process.env['COURSES_TABLE_NAME'] || 'Courses');
  }

  // ============================================================================
  // COURSE MANAGEMENT
  // ============================================================================

  async getCourseById(courseId: string): Promise<Course | null> {
    try {
      const courseItem = await this.getItem<CourseDBItem>(`COURSE#${courseId}`, 'METADATA');
      if (!courseItem) return null;

      return this.mapDBItemToCourse(courseItem);
    } catch (error) {
      this.handleError(error, 'getCourseById');
    }
  }

  async getCoursesByInstructor(instructorId: string): Promise<Course[]> {
    try {
      const courseItems = await this.queryItems<CourseDBItem>(
        `INSTRUCTOR#${instructorId}`,
        'COURSE#',
        'GSI1'
      );

      return courseItems.map(item => this.mapDBItemToCourse(item));
    } catch (error) {
      this.handleError(error, 'getCoursesByInstructor');
    }
  }

  async getAllCourses(): Promise<Course[]> {
    try {
      // This would require a GSI on all courses
      // For now, we'll implement a scan (not recommended for production)
      const courseItems = await this.queryItems<CourseDBItem>(
        'COURSE#',
        'METADATA'
      );

      return courseItems.map(item => this.mapDBItemToCourse(item));
    } catch (error) {
      this.handleError(error, 'getAllCourses');
    }
  }

  async createCourse(instructorId: string, courseData: CreateCourseRequest): Promise<Course> {
    try {
      this.validateRequired(courseData, [
        'name', 'code', 'description', 'semester', 'year', 'credits', 
        'schedule', 'prerequisites', 'learningObjectives', 'gradingPolicy'
      ]);

      // Check if course code already exists
      const existingCourse = await this.getCourseByCode(courseData.code);
      if (existingCourse) {
        throw new Error('Course with this code already exists');
      }

      const courseId = this.generateId('course');
      const courseDBItem: CourseDBItem = {
        PK: `COURSE#${courseId}`,
        SK: 'METADATA',
        GSI1PK: `INSTRUCTOR#${instructorId}`,
        GSI1SK: `COURSE#${courseId}`,
        courseId,
        name: courseData.name,
        code: courseData.code,
        description: courseData.description,
        instructorId,
        instructorName: '', // Will be populated from user data
        status: 'draft',
        semester: courseData.semester,
        year: courseData.year,
        credits: courseData.credits,
        maxEnrollment: courseData.maxEnrollment,
        currentEnrollment: 0,
        schedule: courseData.schedule,
        prerequisites: courseData.prerequisites,
        learningObjectives: courseData.learningObjectives,
        gradingPolicy: courseData.gradingPolicy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.putItem(courseDBItem);

      return this.mapDBItemToCourse(courseDBItem);
    } catch (error) {
      this.handleError(error, 'createCourse');
    }
  }

  async updateCourse(courseId: string, updates: Partial<Course>): Promise<Course> {
    try {
      const courseItem = await this.getItem<CourseDBItem>(`COURSE#${courseId}`, 'METADATA');
      if (!courseItem) {
        throw new Error('Course not found');
      }

      // Validate that only allowed fields are updated
      const allowedFields = [
        'name', 'description', 'status', 'maxEnrollment', 'schedule',
        'prerequisites', 'learningObjectives', 'gradingPolicy'
      ];

      const filteredUpdates = Object.keys(updates)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updates[key];
          return obj;
        }, {} as any);

      const updatedItem = await this.updateItem<CourseDBItem>(
        `COURSE#${courseId}`,
        'METADATA',
        filteredUpdates
      );

      return this.mapDBItemToCourse(updatedItem);
    } catch (error) {
      this.handleError(error, 'updateCourse');
    }
  }

  async deleteCourse(courseId: string): Promise<void> {
    try {
      const courseItem = await this.getItem<CourseDBItem>(`COURSE#${courseId}`, 'METADATA');
      if (!courseItem) {
        throw new Error('Course not found');
      }

      // Check if course has students enrolled
      if (courseItem.currentEnrollment > 0) {
        throw new Error('Cannot delete course with enrolled students');
      }

      // Delete course
      await this.deleteItem(`COURSE#${courseId}`, 'METADATA');

      // TODO: Delete all related assignments and submissions
    } catch (error) {
      this.handleError(error, 'deleteCourse');
    }
  }

  async publishCourse(courseId: string): Promise<Course> {
    try {
      return await this.updateCourse(courseId, { status: 'published' });
    } catch (error) {
      this.handleError(error, 'publishCourse');
    }
  }

  async archiveCourse(courseId: string): Promise<Course> {
    try {
      return await this.updateCourse(courseId, { status: 'archived' });
    } catch (error) {
      this.handleError(error, 'archiveCourse');
    }
  }

  // ============================================================================
  // ENROLLMENT MANAGEMENT
  // ============================================================================

  async enrollStudent(courseId: string, studentId: string): Promise<void> {
    try {
      const courseItem = await this.getItem<CourseDBItem>(`COURSE#${courseId}`, 'METADATA');
      if (!courseItem) {
        throw new Error('Course not found');
      }

      // Check if course is published
      if (courseItem.status !== 'published') {
        throw new Error('Cannot enroll in unpublished course');
      }

      // Check enrollment limit
      if (courseItem.maxEnrollment && courseItem.currentEnrollment >= courseItem.maxEnrollment) {
        throw new Error('Course enrollment limit reached');
      }

      // Check if student is already enrolled
      const existingEnrollment = await this.getItem(
        `COURSE#${courseId}`,
        `STUDENT#${studentId}`
      );

      if (existingEnrollment) {
        throw new Error('Student is already enrolled in this course');
      }

      // Create enrollment record
      const enrollmentItem = {
        PK: `COURSE#${courseId}`,
        SK: `STUDENT#${studentId}`,
        GSI1PK: `STUDENT#${studentId}`,
        GSI1SK: `COURSE#${courseId}`,
        courseId,
        studentId,
        enrolledAt: new Date().toISOString(),
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.putItem(enrollmentItem);

      // Update course enrollment count
      await this.updateItem<CourseDBItem>(
        `COURSE#${courseId}`,
        'METADATA',
        { currentEnrollment: courseItem.currentEnrollment + 1 }
      );
    } catch (error) {
      this.handleError(error, 'enrollStudent');
    }
  }

  async unenrollStudent(courseId: string, studentId: string): Promise<void> {
    try {
      const enrollmentItem = await this.getItem(
        `COURSE#${courseId}`,
        `STUDENT#${studentId}`
      );

      if (!enrollmentItem) {
        throw new Error('Student is not enrolled in this course');
      }

      // Delete enrollment record
      await this.deleteItem(`COURSE#${courseId}`, `STUDENT#${studentId}`);

      // Update course enrollment count
      const courseItem = await this.getItem<CourseDBItem>(`COURSE#${courseId}`, 'METADATA');
      if (courseItem) {
        await this.updateItem<CourseDBItem>(
          `COURSE#${courseId}`,
          'METADATA',
          { currentEnrollment: Math.max(0, courseItem.currentEnrollment - 1) }
        );
      }
    } catch (error) {
      this.handleError(error, 'unenrollStudent');
    }
  }

  async getEnrolledStudents(courseId: string): Promise<any[]> {
    try {
      const enrollmentItems = await this.queryItems(
        `COURSE#${courseId}`,
        'STUDENT#'
      );

      return enrollmentItems;
    } catch (error) {
      this.handleError(error, 'getEnrolledStudents');
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private async getCourseByCode(code: string): Promise<Course | null> {
    try {
      // This would require a GSI on course code
      // For now, we'll implement a simple check
      const courses = await this.getAllCourses();
      return courses.find(course => course.code === code) || null;
    } catch (error) {
      this.handleError(error, 'getCourseByCode');
    }
  }

  private mapDBItemToCourse(item: CourseDBItem): Course {
    return {
      id: item.courseId,
      name: item.name,
      code: item.code,
      description: item.description,
      instructorId: item.instructorId,
      instructorName: item.instructorName,
      status: item.status,
      semester: item.semester,
      year: item.year,
      credits: item.credits,
      maxEnrollment: item.maxEnrollment,
      currentEnrollment: item.currentEnrollment,
      schedule: item.schedule,
      prerequisites: item.prerequisites,
      learningObjectives: item.learningObjectives,
      gradingPolicy: item.gradingPolicy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  }

  // ============================================================================
  // VALIDATION METHODS
  // ============================================================================

  private validateCourseData(courseData: CreateCourseRequest): void {
    if (courseData.credits < 1 || courseData.credits > 6) {
      throw new Error('Credits must be between 1 and 6');
    }

    if (courseData.year < new Date().getFullYear()) {
      throw new Error('Course year cannot be in the past');
    }

    if (courseData.maxEnrollment && courseData.maxEnrollment < 1) {
      throw new Error('Max enrollment must be at least 1');
    }

    if (!courseData.schedule.days.length) {
      throw new Error('Course must have at least one day scheduled');
    }

    if (!courseData.learningObjectives.length) {
      throw new Error('Course must have at least one learning objective');
    }
  }
}
