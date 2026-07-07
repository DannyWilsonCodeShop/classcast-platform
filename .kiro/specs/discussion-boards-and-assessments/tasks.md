# Implementation Plan: Discussion Boards, Timed Video Assessments & Module Assignments

## Overview

This plan implements three new assignment types for ClassCast: Discussion Boards, Timed Video Assessments, and Module Assignments. Tasks are organized by feature area in dependency order — shared types and DynamoDB tables first, then each feature's API endpoints, student UI, and instructor UI, followed by integration into the existing assignment system.

## Tasks

- [ ] 1. Foundation — shared types, DynamoDB tables, and utilities
  - [ ] 1.1 Create shared TypeScript type definitions
    - Create `src/types/discussion.ts` with interfaces: `DiscussionConfig`, `DiscussionPost`, `DiscussionGroup`
    - Create `src/types/assessment.ts` with interfaces: `AssessmentQuestion`, `AssessmentSession`, `QuestionTimestamp`, `IntegrityEvent`, `AssessmentGradingData`
    - Create `src/types/module.ts` with interfaces: `ModuleConfig`, `ModuleGroup`, `ModuleLesson`
    - Extend the existing `AssignmentRecord` type to include `discussionConfig`, `assessmentQuestions`, and `moduleConfig` fields
    - Add union type extension: `assignmentType: 'video' | 'discussion' | 'assessment' | 'module'`
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

  - [ ] 1.2 Provision DynamoDB tables
    - Create `classcast-discussion-posts` table with `postId` PK and GSI `DiscussionIdIndex` (discussionId PK, createdAt SK)
    - Create `classcast-discussion-groups` table with `groupId` PK and GSI `DiscussionIdIndex` (discussionId PK)
    - Create `classcast-assessment-sessions` table with `sessionId` PK and GSI `AssessmentIdIndex` (assessmentId PK, studentId SK)
    - Create `classcast-module-groups` table with `groupId` PK and GSI `ModuleAssignmentIdIndex` (moduleAssignmentId PK)
    - Create `classcast-module-lessons` table with `lessonId` PK and GSI `ModuleSubmissionIdIndex` (moduleSubmissionId PK, orderIndex SK)
    - All tables use PAY_PER_REQUEST billing mode
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

  - [ ] 1.3 Implement random group assignment utility
    - Create `src/lib/groupAssignment.ts` with `assignRandomGroups(studentIds: string[], targetGroupSize: number): string[][]`
    - Implement Fisher-Yates shuffle and even distribution of remainders
    - Handle edge cases: fewer students than group size (single group), zero students (empty array)
    - No group should exceed targetGroupSize + 1 members
    - _Requirements: 1.7, 1.8, 12.6, 12.7_

  - [ ]* 1.4 Write unit tests for random group assignment utility
    - Test all students are assigned to exactly one group
    - Test no group exceeds targetGroupSize + 1
    - Test single-group edge case when totalStudents < targetGroupSize
    - Test empty array case
    - _Requirements: 1.7, 1.8, 12.6, 12.7_

- [ ] 2. Discussion Boards — API endpoints
  - [ ] 2.1 Implement POST /api/discussions/[discussionId]/posts endpoint
    - Create `src/app/api/discussions/[discussionId]/posts/route.ts`
    - POST handler: validate request body (authorId, content, parentPostId, videoUrl), enforce minimum word count, reject if past due date, reject video posts exceeding 120s duration
    - GET handler: fetch posts from `classcast-discussion-posts` table via DiscussionIdIndex, filter by group for small-group discussions, compute participation summary
    - Generate unique postId and record createdAt in ISO 8601
    - _Requirements: 2.2, 2.3, 2.8, 2.9, 3.5, 8.5, 16.1, 16.7_

  - [ ] 2.2 Implement POST /api/discussions/[discussionId]/groups endpoint
    - Create `src/app/api/discussions/[discussionId]/groups/route.ts`
    - POST handler: accept courseId and groupSize, fetch enrolled students, call `assignRandomGroups`, persist groups to `classcast-discussion-groups` table
    - GET handler for `/groups/[groupId]`: fetch group record and associated posts
    - _Requirements: 1.7, 1.8, 16.4_

  - [ ]* 2.3 Write unit tests for discussion API endpoints
    - Test post creation with valid/invalid word count
    - Test rejection when past due date
    - Test group creation with even/uneven student counts
    - Test group-filtered post retrieval for small-group format
    - _Requirements: 2.8, 2.9, 3.5_

