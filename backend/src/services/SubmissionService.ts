// ============================================================================
// SUBMISSION SERVICE - Handles all submission-related business logic
// ============================================================================

import { BaseService } from './BaseService';
import { 
  Submission, 
  SubmissionDBItem, 
  SubmitAssignmentRequest,
  GradeSubmissionRequest,
  ApiResponse 
} from '../types';

export class SubmissionService extends BaseService {
  constructor() {
    super(process.env['SUBMISSIONS_TABLE_NAME'] || 'Submissions');
  }

  // ============================================================================
  // SUBMISSION MANAGEMENT
  // ============================================================================

  async getSubmissionById(submissionId: string): Promise<Submission | null> {
    try {
      // First get the assignment ID from the submission
      const submissionItem = await this.getItem<SubmissionDBItem>(
        `SUBMISSION#${submissionId}`,
        'METADATA'
      );
      
      if (!submissionItem) return null;

      return this.mapDBItemToSubmission(submissionItem);
    } catch (error) {
      this.handleError(error, 'getSubmissionById');
    }
  }

  async getSubmissionsByAssignment(assignmentId: string): Promise<Submission[]> {
    try {
      const submissionItems = await this.queryItems<SubmissionDBItem>(
        `ASSIGNMENT#${assignmentId}`,
        'SUBMISSION#'
      );

      return submissionItems.map(item => this.mapDBItemToSubmission(item));
    } catch (error) {
      this.handleError(error, 'getSubmissionsByAssignment');
    }
  }

  async getSubmissionsByStudent(studentId: string): Promise<Submission[]> {
    try {
      const submissionItems = await this.queryItems<SubmissionDBItem>(
        `STUDENT#${studentId}`,
        'SUBMISSION#',
        'GSI1'
      );

      return submissionItems.map(item => this.mapDBItemToSubmission(item));
    } catch (error) {
      this.handleError(error, 'getSubmissionsByStudent');
    }
  }

  async getSubmissionsByCourse(courseId: string): Promise<Submission[]> {
    try {
      // Get all assignments for the course first
      const assignmentService = new (await import('./AssignmentService')).AssignmentService();
      const assignments = await assignmentService.getAssignmentsByCourse(courseId);
      
      // Get submissions for each assignment
      const allSubmissions: Submission[] = [];
      for (const assignment of assignments) {
        const submissions = await this.getSubmissionsByAssignment(assignment.id);
        allSubmissions.push(...submissions);
      }

      return allSubmissions;
    } catch (error) {
      this.handleError(error, 'getSubmissionsByCourse');
    }
  }

