/**
 * Deterministic assignment card color based on assignmentId.
 * Same assignment always gets the same color everywhere.
 * Palette built around #6cc3d3 (teal) with complementary accent cards.
 * Uses inline styles to avoid Tailwind JIT not detecting dynamic classes.
 */
const CARD_STYLES = [
  { bg: '#6cc3d3', text: '#ffffff' },           // teal + white
  { bg: '#005587', text: '#FFC72C' },           // navy + gold
  { bg: '#4db8c7', text: '#ffffff' },           // deeper teal + white
  { bg: '#FFC72C', text: '#005587' },           // gold + navy
  { bg: '#8dd4df', text: '#003d5c' },           // light teal + dark navy
  { bg: '#003d5c', text: '#6cc3d3' },           // dark navy + teal
];

export function getAssignmentColor(assignmentId: string): string {
  const index = getAssignmentIndex(assignmentId);
  return CARD_STYLES[index].bg;
}

export function getAssignmentTitleColor(assignmentId: string): string {
  const index = getAssignmentIndex(assignmentId);
  return CARD_STYLES[index].text;
}

function getAssignmentIndex(assignmentId: string): number {
  let hash = 0;
  for (let i = 0; i < assignmentId.length; i++) {
    hash = ((hash << 5) - hash) + assignmentId.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash) % CARD_STYLES.length;
}
