import { getAssignmentMaxPoints, resolveAssignmentMaxPoints, getGradePercentage } from '../assignmentPoints';

describe('assignmentPoints', () => {
  it('uses maxScore (video assignment, maxScore 15 with rubric 15)', () => {
    expect(getAssignmentMaxPoints({ maxScore: 15, rubric: [{ points: 15 }] })).toBe(15);
  });
  it('maxScore beats a conflicting legacy points field (Quadratic Functions Project)', () => {
    expect(getAssignmentMaxPoints({ maxScore: 15, points: 100 })).toBe(15);
  });
  it('maxScore beats rubric total (Polyatomic Ions: 100 vs 30)', () => {
    expect(getAssignmentMaxPoints({ maxScore: 100, rubric: [{ points: 30 }] })).toBe(100);
  });
  it('handles non-100 values on discussion, choice-board, module and video types', () => {
    expect(getAssignmentMaxPoints({ assignmentType: 'discussion', maxScore: 12 })).toBe(12);
    expect(getAssignmentMaxPoints({ assignmentType: 'choice-board', maxScore: 16 })).toBe(16);
    expect(getAssignmentMaxPoints({ assignmentType: 'module', maxScore: 20 })).toBe(20);
    expect(getAssignmentMaxPoints({ assignmentType: 'video', maxScore: 5 })).toBe(5);
  });
  it('falls through points, totalPoints, rubric, discussionConfig, assessment questions', () => {
    expect(getAssignmentMaxPoints({ points: 8 })).toBe(8);
    expect(getAssignmentMaxPoints({ totalPoints: 9 })).toBe(9);
    expect(getAssignmentMaxPoints({ rubric: { totalPoints: 30 } })).toBe(30);
    expect(getAssignmentMaxPoints({ rubric: { categories: [{ points: 10 }, { maxPoints: 5 }] } })).toBe(15);
    expect(getAssignmentMaxPoints({ rubric: [{ levels: [{ score: 1 }, { score: 4 }] }, { levels: [{ score: 4 }] }] })).toBe(8);
    expect(getAssignmentMaxPoints({ discussionConfig: { points: 25 } })).toBe(25);
    expect(getAssignmentMaxPoints({ assessmentQuestions: [{ points: 2 }, { points: 3 }] })).toBe(5);
  });
  it('treats string, zero, null and negative values as missing', () => {
    expect(getAssignmentMaxPoints({ maxScore: '12' })).toBe(12);
    expect(getAssignmentMaxPoints({ maxScore: 0, points: 7 })).toBe(7);
    expect(getAssignmentMaxPoints({ maxScore: null, points: -1, totalPoints: 4 })).toBe(4);
  });
  it('uses submission value only when assignment has none, then falls back to 100', () => {
    expect(getAssignmentMaxPoints({ maxScore: 15 }, { maxPoints: 50 })).toBe(15);
    expect(getAssignmentMaxPoints({}, { maxPoints: 50 })).toBe(50);
    expect(resolveAssignmentMaxPoints(undefined, {})).toEqual({ points: 100, source: 'default', isFallback: true });
    expect(resolveAssignmentMaxPoints({ maxScore: 15 }).isFallback).toBe(false);
  });
  it('computes percentages', () => {
    expect(getGradePercentage(12, 16)).toBe(75);
    expect(getGradePercentage(0, 15)).toBe(0);
    expect(getGradePercentage(null, 15)).toBeNull();
  });
  it('treats a full-credit raw grade as 100% (16/16)', () => {
    const max = getAssignmentMaxPoints({ maxScore: 16 });
    expect(getGradePercentage(Math.min(16, max), max)).toBe(100);
  });
});
