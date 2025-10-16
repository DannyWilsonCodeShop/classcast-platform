# 🔍 YouTube Submission Debug Guide

## Current Status

The YouTube submission feature has been enhanced with comprehensive error logging to help diagnose why videos aren't uploading.

## How to Debug

### 1. Open Browser Console
When submitting a YouTube video, open your browser's Developer Console (F12 or Right-click → Inspect → Console)

### 2. Look for These Logs

#### When Submitting YouTube URL:
```
📤 Submitting YouTube video: {submissionData}
📥 Response status: 200
📥 Response data: {responseData}
```

#### If Successful:
```
✅ Response status: 200
✅ Response data: { success: true, submission: {...} }
```

#### If Failed:
```
❌ Response status: 400/500
❌ Response data: { error: "Error message here" }
YouTube Submission Error: [Specific error message]
```

### 3. Common Error Scenarios

#### Error: "Missing required fields"
**Cause**: Missing `assignmentId`, `studentId`, `courseId`, or `youtubeUrl`

**Check**:
```javascript
// These should all be present in the console log
assignmentId: "assignment_xxxx_xxxx"
studentId: "user_xxxx_xxxx"  
courseId: "course_xxxx_xxxx"
youtubeUrl: "https://www.youtube.com/watch?v=..."
```

**Fix**: Ensure you're accessing the page with proper URL parameters

#### Error: "Invalid YouTube URL"
**Cause**: URL validation failed

**Valid formats**:
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`

**Fix**: Ensure you're pasting a valid YouTube URL

#### Error: "Failed to submit YouTube video"
**Cause**: API endpoint error

**Check**:
1. Network tab in DevTools
2. Look for `/api/video-submissions` request
3. Check response status and body
4. Review server logs in Amplify console

### 4. Test the Full Flow

#### Step-by-Step Test:
1. Navigate to: `https://class-cast.com/student/video-submission?assignmentId=assignment_1760361837873_ocjepaj50&courseId=course_1760358077083_u6dasswug`
2. Click "YouTube URL" tab
3. Paste a YouTube URL (e.g., `https://www.youtube.com/watch?v=dQw4w9WgXcQ`)
4. Watch console for logs
5. Click "Submit" button
6. Check console for response logs

### 5. What Should Happen

#### Successful Submission:
1. YouTube URL is validated ✓
2. Video ID is extracted ✓
3. YouTube iframe preview appears ✓
4. User clicks Submit ✓
5. API creates submission in DynamoDB ✓
6. Progress bar shows 100% ✓
7. Success message appears ✓
8. Auto-redirect to dashboard after 3 seconds ✓

#### Data Sent to API:
```json
{
  "assignmentId": "assignment_1760361837873_ocjepaj50",
  "studentId": "user_xxxx_xxxx",
  "courseId": "course_1760358077083_u6dasswug",
  "sectionId": null,
  "youtubeUrl": "https://www.youtube.com/watch?v=...",
  "videoId": "VIDEO_ID",
  "thumbnailUrl": "https://img.youtube.com/vi/VIDEO_ID/hqdefault.jpg",
  "videoTitle": "Functions Video Assignment: Multiple Representations...",
  "videoDescription": "Student YouTube video submission",
  "submissionMethod": "youtube",
  "isRecorded": false,
  "isUploaded": false,
  "isYouTube": true
}
```

#### Data Stored in DynamoDB:
```json
{
  "submissionId": "submission_xxxx_xxxx",
  "assignmentId": "assignment_1760361837873_ocjepaj50",
  "studentId": "user_xxxx_xxxx",
  "courseId": "course_1760358077083_u6dasswug",
  "videoUrl": "https://www.youtube.com/watch?v=...",
  "youtubeUrl": "https://www.youtube.com/watch?v=...",
  "videoTitle": "Functions Video Assignment...",
  "thumbnailUrl": "https://img.youtube.com/vi/VIDEO_ID/hqdefault.jpg",
  "isYouTube": true,
  "submissionMethod": "youtube",
  "status": "submitted",
  "submittedAt": "2025-10-16T..."
}
```

## Troubleshooting Steps

### If YouTube video doesn't show preview:
1. Check console for: `isValidYouTubeUrl` result
2. Verify URL format is correct
3. Check if `extractYouTubeVideoId` returns a valid ID
4. Test the iframe URL directly: `https://www.youtube.com/embed/VIDEO_ID`

### If submission fails silently:
1. Check browser console for error logs
2. Look for red error messages in the UI
3. Check Network tab for failed requests
4. Review response status and body

### If submission succeeds but doesn't appear in dashboard:
1. Check DynamoDB table: `classcast-submissions`
2. Verify `submissionId` was created
3. Check if assignment page queries for YouTube submissions
4. Verify `isYouTube` flag is preserved

## Camera Control Status

### ✅ Camera Now Stops On:
1. **Tab Switch** - Clicking "Upload" or "YouTube URL" tabs
2. **Page Visibility** - Switching browser tabs or minimizing window
3. **Navigation** - Clicking back button or navigating away
4. **Page Close** - Closing the tab or browser
5. **Component Unmount** - Any time the component unmounts

### 🎥 Camera Lifecycle:
```
User visits page → Camera OFF
User clicks "Record" tab → Camera ON
User clicks "Upload" tab → Camera OFF (stopCamera called)
User clicks "YouTube" tab → Camera OFF (stopCamera called)
User switches browser tab → Camera OFF (visibilitychange)
User clicks back button → Camera OFF (stopCamera + beforeunload)
User closes page → Camera OFF (beforeunload)
```

## Console Logs to Watch For

### Camera Logs:
- `📹 Camera preview started`
- `📹 Stopping camera`
- `📹 Stopped track: video`
- `📹 Stopped track: audio`
- `📹 Switching away from record tab, stopping camera`
- `📹 Page hidden, stopping camera`
- `📹 Page unloading, stopping camera`
- `📹 Component unmounting, stopping camera`

### YouTube Logs:
- `📤 Submitting YouTube video: {data}`
- `📥 Response status: 200`
- `📥 Response data: {response}`
- `YouTube Submission Error: {error}` (if failed)

## Next Steps

1. **Test YouTube submission** with console open
2. **Copy all error messages** from console if it fails
3. **Check what the actual error is** from the API response
4. **Verify the data being sent** includes all required fields

## Expected Behavior

✅ YouTube iframe preview appears when valid URL is entered
✅ Submit button is enabled when URL is valid
✅ Console shows detailed submission data
✅ API response is logged
✅ Success or error message is displayed
✅ Camera is off when on YouTube tab
✅ Camera stops immediately when switching away from Record tab

