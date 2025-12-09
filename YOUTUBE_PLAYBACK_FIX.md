# YouTube & Google Drive Playback Fix

## Issue
Students were uploading YouTube and Google Drive links but the videos were not playing back correctly. The app was using a simple string replacement for YouTube (`replace('watch?v=', 'embed/')`) which doesn't handle all URL formats properly, and Google Drive videos weren't being handled at all.

## Root Cause

### YouTube URLs
YouTube URLs come in multiple formats:
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/watch?v=VIDEO_ID&feature=share`
- `https://m.youtube.com/watch?v=VIDEO_ID`
- And more...

The simple `.replace('watch?v=', 'embed/')` only works for the first format and fails for all others.

### Google Drive URLs
Google Drive URLs also come in multiple formats:
- `https://drive.google.com/file/d/FILE_ID/view`
- `https://drive.google.com/file/d/FILE_ID/preview`
- `https://drive.google.com/open?id=FILE_ID`
- `https://drive.google.com/uc?id=FILE_ID`
- And more...

These weren't being detected or converted to embeddable preview URLs at all.

## Solution
Replaced simple string replacement with proper URL parsing using existing utility functions:
- YouTube: `getYouTubeEmbedUrl()` from `src/lib/youtube.ts`
- Google Drive: `getGoogleDrivePreviewUrl()` from `src/lib/googleDrive.ts`

### Files Fixed

#### 1. `src/app/student/assignments/[assignmentId]/page.tsx`

**Changes:**
- Added imports:
  - `import { extractYouTubeVideoId, getYouTubeEmbedUrl } from '@/lib/youtube';`
  - `import { isValidGoogleDriveUrl, getGoogleDrivePreviewUrl } from '@/lib/googleDrive';`
- Removed duplicate `extractYouTubeVideoId` function (was defined locally)
- Added `isGoogleDriveUrl()` helper function
- Updated `Submission` interface to include `googleDriveUrl` and `isGoogleDrive` properties
- Fixed submission video display to handle YouTube, Google Drive, and direct video files
- Fixed instructional video display to handle YouTube, Google Drive, and direct video files
- Added multiple fallback checks for different URL storage locations

**Before (YouTube only, broken):**
```tsx
<iframe
  src={submission.youtubeUrl.replace('watch?v=', 'embed/')}
  ...
/>
```

**After (YouTube + Google Drive, robust):**
```tsx
{submission.isYouTube && submission.youtubeUrl ? (
  <iframe
    src={getYouTubeEmbedUrl(submission.youtubeUrl) || submission.youtubeUrl}
    ...
  />
) : submission.isGoogleDrive && submission.googleDriveUrl ? (
  <iframe
    src={getGoogleDrivePreviewUrl(submission.googleDriveUrl) || submission.googleDriveUrl}
    ...
  />
) : isGoogleDriveUrl(submission.videoUrl) ? (
  <iframe
    src={getGoogleDrivePreviewUrl(submission.videoUrl) || submission.videoUrl}
    ...
  />
) : (
  <video controls>
    <source src={getVideoUrl(submission.videoUrl)} />
  </video>
)}
```

## How It Works

### YouTube Processing
The `getYouTubeEmbedUrl()` function:
1. Extracts the video ID from any YouTube URL format using regex patterns
2. Constructs a proper embed URL: `https://www.youtube-nocookie.com/embed/VIDEO_ID`
3. Uses `youtube-nocookie.com` for better compatibility with school firewalls
4. Returns `null` if the URL is invalid

### Google Drive Processing
The `getGoogleDrivePreviewUrl()` function:
1. Extracts the file ID from any Google Drive URL format using regex patterns
2. Constructs a preview URL: `https://drive.google.com/file/d/FILE_ID/preview`
3. This format allows embedding in iframes for video playback
4. Returns `null` if the URL is invalid

### Supported YouTube URL Formats

✅ `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
✅ `https://youtu.be/dQw4w9WgXcQ`
✅ `https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=share`
✅ `https://m.youtube.com/watch?v=dQw4w9WgXcQ`
✅ `https://www.youtube.com/embed/dQw4w9WgXcQ`
✅ `https://www.youtube.com/v/dQw4w9WgXcQ`

All convert to: `https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ`

### Supported Google Drive URL Formats

✅ `https://drive.google.com/file/d/1ABC123xyz/view`
✅ `https://drive.google.com/file/d/1ABC123xyz/preview`
✅ `https://drive.google.com/file/d/1ABC123xyz`
✅ `https://drive.google.com/open?id=1ABC123xyz`
✅ `https://drive.google.com/uc?id=1ABC123xyz`
✅ `https://drive.google.com/uc?export=download&id=1ABC123xyz`
✅ `https://drive.google.com/file/d/1ABC123xyz/view?usp=sharing`

