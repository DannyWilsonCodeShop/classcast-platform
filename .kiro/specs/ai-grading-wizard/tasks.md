# Implementation Plan: AI Grading Wizard

## Overview

This plan implements the Peer Response Indicator component and the AI Grading Wizard modal for the ClassCast instructor grading page. Tasks are organized to build foundational types and components first, then layer in API endpoints, and finally wire everything together on the bulk grading page.

## Tasks

- [x] 1. Create shared types and interfaces
  - [x] 1.1 Create AI grading types file
    - Create `src/types/aiGrading.ts` with all shared interfaces: `AIGradingPreferences`, `GradingResult`, `GradeBatchRequest`, `GradeBatchResponse`, `GetAIPreferencesResponse`, `PutAIPreferencesResponse`, `EnhancedAutoGradeRequest`, `PeerResponseSummary`
    - Include the `GradingMode`, `StrictnessLevel`, `FormalityLevel`, `FeedbackLength`, `FeedbackTone` union types
    - _Requirements: 5.1, 6.1, 7.3, 7.4, 7.5, 9.1_

- [x] 2. Implement PeerResponseIndicator component
  - [x] 2.1 Create PeerResponseIndicator component
    - Create `src/components/instructor/PeerResponseIndicator.tsx`
    - Implement `PeerResponseIndicatorProps` interface with `enablePeerResponses`, `minResponsesRequired`, and `completedCount`
    - Render nothing when `enablePeerResponses` is false
    - Display "{completedCount} of {minResponsesRequired} complete" text
    - Apply green success styling when `completedCount >= minResponsesRequired`
    - Apply amber/gold warning styling when `completedCount < minResponsesRequired`
    - Use compact pill design with ClassCast theme colors
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3_

  - [ ]* 2.2 Write property tests for PeerResponseIndicator
    - **Property 1: Peer response indicator format**
    - **Property 2: Peer response indicator visual state**
    - **Validates: Requirements 1.1, 1.3, 2.1, 2.2, 2.3**

  - [ ]* 2.3 Write unit tests for PeerResponseIndicator
    - Test renders nothing when `enablePeerResponses` is false
    - Test correct text format for various count combinations
    - Test success vs warning styling thresholds
    - _Requirements: 1.2, 2.1, 2.2_

- [x] 3. Implement AI Grading Wizard modal shell and navigation
  - [x] 3.1 Create AIGradingWizard modal component with step navigation
    - Create `src/components/instructor/AIGradingWizard.tsx`
    - Implement modal overlay with ClassCast theme (navy #005587, gold #FFC72C, white, Oswald headings, rounded-2xl)
    - Implement `WizardStepIndicator` inline (horizontal step bar with numbered circles)
    - Implement step state management: `currentStep`, `totalSteps` (3 or 4 depending on mode)
    - Implement "Next" and "Back" button navigation logic
    - Disable "Back" button on Step 1
    - Allow close at any step without side effects (no API calls, no saves)
    - Implement step skip logic: skip Step 3 when mode is 'rubric_only' or 'response_grading'
    - _Requirements: 4.2, 4.3, 7.2, 10.1, 10.2, 10.3, 10.4_

  - [ ]* 3.2 Write property tests for wizard navigation
    - **Property 4: Wizard mode selection validation**
    - **Property 5: Wizard step skip logic**
    - **Property 8: Step indicator correctness**
    - **Property 9: Close without side effects**
    - **Validates: Requirements 5.5, 7.1, 7.2, 10.1, 10.4**

- [x] 4. Implement wizard step content components
  - [x] 4.1 Implement Step 1 – Grading Mode Selection
    - Add three radio card options inside the wizard: "Rubric Only", "Rubric + Individualized Feedback", "Response Grading"
    - Each card should have a title and brief description
    - Require exactly one selection before enabling "Next" button
    - Store selected mode in wizard state
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 4.2 Implement Step 2 – Strictness and Criteria Configuration
    - Add a three-position slider/toggle for strictness: Lenient, Moderate, Strict
    - Default to "Moderate"
    - Add comma-separated text input for keywords
    - Add optional text input for concepts
    - Store values in wizard state
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 4.3 Implement Step 3 – Feedback Preferences (conditional)
    - Only render when grading mode is "Rubric + Individualized Feedback"
    - Add formality selection: Casual (encouraging, emoji), Professional (clear, direct), Academic (formal, detailed)
    - Add feedback length selection: Brief (1-2 sentences), Standard (paragraph), Detailed (comprehensive)
    - Add tone selection: Encouraging, Constructive, Critical
    - Store values in wizard state
    - _Requirements: 7.1, 7.3, 7.4, 7.5_

  - [x] 4.4 Implement Step 4 – Review and Apply
    - Display summary of all configured settings (mode, strictness, keywords, concepts, feedback prefs if applicable)
    - Add "Apply to All Ungraded" button (disabled when no ungraded submissions exist)
    - Add "Apply to This Submission" button
    - Show progress indicator during batch processing
    - Display error message with retry on failure
    - Show completion summary with success/failure counts
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 4.5 Write property test for review step completeness
    - **Property 6: Review step summary completeness**
    - **Validates: Requirements 8.1**

- [x] 5. Checkpoint – Ensure all component tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement AI preferences API endpoint
  - [x] 6.1 Create GET/PUT /api/assignments/[assignmentId]/ai-preferences route
    - Create `src/app/api/assignments/[assignmentId]/ai-preferences/route.ts`
    - Implement GET handler: read `aiGradingPreferences` field from assignment record in DynamoDB, return `GetAIPreferencesResponse`
    - Implement PUT handler: validate request body as `AIGradingPreferences`, update `aiGradingPreferences` field on assignment record, return `PutAIPreferencesResponse` with `updatedAt` timestamp
    - Include authentication check (instructor must own the assignment)
    - Handle errors (assignment not found, DynamoDB failures) with appropriate status codes
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ]* 6.2 Write property test for AI preferences round-trip
    - **Property 7: AI grading preferences round-trip**
    - **Validates: Requirements 9.1, 9.2**

