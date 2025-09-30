// ============================================================================
// ASSIGNMENT SERVICE - Handles all assignment-related business logic
// ============================================================================

import { BaseService } from './BaseService';
import { 
  Assignment, 
  AssignmentDBItem, 
  CreateAssignmentRequest,
  ApiResponse 
} from '../types';

export class AssignmentService extends BaseService {
  constructor() {
    super(process.env['ASSIGNMENTS_TABLE_NAME'] || 'Assignments');
  }

  // ============================================================================
  // ASSIGNMENT MANAGEMENT
  // ============================================================================

  async getAssignmentById(assignmentId: string): Promise<Assignment | null> {
    try {
      // First get the course ID from the assignment
      const assignmentItem = await this.getItem<AssignmentDBItem>(
        `ASSIGNMENT#${assignmentId}`,
        'METADATA'
      );
      
      if (!assignmentItem) return null;

      return this.mapDBItemToAssignment(assignmentItem);
    } catch (error) {
      this.handleError(error, 'getAssignmentById');
    }
  }

  async getAssignmentsByCourse(courseId: string): Promise<Assignment[]> {
    try {
      const assignmentItems = await this.queryItems<AssignmentDBItem>(
        `COURSE#${courseId}`,
        'ASSIGNMENT#'
      );

      return assignmentItems.map(item => this.mapDBItemToAssignment(item));
    } catch (error) {
      this.handleError(error, 'getAssignmentsByCourse');
    }
  }

