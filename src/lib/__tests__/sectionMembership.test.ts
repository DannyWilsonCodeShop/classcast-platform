import { resolveStudentSection, countBySection } from '../sectionMembership';

const a = { sectionId: 'sec_a', sectionName: 'Section 1' };
const b = { sectionId: 'sec_b', sectionName: 'Section 2' };

describe('sectionMembership', () => {
  it('counts unassigned students in the lone section', () => {
    const students = [{}, { sectionName: 'No Section' }, { sectionId: undefined }];
    expect(countBySection(students, [a])).toEqual({ sec_a: 3 });
  });

  it('keeps a student with another sectionId out of the lone section', () => {
    expect(resolveStudentSection({ sectionId: 'other' }, [a])).toBeNull();
    expect(countBySection([{ sectionId: 'other' }], [a])).toEqual({});
  });

  it('leaves unassigned students unassigned with two sections', () => {
    expect(resolveStudentSection({}, [a, b])).toBeNull();
  });

  it('prefers an explicit match', () => {
    expect(resolveStudentSection({ sectionId: 'sec_b' }, [a, b])).toBe(b);
    expect(resolveStudentSection({ sectionName: 'Section 1' }, [a, b])).toBe(a);
  });
});
