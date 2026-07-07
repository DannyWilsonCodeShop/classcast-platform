/**
 * Module Assignment types for ClassCast
 */

export interface ModuleConfig {
  topic: string;
  requiredVideos: number;                // 2–20
  maxVideoDurationSeconds: number;       // 30–600
  groupFormation: 'random' | 'manual' | 'self-selection';
  groupSize: number;                     // 2–8
  gradingPolicy: 'shared' | 'individual';
}

export interface ModuleGroup {
  groupId: string;
  moduleAssignmentId: string;
  studentIds: string[];
  groupSize: number;
  formationMethod: 'random' | 'manual' | 'self-selection';
}

export interface ModuleLesson {
  lessonId: string;
  moduleSubmissionId: string;
  title: string;
  description: string;
  videoUrl: string;
  authorId: string;
  orderIndex: number;
  duration: number;
  createdAt: string;
}
