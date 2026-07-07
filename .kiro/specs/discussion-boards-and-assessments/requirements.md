# Requirements Document

## Introduction

This document specifies the requirements for three new assignment types in the ClassCast learning management system: Discussion Boards, Timed Video Assessments, and Module Assignments. Discussion Boards enable threaded student dialog around instructor-defined prompts in whole-class or small-group formats. Timed Video Assessments provide a continuous-recording exam experience where questions appear on screen with countdown timers, enforcing academic integrity through upper-body framing requirements and single-attempt constraints. Module Assignments allow student groups to collaborate on multi-video lesson series with shared or individual grading.

## Glossary

- **Discussion_Board**: An assignment type where students respond to an instructor-defined prompt and to each other in threaded conversations, supporting text and video responses.
- **Assessment**: An assignment type consisting of timed questions displayed sequentially while the student is continuously recorded on camera.
- **Discussion_Post**: A single text or video contribution made by a student within a Discussion Board thread.
- **Discussion_Thread**: A hierarchical chain of Discussion Posts beginning with a top-level response to the instructor prompt.
- **Discussion_Group**: A randomly assigned subset of students from a course section who participate together in a small-group Discussion Board.
- **Module_Group**: A group of students assigned to collaborate on a Module assignment, producing a multi-video lesson series together.
- **Module_Assignment**: An assignment type where a group of students collaborates to create a series of video lessons on a topic, with grading applied to all group members or individually.
- **Assessment_Question**: A single question within an Assessment, with a prescribed time limit in seconds.
- **Assessment_Session**: The continuous recording session from the moment a student starts an Assessment until the final question timer expires.
- **Participation_Requirements**: Instructor-defined minimums for Discussion Board engagement, including minimum post count and minimum word count per post.
- **Question_Timestamp**: A time marker in the Assessment recording that indicates when each question appeared on screen.
- **Instructor**: A user who creates assignments, views submissions, grades student work, and moderates content.
- **Student**: A user who participates in discussions, takes assessments, and views grades and feedback.
- **Assignment_Wizard**: The existing multi-step assignment creation interface that supports video, discussion, assessment, and module types.
- **Rubric_Grading_System**: The existing grading system that allows instructors to score submissions against defined rubric categories.
- **Course_Section**: A grouping of students enrolled in a specific instance of a course.

## Requirements

### Requirement 1: Discussion Board Creation

**User Story:** As an Instructor, I want to create a Discussion Board assignment with a prompt and participation rules, so that students can engage in structured academic dialog.

#### Acceptance Criteria

1. WHEN an Instructor selects the "Discussion Board" assignment type in the Assignment_Wizard, THE Assignment_Wizard SHALL display configuration options for discussion prompt, discussion format, response types, and Participation_Requirements.
2. WHEN an Instructor submits a Discussion Board configuration, THE System SHALL create a Discussion_Board record associated with the selected course section, storing the prompt text, format type, allowed response types, and Participation_Requirements.
3. THE Assignment_Wizard SHALL allow the Instructor to select a discussion format of either "whole class" or "small groups".
4. WHERE the Instructor selects "small groups" format, THE System SHALL display a group size input allowing values between 3 and 10 students per group.
5. THE Assignment_Wizard SHALL allow the Instructor to configure Participation_Requirements including minimum number of posts (1–50) and minimum word count per text post (0–1000 words).
6. THE Assignment_Wizard SHALL allow the Instructor to select allowed response types: text only, video only, or both text and video.
7. WHEN a Discussion Board is created with "small groups" format, THE System SHALL randomly assign all enrolled students in the Course_Section into Discussion_Groups of the specified size.
8. IF the number of enrolled students does not divide evenly by the specified group size, THEN THE System SHALL distribute remaining students across existing groups so that no group exceeds the specified size by more than one student.

### Requirement 2: Discussion Board Student Participation

**User Story:** As a Student, I want to post text and video responses in a Discussion Board, so that I can participate in academic discussions with my peers.

#### Acceptance Criteria

