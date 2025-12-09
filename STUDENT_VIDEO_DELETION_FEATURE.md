# Student Video Deletion Feature

## Overview
Students can now delete their video submissions before they are graded, allowing them to correct mistakes and resubmit.

## Implementation Details

### 1. Delete API Endpoint
**File:** `src/app/api/delete-submission/route.ts`

**Endpoint:** `POST /api/delete-submission`

**Request Body:**
```json
{
  "submissionId": "submission_1234567890_abc123"
}
```

**Functionality:**
- Verifies submission exists
- Deletes video file from S3 (if not YouTube/Google Drive)
- Deletes all associated peer responses
- Deletes video entry from community display table
- Deletes submission record from database
- Returns success/error response

**Security:**
- Only allows deletion of ungraded submissions
- Comprehensive error handling
- Detailed logging for debugging

### 2. Student Assignment Page Updates
**File:** `src/app/student/assignments/[assignmentId]/page.tsx`

**New Features:**
1. **Submission Display Section**
   - Shows submitted video with preview
   - Displays submission details (title, description, date, duration)
   - Shows grade and feedback (if graded)
   - Shows pending status (if not graded)

2. **Delete Button**
   - Only visible for ungraded submissions
   - Located in top-right of submission section
   - Red styling to indicate destructive action
   - Opens confirmation modal before deletion

3. **Delete Confirmation Modal**
   - Warning icon and message
   - "This action cannot be undone" notice
   - Cancel and Delete buttons
   - Loading state during deletion
   - Disabled buttons during deletion process

4. **Peer Feedback Section**
   - Shows responses from classmates on student's video
   - Collapsible with show/hide toggle
   - Reply functionality for student to respond to feedback
   - Nested replies display

### 3. User Experience Flow

**Before Grading:**
1. Student submits video assignment
2. Submission appears with green success styling
3. Delete button is visible in top-right
4. Student can click delete if they made a mistake
5. Confirmation modal appears
6. After confirming, submission is deleted
7. Student can resubmit a new video

**After Grading:**
1. Submission shows grade and feedback
2. Delete button is hidden (cannot delete graded work)
3. Student can view but not modify submission

### 4. What Gets Deleted

When a student deletes their submission:
- ✅ Video file from S3 storage (if uploaded)
- ✅ Submission record from database
- ✅ All peer responses to that video
- ✅ Video entry from community feed
- ✅ Associated metadata and thumbnails

**Note:** YouTube and Google Drive videos are not deleted from their original platforms, only the submission record is removed.

### 5. Safety Features

1. **Confirmation Required:** Modal prevents accidental deletion
2. **Grade Protection:** Cannot delete graded submissions
3. **Loading States:** Prevents double-submission during deletion
4. **Error Handling:** Shows user-friendly error messages
5. **Comprehensive Logging:** All deletion steps are logged for debugging

### 6. UI Components

**Delete Button:**
```tsx
<button className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
  <svg>...</svg>
  <span>Delete Submission</span>
</button>
```

**Confirmation Modal:**
- Warning icon with red background
- Clear heading: "Delete Submission?"
- Subtext: "This action cannot be undone"
- Cancel (gray) and Delete (red) buttons
- Disabled state during deletion

### 7. Success Messages

After successful deletion:
- Alert: "Submission deleted successfully!"
- Submission section disappears
- Page refreshes to show unsubmitted state
- Student can submit a new video

### 8. Error Handling

Possible errors and messages:
- "No submission found" - Submission doesn't exist
- "Failed to delete submission" - Server error
- "An error occurred while deleting" - Network error

## Testing Checklist

- [ ] Student can see delete button on ungraded submission
- [ ] Delete button opens confirmation modal
- [ ] Cancel button closes modal without deleting
- [ ] Delete button removes submission successfully
- [ ] S3 video file is deleted (for uploaded videos)
- [ ] Peer responses are deleted
- [ ] Video entry removed from community feed
- [ ] Success message appears after deletion
- [ ] Page refreshes to show unsubmitted state
- [ ] Student can resubmit after deletion
- [ ] Delete button hidden for graded submissions
- [ ] Error messages display for failed deletions
- [ ] Loading state prevents double-clicks

## Future Enhancements

1. **Soft Delete:** Keep deleted submissions in database with `isDeleted` flag
2. **Deletion History:** Track when and why submissions were deleted
3. **Undo Feature:** Allow students to restore recently deleted submissions
4. **Admin Override:** Allow instructors to prevent deletion after certain date
5. **Deletion Limit:** Limit number of times a student can delete/resubmit

## Related Files

- `src/app/api/delete-submission/route.ts` - Delete API endpoint
- `src/app/student/assignments/[assignmentId]/page.tsx` - Student assignment page
- `src/app/api/video-submissions/route.ts` - Submission creation API
- `src/lib/videoUtils.ts` - Video URL utilities

## Database Tables Affected

1. **classcast-submissions** - Submission record deleted
2. **classcast-peer-responses** - Associated responses deleted
3. **classcast-videos** - Community video entry deleted
4. **S3 Bucket (classcast-videos)** - Video file deleted

## Deployment Notes

- No environment variables needed
- Uses existing AWS credentials
- No database migrations required
- Feature is immediately available after deployment
