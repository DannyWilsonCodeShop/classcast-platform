// Study hall teacher / destination configuration, scoped by grade level.
//
// The study hall pickup (hall-pass) feature lets someone request a student be pulled to a
// teacher's study hall. Each grade level has its own set of study-hall teachers, PLUS a set
// of shared destinations (cafeteria, commons, etc.) that are available regardless of grade.
//
// To add a grade level, add an entry to GRADE_TEACHERS below — no other code change needed.

/** Grade levels offered, in display order. Strings so they match the roster's `grade` field. */
export const GRADES: string[] = ['9', '10', '11', '12'];

/** Human label for a grade value (e.g. "10" -> "10th Grade"). */
export function gradeLabel(grade: string): string {
  const n = Number(grade);
  if (!Number.isFinite(n)) return grade;
  const suffix = n === 11 || n === 12 || n === 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th';
  return `${grade}${suffix} Grade`;
}

/**
 * Study-hall teachers per grade. Grade 10 is the original Cristo Rey list.
 * Other grades start empty — add names here as those study halls come online.
 */
export const GRADE_TEACHERS: Record<string, string[]> = {
  '9': [],
  '10': [
    'Dr. Diaz',
    'Ms. Marlar',
    'Ms. Tate',
    'Ms. Alvarado',
    'Mr. Wilson',
    'Mr. Barrow',
    'Mr. Gordon',
    'Ms. King',
    'Ms. Brown',
    'Ms. Pollitzer',
    'Dean Stevens',
  ],
  '11': [],
  '12': [],
};

/**
 * Destinations available for every grade (not tied to a grade's study-hall teachers).
 * "Other" stays last so it reads as the catch-all.
 */
export const SHARED_DESTINATIONS: string[] = [
  'Mr. Johnson (CWS)',
  'IT Service Desk',
  'Cafeteria',
  'Commons',
  'Other',
];

/** The default grade shown when the device has no saved preference. */
export const DEFAULT_GRADE = '10';

/**
 * The full ordered option list for a grade's teacher dropdown:
 * that grade's study-hall teachers first, then the shared destinations.
 */
export function teachersForGrade(grade: string): string[] {
  const gradeTeachers = GRADE_TEACHERS[grade] || [];
  return [...gradeTeachers, ...SHARED_DESTINATIONS];
}

/** True if a selected teacher is a shared destination (valid for any grade). */
export function isSharedDestination(teacher: string): boolean {
  return SHARED_DESTINATIONS.includes(teacher);
}

/** True if a teacher is a valid option for the given grade (grade teacher or shared). */
export function isValidTeacherForGrade(teacher: string, grade: string): boolean {
  return teachersForGrade(grade).includes(teacher);
}
