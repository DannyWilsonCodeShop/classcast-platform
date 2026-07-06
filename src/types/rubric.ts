/**
 * Shared rubric type definitions and utility functions
 * Used across assignment creation, rubric builder, and grading panels
 */

// Core types
export interface ScoringLevel {
  score: number;
  description: string;
}

export interface RubricCategory {
  id: string;
  name: string;
  levels: ScoringLevel[];
}

// Submission grading types
export interface SubmissionRubricGrade {
  grade: number;
  rubricScores: Record<string, number>; // { [categoryId]: score }
  gradingMethod: 'rubric' | 'simple';
  gradedAt: string;
}

// Validation
export interface RubricValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates a rubric array for completeness and correctness.
 * - Each category must have a non-empty name (trimmed)
 * - Each category must have at least one scoring level
 * - Each scoring level must have score >= 0
 */
export function validateRubric(rubric: RubricCategory[]): RubricValidationResult {
  const errors: string[] = [];

  if (!rubric || rubric.length === 0) {
    return { valid: true, errors: [] }; // Empty rubric is valid (rubric is optional)
  }

  rubric.forEach((category, index) => {
    if (!category.name || category.name.trim() === '') {
      errors.push(`Category ${index + 1} must have a name`);
    }
    if (!category.levels || category.levels.length === 0) {
      errors.push(`Category "${category.name || index + 1}" must have at least one scoring level`);
    } else {
      category.levels.forEach((level, levelIndex) => {
        if (level.score < 0) {
          errors.push(`Category "${category.name}", level ${levelIndex + 1}: score must be >= 0`);
        }
      });
    }
  });

  return { valid: errors.length === 0, errors };
}

/**
 * Generates a unique ID for a new rubric category.
 */
export function generateCategoryId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `cat_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `cat_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * Calculates the total grade from per-category scores.
 */
export function calculateTotal(scores: Record<string, number>): number {
  return Object.values(scores).reduce((sum, score) => sum + score, 0);
}

/**
 * Gets the maximum possible score for a category (highest score in its levels).
 * Handles multiple rubric formats:
 * - New format: { id, name, levels: [{ score, description }] }
 * - Old format: { id/name, maxPoints, description }
 * - DynamoDB format: levels may have score as string
 */
export function getCategoryMaxScore(category: RubricCategory): number {
  // Try maxPoints first (old format)
  if ((category as any).maxPoints && typeof (category as any).maxPoints === 'number') {
    return (category as any).maxPoints;
  }
  
  // Try levels array (new format)
  if (!category.levels || !Array.isArray(category.levels) || category.levels.length === 0) return 0;
  
  const scores = category.levels.map(l => {
    const score = typeof l.score === 'string' ? Number(l.score) : l.score;
    return isNaN(score) ? 0 : score;
  });
  
  return Math.max(...scores);
}

/**
 * Gets the total maximum possible score for an entire rubric.
 */
export function getRubricMaxScore(rubric: RubricCategory[]): number {
  return rubric.reduce((sum, cat) => sum + getCategoryMaxScore(cat), 0);
}
