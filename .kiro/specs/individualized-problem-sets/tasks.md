# Implementation Plan: Individualized Problem Sets

## Overview

This plan implements the Individualized Problem Sets feature, enabling instructors to create problem banks, distribute problems 1:1 to students, and reference assigned problems during grading. Tasks are ordered by dependency: foundation types and utilities first, then API endpoints, followed by UI components and integration points.

## Tasks

- [x] 1. Create types, utilities, and DynamoDB table definitions
  - [x] 1.1 Create TypeScript types and interfaces
    - Create `src/types/problemBank.ts` with interfaces: `ProblemBank`, `Problem`, `ProblemAssignmentRecord`, `ProblemInput`, `ParsedSpreadsheet`, `ProblemAssignment`
    - Include API request/response types: `CreateBankRequest`, `DistributeRequest`, `DistributeResponse`
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 1.2 Create DynamoDB table infrastructure
    - Add `classcast-problem-banks` table definition with `bankId` PK and `instructorId-index` GSI (PK: instructorId, SK: createdAt)
    - Add `classcast-problems` table definition with `problemId` PK and `bankId-index` GSI (PK: bankId, SK: orderIndex)
    - Add `classcast-problem-assignments` table definition with `id` PK, `assignmentId-index` GSI (PK: assignmentId, SK: studentId), and `studentId-assignmentId-index` GSI (PK: studentId, SK: assignmentId)
    - Follow existing DynamoDB patterns in the project
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 1.3 Implement problem distribution utility
    - Create `src/lib/problemDistribution.ts`
    - Implement `distributeProblemSet(problemIds, studentIds)` using Fisher-Yates shuffle (similar to `src/lib/groupAssignment.ts`)
    - Validate `problemIds.length >= studentIds.length` before distribution, throw error if insufficient
    - Return array of `ProblemAssignment` objects mapping shuffled problems to students 1:1
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ]* 1.4 Write property tests for distribution utility
    - **Property 3: Distribution produces a valid 1:1 mapping**
    - **Property 4: Distribution rejects insufficient problem counts**
    - **Property 5: Late enrollment assigns from unassigned pool**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.8**

  - [x] 1.5 Implement spreadsheet parser utility
    - Create `src/lib/spreadsheetParser.ts`
    - Implement `parseSpreadsheet(file: File): Promise<ParsedSpreadsheet>` using `papaparse` for CSV and `xlsx` (SheetJS) for XLS/XLSX
    - Extract first column of each row as problem text, skip empty rows
    - Detect and skip header rows matching common headers ("Problem", "Question", "#")
    - Return parsed rows, total count, and any errors
    - _Requirements: 1.3_

  - [ ]* 1.6 Write property tests for spreadsheet parser
    - **Property 1: Spreadsheet parsing produces one problem per non-empty row**
    - **Property 8: CSV export round-trip**
    - **Validates: Requirements 1.3, 5.5**

- [ ] 2. Checkpoint – Ensure foundation tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Implement Problem Banks API endpoints
  - [x] 3.1 Create POST /api/problem-banks route
    - Create `src/app/api/problem-banks/route.ts`
    - Implement POST handler: validate request body, generate `bankId` UUID, create bank record in DynamoDB, batch-write all problems with generated `problemId`s, return 201 with created bank and problem IDs
    - Implement GET handler: query `instructorId-index` GSI to list all banks for the authenticated instructor
    - Include authentication check (instructor role required)
    - _Requirements: 1.1, 1.7, 5.1, 6.1, 6.2_

  - [x] 3.2 Create GET/PUT/DELETE /api/problem-banks/[bankId] route
    - Create `src/app/api/problem-banks/[bankId]/route.ts`
    - GET: fetch bank by `bankId`, fetch all problems via `bankId-index` GSI, return bank with problems array
    - PUT: update bank metadata (title, description), use `updatedAt` condition expression for optimistic concurrency
    - DELETE: check for active distributions (query `assignmentId-index`), return 409 if linked, otherwise delete bank and all its problems
    - _Requirements: 1.5, 5.2, 5.4, 6.1_

  - [x] 3.3 Create problems CRUD under /api/problem-banks/[bankId]/problems
    - Create `src/app/api/problem-banks/[bankId]/problems/route.ts` (POST for adding problems)
    - Create `src/app/api/problem-banks/[bankId]/problems/[problemId]/route.ts` (PUT/DELETE for individual problems)
    - POST: add problems to existing bank, update `problemCount` on bank record
    - PUT: update problem content or imageUrl
    - DELETE: remove problem, decrement `problemCount`
    - _Requirements: 1.5, 6.2_

  - [x] 3.4 Create bank duplication and export endpoints
    - Add POST `/api/problem-banks/[bankId]/duplicate` — create new bank with new IDs but same content/imageUrls
    - Add GET `/api/problem-banks/[bankId]/export` — stream CSV with columns: #, Problem Text, Image URL
    - _Requirements: 5.3, 5.5_

  - [ ]* 3.5 Write property test for bank duplication
    - **Property 7: Bank duplication preserves content with new identifiers**
    - **Validates: Requirements 5.3**