1. WHEN a Student opens a published Discussion Board assignment, THE System SHALL display the instructor prompt and all existing Discussion_Threads visible to that Student.
2. THE System SHALL allow a Student to create a new top-level Discussion_Post in response to the instructor prompt.
3. THE System SHALL allow a Student to reply to any existing Discussion_Post, creating a nested thread.
4. WHERE the Discussion Board allows text responses, THE System SHALL provide a text input field for composing Discussion_Posts.
5. WHERE the Discussion Board allows video responses, THE System SHALL provide a video recording interface using the device camera for composing video Discussion_Posts.
6. WHILE a Discussion Board has a "whole class" format, THE System SHALL display all Discussion_Threads from all students in the Course_Section.
7. WHILE a Discussion Board has a "small groups" format, THE System SHALL display only Discussion_Threads from students within the same Discussion_Group.
8. WHEN a Student submits a text Discussion_Post, THE System SHALL validate that the post meets the minimum word count defined in the Participation_Requirements.
9. IF a Student submits a text post below the minimum word count, THEN THE System SHALL reject the submission and display a message indicating the required word count.
10. THE System SHALL display each Student's current post count and progress toward meeting the minimum post requirement.

### Requirement 3: Discussion Board Instructor Management

**User Story:** As an Instructor, I want to view, moderate, and grade Discussion Board participation, so that I can ensure quality academic discourse and evaluate student engagement.

#### Acceptance Criteria

1. WHEN an Instructor opens a Discussion Board assignment, THE System SHALL display all Discussion_Threads across all Discussion_Groups with the ability to filter by group.
2. THE System SHALL allow the Instructor to delete any Discussion_Post for content moderation purposes.
3. THE System SHALL allow the Instructor to grade each Student's Discussion Board participation using the Rubric_Grading_System.
4. WHEN an Instructor views a Discussion Board, THE System SHALL display a participation summary showing each Student's total post count, word count, and whether Participation_Requirements are met.
5. WHILE a Discussion Board is past its due date, THE System SHALL prevent Students from creating new Discussion_Posts.
6. THE System SHALL allow the Instructor to extend the due date of a Discussion Board after initial creation.

### Requirement 4: Assessment Creation

**User Story:** As an Instructor, I want to create a timed video Assessment with multiple questions, so that I can evaluate students through a controlled, proctored recording experience.

#### Acceptance Criteria

1. WHEN an Instructor selects the "Assessment" assignment type in the Assignment_Wizard, THE Assignment_Wizard SHALL display a question builder interface for adding Assessment_Questions.
2. THE Assignment_Wizard SHALL allow the Instructor to add between 1 and 50 Assessment_Questions to a single Assessment.
3. THE Assignment_Wizard SHALL require the Instructor to specify a time limit between 15 and 300 seconds for each Assessment_Question.
4. THE Assignment_Wizard SHALL allow the Instructor to enter question text of up to 2000 characters for each Assessment_Question.
5. WHEN the Instructor submits an Assessment configuration, THE System SHALL store all Assessment_Questions in their defined order along with their time limits.
6. THE System SHALL prevent Assessment_Questions from being visible to Students before the Student begins the Assessment_Session.
7. THE Assignment_Wizard SHALL allow the Instructor to attach a rubric to the Assessment for per-question grading.

### Requirement 5: Assessment Student Experience

**User Story:** As a Student, I want to take a timed video Assessment where questions appear on screen while I am recorded, so that I can demonstrate my knowledge under controlled conditions.

#### Acceptance Criteria

1. WHEN a Student opens an Assessment assignment that has not been attempted, THE System SHALL display assessment instructions including the number of questions, total duration, and framing requirements.
2. WHEN a Student starts an Assessment_Session, THE System SHALL activate the device camera and begin continuous video recording.
3. WHILE an Assessment_Session is active, THE System SHALL display the current Assessment_Question text on screen along with a visible countdown timer showing remaining seconds.
4. WHEN an Assessment_Question countdown timer reaches zero, THE System SHALL automatically advance to the next Assessment_Question without student input.
5. WHEN the final Assessment_Question countdown timer reaches zero, THE System SHALL stop the video recording and end the Assessment_Session.
6. WHILE an Assessment_Session is active, THE System SHALL prevent the Student from pausing, rewinding, skipping, or restarting the assessment.
7. THE System SHALL allow each Student exactly one attempt at each Assessment unless an Instructor grants a reset.
8. WHEN a Student has already completed an Assessment, THE System SHALL display a message indicating the assessment has been submitted and prevent a second attempt.
9. WHEN an Assessment_Session completes, THE System SHALL upload the recorded video to the S3 storage bucket with metadata including assignment ID, student ID, and Question_Timestamps for each question transition.
10. WHILE an Assessment_Session is active, THE System SHALL display a framing guide overlay indicating that the Student must keep full upper body and arms visible in the camera frame.

