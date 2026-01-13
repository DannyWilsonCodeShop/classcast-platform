# Video Upload Persistence Bug Fix

## Issue Summary
When instructors upload a video from iPhone in the instructor portal while creating a new assignment, the video doesn't persist. The video gets uploaded to S3 successfully, but the assignment creation fails to save the video URL.

## Root Cause Analysis

### 1. Missing Field in Assignment API
**Problem**: The `/api/assignments/route.ts` POST handler was not extracting or saving the `instructionalVideoUrl` field from the request body.

**Evidence**: 
- Video upload to S3 works correctly (returns video URL)
- Assignment creation succeeds but without video URL
- Video becomes "orphaned" in S3 bucket

### 2. Form Submission Flow
**Current Flow**:
1. User selects video file in form
2. User clicks submit
3. Form validates data
4. **Video uploads to S3** → Gets video URL
5. **Assignment creation API called** → Should save video URL
6. **BUG**: Video URL not included in saved assignment

## Fixes Applied

### 1. Updated Assignment Creation API
**File**: `src/app/api/assignments/route.ts`

**Changes**:
- Added `instructionalVideoUrl` to destructured request body
- Added additional peer response and video settings fields
- Included `instructionalVideoUrl` in assignment object saved to DynamoDB

```typescript
// Added to request body destructuring
instructionalVideoUrl,
enablePeerResponses,
responseDueDate,
minResponsesRequired,
maxResponsesPerVideo,
responseWordLimit,
responseCharacterLimit,
hidePeerVideosUntilInstructorPosts,
requireLiveRecording,
allowYouTubeUrl,
coverPhoto,
emoji,
color

// Added to assignment object
instructionalVideoUrl: instructionalVideoUrl || null,
enablePeerResponses: enablePeerResponses || false,
responseDueDate: responseDueDate || null,
// ... other fields
```

### 2. Enhanced Error Handling
**File**: `src/components/instructor/AssignmentCreationForm.tsx`

**Changes**:
- Added detailed error logging in handleSubmit
- Better error messages for different failure types
- Network error detection and user-friendly messages

### 3. Improved API Response Handling
**File**: `src/app/instructor/courses/[courseId]/assignments/create/page.tsx`

**Changes**:
- Added response status and headers logging
- Enhanced error message extraction
- Better debugging information

## Testing Strategy

### Manual Testing Steps
1. **Test Video Upload Only**:
   - Go to assignment creation form
   - Select "Upload" for instructional video
   - Choose a video file
   - Check browser network tab for upload success

2. **Test Complete Flow**:
   - Upload video and fill out assignment form
   - Submit assignment
   - Check if assignment is created with video URL
   - Verify video appears in assignment view

3. **Test iPhone Specific**:
   - Use iPhone Safari/Chrome
   - Test with different video formats (MOV, MP4)
   - Test with different file sizes
   - Check for mobile-specific upload issues

### Debugging Tools

**Browser Console Logs**:
```javascript
// Form submission
🔄 Form submit triggered
📝 Form data: {...}
✅ Validating form...
📤 Uploading instructional video...
✅ Instructional video uploaded: [URL]
📤 Calling onSubmit with assignment data: {...}
✅ onSubmit completed successfully

// API Response
API Response status: 200
Assignment created successfully: {...}
```

**Test Script**: `test-video-upload-persistence.js`
- Verifies API endpoint structure
- Tests assignment creation flow
- Validates video URL persistence

## Mobile-Specific Considerations

### iPhone Upload Issues
1. **File Format**: iPhones record in MOV format by default
2. **File Size**: iPhone videos can be very large (>2GB)
3. **Network**: Mobile networks may have upload timeouts
4. **Browser**: Safari vs Chrome behavior differences

### Potential Mobile Fixes
1. **File Size Validation**:
   ```typescript
   if (file.size > maxFileSize) {
     alert(`File too large. Maximum size: ${formatFileSize(maxFileSize)}`);
     return;
   }
   ```

2. **Format Validation**:
   ```typescript
   const allowedTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/quicktime'];
   if (!allowedTypes.includes(file.type)) {
     alert('Unsupported video format. Please use MP4, WebM, or MOV.');
     return;
   }
   ```

3. **Upload Progress**:
   ```typescript
   // Add upload progress indicator for large files
   const uploadWithProgress = async (file) => {
     // Implementation with progress tracking
   };
   ```

## Verification Steps

### 1. Check Assignment in Database
```javascript
// Query DynamoDB to verify instructionalVideoUrl is saved
const assignment = await docClient.send(new GetCommand({
  TableName: 'classcast-assignments',
  Key: { assignmentId: 'assignment_xxx' }
}));

console.log('Instructional Video URL:', assignment.Item?.instructionalVideoUrl);
```

### 2. Check S3 Video Exists
```javascript
// Verify video file exists in S3
const videoUrl = assignment.instructionalVideoUrl;
const response = await fetch(videoUrl, { method: 'HEAD' });
console.log('Video exists:', response.ok);
```

### 3. Test Assignment Display
- Navigate to assignment view page
- Verify instructional video appears
- Test video playback

## Rollback Plan
If issues persist:

1. **Revert API Changes**:
   ```bash
   git checkout HEAD~1 -- src/app/api/assignments/route.ts
   ```

2. **Alternative Approach**:
   - Save video URL in separate table
   - Link via assignmentId
   - Update assignment after creation

## Monitoring
- Monitor S3 bucket for orphaned videos
- Track assignment creation success rates
- Monitor mobile vs desktop upload success

## Next Steps
1. Deploy fixes to staging environment
2. Test with actual iPhone device
3. Monitor production logs for upload errors
4. Consider implementing upload progress indicators
5. Add video compression for large files

## Files Modified
- `src/app/api/assignments/route.ts` - Added instructionalVideoUrl handling
- `src/components/instructor/AssignmentCreationForm.tsx` - Enhanced error handling
- `src/app/instructor/courses/[courseId]/assignments/create/page.tsx` - Better API response handling
- `test-video-upload-persistence.js` - Created debugging test script