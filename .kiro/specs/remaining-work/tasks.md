# Remaining Work — Task List

## Priority 1: Bug Fixes & Polish

- [x] 1. Student Detail View — fix view count tracking
  - [x] 1.1 When a student's video is watched from the Recent Videos section on the dashboard, increment the view count on their submission record
  - [x] 1.2 Add a `viewCount` field to the submission and update `GET /api/student/feed` to return it
  - [x] 1.3 Display accurate view counts on the Student Detail page

- [~] 2. Instructor View Modal restyle — CANCELLED

- [x] 3. Assignment Edit functionality
  - [x] 3.1 Create `/api/assignments/[assignmentId]` PUT endpoint (already exists, verify it handles all fields)
  - [x] 3.2 Build edit form/modal that pre-fills current assignment data
  - [x] 3.3 Wire "Edit" button on assignment details page to the edit form
  - [x] 3.4 Allow editing: title, description, due date, max score, rubric

## Priority 2: Android Build Update

- [x] 4. Android version bump + icon + splash
  - [x] 4.1 Bump Android versionCode and versionName to match iOS (1.4.0)
  - [x] 4.2 Replace Android app icon with MyClassCast36.png (all mipmap sizes)
  - [x] 4.3 Generate Android splash screen (white bg + centered logo)
  - [x] 4.4 Run `npx cap sync android`
  - [x] 4.5 Build signed AAB for Play Store

## Priority 3: Study Module & Group Project Builders

- [ ] 5. Study Module lesson builder
  - [ ] 5.1 Create `/instructor/assignments/[assignmentId]/lessons` page
  - [ ] 5.2 Add lesson CRUD API (POST/PUT/DELETE lessons for a module)
  - [ ] 5.3 Build lesson editor UI: add video URL, text content, or quiz
  - [ ] 5.4 Quiz builder within lessons (multiple choice, true/false)
  - [ ] 5.5 Drag-to-reorder lessons
  - [ ] 5.6 Student-facing lesson viewer with progress tracking

- [ ] 6. Group Project — teacher-assigned group builder
  - [ ] 6.1 After creating a group project assignment, show group assignment UI
  - [ ] 6.2 List enrolled students and allow dragging into group buckets
  - [ ] 6.3 Mobile-friendly: use dropdown "Assign to Group" per student
  - [ ] 6.4 Save group assignments to `classcast-module-groups` table
  - [ ] 6.5 Show group members in student ModuleWorkspace view

## Priority 4: Notifications & Communication

- [ ] 7. Push notification triggers
  - [ ] 7.1 Send push when instructor posts a new assignment
  - [ ] 7.2 Send push when a grade is posted
  - [ ] 7.3 Send push when assignment is due in 24 hours
  - [ ] 7.4 Send push when someone responds to your discussion post
  - [ ] 7.5 Configure notification preferences (allow students to opt out per type)

- [ ] 8. Email notifications
  - [ ] 8.1 Send email when grade is posted (with score + feedback preview)
  - [ ] 8.2 Send weekly digest email (upcoming assignments, ungraded work)
  - [ ] 8.3 Send enrollment confirmation email when student joins a course
  - [ ] 8.4 Use SES with verified domain (already configured)

## Priority 5: Analytics & Reporting

- [ ] 9. Instructor analytics dashboard
  - [ ] 9.1 Create `/instructor/analytics` page
  - [ ] 9.2 Show: video submissions over time, average grades by assignment, student engagement
  - [ ] 9.3 Per-student metrics: videos watched, posts made, average rating received
  - [ ] 9.4 Export analytics as CSV
  - [ ] 9.5 Add to instructor sidebar navigation

## Priority 6: Infrastructure Cleanup

- [x] 10. Remove OpenAI dependency
  - [x] 10.1 Run `npm uninstall openai`
  - [x] 10.2 Remove `OPENAI_API_KEY` from .env.local
  - [x] 10.3 Verify build still passes

- [x] 11. Amplify environment variables
  - [x] 11.1 Add `SNS_ERROR_TOPIC_ARN` to Amplify environment variables
  - [ ] 11.2 Verify error reporting works in production after deploy

- [ ] 12. Production verification
  - [ ] 12.1 Test AI Assignment Generator with enterprise subscription
  - [ ] 12.2 Test star rating "first click" persistence
  - [ ] 12.3 Test enrollment with section class code (e.g., 5PQ2QH)
  - [ ] 12.4 Verify splash screen on iOS (no blue, no shift)
  - [ ] 12.5 Verify dashboard doesn't scroll vertically

## Notes

- Tasks in Priority 1-2 should be done before next App Store submission
- Priority 3-4 are feature completions that round out the platform
- Priority 5 adds value for schools evaluating the product
- Priority 6 is housekeeping that prevents tech debt
