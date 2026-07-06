# Implementation Plan: Instructor Creation Flow & Rubric Grading

## Overview

This plan implements four integrated features: a unified Create Modal triggered from the sidebar, a Rubric Builder as a step in assignment creation, a Rubric-Based Grading Panel for scoring submissions per-category, and an AI Tools landing page. Implementation follows dependency order — shared types and interfaces first, then core components, then integration and wiring.

## Tasks

- [x] 1. Set up shared types, interfaces, and utilities
  - [x] 1.1 Create shared rubric type definitions and utility functions
    - Create `src/types/rubric.ts` with `RubricCategory`, `ScoringLevel`, and `SubmissionRubricGrade` interfaces
    - Export validation function `validateRubric(rubric: RubricCategory[]): { valid: boolean; errors: string[] }`
    - Export ID generator `generateCategoryId(): string` using `crypto.randomUUID()`
    - Export `calculateTotal(scores: Record<string, number>): number` helper
    - _Requirements: 2.9, 5.2, 5.3_

  - [x] 1.2 Define template rubric data
    - Create `src/lib/template-rubrics.ts` with the five pre-built templates from the design (video_presentation, math_video_explanation, discussion_response, lab_demonstration, creative_project)
    - Export as typed constant `TEMPLATE_RUBRICS` with label, description, and categories for each
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 2. Implement CreateModal component
  - [x] 2.1 Build the CreateModal component
    - Create `src/components/instructor/CreateModal.tsx`
    - Implement centered modal overlay with backdrop click and Escape key to dismiss
    - Render three option cards: "New Course" (routes to `/instructor/classes/create`), "New Assignment" (routes to `/instructor/assignments/create`), "New Module" (routes to `/instructor/lesson-modules`)
    - Each card shows descriptive icon, label, and short description
    - Style with ClassCast theme: white bg, navy accent, rounded-2xl cards, Oswald headings
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 2.2 Write unit tests for CreateModal
    - Test modal opens/closes on backdrop click and Escape
    - Test each option navigates to the correct route
    - _Requirements: 1.1, 1.5_

- [x] 3. Implement TemplateRubricSelector component
  - [x] 3.1 Build the TemplateRubricSelector component
    - Create `src/components/instructor/TemplateRubricSelector.tsx`
    - Display template options as selectable cards with label and description
    - On selection, call `onSelect` prop with the full template categories array
    - Show confirmation dialog if `hasExistingContent` is true before replacing
    - _Requirements: 3.1, 3.3, 3.4, 3.5_

- [x] 4. Implement RubricBuilder component
  - [x] 4.1 Build the RubricBuilder component
    - Create `src/components/instructor/RubricBuilder.tsx`
    - Controlled component: accepts `value: RubricCategory[]` and `onChange` props
    - Render "Add Category" button that appends a new category with generated ID and empty name
    - Each category shows: editable name field, list of scoring levels (score number + description text), "Add Level" and "Remove Level" buttons, "Remove Category" button
    - Integrate `TemplateRubricSelector` at top of builder with "Start from Template" option
    - Apply validation rules on parent save: non-empty category names, ≥1 level per category, scores ≥ 0
    - Show inline validation errors when save is attempted
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.9, 3.1_

  - [ ]* 4.2 Write property test for RubricBuilder CRUD operations
    - **Property 1: Rubric CRUD Invariant**
    - **Validates: Requirements 2.2, 2.4, 2.5, 2.6**

  - [ ]* 4.3 Write property test for rubric validation logic
    - **Property 3: Rubric Validation**
    - **Validates: Requirements 2.9**

  - [ ]* 4.4 Write property test for template application
    - **Property 5: Template Application**
    - **Validates: Requirements 3.3**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement RubricGradingPanel component
  - [x] 6.1 Build the RubricGradingPanel component
    - Create `src/components/instructor/RubricGradingPanel.tsx`
    - Render one `CategoryScoreRow` per rubric category with: category name label, range slider (0 to category max), number input (synced bidirectionally with slider), max score label
    - Clamp input values to `[0, categoryMax]`
    - Display auto-calculated total grade as sum of all category scores
    - Provide "Set All to Maximum" button that sets each score to the highest level score in its category
    - Implement debounced auto-save via PUT to `/api/submissions/[submissionId]/grade` with `rubricScores` and computed total
    - Accept `initialScores` prop to pre-populate when editing previously graded submissions
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10_

  - [ ]* 6.2 Write property test for slider/input bidirectional sync
    - **Property 6: Slider/Input Bidirectional Sync**
    - **Validates: Requirements 4.4, 4.5**

  - [ ]* 6.3 Write property test for value clamping
    - **Property 7: Value Clamping**
    - **Validates: Requirements 4.6**

  - [ ]* 6.4 Write property test for auto-calculate total
    - **Property 8: Auto-Calculate Total**
    - **Validates: Requirements 4.7, 4.8**

  - [ ]* 6.5 Write property test for Set All to Maximum
    - **Property 9: Set All to Maximum**
    - **Validates: Requirements 4.10**

