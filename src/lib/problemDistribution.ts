/**
 * Problem distribution utility for ClassCast.
 * Randomly assigns problems to students 1:1 using Fisher-Yates shuffle.
 */

import { ProblemAssignment } from '@/types/problemBank';

/**
 * Distributes problems to students 1:1.
 * Each student gets exactly one unique problem.
 *
 * @param problemIds - Array of problem IDs from the bank
 * @param studentIds - Array of student user IDs from the section
 * @returns Array of problem-to-student assignments
 * @throws Error if there are fewer problems than students
 */
export function distributeProblemSet(
  problemIds: string[],
  studentIds: string[]
): ProblemAssignment[] {
  if (problemIds.length < studentIds.length) {
    throw new Error(
      `Not enough problems (${problemIds.length}) for ${studentIds.length} students`
    );
  }

  if (studentIds.length === 0) return [];

  // Fisher-Yates shuffle the problem IDs
  const shuffled = [...problemIds];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Map first N shuffled problems to students
  return studentIds.map((studentId, index) => ({
    problemId: shuffled[index],
    studentId,
  }));
}

/**
 * Assigns a problem to a late-enrolling student from the unassigned pool.
 *
 * @param allProblemIds - All problem IDs in the bank
 * @param assignedProblemIds - Already-assigned problem IDs
 * @param studentId - The new student to assign
 * @returns A ProblemAssignment or null if no problems available
 */
export function assignLateEnrollment(
  allProblemIds: string[],
  assignedProblemIds: string[],
  studentId: string
): ProblemAssignment | null {
  const assignedSet = new Set(assignedProblemIds);
  const unassigned = allProblemIds.filter(id => !assignedSet.has(id));

  if (unassigned.length === 0) return null;

  // Pick a random unassigned problem
  const randomIndex = Math.floor(Math.random() * unassigned.length);
  return {
    problemId: unassigned[randomIndex],
    studentId,
  };
}