### Requirement 6: Assessment Instructor Review and Grading

**User Story:** As an Instructor, I want to review Assessment recordings with question timestamps and grade each question individually, so that I can evaluate student responses accurately.

#### Acceptance Criteria

1. WHEN an Instructor opens a submitted Assessment, THE System SHALL display the recorded video with a timeline showing Question_Timestamp markers for each question.
2. WHEN an Instructor clicks a Question_Timestamp marker, THE System SHALL seek the video playback to the beginning of that question's segment.
3. THE System SHALL allow the Instructor to grade each Assessment_Question individually using the Rubric_Grading_System.
4. WHEN an Instructor completes grading all questions in an Assessment, THE System SHALL calculate and store the total assessment score as the sum of individual question scores.
5. THE System SHALL allow the Instructor to reset a Student's Assessment attempt, enabling the Student to retake the assessment.
6. WHEN an Instructor resets a Student's Assessment attempt, THE System SHALL remove the previous submission and restore the Student's ability to start a new Assessment_Session.

### Requirement 7: Assessment Integrity Controls

**User Story:** As an Instructor, I want the assessment to enforce integrity constraints, so that I can trust the results reflect genuine student effort.

#### Acceptance Criteria

1. THE System SHALL record a continuous, uninterrupted video for the entire Assessment_Session without allowing pauses or breaks.
2. IF the camera feed is lost or interrupted during an Assessment_Session, THEN THE System SHALL display a warning to the Student and log the interruption event with a timestamp.
3. IF a Student navigates away from the Assessment screen during an active Assessment_Session, THEN THE System SHALL log the navigation event with a timestamp and display a warning upon return.
4. THE System SHALL store all integrity event logs (camera interruptions, navigation events) with the Assessment submission for Instructor review.
5. WHEN an Instructor reviews a submitted Assessment, THE System SHALL display any logged integrity events alongside the video timeline.

### Requirement 8: Discussion Board Video Posts

**User Story:** As a Student, I want to record video responses in a Discussion Board, so that I can communicate ideas more expressively than text alone.

#### Acceptance Criteria

1. WHERE a Discussion Board allows video responses, THE System SHALL provide a video recording button within the post composition interface.
2. WHEN a Student initiates a video recording for a Discussion_Post, THE System SHALL activate the device camera using the Capacitor native camera API.
3. WHEN a Student completes a video recording for a Discussion_Post, THE System SHALL upload the video to S3 and associate the video URL with the Discussion_Post.
4. THE System SHALL display video Discussion_Posts with an inline video player within the discussion thread.
5. THE System SHALL enforce a maximum video duration of 120 seconds per video Discussion_Post.

### Requirement 9: Notifications and Deadlines

**User Story:** As a Student, I want to receive awareness of approaching deadlines and new discussion activity, so that I can participate on time and stay engaged.

#### Acceptance Criteria

1. WHILE a Discussion Board is within 24 hours of its due date, THE System SHALL display a visual deadline indicator on the Discussion Board assignment card.
2. WHILE a Student has not met the Participation_Requirements for a Discussion Board, THE System SHALL display a visual indicator showing remaining posts needed.
3. WHEN an Assessment is available but not yet attempted, THE System SHALL display the assessment on the Student's assignment list with an "Available" status badge.
4. WHEN an Assessment deadline has passed and the Student has not attempted the assessment, THE System SHALL display a "Missed" status badge on the assignment card.

### Requirement 10: Discussion Board Setup Wizard

**User Story:** As an Instructor, I want a guided setup wizard for creating Discussion Board assignments, so that I can configure all discussion parameters step by step without missing required settings.

#### Acceptance Criteria

