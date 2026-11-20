/**
 * Single source of truth for an assignment's point value (grade denominator).
 *
 * Precedence (first positive finite number wins):
 *   1. assignment.maxScore            (the field every assignment stores)
 *   2. assignment.maxPoints
 *   3. assignment.points              (legacy; can conflict with maxScore, so it ranks lower)
 *   4. assignment.totalPoints
 *   5. rubric total (rubric.totalPoints, or sum of rubric / rubric.categories points)
 *   6. discussionConfig.points / maxPoints / totalPoints
 *   7. sum of assessmentQuestions[].points
 *   8. submission.maxScore / submission.maxPoints (only when the assignment has no source)
 *   9. DEFAULT_MAX_POINTS (100) -- `isFallback` is true so the UI can avoid claiming it
 */
export const DEFAULT_MAX_POINTS = 100;

export interface AssignmentPointsInfo {
  points: number;
  source: string;
  isFallback: boolean;
}

const positive = (v: unknown): number | null => {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number);
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : null;
};

const sumPoints = (items: unknown, keys: string[]): number | null => {
  if (!Array.isArray(items)) return null;
  let total = 0;
  for (const item of items) {
    for (const k of keys) {
      const v = positive(item?.[k]);
      if (v !== null) {
        total += v;
        break;
      }
    }
  }
  return total > 0 ? total : null;
};

const levelsTotal = (items: unknown): number | null => {
  if (!Array.isArray(items)) return null;
  let total = 0;
  for (const item of items) {
    const scores = Array.isArray(item?.levels) ? item.levels.map((l: any) => positive(l?.score) ?? 0) : [];
    total += scores.length ? Math.max(...scores) : 0;
  }
  return total > 0 ? total : null;
};

const rubricTotal = (rubric: any): number | null => {
  if (!rubric) return null;
  if (Array.isArray(rubric)) return sumPoints(rubric, ['points', 'maxPoints']) ?? levelsTotal(rubric);
  return (
    positive(rubric.totalPoints) ??
    positive(rubric.maxScore) ??
    sumPoints(rubric.categories ?? rubric.criteria, ['points', 'maxPoints']) ??
    levelsTotal(rubric.categories ?? rubric.criteria)
  );
};

export function resolveAssignmentMaxPoints(assignment?: any, submission?: any): AssignmentPointsInfo {
  const a = assignment || {};
  const candidates: Array<[string, number | null]> = [
    ['maxScore', positive(a.maxScore)],
    ['maxPoints', positive(a.maxPoints)],
    ['points', positive(a.points)],
    ['totalPoints', positive(a.totalPoints)],
    ['rubric', rubricTotal(a.rubric)],
    [
      'discussionConfig',
      positive(a.discussionConfig?.points) ??
        positive(a.discussionConfig?.maxPoints) ??
        positive(a.discussionConfig?.totalPoints),
    ],
    ['assessmentQuestions', sumPoints(a.assessmentQuestions, ['points'])],
    ['submission', positive(submission?.maxScore) ?? positive(submission?.maxPoints)],
  ];
  for (const [source, value] of candidates) {
    if (value !== null) return { points: value, source, isFallback: false };
  }
  return { points: DEFAULT_MAX_POINTS, source: 'default', isFallback: true };
}

export function getAssignmentMaxPoints(assignment?: any, submission?: any): number {
  return resolveAssignmentMaxPoints(assignment, submission).points;
}

/** Percentage 0-100 (rounded to 1 decimal), or null when grade is not a number. */
export function getGradePercentage(grade: unknown, maxPoints: number): number | null {
  const g = positive(grade) ?? (grade === 0 ? 0 : null);
  if (g === null || !(maxPoints > 0)) return null;
  return Math.round((g / maxPoints) * 1000) / 10;
}