- [x] 7. Implement AI Tools Landing Page
  - [x] 7.1 Create the AI Tools page
    - Create `src/app/instructor/ai/page.tsx`
    - Render page with Oswald-styled heading "AI Tools"
    - Display feature cards: "AI Rubric Maker", "AI Assignment Maker", "AI Assignment Grader" each with title, description, "Coming Soon" badge
    - Cards are non-interactive (no click actions)
    - Style with ClassCast theme: white bg, navy text, rounded-2xl cards, gold accent badges
    - _Requirements: 6.2, 6.3, 6.4, 6.5_

- [x] 8. Implement Assignment Creation Flow (multi-step wizard)
  - [x] 8.1 Create the multi-step assignment creation page
    - Create `src/app/instructor/assignments/create/page.tsx`
    - Implement wizard with steps: (1) Course Selection (if no course context), (2) Assignment Details (title, description, type, due date, points), (3) Rubric (RubricBuilder integration, marked as optional step), (4) Review & Save
    - Add progress indicator with Oswald-styled step labels
    - Preserve form data across forward/backward navigation between steps
    - On final save: POST to `/api/assignments` including rubric JSON, handle success/error
    - Support pre-selected course via URL param `/instructor/courses/[courseId]/assignments/create`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 2.1, 2.7_

  - [ ]* 8.2 Write property test for step navigation data preservation
    - **Property 10: Step Navigation Preserves Data**
    - **Validates: Requirements 7.2**

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Integrate components into existing codebase
  - [x] 10.1 Modify InstructorSidebar to use CreateModal and add AI nav item
    - Modify `src/components/instructor/InstructorSidebar.tsx`
    - Change the Create button `onClick` from `router.push('/instructor/classes/create')` to opening the `CreateModal`
    - Add "AI" nav item to `NAV_ITEMS` array with path `/instructor/ai` and appropriate icon
    - Import and render `CreateModal` component with open/close state
    - _Requirements: 1.1, 6.1_

  - [x] 10.2 Modify GradingModal to use RubricGradingPanel
    - Modify `src/components/instructor/GradingModal.tsx`
    - Replace the hardcoded `sampleRubric` with the actual rubric from the assignment data
    - When assignment has a rubric: render `RubricGradingPanel` with the assignment's rubric categories
    - When assignment has no rubric: fall back to existing single-number grade input
    - Pass `initialScores` from submission's `rubricScores` if previously graded
    - _Requirements: 4.1, 4.11_

  - [x] 10.3 Extend the grade submission API to accept rubricScores
    - Modify `src/app/api/submissions/[submissionId]/grade/route.ts`
    - Accept optional `rubricScores: Record<string, number>` and `gradingMethod: 'rubric' | 'simple'` in the request body
    - Add `rubricScores` and `gradingMethod` to the DynamoDB UpdateExpression when present
    - Maintain backward compatibility: existing simple grade saves continue to work without rubricScores
    - _Requirements: 5.4, 4.9_

- [x] 11. Wire rubric data into assignment CRUD flow
  - [x] 11.1 Ensure assignment API persists and returns rubric field
    - Verify/modify the existing POST/PUT `/api/assignments` endpoint to accept and store `rubric: RubricCategory[] | null` attribute
    - Verify/modify the GET endpoint to return the `rubric` field when fetching an assignment
    - Ensure rubric category order is preserved in serialization/deserialization
    - _Requirements: 2.7, 2.8, 5.1, 5.2, 5.5_

  - [ ]* 11.2 Write property test for rubric serialization round-trip
    - **Property 2: Rubric Serialization Round-Trip**
    - **Validates: Requirements 2.7, 2.8, 5.2, 5.5**

  - [ ]* 11.3 Write property test for unique ID generation
    - **Property 4: Unique ID Generation**
    - **Validates: Requirements 5.3**

- [x] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The design uses TypeScript/React — all implementations use this stack
- The existing `AssignmentCreationForm.tsx` has rubric-related fields (`customRubricCategories`, `rubricType`) but the new wizard flow creates a dedicated step using the new `RubricBuilder` component
- The existing `GradingModal.tsx` uses a hardcoded `sampleRubric` — task 10.2 replaces this with actual assignment rubric data

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "3.1", "7.1"] },
    { "id": 2, "tasks": ["2.2", "4.1"] },
    { "id": 3, "tasks": ["4.2", "4.3", "4.4", "6.1"] },
    { "id": 4, "tasks": ["6.2", "6.3", "6.4", "6.5", "8.1"] },
    { "id": 5, "tasks": ["8.2", "10.1", "10.2", "10.3"] },
    { "id": 6, "tasks": ["11.1"] },
    { "id": 7, "tasks": ["11.2", "11.3"] }
  ]
}
```
