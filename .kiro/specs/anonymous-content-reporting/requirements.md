# Requirements Document

## Introduction

Anonymous Content Reporting enables students to flag content they find risky, inappropriate, or harmful without revealing their identity to instructors. Reports feed into the existing moderation workflow at /instructor/moderation, where instructors review flagged content and take action (approve or remove). The feature covers video submissions, peer review responses, and community posts. A report button is accessible on videos in the peer feed and on peer review comments. The system includes anti-spam protections to prevent abuse of the reporting mechanism. The feature targets mobile-first (iOS app via Capacitor) and web.

## Glossary

- **Report_Button**: The UI element rendered on reportable content (videos, peer reviews, community posts) that initiates the anonymous reporting flow.
- **Report_Form**: The modal or sheet presented to the student after tapping the Report_Button, allowing selection of a report category and optional details.
- **Reporting_Service**: The server-side module responsible for receiving reports, stripping reporter identity, applying rate limits, and creating moderation flags.
- **Moderation_Queue**: The existing instructor-facing dashboard at /instructor/moderation that displays flagged content for review.
- **Reporter**: The authenticated student who submits a content report.
- **Rate_Limiter**: The subsystem that enforces per-student limits on report submissions to prevent spam and abuse.
- **Report_Category**: One of the predefined classification labels a Reporter selects when filing a report: inappropriate content, bullying/harassment, off-topic, spam, or safety concern.
- **Reportable_Content**: Any content item that can be reported, specifically video submissions, peer review responses, and community posts.
- **Anonymous_Flag**: A moderation flag record created by the Reporting_Service that contains no reference to the Reporter's identity.

## Requirements

### Requirement 1: Report Button Placement

**User Story:** As a student, I want to see a report option on content I'm viewing, so that I can quickly flag something concerning without searching for the feature.

#### Acceptance Criteria

1. WHEN a student views a video submission in the peer feed, THE Report_Button SHALL be visible and accessible on the video card or player controls.
2. WHEN a student views a peer review response on an assignment, THE Report_Button SHALL be visible and accessible adjacent to the review content.
3. WHEN a student views a community post, THE Report_Button SHALL be visible and accessible on the post card.
4. THE Report_Button SHALL render as a recognizable flag or report icon with a minimum touch target of 44x44 CSS pixels on mobile devices.
5. THE Report_Button SHALL be accessible via screen readers with the label "Report content".

### Requirement 2: Report Submission Flow

**User Story:** As a student, I want to select a reason for my report and optionally add details, so that instructors have context for their review.

#### Acceptance Criteria

1. WHEN the student taps the Report_Button, THE Report_Form SHALL present the following Report_Category options: inappropriate content, bullying/harassment, off-topic, spam, and safety concern.
2. WHEN the Report_Form is displayed, THE Report_Form SHALL require the student to select exactly one Report_Category before submission is enabled.
3. WHEN the Report_Form is displayed, THE Report_Form SHALL provide an optional free-text field (maximum 500 characters) for additional context.
4. WHEN the student submits the Report_Form with a valid category selected, THE Report_Form SHALL send the report to the Reporting_Service and display a confirmation message.
5. IF the report submission fails due to a network or server error, THEN THE Report_Form SHALL display an error message and allow the student to retry.
6. THE Report_Form SHALL render as a bottom sheet on mobile (Capacitor iOS) and as a centered modal on desktop web.

### Requirement 3: Reporter Anonymity

**User Story:** As a student, I want my identity to remain hidden when I report content, so that I feel safe reporting without fear of retaliation.

#### Acceptance Criteria

