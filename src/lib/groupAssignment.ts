/**
 * Random group assignment utility for ClassCast.
 * Used by both Discussion Boards (small groups) and Module Assignments (random formation).
 */

/**
 * Randomly assigns students into groups of approximately targetGroupSize.
 * Uses Fisher-Yates shuffle for fair randomization.
 * Remaining students are distributed evenly so no group exceeds targetGroupSize + 1.
 *
 * @param studentIds - Array of student user IDs to assign
 * @param targetGroupSize - Desired number of students per group (3-10)
 * @returns Array of groups, each group being an array of student IDs
 */
export function assignRandomGroups(
  studentIds: string[],
  targetGroupSize: number
): string[][] {
  if (studentIds.length === 0) return [];
  if (studentIds.length <= targetGroupSize) return [[...studentIds]];

  // Fisher-Yates shuffle
  const shuffled = [...studentIds];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Calculate number of full groups
  const numGroups = Math.floor(shuffled.length / targetGroupSize);

  // Create groups
  const groups: string[][] = [];
  for (let i = 0; i < numGroups; i++) {
    groups.push(shuffled.slice(i * targetGroupSize, (i + 1) * targetGroupSize));
  }

  // Distribute remainders evenly across existing groups
  const remainder = shuffled.slice(numGroups * targetGroupSize);
  remainder.forEach((studentId, index) => {
    groups[index % groups.length].push(studentId);
  });

  return groups;
}