- [x] 7. Implement batch grading API endpoint
  - [x] 7.1 Create POST /api/ai/grade-batch route
    - Create `src/app/api/ai/grade-batch/route.ts`
    - Implement POST handler: validate `GradeBatchRequest` body
    - Save AI preferences to assignment record via DynamoDB update
    - Fetch ungraded submissions for the assignment (or single submission when `scope = 'single'`)
    - Loop through submissions sequentially, calling existing `/api/ai/auto-grade` logic with enhanced preferences payload
    - Implement 1-second delay between submissions for rate limiting
    - Handle per-submission errors gracefully (mark failed, continue batch)
    - Return `GradeBatchResponse` with results array, totals, and `preferenceSaved` flag
    - _Requirements: 8.2, 8.3, 8.4, 8.5, 9.1_

  - [ ]* 7.2 Write unit tests for grade-batch API
    - Test scope = 'single' processes only one submission
    - Test scope = 'all_ungraded' processes all ungraded submissions
    - Test partial failure handling (some succeed, some fail)
    - Test preferences are saved to assignment record
    - _Requirements: 8.2, 8.3, 8.5_

- [x] 8. Wire AI preferences loading into the wizard
  - [x] 8.1 Add preference fetch and pre-population to AIGradingWizard
    - On wizard open, call GET `/api/assignments/[assignmentId]/ai-preferences`
    - If preferences exist, pre-populate all wizard fields with saved values
    - If fetch fails, default to moderate strictness, empty keywords, no saved preferences (show subtle toast)
    - _Requirements: 9.2, 9.3_

- [x] 9. Integrate components into the bulk grading page
  - [x] 9.1 Add PeerResponseIndicator to submission cards
    - Modify `src/app/instructor/grading/bulk/page.tsx`
    - Import PeerResponseIndicator component
    - Render PeerResponseIndicator below the video player metadata line for each submission
    - Calculate `completedCount` from `submission.peerResponses` array length
    - Pass assignment's `enablePeerResponses` and `minResponsesRequired` from the assignment data
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3_

  - [x] 9.2 Add peer response detail display to submission cards
    - Render each peer response below the video player when peer responses exist
    - Display: peer video reference, response text content, submission timestamp
    - Display "No responses submitted" message when peer responses array is empty and peer responses are enabled
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 9.3 Add AI Grade button and wire AIGradingWizard
    - Add "AI Grade" button to the page header (beside existing filter controls)
    - Add wizard open/close state management
    - Render `<AIGradingWizard>` conditionally when wizard state is open
    - Pass required props: assignmentId, assignmentTitle, rubric, ungradedCount, currentSubmissionId
    - Handle `onGradingComplete` callback to refresh submission list and update grade states
    - _Requirements: 4.1, 4.2, 8.2, 8.3_

  - [ ]* 9.4 Write property test for peer response detail completeness
    - **Property 3: Peer response detail completeness**
    - **Validates: Requirements 3.1, 3.2**

- [x] 10. Final checkpoint – Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The batch endpoint reuses existing `/api/ai/auto-grade` logic rather than duplicating AI integration
- All components follow ClassCast's existing theme: navy #005587, gold #FFC72C, white, Oswald headings, rounded-2xl cards

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "4.1", "4.2", "4.3"] },
    { "id": 3, "tasks": ["3.2", "4.4", "6.1"] },
    { "id": 4, "tasks": ["4.5", "6.2", "7.1"] },
    { "id": 5, "tasks": ["7.2", "8.1"] },
    { "id": 6, "tasks": ["9.1", "9.2", "9.3"] },
    { "id": 7, "tasks": ["9.4"] }
  ]
}
```
