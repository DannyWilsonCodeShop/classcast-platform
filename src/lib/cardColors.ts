/**
 * Deterministic card color for an assignment (student dashboard).
 * The same assignmentId always maps to the same palette entry, so every video of an
 * assignment and that assignment's colored edge in the "Due soon" rail match.
 * `from`/`to` are the mat gradient; `edge` is the solid color used for rail edges and calendar dots.
 */
export interface CardColor {
  name: string;
  from: string;
  to: string;
  edge: string;
}

export const CARD_COLORS: CardColor[] = [
  { name: 'blue', from: '#0b2540', to: '#2b8fd0', edge: '#2b8fd0' },
  { name: 'teal', from: '#0f3b3a', to: '#14b8a6', edge: '#14b8a6' },
  { name: 'purple', from: '#2e1f5e', to: '#8b5cf6', edge: '#8b5cf6' },
  { name: 'amber', from: '#4a2c05', to: '#f59e0b', edge: '#f59e0b' },
  { name: 'rose', from: '#4c0519', to: '#e11d48', edge: '#e11d48' },
  { name: 'green', from: '#052e1b', to: '#22a35a', edge: '#22a35a' },
  { name: 'indigo', from: '#1e1b4b', to: '#6366f1', edge: '#6366f1' },
];

export function getCardColor(assignmentId?: string | null): CardColor {
  const id = assignmentId || '';
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return CARD_COLORS[Math.abs(hash) % CARD_COLORS.length];
}

export function cardGradient(c: CardColor): string {
  return `linear-gradient(135deg, ${c.from} 0%, ${c.to} 100%)`;
}
