/**
 * Individualized Problem Sets types for ClassCast
 */

export interface ProblemBank {
  bankId: string;
  instructorId: string;
  courseId: string;
  title: string;
  description?: string;
  problemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Problem {
  problemId: string;
  bankId: string;
  content: string;
  imageUrl?: string;
  orderIndex: number;
  createdAt: string;
}

export interface ProblemAssignmentRecord {
  id: string;
  assignmentId: string;
  studentId: string;
  problemId: string;
  bankId: string;
  assignedAt: string;
}

export interface ProblemInput {
  id: string;
  content: string;
  imageFile?: File;
  imageUrl?: string;
  orderIndex: number;
}

export interface ParsedSpreadsheet {
  rows: string[];
  totalRows: number;
  errors: string[];
}

export interface ProblemAssignment {
  problemId: string;
  studentId: string;
}

export interface CreateBankRequest {
  title: string;
  description?: string;
  courseId: string;
  instructorId: string;
  problems: { content: string; imageUrl?: string }[];
}

export interface DistributeRequest {
  assignmentId: string;
  bankId: string;
  sectionId: string;
}

export interface DistributeResponse {
  success: boolean;
  distributed: number;
  unassignedProblems: number;
}