- [ ] 3. Discussion Boards — Student UI
  - [ ] 3.1 Implement DiscussionBoardView component
    - Create `src/components/discussions/DiscussionBoardView.tsx`
    - Display instructor prompt at top, fetch and render threaded posts (flat list with indentation for replies)
    - Filter posts by student's group for small-group format
    - Show participation progress bar (e.g., "2/3 posts required")
    - Disable post creation if past due date
    - Display video posts with inline `<video>` player
    - _Requirements: 2.1, 2.6, 2.7, 2.10, 9.2_

  - [ ] 3.2 Implement DiscussionPostComposer component
    - Create `src/components/discussions/DiscussionPostComposer.tsx`
    - Text mode: textarea with live word count indicator, validate against minimum before submission
    - Video mode: trigger Capacitor camera recording (reuse existing camera utilities), enforce 120s max duration
    - Upload video to S3 via presigned URL, then submit post with videoUrl
    - Show inline validation errors for word count and duration
    - _Requirements: 2.4, 2.5, 2.8, 2.9, 8.1, 8.2, 8.3, 8.5_

  - [ ] 3.3 Implement ParticipationProgress component
    - Create `src/components/discussions/ParticipationProgress.tsx`
    - Display current post count vs minimum required
    - Visual indicator when requirements are not met
    - _Requirements: 2.10, 9.2_

- [ ] 4. Discussion Boards — Instructor UI
  - [ ] 4.1 Implement DiscussionSetupWizard component
    - Create `src/components/instructor/wizards/DiscussionSetupWizard.tsx`
    - Step 1: Prompt & Format — textarea for prompt (min 10 chars), format selector (whole-class/small-groups), group size slider (3–10, shown for small-groups only, default 5)
    - Step 2: Participation Rules — min posts (default 2), min word count (default 50)
    - Step 3: Response Settings — radio: text only / video only / text and video (default: both)
    - Step 4: Rubric — reuse existing `<RubricBuilder />` component
    - Step 5: Review — summary of all settings with back-navigation
    - Validate all required fields on submission, show specific error messages
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_

  - [ ] 4.2 Implement DiscussionModeratorView component
    - Create `src/components/instructor/DiscussionModeratorView.tsx`
    - Display all threads across all groups with group filter controls
    - Allow instructor to delete any post for moderation
    - Display participation summary: per-student post count, word count, whether requirements are met
    - Integrate with existing RubricGradingPanel for per-student grading
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6_

- [ ] 5. Checkpoint — Discussion Boards
  - Ensure all discussion board tests pass, ask the user if questions arise.

- [ ] 6. Assessments — API endpoints
  - [ ] 6.1 Implement POST /api/assessments/[assessmentId]/sessions endpoint
    - Create `src/app/api/assessments/[assessmentId]/sessions/route.ts`
    - POST handler: validate studentId, reject if student already has a 'completed' session (single attempt), reject if past due date, create session with status 'in-progress', return session + questions
    - GET handler: list all sessions for instructor review, optional studentId filter
    - _Requirements: 5.2, 5.6, 5.7, 5.8, 16.2, 16.8_

  - [ ] 6.2 Implement PUT /api/assessments/[assessmentId]/sessions/[sessionId] endpoint
    - Create `src/app/api/assessments/[assessmentId]/sessions/[sessionId]/route.ts`
    - PUT handler: accept videoUrl, questionTimestamps, integrityEvents, set status to 'completed', store completedAt
    - Validate that questionTimestamps includes all questions
    - _Requirements: 5.5, 5.9, 7.1, 7.4, 16.2, 16.8_

  - [ ] 6.3 Implement POST /api/assessments/[assessmentId]/reset/[studentId] endpoint
    - Create `src/app/api/assessments/[assessmentId]/reset/[studentId]/route.ts`
    - POST handler: set existing session status to 'reset', allowing student to start fresh
    - Instructor-only authentication check
    - _Requirements: 5.7, 6.5, 6.6_

  - [ ]* 6.4 Write unit tests for assessment API endpoints
    - Test session creation rejects duplicate attempts
    - Test session creation rejects past-due assessments
    - Test session completion stores all required data
    - Test reset allows re-attempt
    - _Requirements: 5.7, 5.8, 6.5, 6.6_