1. WHEN an Instructor selects "Discussion Board" as the assignment type in the Assignment_Wizard, THE Assignment_Wizard SHALL present a multi-step wizard flow with steps: Prompt & Format, Participation Rules, Response Settings, Rubric, and Review.
2. THE Discussion Board setup wizard SHALL require the Instructor to enter a discussion prompt of at least 10 characters before proceeding past the Prompt & Format step.
3. WHEN the Instructor selects "small groups" format, THE Discussion Board setup wizard SHALL display a group size slider with values between 3 and 10, defaulting to 5.
4. THE Discussion Board setup wizard SHALL display a Participation Rules step where the Instructor sets minimum post count (default: 2) and minimum word count per post (default: 50 words).
5. THE Discussion Board setup wizard SHALL display a Response Settings step where the Instructor selects allowed response types from: text only, video only, or text and video (default: text and video).
6. THE Discussion Board setup wizard SHALL display a Review step summarizing all configured settings before final submission.
7. THE Discussion Board setup wizard SHALL allow the Instructor to navigate back to any previous step to modify settings before submission.
8. WHEN the Instructor submits the Discussion Board setup wizard, THE System SHALL validate all required fields and display specific error messages for any missing or invalid configuration.

### Requirement 11: Assessment Setup Wizard

**User Story:** As an Instructor, I want a guided setup wizard for creating Assessment assignments, so that I can define questions, set time limits, and configure assessment parameters in a structured flow.

#### Acceptance Criteria

1. WHEN an Instructor selects "Assessment" as the assignment type in the Assignment_Wizard, THE Assignment_Wizard SHALL present a multi-step wizard flow with steps: Assessment Info, Question Builder, Rubric, and Review.
2. THE Assessment setup wizard SHALL display an Assessment Info step where the Instructor enters the assessment title, description, and overall instructions for students.
3. THE Assessment setup wizard SHALL display a Question Builder step with an interface for adding, editing, reordering, and removing Assessment_Questions.
4. THE Question Builder SHALL display each Assessment_Question with its question text, time limit, and order number in an editable list.
5. WHEN the Instructor adds a new Assessment_Question, THE Question Builder SHALL default the time limit to 60 seconds and place the question at the end of the list.
6. THE Question Builder SHALL allow the Instructor to reorder Assessment_Questions using drag-and-drop or up/down arrow controls.
7. THE Question Builder SHALL display the total assessment duration (sum of all question time limits) and update the total in real time as questions are added, removed, or modified.
8. THE Assessment setup wizard SHALL prevent submission if fewer than 1 Assessment_Question is configured.
9. THE Assessment setup wizard SHALL display a Review step showing all questions in order with their time limits, total duration, and rubric summary.
10. THE Assessment setup wizard SHALL allow the Instructor to navigate back to any previous step to modify settings before submission.
11. WHEN the Instructor submits the Assessment setup wizard, THE System SHALL validate all required fields and display specific error messages for any missing or invalid configuration.

### Requirement 12: Module Assignment Creation

**User Story:** As an Instructor, I want to create a Module assignment where student groups collaborate to produce a multi-video lesson series, so that students practice teaching and content creation skills together.

#### Acceptance Criteria

1. WHEN an Instructor selects the "Module" assignment type in the Assignment_Wizard, THE Assignment_Wizard SHALL display configuration options for module topic, group formation, video requirements, and grading settings.
2. THE Assignment_Wizard SHALL allow the Instructor to specify the number of videos required in the lesson series (between 2 and 20 videos).
3. THE Assignment_Wizard SHALL allow the Instructor to specify a maximum duration per video (between 30 and 600 seconds).
4. THE Assignment_Wizard SHALL allow the Instructor to configure group formation: manual assignment, random assignment, or student self-selection.
5. WHERE the Instructor selects random group assignment, THE System SHALL allow the Instructor to specify a group size between 2 and 8 students.
6. WHEN the Instructor submits a Module assignment with random group assignment, THE System SHALL randomly assign all enrolled students in the Course_Section into Module_Groups of the specified size.
7. IF the number of enrolled students does not divide evenly by the specified group size, THEN THE System SHALL distribute remaining students across existing groups so that no group exceeds the specified size by more than one student.
8. THE Assignment_Wizard SHALL allow the Instructor to specify whether all group members receive the same grade or individual grades.

### Requirement 13: Module Assignment Student Collaboration

**User Story:** As a Student, I want to collaborate with my group to create a multi-video lesson series, so that we can divide the teaching work and produce a comprehensive module together.

#### Acceptance Criteria