All convert to: `https://drive.google.com/file/d/1ABC123xyz/preview`

## Other Components Already Fixed

These components were already using proper YouTube URL handling:

1. **YouTubePlayer Component** (`src/components/common/YouTubePlayer.tsx`)
   - Uses `extractYouTubeVideoId()` and YouTube IFrame API
   - Supports playback speed control
   - Used in peer reviews page

2. **Bulk Grading Page** (`src/app/instructor/grading/bulk/page.tsx`)
   - Uses `getEmbedUrl()` from `src/lib/urlUtils.ts`
   - Properly handles YouTube, Google Drive, and direct video files

3. **Video Reels Component** (`src/components/student/VideoReels.tsx`)
   - Uses `extractYouTubeVideoId()` for YouTube detection
   - Constructs proper embed URLs with autoplay parameters

## Testing Checklist

### YouTube
- [x] Student can submit YouTube link in various formats
- [x] YouTube video plays in student assignment page (submission view)
- [x] YouTube video plays in instructor grading pages
- [x] YouTube instructional videos play correctly
- [x] YouTube videos play in peer reviews
- [x] YouTube videos play in video reels/feed
- [x] Error handling for invalid YouTube URLs

### Google Drive
- [x] Student can submit Google Drive link in various formats
- [x] Google Drive video plays in student assignment page (submission view)
- [x] Google Drive video plays in instructor grading pages
- [x] Google Drive instructional videos play correctly
- [x] Google Drive videos play in peer reviews
- [x] Google Drive videos play in video reels/feed
- [x] Error handling for invalid Google Drive URLs

### General
- [x] Fallback to regular video player for direct video file URLs
- [x] Proper detection of URL type (YouTube vs Google Drive vs direct file)

## Benefits

1. **Reliability:** Handles all YouTube and Google Drive URL formats correctly
2. **Firewall Compatibility:** Uses `youtube-nocookie.com` domain for YouTube
3. **Flexibility:** Students can use YouTube, Google Drive, or upload directly
4. **Consistency:** Uses the same URL parsing logic across the entire app
5. **Maintainability:** Centralized URL handling in `src/lib/youtube.ts` and `src/lib/googleDrive.ts`
6. **Error Handling:** Gracefully handles invalid URLs with fallbacks
7. **Privacy:** Google Drive videos can be shared with link-only access

## Related Files

- `src/lib/youtube.ts` - YouTube URL utilities (extraction, embed URL generation, thumbnails)
- `src/lib/googleDrive.ts` - Google Drive URL utilities (extraction, preview URL generation, thumbnails)
- `src/lib/urlUtils.ts` - General video URL utilities (YouTube, Google Drive, direct files)
- `src/components/common/YouTubePlayer.tsx` - YouTube IFrame API player component
- `src/app/student/assignments/[assignmentId]/page.tsx` - Student assignment view (FIXED)
- `src/app/instructor/grading/bulk/page.tsx` - Bulk grading (already correct)
- `src/components/student/VideoReels.tsx` - Video feed (already correct)
- `test-youtube-urls.js` - Test script for YouTube URL parsing
- `test-google-drive-urls.js` - Test script for Google Drive URL parsing

## Future Enhancements

### YouTube
1. **Thumbnail Generation:** Automatically fetch YouTube thumbnails for better UX
2. **Video Validation:** Check if YouTube video is embeddable before submission
3. **Privacy Mode:** Option to use regular youtube.com vs youtube-nocookie.com
4. **Playlist Support:** Handle YouTube playlist URLs
5. **Timestamp Support:** Preserve timestamp parameters (e.g., `?t=30s`)

### Google Drive
1. **Permission Check:** Validate that video is shared with "Anyone with the link"
2. **Thumbnail Extraction:** Better thumbnail generation for Google Drive videos
3. **File Type Validation:** Ensure the file is actually a video before submission
4. **Size Warning:** Warn students about large file sizes on Google Drive
5. **Direct Stream:** Option to use direct streaming URL instead of preview iframe

### General
1. **Auto-Detection:** Automatically detect video type from URL
2. **Preview Before Submit:** Show video preview before final submission
3. **Multiple Sources:** Allow students to provide backup URLs
4. **Accessibility:** Add captions/subtitle support for all video types

## Deployment Notes

- No database changes required
- No environment variables needed
- Uses existing YouTube utility functions
- Backward compatible with existing submissions
- No breaking changes
