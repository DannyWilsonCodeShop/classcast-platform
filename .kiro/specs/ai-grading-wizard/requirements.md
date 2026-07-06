# Requirements Document

## Introduction

This feature enhances the ClassCast instructor grading page with two capabilities: (1) peer response indicators that surface assignment peer response requirements and student completion status directly on the grading page, and (2) an AI Grading Wizard that provides a multi-step configuration flow for AI-assisted grading with customizable strictness, keyword detection, feedback preferences, and batch processing.

## Glossary

- **Grading_Page**: The instructor-facing page for reviewing and grading student video submissions (`/instructor/grading/bulk`)
- **Peer_Response_Indicator**: A UI component that displays peer response requirements and completion status for a submission
- **AI_Grading_Wizard**: A multi-step modal dialog for configuring and executing AI-assisted grading
- **Grading_Mode**: The type of AI grading to perform (rubric-only, rubric with individualized feedback, or response grading)
- **Strictness_Level**: A configurable scale (Lenient, Moderate, Strict) that controls how generously the AI grades submissions
- **Feedback_Preferences**: Configuration for the AI's feedback output including formality, length, and tone
- **Assignment_Settings**: The assignment-level configuration fields including `enablePeerResponses`, `minResponsesRequired`, and `maxResponsesPerVideo`
- **AI_Grading_Preferences**: The saved per-assignment configuration for the AI Grading Wizard (grading mode, strictness, keywords, feedback preferences)
- **Ungraded_Submission**: A video submission that has not yet received a grade from the instructor or AI

## Requirements

### Requirement 1: Peer Response Requirement Display

**User Story:** As an instructor, I want to see whether an assignment requires peer responses and how many are required, so that I can understand the full assignment context while grading.

#### Acceptance Criteria

1. WHEN the Grading_Page displays a submission for an assignment with `enablePeerResponses` set to true, THE Peer_Response_Indicator SHALL display the number of responses required from `minResponsesRequired`
2. WHEN the Grading_Page displays a submission for an assignment with `enablePeerResponses` set to false, THE Peer_Response_Indicator SHALL not be rendered
3. THE Peer_Response_Indicator SHALL display the text in the format "{completed} of {required} complete" showing the student's current progress

### Requirement 2: Peer Response Completion Status

**User Story:** As an instructor, I want to see how many peer responses each student has completed, so that I can assess whether they fulfilled the peer engagement requirement.

#### Acceptance Criteria

1. WHEN a student has completed fewer responses than `minResponsesRequired`, THE Peer_Response_Indicator SHALL display the completion count with a visual warning state
2. WHEN a student has completed all required responses (count equals or exceeds `minResponsesRequired`), THE Peer_Response_Indicator SHALL display the completion count with a visual success state
3. THE Peer_Response_Indicator SHALL calculate the completed count from the student's entries in the `submission.peerResponses` array

### Requirement 3: Peer Response Detail Display

**User Story:** As an instructor, I want to read the actual peer responses a student has written, so that I can evaluate the quality of their peer engagement.

#### Acceptance Criteria

1. WHEN the instructor views a submission with peer responses, THE Grading_Page SHALL display each peer response below the video player
2. THE Grading_Page SHALL display for each peer response: the peer video that was responded to, the response text content, and the submission timestamp
3. WHEN a student has no peer responses, THE Grading_Page SHALL display a message indicating no responses have been submitted

### Requirement 4: AI Grading Wizard Launch

**User Story:** As an instructor, I want to open the AI Grading Wizard from the grading page, so that I can configure and run AI-assisted grading.

#### Acceptance Criteria