- [ ] 7. Assessments — Student UI
  - [ ] 7.1 Implement AssessmentStartScreen component
    - Create `src/components/assessments/AssessmentStartScreen.tsx`
    - Display instructions: number of questions, total duration, framing requirements
    - Request camera permission via Capacitor/browser API
    - Show camera preview for student to verify framing
    - "Start Assessment" button disabled until camera is active
    - Show "Assessment already submitted" message if hasExistingAttempt is true
    - _Requirements: 5.1, 5.8, 5.10_

  - [ ] 7.2 Implement AssessmentRecordingView component
    - Create `src/components/assessments/AssessmentRecordingView.tsx`
    - Start MediaRecorder on mount, record continuously at 720p quality
    - Display current question text + countdown timer overlay
    - Auto-advance to next question when timer hits 0
    - Record QuestionTimestamp each time a new question appears
    - On final question timer expiry: stop recording, trigger upload flow
    - No pause/skip/restart controls — enforce continuous recording
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 7.1_

  - [ ] 7.3 Implement FramingGuide overlay component
    - Create `src/components/assessments/FramingGuide.tsx`
    - Render dashed rectangle overlay indicating upper body + arms framing area
    - Display over camera feed during active assessment
    - _Requirements: 5.10_

  - [ ] 7.4 Implement useIntegrityMonitor hook
    - Create integrity monitoring logic within `AssessmentRecordingView` or as a separate hook
    - Monitor camera track 'ended' and 'mute'/'unmute' events for camera-lost/restored
    - Monitor `visibilitychange` for tab navigation events
    - Log all integrity events with timestamps relative to session start
    - Display warning to student on camera loss or tab navigation
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 7.5 Implement useAssessmentTimer hook
    - Create timer logic: countdown per question, auto-advance, record timestamps
    - Call onComplete when final question timer expires
    - Track elapsed time relative to session start for timestamp recording
    - _Requirements: 5.3, 5.4, 5.5_

- [ ] 8. Assessments — Instructor UI
  - [ ] 8.1 Implement AssessmentSetupWizard component
    - Create `src/components/instructor/wizards/AssessmentSetupWizard.tsx`
    - Step 1: Assessment Info — title, description, student instructions
    - Step 2: Question Builder — add/edit/reorder/delete questions, default 60s timer, drag-and-drop or arrow reordering, real-time total duration display
    - Step 3: Rubric — reuse existing `<RubricBuilder />` component
    - Step 4: Review — all questions listed with times, total duration, rubric summary
    - Prevent submission with 0 questions
    - Back-navigation to any previous step
    - Validate all required fields on submission
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.10, 11.11_

  - [ ] 8.2 Implement QuestionBuilder component
    - Create `src/components/instructor/wizards/QuestionBuilder.tsx`
    - Interactive list: add question (appends with 60s default), inline edit text (textarea) and time limit (number input)
    - Drag-and-drop or up/down arrow reordering, delete with confirmation
    - Real-time total duration display: "Total: 4m 30s (5 questions)"
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 11.3, 11.4, 11.5, 11.6, 11.7_

  - [ ] 8.3 Implement AssessmentReviewPlayer component
    - Create `src/components/instructor/AssessmentReviewPlayer.tsx`
    - Video player with custom timeline showing question timestamp markers
    - Clickable markers jump to question start time
    - Question panel beside video shows current question text
    - Per-question grading input integrated with RubricGradingPanel
    - Integrity event indicators (red markers) on timeline
    - Summary panel showing all integrity events with timestamps
    - Calculate and store total score as sum of individual question scores
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.5_

