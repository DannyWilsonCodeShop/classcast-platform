export interface SectionRef {
  sectionId: string;
  sectionName: string;
}

export interface StudentSectionRef {
  sectionId?: string | null;
  sectionName?: string | null;
}

const UNASSIGNED_LABEL = 'No Section';

/**
 * Resolve which section a student belongs to.
 * An explicit sectionId/sectionName match wins. A student with no section info
 * belongs to the lone section when the course has exactly one section.
 */
export function resolveStudentSection<T extends SectionRef>(
  student: StudentSectionRef,
  sections: T[]
): T | null {
  const sectionId = student.sectionId || undefined;
  const sectionName =
    student.sectionName && student.sectionName !== UNASSIGNED_LABEL ? student.sectionName : undefined;

  if (sectionId || sectionName) {
    return (
      sections.find(s => (!!sectionId && s.sectionId === sectionId) || (!!sectionName && s.sectionName === sectionName)) ||
      null
    );
  }

  return sections.length === 1 ? sections[0] : null;
}

/** Count students per sectionId using resolveStudentSection. */
export function countBySection<T extends SectionRef>(
  students: StudentSectionRef[],
  sections: T[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const student of students) {
    const section = resolveStudentSection(student, sections);
    if (section) counts[section.sectionId] = (counts[section.sectionId] || 0) + 1;
  }
  return counts;
}