1. THE Grading_Page SHALL display a button labeled for AI grading that opens the AI_Grading_Wizard
2. WHEN the instructor clicks the AI grading button, THE AI_Grading_Wizard SHALL open as a modal overlay with step-by-step navigation
3. THE AI_Grading_Wizard SHALL follow mobile-first design using the ClassCast theme (navy #005587, gold #FFC72C, white)

### Requirement 5: Grading Mode Selection (Step 1)

**User Story:** As an instructor, I want to choose how the AI grades submissions, so that I can select the appropriate grading approach for the assignment.

#### Acceptance Criteria

1. THE AI_Grading_Wizard SHALL present three Grading_Mode options in Step 1: "Rubric Only", "Rubric + Individualized Feedback", and "Response Grading"
2. WHEN the instructor selects "Rubric Only", THE AI_Grading_Wizard SHALL configure AI to grade against rubric categories and assign scores without personalized feedback
3. WHEN the instructor selects "Rubric + Individualized Feedback", THE AI_Grading_Wizard SHALL configure AI to grade against the rubric AND generate personalized feedback based on video content
4. WHEN the instructor selects "Response Grading", THE AI_Grading_Wizard SHALL configure AI to grade peer responses for quality and engagement
5. THE AI_Grading_Wizard SHALL require the instructor to select exactly one Grading_Mode before proceeding to Step 2

### Requirement 6: Strictness and Criteria Configuration (Step 2)

**User Story:** As an instructor, I want to configure how strictly the AI grades and specify key terms to listen for, so that the AI grading aligns with my expectations.

#### Acceptance Criteria

1. THE AI_Grading_Wizard SHALL display a Strictness_Level slider with three positions: Lenient, Moderate, and Strict
2. THE AI_Grading_Wizard SHALL provide a comma-separated text input for keywords or phrases that the student should mention in the submission
3. THE AI_Grading_Wizard SHALL provide an optional text input for concepts that must be covered in the submission
4. THE AI_Grading_Wizard SHALL default the Strictness_Level to Moderate

### Requirement 7: Feedback Preferences Configuration (Step 3)

**User Story:** As an instructor, I want to control the style and depth of AI-generated feedback, so that feedback matches my communication style and assignment expectations.

#### Acceptance Criteria

1. WHEN the instructor selected "Rubric + Individualized Feedback" in Step 1, THE AI_Grading_Wizard SHALL display Step 3 with feedback preference options
2. WHEN the instructor selected "Rubric Only" or "Response Grading" in Step 1, THE AI_Grading_Wizard SHALL skip Step 3 and proceed directly to Step 4
3. THE AI_Grading_Wizard SHALL provide a formality level selection with options: Casual (encouraging, emoji), Professional (clear, direct), and Academic (formal, detailed)
4. THE AI_Grading_Wizard SHALL provide a feedback length selection with options: Brief (1-2 sentences per category), Standard (paragraph per category), and Detailed (comprehensive)
5. THE AI_Grading_Wizard SHALL provide a tone selection with options: Encouraging, Constructive, and Critical

### Requirement 8: Review and Apply (Step 4)

**User Story:** As an instructor, I want to review my AI grading configuration and choose how to apply it, so that I can confirm settings before running AI grading.

#### Acceptance Criteria

1. THE AI_Grading_Wizard SHALL display a summary of all selected settings in Step 4 including grading mode, strictness level, keywords, concepts, and feedback preferences (when applicable)
2. THE AI_Grading_Wizard SHALL display an "Apply to All Ungraded" button that initiates AI grading on all Ungraded_Submissions for the current assignment
3. THE AI_Grading_Wizard SHALL display an "Apply to This Submission" button that initiates AI grading on the currently viewed submission only
4. WHEN the instructor clicks either apply button, THE AI_Grading_Wizard SHALL display a progress indicator showing the AI processing status
5. IF the AI grading process encounters an error, THEN THE AI_Grading_Wizard SHALL display an error message and allow the instructor to retry

### Requirement 9: AI Grading Preferences Persistence

**User Story:** As an instructor, I want my AI grading settings to be saved per assignment, so that I do not have to reconfigure them each time I grade.

#### Acceptance Criteria

1. WHEN the instructor completes the AI_Grading_Wizard configuration, THE system SHALL save the AI_Grading_Preferences associated with the assignment
2. WHEN the instructor opens the AI_Grading_Wizard for an assignment with existing AI_Grading_Preferences, THE AI_Grading_Wizard SHALL pre-populate all fields with the saved preferences
3. THE AI_Grading_Preferences SHALL persist across browser sessions for the same assignment

### Requirement 10: Wizard Navigation

**User Story:** As an instructor, I want to navigate between wizard steps freely, so that I can review and modify settings before applying.

#### Acceptance Criteria

1. THE AI_Grading_Wizard SHALL display a step indicator showing the current step and total steps
2. THE AI_Grading_Wizard SHALL provide a "Next" button to advance to the subsequent step and a "Back" button to return to the previous step
3. WHEN the instructor is on Step 1, THE AI_Grading_Wizard SHALL disable the "Back" button
4. THE AI_Grading_Wizard SHALL allow the instructor to close the wizard at any step without applying changes
