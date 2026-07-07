# Requirements: Individualized Problem Sets

## Introduction

Individualized Problem Sets allow instructors to create a bank of unique problems and randomly distribute them to students in a section. Each student receives a different problem to work on for their video assignment. This ensures academic integrity (students can't copy each other) and allows instructors to assess the same skill across different problem instances. Problem banks can be created independently of assignments and reused across multiple assignments.

## Glossary

- **Problem_Bank**: A reusable collection of problems (text and/or images) created by an instructor, stored independently of assignments.
- **Problem**: A single item in a Problem Bank, consisting of text content and/or an image.
- **Problem_Assignment**: The mapping between a specific Problem and a specific Student for a given assignment.
- **Question_Set**: Synonym for Problem Bank — the set of questions to be distributed.

## Requirements

### Requirement 1: Problem Bank Creation

**User Story:** As an Instructor, I want to create a bank of problems using multiple input methods, so that I can efficiently build a unique problem for each student.

#### Acceptance Criteria

1. THE System SHALL allow an Instructor to create a new Problem_Bank with a title and optional description.
2. THE System SHALL support four input methods for adding problems to a Problem_Bank:
   - **Paste text**: Instructor types or pastes text content for each problem
   - **Upload image**: Instructor uploads an image file (PNG, JPG, HEIC) for each problem
   - **Take photo**: Instructor captures a photo using the device camera for each problem
   - **Upload spreadsheet**: Instructor uploads a CSV/XLS file where each row becomes a separate problem
3. WHEN an Instructor uploads a spreadsheet, THE System SHALL parse each row as a separate Problem, using the first column as the problem text.
4. THE System SHALL display the total number of problems in the bank and indicate whether it matches the section enrollment count.
5. THE System SHALL allow an Instructor to add, edit, and remove individual problems from a Problem_Bank after creation.
6. THE System SHALL store problem images in S3 and associate the image URL with the Problem record.
7. A Problem_Bank SHALL exist independently of any assignment and be reusable across multiple assignments.
8. THE System SHALL allow an Instructor to create a Problem_Bank from the Assignment creation wizard OR from a dedicated Problem Banks management page.

### Requirement 2: Problem Distribution

**User Story:** As an Instructor, I want problems to be randomly and uniquely distributed to students, so that each student works on a different problem.

#### Acceptance Criteria

1. WHEN an Instructor links a Problem_Bank to an assignment, THE System SHALL randomly assign one Problem to each enrolled Student in the section.
2. THE System SHALL ensure no two students in the same section receive the same Problem (one-to-one mapping).
3. IF the number of problems in the bank is less than the number of enrolled students, THE System SHALL warn the Instructor and prevent distribution until enough problems are added.
4. IF the number of problems exceeds the number of students, THE System SHALL only use as many problems as there are students (extras remain unassigned).
5. WHEN a new student enrolls in the section after distribution, THE System SHALL automatically assign them an unassigned Problem from the bank (if available).
6. THE System SHALL store Problem_Assignments in DynamoDB with attributes: assignmentId, studentId, problemId, assignedAt.
7. THE System SHALL allow the Instructor to view the distribution (which student got which problem) from the assignment management interface.
8. THE System SHALL allow the Instructor to redistribute (re-randomize) problems before the assignment due date.

### Requirement 3: Student View — Problem in Resources

**User Story:** As a Student, I want to see my assigned problem in the Resources section of my assignment, so that I know which specific problem to solve in my video.

#### Acceptance Criteria

1. WHEN a Student opens an assignment that has a linked Problem_Bank, THE System SHALL display their assigned Problem in the Resources section of the assignment detail page.
2. THE System SHALL display the problem text (if text-based) in a readable format.
3. THE System SHALL display the problem image (if image-based) with tap-to-zoom capability.
4. IF a Student has not yet been assigned a problem (e.g., enrolled after distribution failed), THE System SHALL display a message: "Your problem has not been assigned yet. Please contact your instructor."
5. THE System SHALL NOT allow a Student to see other students' assigned problems.

### Requirement 4: Instructor Grading View — Problem Reference

**User Story:** As an Instructor, I want to quickly see which problem was assigned to a student while grading their video, so that I can accurately evaluate their response.

#### Acceptance Criteria

1. WHEN an Instructor is on the grading page viewing a student's submission, THE System SHALL display a 📎 clip icon next to the student's name/info.
2. WHEN the Instructor taps the 📎 clip icon, THE System SHALL display the Problem (text and/or image) that was assigned to that student.
3. THE Problem display SHALL appear as a modal/overlay so the instructor can reference it while the video plays.
4. THE System SHALL display the problem reference for each student in the bulk grading feed.

### Requirement 5: Problem Bank Management

**User Story:** As an Instructor, I want to manage my problem banks over time, so that I can reuse and update them across semesters.

#### Acceptance Criteria

1. THE System SHALL provide a Problem Banks page accessible from the instructor navigation where all created banks are listed.
2. THE System SHALL display each Problem_Bank with its title, problem count, and last modified date.
3. THE System SHALL allow an Instructor to duplicate a Problem_Bank for use in a new semester/assignment.
4. THE System SHALL allow an Instructor to delete a Problem_Bank (with confirmation).
5. THE System SHALL allow an Instructor to export a Problem_Bank as a CSV file.

### Requirement 6: Data Storage

**User Story:** As a system operator, I want problem bank data stored reliably, so that assignments and distributions are persisted.

#### Acceptance Criteria

1. THE System SHALL store Problem_Banks in DynamoDB with attributes: bankId (PK), instructorId, title, description, problemCount, createdAt, updatedAt.
2. THE System SHALL store Problems in DynamoDB with attributes: problemId (PK), bankId (GSI), content (text), imageUrl, orderIndex, createdAt.
3. THE System SHALL store Problem_Assignments in DynamoDB with attributes: id (PK), assignmentId+studentId (GSI), problemId, assignedAt.
4. THE System SHALL store problem images in S3 under the path: `problem-banks/{bankId}/{problemId}_{timestamp}.{ext}`