1. WHEN a Student opens a Module assignment, THE System SHALL display the module workspace showing all group members, the required number of videos, and current progress.
2. THE System SHALL allow any group member to add a new video lesson to the Module by recording or uploading a video.
3. THE System SHALL allow any group member to add a title and description to each video lesson in the Module.
4. THE System SHALL allow any group member to reorder video lessons within the Module using drag-and-drop or arrow controls.
5. THE System SHALL allow any group member to remove a video lesson from the Module that the group member uploaded.
6. THE System SHALL display the video authorship (which group member recorded each video) alongside each video lesson.
7. WHEN a group member uploads a video lesson, THE System SHALL upload the video to S3 and associate the video URL with the Module submission.
8. WHILE a Module assignment is before its due date, THE System SHALL allow group members to continue adding and editing video lessons.
9. WHEN all required videos have been added to the Module, THE System SHALL display a "Ready to Submit" status indicator.
10. THE System SHALL require at least one group member to confirm final submission of the Module before the due date.

### Requirement 14: Module Assignment Grading

**User Story:** As an Instructor, I want to review and grade Module submissions, so that I can evaluate the quality of the collaborative lesson series and assign grades to the group.

#### Acceptance Criteria

1. WHEN an Instructor opens a submitted Module assignment, THE System SHALL display the complete lesson series with all videos in order, along with group member attributions.
2. THE System SHALL allow the Instructor to play each video lesson within the module review interface.
3. THE System SHALL allow the Instructor to grade the Module using the Rubric_Grading_System.
4. WHERE the Instructor configured shared grading, THE System SHALL apply the same grade to all members of the Module_Group upon grading.
5. WHERE the Instructor configured individual grading, THE System SHALL allow the Instructor to assign individual grades to each group member.
6. WHEN an Instructor grades a Module with shared grading, THE System SHALL record the grade for each group member's submission record.

### Requirement 15: Module Assignment Setup Wizard

**User Story:** As an Instructor, I want a guided setup wizard for creating Module assignments, so that I can configure group formation, video requirements, and grading policies step by step.

#### Acceptance Criteria

1. WHEN an Instructor selects "Module" as the assignment type in the Assignment_Wizard, THE Assignment_Wizard SHALL present a multi-step wizard flow with steps: Module Info, Group Formation, Video Requirements, Rubric, and Review.
2. THE Module setup wizard SHALL display a Module Info step where the Instructor enters the module topic, description, and instructions for students.
3. THE Module setup wizard SHALL display a Group Formation step where the Instructor selects group formation method (random, manual, or self-selection) and group size.
4. THE Module setup wizard SHALL display a Video Requirements step where the Instructor sets the required number of videos and maximum duration per video.
5. THE Module setup wizard SHALL display a grading policy selector where the Instructor chooses between shared grading (same grade for all members) or individual grading.
6. THE Module setup wizard SHALL display a Review step summarizing all configured settings before final submission.
7. THE Module setup wizard SHALL allow the Instructor to navigate back to any previous step to modify settings before submission.
8. WHEN the Instructor submits the Module setup wizard, THE System SHALL validate all required fields and display specific error messages for any missing or invalid configuration.

### Requirement 16: Data Storage and Retrieval

**User Story:** As a system operator, I want Discussion Board, Assessment, and Module assignment data stored reliably in DynamoDB, so that all submissions and interactions are persisted and queryable.


#### Acceptance Criteria

1. THE System SHALL store Discussion_Posts in DynamoDB with attributes: postId, discussionId, authorId, parentPostId, content, videoUrl, createdAt, and updatedAt.
2. THE System SHALL store Assessment submissions in DynamoDB with attributes: submissionId, assessmentId, studentId, videoUrl, questionTimestamps, integrityEvents, gradingData, submittedAt, and status.
3. THE System SHALL store Assessment_Questions in DynamoDB with attributes: questionId, assessmentId, questionText, timeLimitSeconds, and orderIndex.
4. THE System SHALL store Discussion_Group assignments in DynamoDB with attributes: groupId, discussionId, studentIds, and groupSize.
5. THE System SHALL store Module_Group assignments in DynamoDB with attributes: groupId, moduleAssignmentId, studentIds, groupSize, and formationMethod.
6. THE System SHALL store Module video lessons in DynamoDB with attributes: lessonId, moduleSubmissionId, title, description, videoUrl, authorId, orderIndex, duration, and createdAt.
7. WHEN a Discussion_Post is created, THE System SHALL generate a unique postId and record the creation timestamp in ISO 8601 format.
8. WHEN an Assessment submission is stored, THE System SHALL include the complete array of Question_Timestamps with each entry containing the questionId and the video timestamp in seconds.
9. WHEN a Module submission is stored, THE System SHALL include references to all video lessons in their defined order with authorship attribution.