- [ ] 9. Checkpoint — Assessments
  - Ensure all assessment tests pass, ask the user if questions arise.

- [ ] 10. Module Assignments — API endpoints
  - [ ] 10.1 Implement POST /api/modules/[moduleId]/lessons endpoint
    - Create `src/app/api/modules/[moduleId]/lessons/route.ts`
    - POST handler: validate request body (title, description, videoUrl, authorId, duration, orderIndex), persist to `classcast-module-lessons` table
    - GET handler: list all lessons for a module submission via ModuleSubmissionIdIndex, compute progress (totalRequired vs totalUploaded, readyToSubmit)
    - DELETE handler: allow lesson removal only by the original uploader (authorId check)
    - _Requirements: 13.2, 13.3, 13.5, 13.6, 13.7, 16.6, 16.9_

  - [ ] 10.2 Implement POST /api/modules/[moduleId]/groups endpoint
    - Create `src/app/api/modules/[moduleId]/groups/route.ts`
    - POST handler: accept courseId, groupSize, formationMethod, and optional manualGroups
    - For 'random' formation: call `assignRandomGroups` utility, persist to `classcast-module-groups` table
    - For 'manual' formation: persist provided group arrays
    - For 'self-selection': create placeholder groups for students to join
    - _Requirements: 12.4, 12.5, 12.6, 12.7, 16.5_

  - [ ] 10.3 Implement POST /api/modules/[moduleId]/submit endpoint
    - Create `src/app/api/modules/[moduleId]/submit/route.ts`
    - POST handler: validate required video count is met, reject if past due date, create/update submission record in `classcast-submissions` with all lesson references
    - _Requirements: 13.9, 13.10_

  - [ ]* 10.4 Write unit tests for module API endpoints
    - Test lesson creation and retrieval in order
    - Test group formation for each method (random, manual, self-selection)
    - Test submission rejection when video count not met
    - Test submission rejection when past due date
    - _Requirements: 12.6, 12.7, 13.9, 13.10_

- [ ] 11. Module Assignments — Student UI
  - [ ] 11.1 Implement ModuleWorkspace component
    - Create `src/components/modules/ModuleWorkspace.tsx`
    - Display group members list, required video count, and current progress
    - Lesson list with drag-and-drop reordering (react-beautiful-dnd or similar)
    - Each lesson card: thumbnail, title, author name, duration
    - "Add Video" button triggers camera recording or file upload
    - Progress indicator: "3/5 videos uploaded"
    - "Submit Module" button enabled only when all required videos are present
    - Only the uploader can delete their own lesson
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.8, 13.9, 13.10_

  - [ ] 11.2 Implement LessonCard component
    - Create `src/components/modules/LessonCard.tsx`
    - Display video thumbnail, title, description, author attribution, duration
    - Show delete button only for the lesson author
    - _Requirements: 13.5, 13.6_

  - [ ] 11.3 Implement LessonUploader component
    - Create `src/components/modules/LessonUploader.tsx`
    - Record video via Capacitor camera or upload from file
    - Upload to S3 via presigned URL with modules/ key prefix
    - Accept title and description input
    - Enforce max duration per video from moduleConfig
    - _Requirements: 13.2, 13.3, 13.7_

- [ ] 12. Module Assignments — Instructor UI
  - [ ] 12.1 Implement ModuleSetupWizard component
    - Create `src/components/instructor/wizards/ModuleSetupWizard.tsx`
    - Step 1: Module Info — topic, description, instructions
    - Step 2: Group Formation — method selector (random/manual/self-selection), group size (2–8)
    - Step 3: Video Requirements — required number of videos (2–20), max duration per video (30–600s)
    - Step 4: Grading Policy — shared or individual grading selector
    - Step 5: Rubric — reuse existing `<RubricBuilder />` component
    - Step 6: Review — summary of all settings with back-navigation
    - Validate all required fields on submission
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.8, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8_

  - [ ] 12.2 Implement ModuleReviewInterface component
    - Create `src/components/instructor/ModuleReviewInterface.tsx`
    - Playlist view: all videos in sequence with auto-advance
    - Show lesson title, description, author attribution per video
    - Shared grading: single rubric evaluation for the whole module, apply same grade to all group members
    - Individual grading: separate score input per group member
    - Integrate with existing RubricGradingPanel component
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

