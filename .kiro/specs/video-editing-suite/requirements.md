# Video Editing Suite — Requirements

## Overview
Add a lightweight video editor to the student recording flow in ClassCast. After recording (or uploading), students can edit their video before submitting. All editing should be non-destructive until export, and work on mobile + desktop browsers.

## Features (in build order)

### Phase 1: Core Trimming
1. **Trim front/back** — Draggable start/end handles on a timeline scrubber
2. **Cut middle section** — Mark a segment to remove, preview without it
3. **Re-record a section** — Mark a timestamp range, re-record just that part, splice it back in

### Phase 2: Enhancements
4. **Speed adjustment** — 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x playback during export
5. **Visual filters** — Brightness, contrast, warmth presets (like Instagram-style but subtle)
6. **Text overlay / captions** — Add text at specific timestamps, choose position/style
7. **Auto-generate captions** — AWS Transcribe integration, auto-place subtitles on video

### Phase 3: Advanced
8. **Add background music** — Select from preset royalty-free tracks, adjust volume mix
9. **Stickers/emoji overlay** — Drag-and-drop stickers/emojis at timestamps
10. **Merge multiple takes** — Record multiple clips, arrange and concatenate them
11. **Picture-in-picture** — Screen share + webcam overlay (slides + face)
12. **Green screen / background replace** — TensorFlow.js body segmentation, virtual backgrounds

## Technical Approach
- **Client-side processing**: Canvas API + MediaRecorder for re-encoding. No server round-trips for basic edits.
- **Server-side fallback**: AWS Lambda + FFmpeg for heavy operations (merge, PiP) or when client is too slow.
- **Non-destructive**: Original recording is preserved. Edits produce a new file.
- **Progressive**: Features load only when the edit UI is opened (code-split).

## UX Flow
1. Student records video → sees preview
2. "Edit" button appears below preview (optional — they can submit immediately)
3. Edit screen: timeline at bottom, tools in a toolbar above it
4. Apply edits → re-encode in browser → replace preview
5. Submit the edited version

## Constraints
- Must work on iOS Safari, Android Chrome, desktop Chrome/Firefox/Safari
- Max video length: existing limits (whatever the assignment allows)
- Re-encoding should show progress and not freeze the UI (Web Worker if possible)
- Mobile-first: touch-friendly timeline, large tap targets
