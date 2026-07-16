# Video Editing Suite — Tasks

## Phase 1: Core Trimming

### Task 1.1: Timeline Scrubber Component
- [ ] Create `<VideoTimeline>` component with waveform/thumbnail strip
- [ ] Draggable playhead that scrubs the video
- [ ] Touch-friendly (large hit area, momentum scrolling)
- [ ] Shows current time + total duration

### Task 1.2: Trim Front/Back
- [ ] Add start/end trim handles to timeline
- [ ] Drag handles to set in/out points
- [ ] Preview plays only the trimmed range
- [ ] "Reset" button to undo trim
- [ ] Re-encode trimmed video using Canvas + MediaRecorder
- [ ] Show encoding progress bar
- [ ] Replace video preview with trimmed result

### Task 1.3: Cut Middle Section
- [ ] "Split" button that marks a cut point on the timeline
- [ ] Two cut points define a region to remove
- [ ] Visual indicator showing removed segment (grayed out)
- [ ] Preview skips the cut section
- [ ] Re-encode with the section removed

### Task 1.4: Re-record a Section
- [ ] "Re-record" button that marks a timestamp range
- [ ] Opens camera in a mini-window to record replacement
- [ ] Splices new recording into the marked range
- [ ] Preview shows the combined result
- [ ] Re-encode the merged video

### Task 1.5: Integration with Record Page
- [ ] Add "Edit" button after recording/upload on record page
- [ ] Open edit UI as a full-screen overlay
- [ ] "Done" saves edited video back to the submission flow
- [ ] "Cancel" returns to original video

---

## Phase 2: Enhancements

### Task 2.1: Speed Adjustment
- [ ] Speed selector (0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x)
- [ ] Apply during re-encode (adjust canvas frame rate)
- [ ] Preview at selected speed before encoding

### Task 2.2: Visual Filters
- [ ] Filter presets: Normal, Warm, Cool, B&W, High Contrast, Soft
- [ ] Apply CSS filters to canvas during re-encode
- [ ] Live preview on video element using CSS filter property
- [ ] Selected filter persists through encode

### Task 2.3: Text Overlay / Captions
- [ ] "Add Text" button in toolbar
- [ ] Text input with font size, color, position (top/center/bottom)
- [ ] Set start/end time for when text appears
- [ ] Render text on canvas during re-encode
- [ ] Multiple text overlays supported

### Task 2.4: Auto-Generate Captions (AWS Transcribe)
- [ ] After recording, "Auto Caption" button
- [ ] Upload audio to S3, start Transcribe job
- [ ] Poll for completion, parse word-level timestamps
- [ ] Render captions as timed text overlays
- [ ] Editable — student can fix any misheard words
- [ ] Burn into video during re-encode OR submit as separate VTT track

---

## Phase 3: Advanced

### Task 3.1: Background Music
- [ ] Library of 5-10 royalty-free tracks (stored in S3 /public)
- [ ] Music picker UI with preview
- [ ] Volume slider for music vs. original audio
- [ ] Mix audio tracks using Web Audio API
- [ ] Render mixed audio during re-encode

### Task 3.2: Stickers / Emoji Overlay
- [ ] Sticker/emoji picker (grid of options)
- [ ] Drag to position on video frame
- [ ] Set start/end time for sticker visibility
- [ ] Resize with pinch/drag handles
- [ ] Render on canvas during re-encode

### Task 3.3: Merge Multiple Takes
- [ ] "Add Clip" button to record/upload additional segments
- [ ] Clips shown as blocks on timeline
- [ ] Drag to reorder
- [ ] Transitions between clips (simple crossfade or cut)
- [ ] Concatenate and re-encode all clips into one video

### Task 3.4: Picture-in-Picture (Screen Share + Webcam)
- [ ] "Share Screen" option during recording
- [ ] Captures screen via `getDisplayMedia()`
- [ ] Webcam shown as small circle overlay (configurable position)
- [ ] Composite both streams onto one canvas
- [ ] Record the composited canvas as the final video

### Task 3.5: Green Screen / Background Replace
- [ ] Use TensorFlow.js `@mediapipe/selfie_segmentation` for body mask
- [ ] Virtual backgrounds: blur, solid color, or uploaded image
- [ ] Apply segmentation mask to canvas in real-time
- [ ] Works during recording (live) and during editing (post)
- [ ] Performance: target 15+ fps on mid-range mobile

---

## Infrastructure Tasks

### FFmpeg Lambda (for heavy operations)
- [ ] Create Lambda function with FFmpeg layer
- [ ] API endpoint: POST /api/video/process
- [ ] Accepts: { videoKey, operations: [{type, params}] }
- [ ] Operations: trim, concat, speed, overlay
- [ ] Returns processed video S3 key
- [ ] Timeout: 5 minutes, 1024MB memory

### Web Worker for Client-Side Encoding
- [ ] Create encoding Web Worker (canvas frame-by-frame capture)
- [ ] Post messages: start, progress, complete, error
- [ ] Offload heavy computation off main thread
- [ ] Fallback to main thread if Workers unavailable
