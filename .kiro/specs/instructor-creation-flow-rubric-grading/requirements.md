# Requirements Document

## Introduction

This feature enhances the ClassCast instructor experience with four integrated capabilities: a unified Create button flow that consolidates content creation entry points, a rubric builder for defining structured grading criteria during assignment creation, a rubric-based grading UI that replaces the single-number grade input with per-category scoring, and a foundational AI Tools page in the sidebar for future AI-powered features. Together, these components streamline assignment creation and grading workflows for instructors using the ClassCast platform.

## Glossary

- **Create_Modal**: The dialog that appears when an instructor clicks the "Create" button, presenting options for content creation (Course, Assignment, Module).
- **Rubric_Builder**: The UI component within the assignment creation/edit flow that allows instructors to define grading categories, scoring levels, and descriptions.
- **Rubric**: A structured grading schema consisting of categories, each with scoring levels that define point values and descriptive criteria. Stored as a JSON array matching the format `[{ id, name, levels: [{ score, description }] }]`.
- **Category**: A single grading dimension within a rubric (e.g., "Mathematical Accuracy", "Work Shown"). Each category contains multiple scoring levels.
- **Scoring_Level**: A specific point value within a category, paired with a description of what performance at that level looks like (e.g., score: 4, description: "All calculations are correct").
- **Grading_Panel**: The UI displayed alongside a video submission that presents rubric categories as interactive scoring rows with sliders and number inputs.
- **Template_Rubric**: A pre-built rubric for common assignment types that instructors can select as a starting point in the Rubric_Builder.
- **AI_Tools_Page**: A dedicated page in the instructor sidebar that serves as a landing page for future AI-powered features with "Coming Soon" placeholders.
- **Instructor_Sidebar**: The navigation sidebar component (InstructorSidebar.tsx) containing navigation items and the Create button.
- **Assignment_Creation_Flow**: The multi-step process for creating a new assignment, which now includes a rubric building step.
- **Auto_Calculate**: The behavior where the total grade is computed by summing all individual category scores without manual intervention.

## Requirements

### Requirement 1: Unified Create Button Modal

**User Story:** As an instructor, I want to click the Create button and choose what type of content to create from a single modal, so that I can quickly start creating courses, assignments, or modules without navigating to different pages.

#### Acceptance Criteria

1. WHEN the instructor clicks the Create button in the Instructor_Sidebar, THE Create_Modal SHALL display with three options: "New Course", "New Assignment", and "New Module".
2. WHEN the instructor selects "New Course" in the Create_Modal, THE Create_Modal SHALL close and navigate the instructor to the existing course creation page at `/instructor/classes/create`.
3. WHEN the instructor selects "New Assignment" in the Create_Modal, THE Create_Modal SHALL close and navigate the instructor to the Assignment_Creation_Flow which includes the Rubric_Builder step.
4. WHEN the instructor selects "New Module" in the Create_Modal, THE Create_Modal SHALL close and navigate the instructor to the existing lesson module creation page at `/instructor/lesson-modules`.
5. WHEN the Create_Modal is open, THE Create_Modal SHALL close when the instructor clicks outside the modal or presses the Escape key.
6. THE Create_Modal SHALL display each option with a descriptive icon and label that clearly communicates the content type.

### Requirement 2: Rubric Builder in Assignment Creation

**User Story:** As an instructor, I want to build a structured rubric while creating or editing an assignment, so that I can define clear grading criteria for my students.

#### Acceptance Criteria

1. WHEN the instructor is in the Assignment_Creation_Flow, THE Rubric_Builder SHALL be presented as a dedicated step in the creation process.
2. THE Rubric_Builder SHALL allow the instructor to add one or more categories, where each category has a name and one or more scoring levels.
3. WHEN the instructor adds a category, THE Rubric_Builder SHALL create a new category with a default name field and at least one scoring level.
4. WHEN the instructor removes a category, THE Rubric_Builder SHALL remove that category and all its associated scoring levels from the rubric.
5. THE Rubric_Builder SHALL allow the instructor to define a numeric point value and a text description for each scoring level within a category.
6. THE Rubric_Builder SHALL allow the instructor to add or remove scoring levels within any category.
7. WHEN the instructor saves the assignment, THE Rubric_Builder SHALL persist the rubric data in the format `[{ id, name, levels: [{ score, description }] }]` to the classcast-assignments DynamoDB table.
8. WHEN the instructor edits an existing assignment that has a rubric, THE Rubric_Builder SHALL load and display the existing rubric data for editing.
9. THE Rubric_Builder SHALL validate that each category has a non-empty name and at least one scoring level with a point value greater than or equal to zero before allowing the assignment to be saved.

### Requirement 3: Template Rubrics

**User Story:** As an instructor, I want to start from a pre-built rubric template for common assignment types, so that I do not have to build every rubric from scratch.

#### Acceptance Criteria

