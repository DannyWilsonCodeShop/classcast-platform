# Instructor Course Page Fixes

## Issue 1: Duplicate "Edit Course" Buttons ✅
**Problem:** The instructor course details page had redundant edit buttons:
1. "✏️ Edit Course" button in header
2. "⚙️ Settings" button in header (same functionality)
3. "✏️ Edit Course Details" button in Course Information card

All three buttons opened the same modal (`setShowSettingsModal(true)`).

**Solution:**
- Removed the "✏️ Edit Course" button from header
- Removed the "✏️ Edit Course Details" button from Course Information card
- Kept only the "⚙️ Settings" button in the header

**Result:** Clean, single point of access for course settings.

## Issue 2: Edit Course from Dashboard Should Open Modal Directly ✅
**Problem:** Clicking "Edit Course" from the instructor dashboard navigated to the course page, requiring a second click on the Settings button to actually edit the course.

**Solution:**
1. Updated dashboard "Edit Course" button to include `?openSettings=true` URL parameter
2. Added logic to course page to detect this parameter and auto-open the settings modal
3. Parameter is removed from URL after opening to prevent reopening on refresh

**Flow:**
```
Dashboard "Edit Course" button
  ↓
Navigate to /instructor/courses/{courseId}?openSettings=true
  ↓
Course page loads
  ↓
Detects openSettings=true parameter
  ↓
Auto-opens CourseSettingsModal
  ↓
Removes parameter from URL
```

**Result:** One-click access to course editing from dashboard.

## Issue 3: Assignment Resources Not Showing
**Problem:** Resources section not appearing on student assignment details page despite:
- Resources existing in database ✅
- Code fix applied to API ✅
- Frontend component ready ✅

**Root Cause:** Changes haven't been deployed to production yet.

**Why Resources Aren't Visible:**
1. User made changes locally but hasn't committed
2. Production site (class-cast.com) is still running old code
3. Old code has the `attachments` vs `resources` field mismatch

**What Was Fixed (Locally):**
- Changed `/api/student/assignments` to return `resources` instead of `attachments`
- Cleaned up debug console.logs
- Changed styling from yellow debug to blue production

**To Make Resources Visible:**
User needs to:
1. Commit the changes
2. Push to repository
3. Wait for Amplify deployment
4. Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)

**Verification:**
Run `node test-assignment-resources-display.js` to confirm resources exist in database:
- Assignment: `assignment_1768361755173_ti155u2nf`
- Resource: "Problem Sheet" link to Google Sheets
- Status: ✅ In database, waiting for deployment

## Files Modified
1. `src/app/instructor/courses/[courseId]/page.tsx` - Removed duplicate Edit buttons, added auto-open settings logic
2. `src/app/instructor/dashboard/page.tsx` - Added openSettings parameter to Edit Course button
3. `src/app/api/student/assignments/route.ts` - Fixed resources field (already done)
4. `src/app/student/assignments/[assignmentId]/page.tsx` - Cleaned up debug code (already done)

## Status
✅ **Instructor page fixes:** COMPLETE - Ready for commit
✅ **Edit Course direct access:** COMPLETE - Ready for commit
⏳ **Resources display:** Waiting for deployment to production

## Next Steps
1. Commit all changes when ready
2. Deployment will make resources visible on production
3. User should see "📎 Assignment Resources" section after deployment + hard refresh
4. "Edit Course" from dashboard will now open settings modal directly
