# Remaining Work — Task List

## Priority 1: Bug Fixes & Polish

- [x] 1. Student Detail View — fix view count tracking
  - [x] 1.1 When a student's video is watched from the Recent Videos section on the dashboard, increment the view count on their submission record
  - [x] 1.2 Add a `viewCount` field to the submission and update `GET /api/student/feed` to return it
  - [x] 1.3 Display accurate view counts on the Student Detail page

- [ ] 2. Instructor View Modal restyle — CANCELLED

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

- [x] 5. Study Module lesson builder
  - [x] 5.1 Create `/instructor/assignments/[assignmentId]/lessons` page
  - [x] 5.2 Add lesson CRUD API (POST/PUT/DELETE lessons for a module)
  - [x] 5.3 Build lesson editor UI: add video URL, text content, or quiz
  - [x] 5.4 Quiz builder within lessons (multiple choice, true/false)
  - [x] 5.5 Drag-to-reorder lessons
  - [x] 5.6 Student-facing lesson viewer with progress tracking

- [x] 6. Group Project — teacher-assigned group builder
  - [x] 6.1 After creating a group project assignment, show group assignment UI
  - [x] 6.2 List enrolled students and allow dragging into group buckets
  - [x] 6.3 Mobile-friendly: use dropdown "Assign to Group" per student
  - [x] 6.4 Save group assignments to `classcast-module-groups` table
  - [x] 6.5 Show group members in student ModuleWorkspace view

## Priority 4: Notifications & Communication

- [x] 7. Push notification triggers
  - [x] 7.1 Send push when instructor posts a new assignment
  - [x] 7.2 Send push when a grade is posted
  - [x] 7.3 Send push when assignment is due in 24 hours
  - [x] 7.4 Send push when someone responds to your discussion post
  - [x] 7.5 Configure notification preferences (allow students to opt out per type)

- [ ] 8. Email notifications
  - [ ] 8.1 Send email when grade is posted (with score + feedback preview)
  - [ ] 8.2 Send weekly digest email (upcoming assignments, ungraded work)
  - [ ] 8.3 Send enrollment confirmation email when student joins a course
  - [ ] 8.4 Use SES with verified domain (already configured)

## Priority 5: Analytics & Reporting

- [x] 9. Instructor analytics dashboard
  - [x] 9.1 Create `/instructor/admin/analytics` page (admin-only)
  - [x] 9.2 Show: total submissions, students, courses, grading stats, weekly activity
  - [x] 9.3 Per-course metrics: students enrolled, assignments, submissions
  - [x] 9.4 Export analytics as CSV
  - [x] 9.5 Add to instructor profile page under "Admin Tools" (admin users only)

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

## Priority 7: Field-Reported Issues & Follow-ups

Flags surfaced from student reports and session work. Keep updated as they're resolved.

- [x] 13. Peer video feed — delete button not reachable
  - [x] 13.1 Student on the Dilations (multi-video) assignment couldn't delete their second video to re-record
  - [x] 13.2 Root cause: delete control sat in the bottom overlay where the floating tab bar (z-40) could cover it on shorter screens
  - [x] 13.3 Fix: moved a labeled Delete/Report button into the top overlay header (never occluded, shows on all screen sizes); added "YOU" badge on own videos; raised action rail + bottom overlay above the tab bar (commit d73f3a39)
  - [ ] 13.4 VERIFY on a real device that the affected student can now delete the second video

- [ ] 14. Peer video feed — Instagram-style redesign follow-ups
  - [ ] 14.1 Star rating rail: the vertical 5-star popover can get tall on small phones — consider a compact single-star trigger that opens a small picker
  - [ ] 14.2 Consider an explicit "Replace / swap video" action (delete + re-record in one flow) since students hit friction doing it manually

- [ ] 15. Email deliverability (SES)
  - [ ] 15.1 Account is in production but on PROBATION; ~326 suppressed recipients (mostly a bad Hotmail blast)
  - [ ] 15.2 Monitor so legitimate reset/notification emails aren't silently dropped; prune suppression list where appropriate

- [ ] 16. Local dev environment — git hangs on Xcode license
  - [ ] 16.1 Default `git` hangs on an unaccepted Xcode license prompt; current workaround is the CLT git binary with --no-verify
  - [ ] 16.2 Permanent fix: run `sudo xcodebuild -license accept` in a terminal (user action)

- [ ] 17. Dashboard/feed performance — replace full-table submission scan
  - [x] 17.1 Peer feed + instructor query: fixed wrong GSI names (were full-scanning); now use assignmentId-index / studentId-index
  - [x] 17.2 Peer feed + dashboard feed: sign S3 video/thumbnail URLs so tiles load reliably (was 403-ing on unsigned URLs)
  - [x] 17.3 /api/student/feed: parallelized the independent table scans and removed a duplicate assignments scan
  - [ ] 17.4 DEEPER FIX: /api/student/feed still Scans the ENTIRE classcast-submissions table on every dashboard load (it's a cross-course peer feed, so it can't use studentId-index). Add a `courseId` GSI to classcast-submissions (+ backfill courseId on existing items if missing) so the feed can Query per enrolled course instead of scanning all platform submissions. Needs an index change + data backfill, hence deferred.
  - [ ] 17.5 Verify dashboard startup latency improvement after 17.1–17.3 deploy

- [x] 18. Retire community-posts / discussion feature (product decision)
  - [x] 18.1 Deleted /community + /student/community pages, /api/community/* routes, communityService.ts
  - [x] 18.2 Removed the community-posts block from /api/student/feed and the 'community' FeedItem type; removed the "Community Help" link on the marketing assignments page; dropped the 'community-post' branch in instructor moderation
  - [x] 18.3 KEPT (different features that share the name): peer-video reels (StudentCommunityFeed/PeerSubmissionCard/CommunityInteractions/VideoReels + /api/student/community/submissions) and InstructorCommunityFeed (grading/submissions view)
  - [x] 18.4 Deleted the unused experimental dashboard variants (dashboard-new, dashboard-hybrid, dashboard-udemy, dashboard/page-old) and the unused DashboardSwitcher dev tool that referenced them — they held dead /api/community references and were not in active nav
  - [ ] 18.5 OPTIONAL data teardown: classcast-community-posts / classcast-community-comments / classcast-post-likes tables still hold old rows; delete the tables once we're sure the feature won't return

## Notes

- Tasks in Priority 1-2 should be done before next App Store submission
- Priority 3-4 are feature completions that round out the platform
- Priority 5 adds value for schools evaluating the product
- Priority 6 is housekeeping that prevents tech debt
- Priority 7 tracks field-reported issues; verify 13.4 on-device before considering the delete fix closed
