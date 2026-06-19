/**
 * Deterministic assignment card color based on assignmentId.
 * Same assignment always gets the same color everywhere.
 */
const BRAND_COLORS = [
  'bg-[#a8d8ea]', // pale blue
  'bg-[#b8e0f0]', // light sky
  'bg-[#c2e4f2]', // wash blue
  'bg-[#9ccfdf]', // soft teal
  'bg-[#aed4e6]', // muted blue
  'bg-[#bfe0ec]', // faded blue
];

export function getAssignmentColor(assignmentId: string): string {
  // Simple hash from the assignmentId string
  let hash = 0;
  for (let i = 0; i < assignmentId.length; i++) {
    hash = ((hash << 5) - hash) + assignmentId.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  const index = Math.abs(hash) % BRAND_COLORS.length;
  return BRAND_COLORS[index];
}