1. WHEN the Reporting_Service creates a moderation flag from a student report, THE Reporting_Service SHALL exclude the Reporter's user ID, name, and any identifying metadata from the Anonymous_Flag record stored in the database.
2. WHEN an instructor views a flagged item in the Moderation_Queue, THE Moderation_Queue SHALL display no information identifying the Reporter.
3. THE Reporting_Service SHALL not store a mapping between the Anonymous_Flag and the Reporter's identity in any database table or log accessible to instructors.
4. THE Reporting_Service SHALL retain a hashed reference to the Reporter's identity in a separate rate-limiting table that is not accessible through the moderation API or UI.

### Requirement 4: Anti-Spam and Abuse Prevention

**User Story:** As an instructor, I want the system to prevent students from spamming reports, so that the moderation queue contains genuine concerns rather than noise.

#### Acceptance Criteria

1. THE Rate_Limiter SHALL enforce a maximum of 5 reports per student per rolling 24-hour period.
2. WHEN a student has reached the rate limit, THE Report_Form SHALL display a message indicating that the reporting limit has been reached and the student should try again later.
3. WHEN a student attempts to report the same content item that the student has already reported, THE Reporting_Service SHALL reject the duplicate report and THE Report_Form SHALL inform the student that this content has already been reported.
4. THE Rate_Limiter SHALL track report counts using the hashed reporter reference without exposing the Reporter's identity in the moderation workflow.

### Requirement 5: Integration with Existing Moderation Workflow

**User Story:** As an instructor, I want student reports to appear in my existing moderation dashboard, so that I have a single place to review all flagged content.

#### Acceptance Criteria

1. WHEN the Reporting_Service processes a valid report, THE Reporting_Service SHALL create a moderation flag using the existing /api/moderation/flag endpoint with status set to "pending".
2. THE Anonymous_Flag SHALL include the content ID, content type, the reported content text or reference, the selected Report_Category as the flag reason, and a severity classification.
3. WHEN a report with category "safety concern" or "bullying/harassment" is submitted, THE Reporting_Service SHALL assign a severity of "high" to the Anonymous_Flag.
4. WHEN a report with category "inappropriate content" is submitted, THE Reporting_Service SHALL assign a severity of "medium" to the Anonymous_Flag.
5. WHEN a report with category "off-topic" or "spam" is submitted, THE Reporting_Service SHALL assign a severity of "low" to the Anonymous_Flag.
6. WHEN an instructor reviews an Anonymous_Flag, THE Moderation_Queue SHALL support the existing approve and remove actions without modification to the review workflow.

### Requirement 6: Confirmation and Feedback

**User Story:** As a student, I want clear feedback after submitting a report, so that I know my report was received and understand what happens next.

#### Acceptance Criteria

1. WHEN a report is successfully submitted, THE Report_Form SHALL display a confirmation message stating that the report has been received and will be reviewed by an instructor.
2. WHEN a report is successfully submitted, THE Report_Form SHALL dismiss automatically after 3 seconds or when the student taps a close button.
3. THE confirmation message SHALL NOT reveal any details about the moderation process timeline or outcomes to the Reporter.
4. WHEN a student views content that the student has previously reported, THE Report_Button SHALL display a visual indicator (such as a filled icon) indicating that a report has already been submitted for this content.

### Requirement 7: Mobile-First and Cross-Platform Behavior

**User Story:** As a student using the iOS app, I want the reporting flow to feel native and responsive, so that it matches the rest of the ClassCast mobile experience.

#### Acceptance Criteria

1. THE Report_Form SHALL use a bottom sheet presentation with swipe-to-dismiss on iOS (Capacitor) matching the existing modal patterns in ClassCast.
2. THE Report_Button SHALL be reachable with one hand in portrait orientation on devices with screen heights up to 926 CSS pixels (iPhone 14 Pro Max).
3. THE Report_Form SHALL be fully functional on both the Capacitor iOS app and the web browser without conditional feature toggling.
4. WHEN the Report_Form is displayed, THE Report_Form SHALL trap focus within the modal and support keyboard navigation for accessibility on web.
5. THE Report_Button and Report_Form SHALL support both light and dark mode if the application's theme system is active.