  async createSubmission(
    assignmentId: string, 
    studentId: string, 
    submissionData: SubmitAssignmentRequest
  ): Promise<Submission> {
    try {
      this.validateRequired(submissionData, ['title']);

      // Check if student already submitted
      const existingSubmission = await this.getSubmissionByStudentAndAssignment(studentId, assignmentId);
      if (existingSubmission) {
        throw new Error('Student has already submitted this assignment');
      }

      // Validate submission based on assignment type
      await this.validateSubmissionData(assignmentId, submissionData);

      const submissionId = this.generateId('submission');
      const submissionDBItem: SubmissionDBItem = {
        PK: `ASSIGNMENT#${assignmentId}`,
        SK: `SUBMISSION#${submissionId}`,
        GSI1PK: `STUDENT#${studentId}`,
        GSI1SK: `SUBMISSION#${submissionId}`,
        assignmentId,
        courseId: '', // Will be populated from assignment
        studentId,
        studentName: '', // Will be populated from user data
        title: submissionData.title,
        content: submissionData.content,
        fileUrl: submissionData.fileUrl,
        thumbnailUrl: submissionData.thumbnailUrl,
        duration: submissionData.duration,
        fileSize: submissionData.fileSize,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.putItem(submissionDBItem);

      return this.mapDBItemToSubmission(submissionDBItem);
    } catch (error) {
      this.handleError(error, 'createSubmission');
    }
  }

  async updateSubmission(submissionId: string, updates: Partial<Submission>): Promise<Submission> {
    try {
      // First get the assignment ID from the submission
      const submissionItem = await this.getItem<SubmissionDBItem>(
        `SUBMISSION#${submissionId}`,
        'METADATA'
      );
      
      if (!submissionItem) {
        throw new Error('Submission not found');
      }

      // Validate that only allowed fields are updated
      const allowedFields = [
        'title', 'content', 'fileUrl', 'thumbnailUrl', 'duration', 'fileSize'
      ];

      const filteredUpdates = Object.keys(updates)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updates[key];
          return obj;
        }, {} as any);

      const updatedItem = await this.updateItem<SubmissionDBItem>(
        `ASSIGNMENT#${submissionItem.assignmentId}`,
        `SUBMISSION#${submissionId}`,
        filteredUpdates
      );

      return this.mapDBItemToSubmission(updatedItem);
    } catch (error) {
      this.handleError(error, 'updateSubmission');
    }
  }

  async deleteSubmission(submissionId: string): Promise<void> {
    try {
      // First get the assignment ID from the submission
      const submissionItem = await this.getItem<SubmissionDBItem>(
        `SUBMISSION#${submissionId}`,
        'METADATA'
      );
      
      if (!submissionItem) {
        throw new Error('Submission not found');
      }

      // Check if submission is already graded
      if (submissionItem.status === 'graded') {
        throw new Error('Cannot delete graded submission');
      }

      // Delete submission
      await this.deleteItem(
        `ASSIGNMENT#${submissionItem.assignmentId}`,
        `SUBMISSION#${submissionId}`
      );
    } catch (error) {
      this.handleError(error, 'deleteSubmission');
    }
  }

  // ============================================================================
  // GRADING MANAGEMENT
  // ============================================================================

  async gradeSubmission(submissionId: string, gradeData: GradeSubmissionRequest): Promise<Submission> {
    try {
      this.validateRequired(gradeData, ['grade', 'feedback', 'rubric']);

      if (gradeData.grade < 0 || gradeData.grade > 100) {
        throw new Error('Grade must be between 0 and 100');
      }

      // First get the assignment ID from the submission
      const submissionItem = await this.getItem<SubmissionDBItem>(
        `SUBMISSION#${submissionId}`,
        'METADATA'
      );
      
      if (!submissionItem) {
        throw new Error('Submission not found');
      }

      const updatedItem = await this.updateItem<SubmissionDBItem>(
        `ASSIGNMENT#${submissionItem.assignmentId}`,
        `SUBMISSION#${submissionId}`,
        {
          status: 'graded',
          grade: gradeData.grade,
          feedback: gradeData.feedback,
          rubric: gradeData.rubric,
          gradedAt: new Date().toISOString()
        }
      );

      return this.mapDBItemToSubmission(updatedItem);
    } catch (error) {
      this.handleError(error, 'gradeSubmission');
    }
  }

  async returnSubmission(submissionId: string, feedback: string): Promise<Submission> {
    try {
      // First get the assignment ID from the submission
      const submissionItem = await this.getItem<SubmissionDBItem>(
        `SUBMISSION#${submissionId}`,
        'METADATA'
      );
      
      if (!submissionItem) {
        throw new Error('Submission not found');
      }

      const updatedItem = await this.updateItem<SubmissionDBItem>(
        `ASSIGNMENT#${submissionItem.assignmentId}`,
        `SUBMISSION#${submissionId}`,
        {
          status: 'returned',
          feedback: feedback
        }
      );

      return this.mapDBItemToSubmission(updatedItem);
    } catch (error) {
      this.handleError(error, 'returnSubmission');
    }
  }

  // ============================================================================
  // SUBMISSION QUERIES
  // ============================================================================

  async getSubmissionByStudentAndAssignment(studentId: string, assignmentId: string): Promise<Submission | null> {
    try {
      const submissionItems = await this.queryItems<SubmissionDBItem>(
        `STUDENT#${studentId}`,
        `SUBMISSION#`,
        'GSI1'
      );

      const submission = submissionItems.find(item => item.assignmentId === assignmentId);
      return submission ? this.mapDBItemToSubmission(submission) : null;
    } catch (error) {
      this.handleError(error, 'getSubmissionByStudentAndAssignment');
    }
  }

  async getGradedSubmissions(assignmentId: string): Promise<Submission[]> {
    try {
      const submissions = await this.getSubmissionsByAssignment(assignmentId);
      return submissions.filter(submission => submission.status === 'graded');
    } catch (error) {
      this.handleError(error, 'getGradedSubmissions');
    }
  }

  async getPendingSubmissions(assignmentId: string): Promise<Submission[]> {
    try {
      const submissions = await this.getSubmissionsByAssignment(assignmentId);
      return submissions.filter(submission => submission.status === 'submitted');
    } catch (error) {
      this.handleError(error, 'getPendingSubmissions');
    }
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  async getSubmissionStats(assignmentId: string): Promise<{
    totalSubmissions: number;
    gradedSubmissions: number;
    pendingSubmissions: number;
    averageGrade: number;
    completionRate: number;
  }> {
    try {
      const submissions = await this.getSubmissionsByAssignment(assignmentId);
      const gradedSubmissions = submissions.filter(sub => sub.status === 'graded');
      const pendingSubmissions = submissions.filter(sub => sub.status === 'submitted');
      const totalGrades = gradedSubmissions.reduce((sum, sub) => sum + (sub.grade || 0), 0);
      
      return {
        totalSubmissions: submissions.length,
        gradedSubmissions: gradedSubmissions.length,
        pendingSubmissions: pendingSubmissions.length,
        averageGrade: gradedSubmissions.length > 0 ? totalGrades / gradedSubmissions.length : 0,
        completionRate: submissions.length > 0 ? (gradedSubmissions.length / submissions.length) * 100 : 0
      };
    } catch (error) {
      this.handleError(error, 'getSubmissionStats');
    }
  }

  // ============================================================================
  // MAPPING METHODS
  // ============================================================================

  private mapDBItemToSubmission(item: SubmissionDBItem): Submission {
    return {
      id: item.SK.replace('SUBMISSION#', ''),
      assignmentId: item.assignmentId,
      courseId: item.courseId,
      studentId: item.studentId,
      studentName: item.studentName,
      title: item.title,
      content: item.content,
      fileUrl: item.fileUrl,
      thumbnailUrl: item.thumbnailUrl,
      duration: item.duration,
      fileSize: item.fileSize,
      status: item.status,
      grade: item.grade,
      feedback: item.feedback,
      rubric: item.rubric,
      submittedAt: item.submittedAt,
      gradedAt: item.gradedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  }

  // ============================================================================
  // VALIDATION METHODS
  // ============================================================================

  private async validateSubmissionData(assignmentId: string, submissionData: SubmitAssignmentRequest): Promise<void> {
    // Get assignment details to validate submission type
    const assignmentService = new (await import('./AssignmentService')).AssignmentService();
    const assignment = await assignmentService.getAssignmentById(assignmentId);
    
    if (!assignment) {
      throw new Error('Assignment not found');
    }

    if (assignment.status !== 'published') {
      throw new Error('Assignment is not published');
    }

    // Check if assignment is past due
    const dueDate = new Date(assignment.dueDate);
    const now = new Date();
    if (dueDate < now) {
      throw new Error('Assignment is past due');
    }

    // Validate submission based on type
    switch (assignment.submissionType) {
      case 'video':
        if (!submissionData.fileUrl) {
          throw new Error('Video file is required for video submissions');
        }
        break;
      case 'text':
        if (!submissionData.content) {
          throw new Error('Text content is required for text submissions');
        }
        break;
      case 'file':
        if (!submissionData.fileUrl) {
          throw new Error('File is required for file submissions');
        }
        break;
      case 'url':
        if (!submissionData.content) {
          throw new Error('URL is required for URL submissions');
        }
        break;
    }
  }
}