1. WHEN the instructor opens the Rubric_Builder, THE Rubric_Builder SHALL offer an option to select from available Template_Rubrics.
2. THE Rubric_Builder SHALL provide Template_Rubrics for common assignment types including at minimum: "Math Problem Set", "Video Presentation", "Written Essay", and "Lab Report".
3. WHEN the instructor selects a Template_Rubric, THE Rubric_Builder SHALL populate all categories and scoring levels from the selected template into the builder.
4. WHEN a Template_Rubric has been applied, THE Rubric_Builder SHALL allow the instructor to modify any category, scoring level, point value, or description from the template.
5. WHEN the instructor has already defined categories in the Rubric_Builder and selects a Template_Rubric, THE Rubric_Builder SHALL confirm with the instructor before replacing existing content.

### Requirement 4: Rubric-Based Grading UI

**User Story:** As an instructor, I want to grade video submissions using rubric categories with sliders and number inputs, so that I can provide structured, consistent grading across all submissions.

#### Acceptance Criteria

1. WHEN the instructor opens a video submission for grading and the assignment has an associated rubric, THE Grading_Panel SHALL display alongside the video player.
2. THE Grading_Panel SHALL display each rubric category as a separate row showing the category name.
3. WHEN a rubric category row is displayed, THE Grading_Panel SHALL show a slider input ranging from 0 to the maximum point value for that category AND a number input box for direct value entry.
4. WHEN the instructor drags a slider, THE Grading_Panel SHALL update the corresponding number input to reflect the slider position value.
5. WHEN the instructor types a value in the number input, THE Grading_Panel SHALL update the corresponding slider position to reflect the typed value.
6. IF the instructor types a value in the number input that exceeds the category maximum or is below zero, THEN THE Grading_Panel SHALL clamp the value to the valid range (0 to category maximum).
7. THE Grading_Panel SHALL display a total grade that Auto_Calculates by summing all individual category scores.
8. WHEN the instructor changes any category score (via slider or number input), THE Grading_Panel SHALL recalculate and display the updated total grade.
9. WHEN the instructor changes any category score, THE Grading_Panel SHALL automatically save the updated scores and total grade to the backend via the grade submission API endpoint.
10. THE Grading_Panel SHALL provide a "Set All to Maximum" action that sets every category score to its respective maximum point value.
11. WHEN the assignment does not have an associated rubric, THE Grading_Panel SHALL fall back to displaying the existing single-number grade input.

### Requirement 5: Rubric Data Persistence

**User Story:** As an instructor, I want rubric data to be stored reliably and in a consistent format, so that rubrics are available for grading and display on the student detail page.

#### Acceptance Criteria

1. THE Rubric SHALL be stored as a JSON array attribute on the assignment record in the classcast-assignments DynamoDB table.
2. THE Rubric data structure SHALL conform to the format: each entry contains a unique `id` (string), a `name` (string), and a `levels` array where each level has a `score` (number) and `description` (string).
3. WHEN the rubric is saved, THE system SHALL generate a unique identifier for each new category that does not already have an `id`.
4. WHEN rubric scores are saved for a submission, THE system SHALL store per-category scores alongside the total grade on the submission record.
5. WHEN a rubric is retrieved for grading or display, THE system SHALL return the rubric in the same structured format it was stored in, preserving category order.

### Requirement 6: AI Tools Landing Page

**User Story:** As an instructor, I want to see an AI Tools page in my sidebar navigation, so that I know what AI-powered features are coming and can access them when they become available.

#### Acceptance Criteria

1. THE Instructor_Sidebar SHALL include an "AI" navigation item that routes to the AI_Tools_Page at `/instructor/ai`.
2. THE AI_Tools_Page SHALL display three feature cards: "AI Rubric Maker", "AI Assignment Maker", and "AI Assignment Grader".
3. THE AI_Tools_Page SHALL display each feature card with a title, a brief description of what the feature does, and a "Coming Soon" badge.
4. THE AI_Tools_Page SHALL render each feature card in a non-interactive state (no clickable action) since the features are placeholders.
5. THE AI_Tools_Page SHALL match the existing instructor portal visual style using the white background and navy (#005587) accent color scheme.

### Requirement 7: Assignment Creation Flow Navigation

**User Story:** As an instructor, I want the assignment creation flow to guide me through all necessary steps including rubric building, so that I do not miss any configuration before publishing.

#### Acceptance Criteria

1. WHEN the instructor navigates to the Assignment_Creation_Flow, THE system SHALL present a multi-step form with at minimum: assignment details (title, description, due date, points, submission type) and rubric building.
2. THE Assignment_Creation_Flow SHALL allow the instructor to navigate forward and backward between steps without losing entered data.
3. WHEN the instructor completes all required steps, THE Assignment_Creation_Flow SHALL allow the instructor to save the assignment with all configured data including the rubric.
4. THE Assignment_Creation_Flow SHALL indicate which steps are required and which are optional (the rubric step is optional — assignments can be saved without a rubric).
5. WHEN the instructor accesses the Assignment_Creation_Flow from the Create_Modal "New Assignment" option, THE system SHALL require a course selection step if no course context is already provided.
