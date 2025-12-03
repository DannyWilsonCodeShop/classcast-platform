# Grade Export Issues - Fixed

## Issues Identified

### 1. Max Scores Always Showing 100 ✅ FIXED
**Problem:** All assignments showing 100 as max score in exports, regardless of actual assignment points.

**Root Cause:** The export API was using `assignment.points` instead of `assignment.maxScore`. Assignments store their max score in the `maxScore` field, not `points`.

**Fix Applied:**
- Updated `/api/instructor/courses/[courseId]/export-grades/route.ts`
- Changed all references from `assignment.points || 100` to `assignment.maxScore || assignment.points || 100`
- This ensures the correct max score is used throughout the export

**Files Modified:**
- `src/app/api/instructor/courses/[courseId]/export-grades/route.ts` (3 locations)

### 2. Export from Assignment Shows All Assignments ⚠️ NEEDS FRONTEND
**Problem:** When clicking export from within a specific assignment, it shows grades for ALL assignments instead of just that one.

**Root Cause:** There are two export endpoints:
1. `/api/instructor/courses/[courseId]/export-grades` - Exports ALL assignments (course-level)
2. `/api/instructor/courses/[courseId]/assignments/[assignmentId]/export-grades` - Exports ONE assignment

The frontend is calling the wrong endpoint when exporting from an assignment view.

**Solution Needed:**
Need to identify where the export button is in the assignment grading view and ensure it calls the assignment-specific endpoint.

## Export Endpoints

### Course-Level Export (All Assignments)
**Endpoint:** `GET /api/instructor/courses/[courseId]/export-grades?format=csv`

**Used By:** Students tab "Export Grades" button

**Returns:**
- All students in the course
- All assignments in the course
- Each student's grade for each assignment
- Total points, earned points, percentage, letter grade

**CSV Format:**
```
Student Name, Email, Section, Assignment 1 (50 pts), Assignment 2 (75 pts), ..., Total Points, Earned Points, Percentage, Letter Grade
```

### Assignment-Level Export (Single Assignment)
**Endpoint:** `POST /api/instructor/courses/[courseId]/assignments/[assignmentId]/export-grades`

**Should Be Used By:** Assignment grading view export button

**Returns:**
- All students in the course
- Only the specific assignment
- Each student's grade for that assignment
- Submission status and feedback

**JSON Format:**
```json
{
  "assignment": {
    "title": "Assignment Title",
    "maxScore": 50
  },
  "grades": [
    {
      "studentName": "John Doe",
      "studentEmail": "john@example.com",
      "sectionName": "Section A",
      "grade": 85,
      "maxScore": 50,
      "status": "graded",
      "submittedAt": "...",
      "feedback": "..."
    }
  ]
}
```

## Testing

### Test Course-Level Export
1. Go to Instructor → Courses → [Course] → Students tab
2. Click "Export Grades" button
3. Verify CSV includes:
   - ✅ All students
   - ✅ All assignments
   - ✅ Correct max scores (not all 100)
   - ✅ Correct earned points
   - ✅ Correct percentages

### Test Assignment-Level Export (When Implemented)
1. Go to Instructor → Courses → [Course] → Assignments → [Assignment] → Grades
2. Click "Export Grades" button
3. Verify export includes:
   - ✅ All students
   - ✅ ONLY that assignment
   - ✅ Correct max score for that assignment
   - ✅ Submission status

## Next Steps

1. ✅ Fix max score issue (DONE)
2. ⏳ Find where assignment-level export button is
3. ⏳ Update frontend to call correct endpoint based on context
4. ⏳ Add CSV conversion to assignment-level export (currently returns JSON)

## Implementation Notes

The assignment-level export endpoint exists but:
- Returns JSON instead of CSV
- Needs frontend button to trigger it
- Should be accessible from:
  - Assignment grading page
  - Bulk grading page (when filtered to one assignment)
  - Assignment details modal

## Recommended Frontend Changes

Add context-aware export:
```typescript
const handleExportGrades = async (assignmentId?: string) => {
  if (assignmentId) {
    // Export single assignment
    const response = await fetch(
      `/api/instructor/courses/${courseId}/assignments/${assignmentId}/export-grades`,
      { method: 'POST', credentials: 'include' }
    );
    const data = await response.json();
    // Convert to CSV and download
    downloadCSV(data, `${assignmentTitle}_grades.csv`);
  } else {
    // Export all assignments (existing code)
    const response = await fetch(
      `/api/instructor/courses/${courseId}/export-grades?format=csv`,
      { credentials: 'include' }
    );
    // Download CSV
  }
};
```