  async createAssignment(courseId: string, assignmentData: CreateAssignmentRequest): Promise<Assignment> {
    try {
      this.validateRequired(assignmentData, [
        'title', 'description', 'dueDate', 'points', 'submissionType', 'instructions'
      ]);

      this.validateAssignmentData(assignmentData);

      const assignmentId = this.generateId('assignment');
      const assignmentDBItem: AssignmentDBItem = {
        PK: `COURSE#${courseId}`,
        SK: `ASSIGNMENT#${assignmentId}`,
        GSI1PK: `DUE_DATE#${assignmentData.dueDate}`,
        GSI1SK: `ASSIGNMENT#${assignmentId}`,
        courseId,
        assignmentId,
        title: assignmentData.title,
        description: assignmentData.description,
        dueDate: assignmentData.dueDate,
        points: assignmentData.points,
        status: 'draft',
        submissionType: assignmentData.submissionType,
        instructions: assignmentData.instructions,
        rubric: assignmentData.rubric,
        peerReview: assignmentData.peerReview,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.putItem(assignmentDBItem);

      return this.mapDBItemToAssignment(assignmentDBItem);
    } catch (error) {
      this.handleError(error, 'createAssignment');
    }
  }

  async updateAssignment(assignmentId: string, updates: Partial<Assignment>): Promise<Assignment> {
    try {
      // First get the course ID from the assignment
      const assignmentItem = await this.getItem<AssignmentDBItem>(
        `ASSIGNMENT#${assignmentId}`,
        'METADATA'
      );
      
      if (!assignmentItem) {
        throw new Error('Assignment not found');
      }

      // Validate that only allowed fields are updated
      const allowedFields = [
        'title', 'description', 'dueDate', 'points', 'status', 'instructions',
        'rubric', 'peerReview'
      ];

      const filteredUpdates = Object.keys(updates)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updates[key];
          return obj;
        }, {} as any);

      const updatedItem = await this.updateItem<AssignmentDBItem>(
        `COURSE#${assignmentItem.courseId}`,
        `ASSIGNMENT#${assignmentId}`,
        filteredUpdates
      );

      return this.mapDBItemToAssignment(updatedItem);
    } catch (error) {
      this.handleError(error, 'updateAssignment');
    }
  }

  async deleteAssignment(assignmentId: string): Promise<void> {
    try {
      // First get the course ID from the assignment
      const assignmentItem = await this.getItem<AssignmentDBItem>(
        `ASSIGNMENT#${assignmentId}`,
        'METADATA'
      );
      
      if (!assignmentItem) {
        throw new Error('Assignment not found');
      }

      // Check if assignment has submissions
      const submissions = await this.getSubmissionsByAssignment(assignmentId);
      if (submissions.length > 0) {
        throw new Error('Cannot delete assignment with existing submissions');
      }

      // Delete assignment
      await this.deleteItem(
        `COURSE#${assignmentItem.courseId}`,
        `ASSIGNMENT#${assignmentId}`
      );
    } catch (error) {
      this.handleError(error, 'deleteAssignment');
    }
  }

  async publishAssignment(assignmentId: string): Promise<Assignment> {
    try {
      return await this.updateAssignment(assignmentId, { status: 'published' });
    } catch (error) {
      this.handleError(error, 'publishAssignment');
    }
  }

  async completeAssignment(assignmentId: string): Promise<Assignment> {
    try {
      return await this.updateAssignment(assignmentId, { status: 'completed' });
    } catch (error) {
      this.handleError(error, 'completeAssignment');
    }
  }

  // ============================================================================
  // ASSIGNMENT QUERIES
  // ============================================================================

  async getAssignmentsByDueDate(dueDate: string): Promise<Assignment[]> {
    try {
      const assignmentItems = await this.queryItems<AssignmentDBItem>(
        `DUE_DATE#${dueDate}`,
        'ASSIGNMENT#',
        'GSI1'
      );

      return assignmentItems.map(item => this.mapDBItemToAssignment(item));
    } catch (error) {
      this.handleError(error, 'getAssignmentsByDueDate');
    }
  }

  async getUpcomingAssignments(courseId: string, days: number = 7): Promise<Assignment[]> {
    try {
      const now = new Date();
      const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
      
      const assignmentItems = await this.queryItems<AssignmentDBItem>(
        `COURSE#${courseId}`,
        'ASSIGNMENT#'
      );

      return assignmentItems
        .filter(item => {
          const dueDate = new Date(item.dueDate);
          return dueDate > now && dueDate <= futureDate;
        })
        .map(item => this.mapDBItemToAssignment(item));
    } catch (error) {
      this.handleError(error, 'getUpcomingAssignments');
    }
  }

  async getOverdueAssignments(courseId: string): Promise<Assignment[]> {
    try {
      const now = new Date();
      
      const assignmentItems = await this.queryItems<AssignmentDBItem>(
        `COURSE#${courseId}`,
        'ASSIGNMENT#'
      );

      return assignmentItems
        .filter(item => {
          const dueDate = new Date(item.dueDate);
          return dueDate < now && item.status !== 'completed';
        })
        .map(item => this.mapDBItemToAssignment(item));
    } catch (error) {
      this.handleError(error, 'getOverdueAssignments');
    }
  }

  // ============================================================================
  // SUBMISSION MANAGEMENT
  // ============================================================================

  async getSubmissionsByAssignment(assignmentId: string): Promise<any[]> {
    try {
      // This would be handled by the SubmissionService
      // For now, we'll return an empty array
      return [];
    } catch (error) {
      this.handleError(error, 'getSubmissionsByAssignment');
    }
  }

  async getAssignmentStats(assignmentId: string): Promise<{
    totalSubmissions: number;
    gradedSubmissions: number;
    averageGrade: number;
    completionRate: number;
  }> {
    try {
      const submissions = await this.getSubmissionsByAssignment(assignmentId);
      const gradedSubmissions = submissions.filter(sub => sub.status === 'graded');
      const totalGrades = gradedSubmissions.reduce((sum, sub) => sum + (sub.grade || 0), 0);
      
      return {
        totalSubmissions: submissions.length,
        gradedSubmissions: gradedSubmissions.length,
        averageGrade: gradedSubmissions.length > 0 ? totalGrades / gradedSubmissions.length : 0,
        completionRate: submissions.length > 0 ? (gradedSubmissions.length / submissions.length) * 100 : 0
      };
    } catch (error) {
      this.handleError(error, 'getAssignmentStats');
    }
  }

  // ============================================================================
  // MAPPING METHODS
  // ============================================================================

  private mapDBItemToAssignment(item: AssignmentDBItem): Assignment {
    return {
      id: item.assignmentId,
      courseId: item.courseId,
      title: item.title,
      description: item.description,
      dueDate: item.dueDate,
      points: item.points,
      status: item.status,
      submissionType: item.submissionType,
      instructions: item.instructions,
      rubric: item.rubric,
      peerReview: item.peerReview,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  }

  // ============================================================================
  // VALIDATION METHODS
  // ============================================================================

  private validateAssignmentData(assignmentData: CreateAssignmentRequest): void {
    if (assignmentData.points < 1 || assignmentData.points > 1000) {
      throw new Error('Points must be between 1 and 1000');
    }

    const dueDate = new Date(assignmentData.dueDate);
    const now = new Date();
    
    if (dueDate <= now) {
      throw new Error('Due date must be in the future');
    }

    if (assignmentData.peerReview?.enabled) {
      if (assignmentData.peerReview.minResponses < 1) {
        throw new Error('Minimum responses must be at least 1');
      }

      if (assignmentData.peerReview.maxResponses < assignmentData.peerReview.minResponses) {
        throw new Error('Maximum responses must be greater than or equal to minimum responses');
      }

      if (assignmentData.peerReview.wordLimit && assignmentData.peerReview.wordLimit < 10) {
        throw new Error('Word limit must be at least 10');
      }

      if (assignmentData.peerReview.characterLimit && assignmentData.peerReview.characterLimit < 50) {
        throw new Error('Character limit must be at least 50');
      }
    }
  }
}