- [ ] 13. Checkpoint — Module Assignments
  - Ensure all module assignment tests pass, ask the user if questions arise.

- [ ] 14. Integration — Assignment wizard, routing, and grading
  - [ ] 14.1 Update Assignment Wizard to support new types
    - Modify the existing assignment creation wizard at `/instructor/assignments/create`
    - Add type selection cards for "Discussion Board", "Assessment", and "Module"
    - Render `DiscussionSetupWizard`, `AssessmentSetupWizard`, or `ModuleSetupWizard` based on selected type
    - Pass configuration data to existing POST `/api/assignments` endpoint with type-specific fields
    - _Requirements: 1.1, 4.1, 12.1_

  - [ ] 14.2 Update PUT /api/assignments/[assignmentId] field mapping
    - Extend the existing `fieldMapping` object to include `discussionConfig`, `assessmentQuestions`, and `moduleConfig`
    - Ensure updates to type-specific fields persist correctly
    - _Requirements: 1.2, 4.5_

  - [ ] 14.3 Add student detail view routing by assignment type
    - Update `/student/assignments/[id]` to check `assignmentType` and render:
      - `'discussion'` → `DiscussionBoardView`
      - `'assessment'` → `AssessmentStartScreen` (or completed view)
      - `'module'` → `ModuleWorkspace`
    - Preserve existing `'video'` → `VideoSubmissionView` routing
    - _Requirements: 2.1, 5.1, 13.1_

  - [ ] 14.4 Add deadline indicators and status badges to assignment cards
    - Display visual deadline indicator when Discussion Board is within 24 hours of due date
    - Display "Available" status badge for unattempted assessments
    - Display "Missed" status badge for assessments past deadline without an attempt
    - Display remaining posts indicator when participation requirements not met
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ] 14.5 Wire grading integration for all three types
    - Discussion Boards: per-student grading through RubricGradingPanel, store in `classcast-submissions`
    - Assessments: per-question grading mapped to rubric categories, total score as sum of question scores
    - Modules: shared grading creates identical records for all group members; individual grading creates separate records
    - _Requirements: 3.3, 6.3, 6.4, 14.3, 14.4, 14.5, 14.6_

- [ ] 15. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation after each feature area
- All components follow ClassCast's existing theme: navy #005587, gold #FFC72C, white, Oswald headings, rounded-2xl cards
- Video uploads reuse the existing presigned URL flow via `/api/upload/presigned`
- Camera recording uses existing Capacitor camera utilities
- The random group assignment utility is shared between Discussion Boards and Module Assignments
- S3 key prefixes: `discussions/`, `assessments/`, `modules/` within the existing `classcast-videos` bucket

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3"] },
    { "id": 2, "tasks": ["1.4", "2.1", "2.2", "6.1", "10.1", "10.2"] },
    { "id": 3, "tasks": ["2.3", "3.1", "3.2", "6.2", "6.3", "10.3"] },
    { "id": 4, "tasks": ["3.3", "4.1", "6.4", "7.1", "7.3", "10.4"] },
    { "id": 5, "tasks": ["4.2", "7.2", "7.4", "7.5", "11.1"] },
    { "id": 6, "tasks": ["8.1", "8.2", "11.2", "11.3"] },
    { "id": 7, "tasks": ["8.3", "12.1", "12.2"] },
    { "id": 8, "tasks": ["14.1", "14.2"] },
    { "id": 9, "tasks": ["14.3", "14.4", "14.5"] }
  ]
}
```