- [x] 4. Implement Problem Distribution API endpoints
  - [x] 4.1 Create POST /api/problem-assignments/distribute route
    - Create `src/app/api/problem-assignments/route.ts`
    - Implement POST `/distribute`: fetch problems for bankId, fetch enrolled students for sectionId, validate count, call `distributeProblemSet`, BatchWrite all `ProblemAssignmentRecord`s with retry loop for `UnprocessedItems`, update assignment record with `problemBankId`
    - Implement POST `/redistribute`: delete existing assignments for the assignmentId, then re-distribute
    - Return distribution summary with counts
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 2.8_

  - [x] 4.2 Create GET /api/problem-assignments query endpoints
    - Add GET handler: query by `assignmentId` (instructor view — returns full distribution list)
    - Add GET `/student` handler: query `studentId-assignmentId-index` GSI for specific student's assigned problem, join with problem content
    - Enforce access control: students can only query their own assignment
    - _Requirements: 2.7, 3.1, 3.5_

  - [ ]* 4.3 Write unit tests for distribution API
    - Test successful distribution with matching counts
    - Test 400 error when insufficient problems
    - Test 409 error on duplicate distribution attempt
    - Test student access isolation (403 for wrong student)
    - _Requirements: 2.1, 2.2, 2.3, 3.5_

- [ ] 5. Checkpoint – Ensure all API tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement Instructor UI — ProblemBankBuilder component
  - [x] 6.1 Create ProblemBankBuilder shell with tab navigation
    - Create `src/components/instructor/ProblemBankBuilder.tsx`
    - Implement `ProblemBankBuilderProps` interface with `bankId?`, `courseId`, `sectionId?`, `onSave`, `onCancel`
    - Implement four-tab layout: "Paste Text", "Upload Image", "Take Photo", "Upload Spreadsheet"
    - Add title input field and optional description textarea
    - Add enrollment indicator badge showing `{problemCount}/{enrollmentCount}` with green/yellow/red coloring
    - Add Save and Cancel buttons
    - _Requirements: 1.1, 1.2, 1.4, 1.8_

  - [ ]* 6.2 Write property test for enrollment indicator
    - **Property 2: Enrollment indicator correctness**
    - **Validates: Requirements 1.4**

  - [x] 6.3 Implement Paste Text tab
    - Add dynamic list of textarea inputs for each problem
    - Add "Add Problem" button to append new empty row
    - Add remove button per row
    - Support paste of multi-line text (each row becomes a problem if pasted with newlines)
    - _Requirements: 1.2, 1.5_

  - [x] 6.4 Implement Upload Image tab
    - Add file picker accepting PNG, JPG, HEIC
    - Upload each selected image via `/api/upload/presigned` with folder `problem-banks/{bankId}`
    - Display thumbnail preview grid of uploaded images
    - Allow removal of individual images
    - _Requirements: 1.2, 1.6, 6.4_

  - [x] 6.5 Implement Take Photo tab with Capacitor camera integration
    - Create `src/components/instructor/CameraCapture.tsx`
    - On native (Capacitor): use `Camera.getPhoto()` with `CameraSource.Camera`
    - On web: fall back to `<input type="file" accept="image/*" capture="environment">`
    - Return captured `File` object, display as thumbnail in grid
    - Upload captured photos via presigned URL flow
    - _Requirements: 1.2, 1.6_

  - [x] 6.6 Implement Upload Spreadsheet tab
    - Add file picker accepting .csv, .xls, .xlsx
    - Call `parseSpreadsheet` utility on file selection
    - Display parsed preview table showing row number and problem text
    - Show error messages for parse failures
    - Allow user to confirm or re-upload
    - _Requirements: 1.2, 1.3_

- [x] 7. Implement Problem Banks management page
  - [x] 7.1 Create Problem Banks list page
    - Create `src/app/instructor/problem-banks/page.tsx`
    - Fetch and display all banks for the instructor (title, problem count, last modified)
    - Add "Create New Bank" button that opens ProblemBankBuilder
    - Add actions per bank: Edit, Duplicate, Export CSV, Delete (with confirmation modal)
    - Follow existing ClassCast instructor page patterns (navy/gold theme, Oswald headings)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 7.2 Wire ProblemBankBuilder into management page
    - Open ProblemBankBuilder in edit mode when clicking a bank
    - Open ProblemBankBuilder in create mode from "Create New Bank" button
    - Handle save callback to refresh the bank list
    - Handle duplicate action via `/api/problem-banks/[bankId]/duplicate`
    - _Requirements: 1.5, 1.8, 5.3_

