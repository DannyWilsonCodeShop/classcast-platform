// Section management utilities for grading

export interface Section {
  id: string;
  name: string;
  count: number;
}

export interface Submission {
  submissionId: string;
  studentId: string;
  studentName: string;
  sectionId?: string;
  sectionName?: string;
  status: 'submitted' | 'graded';
  grade?: number;
  [key: string]: any;
}

/**
 * Extract unique sections from submissions with counts
 */
export function extractSections(submissions: Submission[]): Section[] {
  const sectionMap = new Map<string, { name: string; count: number }>();
  
  submissions.forEach(submission => {
    if (submission.sectionId && submission.sectionName) {
      const existing = sectionMap.get(submission.sectionId);
      if (existing) {
        existing.count++;
      } else {
        sectionMap.set(submission.sectionId, {
          name: submission.sectionName,
          count: 1
        });
      }
    }
  });
  
  return Array.from(sectionMap.entries()).map(([id, data]) => ({
    id,
    name: data.name,
    count: data.count
  }));
}

/**
 * Filter submissions by section
 */
export function filterBySection(submissions: Submission[], sectionId: string): Submission[] {
  if (sectionId === 'all') {
    return submissions;
  }
  return submissions.filter(sub => sub.sectionId === sectionId);
}

/**
 * Get section statistics
 */
export function getSectionStats(submissions: Submission[], sectionId?: string) {
  const filteredSubmissions = sectionId && sectionId !== 'all' 
    ? filterBySection(submissions, sectionId)
    : submissions;
  
  const total = filteredSubmissions.length;
  const graded = filteredSubmissions.filter(sub => sub.status === 'graded').length;
  const ungraded = total - graded;
  const averageGrade = filteredSubmissions
    .filter(sub => sub.grade !== undefined && sub.grade !== null)
    .reduce((sum, sub, _, arr) => sum + (sub.grade! / arr.length), 0);
  
  return {
    total,
    graded,
    ungraded,
    averageGrade: isNaN(averageGrade) ? null : Math.round(averageGrade * 100) / 100,
    completionRate: total > 0 ? Math.round((graded / total) * 100) : 0
  };
}

/**
 * Sort submissions with section-aware sorting
 */
export function sortSubmissions(
  submissions: Submission[], 
  sortBy: 'name' | 'date' | 'grade' | 'section'
): Submission[] {
  const sorted = [...submissions];
  
  switch (sortBy) {
    case 'name':
      return sorted.sort((a, b) => {
        // Sort by last name, then first name
        const getLastName = (fullName: string) => {
          const parts = fullName.trim().split(' ');
          return parts.length > 1 ? parts[parts.length - 1] : fullName;
        };
        const lastNameCompare = getLastName(a.studentName).localeCompare(getLastName(b.studentName));
        if (lastNameCompare !== 0) return lastNameCompare;
        return a.studentName.localeCompare(b.studentName);
      });
      
    case 'date':
      return sorted.sort((a, b) => {
        const dateA = new Date(a.submittedAt || 0).getTime();
        const dateB = new Date(b.submittedAt || 0).getTime();
        return dateB - dateA; // Most recent first
      });
      
    case 'grade':
      return sorted.sort((a, b) => {
        if (a.grade === undefined && b.grade === undefined) return 0;
        if (a.grade === undefined) return 1; // Ungraded last
        if (b.grade === undefined) return -1; // Ungraded last
        return b.grade - a.grade; // Highest grade first
      });
      
    case 'section':
      return sorted.sort((a, b) => {
        // First sort by section name
        const sectionA = a.sectionName || 'No Section';
        const sectionB = b.sectionName || 'No Section';
        const sectionCompare = sectionA.localeCompare(sectionB);
        
        if (sectionCompare !== 0) return sectionCompare;
        
        // Then sort by student name within section
        const getLastName = (fullName: string) => {
          const parts = fullName.trim().split(' ');
          return parts.length > 1 ? parts[parts.length - 1] : fullName;
        };
        const lastNameCompare = getLastName(a.studentName).localeCompare(getLastName(b.studentName));
        if (lastNameCompare !== 0) return lastNameCompare;
        return a.studentName.localeCompare(b.studentName);
      });
      
    default:
      return sorted;
  }
}

/**
 * Search submissions across multiple fields
 */
export function searchSubmissions(submissions: Submission[], searchTerm: string): Submission[] {
  if (!searchTerm.trim()) {
    return submissions;
  }
  
  const term = searchTerm.toLowerCase().trim();
  
  return submissions.filter(submission => {
    return (
      submission.studentName.toLowerCase().includes(term) ||
      submission.studentEmail?.toLowerCase().includes(term) ||
      submission.sectionName?.toLowerCase().includes(term) ||
      submission.submissionId.toLowerCase().includes(term)
    );
  });
}

/**
 * Get grading progress for a section
 */
export function getGradingProgress(submissions: Submission[], sectionId?: string) {
  const stats = getSectionStats(submissions, sectionId);
  
  return {
    ...stats,
    progressPercentage: stats.completionRate,
    remainingCount: stats.ungraded,
    isComplete: stats.ungraded === 0 && stats.total > 0
  };
}