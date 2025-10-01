// Semester constants for consistent use across the application

export const SEMESTER_OPTIONS = [
  { value: 'Fall', label: 'Fall' },
  { value: 'Spring', label: 'Spring' },
  { value: 'Fall+Spring', label: 'Fall+Spring (Full Year)' },
  { value: 'Summer', label: 'Summer' },
  { value: 'Winter', label: 'Winter' }
] as const;

export const SEMESTER_VALUES = SEMESTER_OPTIONS.map(option => option.value);

export type SemesterValue = typeof SEMESTER_VALUES[number];

// Helper function to get semester label
export const getSemesterLabel = (value: string): string => {
  const option = SEMESTER_OPTIONS.find(opt => opt.value === value);
  return option ? option.label : value;
};

// Helper function to check if a semester is full year
export const isFullYearSemester = (semester: string): boolean => {
  return semester === 'Fall+Spring';
};

// Helper function to get academic year for a semester
export const getAcademicYear = (semester: string, year: number): string => {
  if (isFullYearSemester(semester)) {
    return `${year}-${year + 1}`;
  }
  return year.toString();
};