- [x] 8. Implement Student UI — Problem in Resources section
  - [x] 8.1 Create ProblemDisplay component
    - Create `src/components/student/ProblemDisplay.tsx`
    - Render text problems in a styled card with readable typography
    - Render image problems with `next/image` and tap-to-zoom (lightbox modal)
    - Show fallback message when no problem assigned: "Your problem has not been assigned yet. Please contact your instructor."
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 8.2 Integrate ProblemDisplay into assignment detail page
    - Modify the student assignment detail view to check for a linked problem bank on the assignment
    - Call `GET /api/problem-assignments/student?assignmentId={id}&studentId={id}` to fetch the student's assigned problem
    - Render ProblemDisplay in the Resources section with the fetched problem data
    - _Requirements: 3.1, 3.5_

  - [ ]* 8.3 Write unit tests for ProblemDisplay
    - Test text problem rendering
    - Test image problem rendering with zoom
    - Test fallback state when problem is null
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 9. Implement Grading Integration — 📎 clip icon with problem modal
  - [x] 9.1 Create ProblemReferenceModal component
    - Create `src/components/instructor/ProblemReferenceModal.tsx`
    - Implement slide-over/modal displaying problem text and/or image with zoom
    - Position as right-side panel (desktop) or bottom sheet (mobile) to not obscure video player
    - Accept `ProblemReferenceModalProps`: `isOpen`, `onClose`, `problem`, `studentName`
    - _Requirements: 4.2, 4.3_

  - [x] 9.2 Integrate 📎 clip icon into grading page
    - Modify the grading page to fetch problem assignment data alongside submissions
    - Add a 📎 clip icon next to each student's name/info in the grading feed
    - On 📎 click, open ProblemReferenceModal with that student's assigned problem
    - Fetch problem content via `GET /api/problem-assignments?assignmentId={id}` for the full distribution
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 9.3 Write unit tests for ProblemReferenceModal
    - Test modal open/close behavior
    - Test text problem display
    - Test image problem display with zoom
    - Test null problem state (no assignment)
    - _Requirements: 4.2, 4.3_

- [x] 10. Implement Assignment Wizard integration
  - [x] 10.1 Add problem bank linking step to assignment creation wizard
    - Extend the assignment creation wizard with an optional step to link a Problem Bank
    - Show a dropdown/selector of existing banks for the course
    - Display bank details (title, problem count) and enrollment comparison indicator
    - Allow "Create New Bank" inline (opens ProblemBankBuilder)
    - Store selected `bankId` on the assignment record
    - _Requirements: 1.8, 2.1_

  - [x] 10.2 Trigger distribution on assignment creation/publish
    - After assignment is created with a linked bank, call `POST /api/problem-assignments/distribute` with assignmentId, bankId, and sectionId
    - Handle errors (insufficient problems) with user-friendly message and option to add more problems
    - Show distribution success confirmation with count
    - _Requirements: 2.1, 2.3, 2.7_

  - [x] 10.3 Add redistribution option to assignment management
    - On the assignment detail/edit page, add a "Redistribute Problems" button (visible only before due date)
    - Confirm with the instructor before redistributing
    - Call `POST /api/problem-assignments/redistribute`
    - _Requirements: 2.8_

- [ ] 11. Final checkpoint – Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The distribution utility reuses the Fisher-Yates pattern from `src/lib/groupAssignment.ts`
- All components follow ClassCast's existing theme: navy #005587, gold #FFC72C, white, Oswald headings, rounded-2xl cards
- Presigned URL uploads follow the existing `/api/upload/presigned` flow with `problem-banks/` folder prefix

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.5"] },
    { "id": 2, "tasks": ["1.4", "1.6", "3.1"] },
    { "id": 3, "tasks": ["3.2", "3.3", "3.4"] },
    { "id": 4, "tasks": ["3.5", "4.1"] },
    { "id": 5, "tasks": ["4.2", "4.3", "6.1"] },
    { "id": 6, "tasks": ["6.2", "6.3", "6.4", "6.5", "6.6"] },
    { "id": 7, "tasks": ["7.1", "8.1", "9.1"] },
    { "id": 8, "tasks": ["7.2", "8.2", "8.3", "9.2"] },
    { "id": 9, "tasks": ["9.3", "10.1"] },
    { "id": 10, "tasks": ["10.2", "10.3"] }
  ]
}
```
