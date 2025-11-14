# Google Drive URL Support - Implementation Guide

## Problem
Users were pasting Google Drive links, but the system was treating them as YouTube URLs, causing 500 errors when trying to view/process the videos.

## Solution
Created URL validation and processing utilities that:
1. Detect Google Drive links
2. Convert them to embeddable format
3. Properly validate YouTube URLs
4. Handle direct video URLs

## Files Created

### 1. `src/lib/urlUtils.ts`
Core utility functions for URL parsing and conversion:
- `extractYouTubeId()` - Extract YouTube video ID from various URL formats
- `extractGoogleDriveId()` - Extract Google Drive file ID
- `convertGoogleDriveToEmbed()` - Convert Google Drive URL to embeddable format
- `parseVideoUrl()` - Main function to parse and validate any video URL
- `getEmbedUrl()` - Get embed URL for YouTube or Google Drive

### 2. `src/lib/videoUrlProcessor.ts`
Backend API utilities for processing video URLs:
- `processVideoUrl()` - Process URL for storage (converts Google Drive to embed format)
- `validateVideoUrl()` - Validate URL and return error if invalid
- `getDisplayUrl()` - Get best URL format for display
- `isGoogleDriveUrl()` - Check if URL is Google Drive
- `isYouTubeUrl()` - Check if URL is YouTube

## Usage

### Frontend (React Components)

```typescript
import { parseVideoUrl, convertToBestFormat } from '@/lib/urlUtils';

// When user pastes a URL
function handleUrlPaste(url: string) {
  const parsed = parseVideoUrl(url);
  
  if (!parsed.isValid) {
    // Show error message
    setError(parsed.error);
    return;
  }
  
  // Convert Google Drive URLs to embeddable format
  const displayUrl = convertToBestFormat(url);
  
  // Use displayUrl for submission
  submitVideoUrl(displayUrl);
}
```

### Backend (API Routes)

```typescript
import { processVideoUrl, validateVideoUrl } from '@/lib/videoUrlProcessor';

// In your API route handler
export async function POST(request: Request) {
  const { videoUrl } = await request.json();
  
  // Validate the URL
  const validation = validateVideoUrl(videoUrl);
  if (!validation.isValid) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 }
    );
  }
  
  // Process the URL (converts Google Drive to embed format)
  const processed = processVideoUrl(videoUrl);
  
  // Store the processed URL
  await saveVideoSubmission({
    originalUrl: processed.originalUrl,
    displayUrl: processed.displayUrl,
    embedUrl: processed.embedUrl,
    videoType: processed.videoType,
  });
  
  return NextResponse.json({ success: true });
}
```

### Video Display Component

```typescript
import { getEmbedUrl, parseVideoUrl } from '@/lib/urlUtils';

function VideoPlayer({ videoUrl }: { videoUrl: string }) {
  const parsed = parseVideoUrl(videoUrl);
  const embedUrl = getEmbedUrl(videoUrl);
  
  if (parsed.type === 'youtube' && embedUrl) {
    return (
      <iframe
        src={embedUrl}
        width="560"
        height="315"
        frameBorder="0"
        allowFullScreen
      />
    );
  }
  
  if (parsed.type === 'google-drive' && embedUrl) {
    return (
      <iframe
        src={embedUrl}
        width="560"
        height="315"
        frameBorder="0"
        allowFullScreen
      />
    );
  }
  
  if (parsed.type === 'direct') {
    return (
      <video controls width="560" height="315">
        <source src={videoUrl} type="video/mp4" />
      </video>
    );
  }
  
  return <div>Unsupported video format</div>;
}
```

## Google Drive URL Formats Supported

The utility handles these Google Drive URL formats:
- `https://drive.google.com/file/d/FILE_ID/view`
- `https://drive.google.com/file/d/FILE_ID/view?usp=sharing`
- `https://drive.google.com/open?id=FILE_ID`
- `https://docs.google.com/file/d/FILE_ID/edit`

All are converted to embeddable format:
- `https://drive.google.com/file/d/FILE_ID/preview`

## YouTube URL Formats Supported

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`
- `https://www.youtube.com/v/VIDEO_ID`

## Files Created/Updated

### 3. `src/app/api/videos/[submissionId]/view/route.ts`
API route handler for video viewing that:
- Validates video URLs using `validateVideoUrl()`
- Processes URLs using `processVideoUrl()` (converts Google Drive to embed format)
- Returns processed URL information for frontend display

### 4. `src/components/VideoUrlInput.tsx`
Reusable React component for video URL input:
- Automatically validates URLs as user types/pastes
- Shows error messages for invalid URLs
- Converts Google Drive URLs to embeddable format
- Provides visual feedback for valid URLs

### 5. `src/components/VideoPlayer.tsx`
Reusable React component for video playback:
- Handles YouTube, Google Drive, and direct video URLs
- Automatically embeds videos in appropriate format
- Falls back gracefully for unsupported formats

## Integration Examples

### Using VideoUrlInput Component

```typescript
import { VideoUrlInput } from '@/components/VideoUrlInput';

function MyForm() {
  const [videoUrl, setVideoUrl] = useState('');
  const [isValid, setIsValid] = useState(false);

  const handleUrlChange = (url: string, valid: boolean, error?: string) => {
    setVideoUrl(url);
    setIsValid(valid);
    if (error) {
      console.error('URL validation error:', error);
    }
  };

  return (
    <form>
      <VideoUrlInput
        value={videoUrl}
        onChange={handleUrlChange}
        label="Video Link"
        placeholder="Paste YouTube or Google Drive link..."
      />
      <button type="submit" disabled={!isValid}>
        Submit
      </button>
    </form>
  );
}
```

### Using VideoPlayer Component

```typescript
import { VideoPlayer } from '@/components/VideoPlayer';

function VideoDisplay({ videoUrl }: { videoUrl: string }) {
  return (
    <VideoPlayer
      videoUrl={videoUrl}
      width="100%"
      height={400}
      autoplay={false}
      controls={true}
    />
  );
}
```

## Next Steps

1. **Integrate Components**: Replace existing video URL input fields with `VideoUrlInput` component
2. **Update Video Display**: Replace existing video players with `VideoPlayer` component
3. **Update API Integration**: Ensure your submission API uses `processVideoUrl()` when saving video URLs
4. **Test**: Test with various Google Drive and YouTube URLs to ensure everything works correctly

## Testing

Test with these URLs:
- ✅ `https://drive.google.com/file/d/1sVZlur94cuyagJ0xpUV_UeHCPRvwMYRx/view?usp=sharing`
- ✅ `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- ✅ `https://youtu.be/dQw4w9WgXcQ`
- ❌ `https://example.com/video.mp4` (should show error if not a valid video URL)

## Notes

- Google Drive files must be set to "Anyone with the link can view" for embedding to work
- The utility preserves the original URL and stores a converted version for display
- Direct video URLs are supported if they end with common video extensions (.mp4, .webm, etc.)

