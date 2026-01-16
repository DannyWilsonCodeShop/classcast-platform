# Mobile Upload Investigation & Fixes

## Issues Found

### 1. File Size Limit Mismatch ✅ FIXED
**Frontend Display:** "Maximum file size: 500MB"
**Actual Limit:** Should be 2GB (2147483648 bytes)

The frontend message is misleading. The system actually supports up to 2GB uploads.

### 2. iPhone Upload Issues

Common iPhone upload problems:

#### A. File Format Compatibility
- iPhones record in `.mov` format (H.264/HEVC codec)
- Some `.mov` files use HEVC (H.265) which isn't universally supported
- **Solution:** Accept `.mov` but may need transcoding

#### B. File Input Attribute
Current: `accept="video/*"`
- This works but iOS is picky about formats
- **Recommendation:** Be more specific

#### C. Large File Handling
- iPhone videos can be VERY large (especially 4K)
- 1 minute of 4K video = ~400MB
- 5 minutes = ~2GB
- **Current limit (2GB) may not be enough for longer videos**

#### D. Mobile Network Issues
- Uploading large files on cellular can fail
- Need better retry logic
- Progress indication is crucial

### 3. Current Upload Limits

**Assignment Creation:**
- Default: `maxFileSize: 2 * 1024 * 1024 * 1024` (2GB)
- This was fixed previously

**Upload API:**
- Supports multipart upload for files > 100MB
- Maximum: 2GB per file

**Frontend Display:**
- Shows: "500MB" ❌ INCORRECT
- Should show: "2GB" ✅

## Recommended Fixes

### Fix 1: Update Frontend Message
Change "Maximum file size: 500MB" to "Maximum file size: 2GB"

### Fix 2: Improve File Input for iOS
```tsx
<input
  type="file"
  accept="video/mp4,video/quicktime,video/x-m4v,video/*"
  capture="environment"  // Allows camera access on mobile
  onChange={handleFileSelect}
/>
```

### Fix 3: Add Mobile-Specific Guidance
Show different messages for mobile users:
- "For best results, record videos under 5 minutes"
- "Connect to WiFi for large uploads"
- "If upload fails, try YouTube or Google Drive link instead"

### Fix 4: Better Error Messages
When upload fails on mobile:
- Check file size and show specific error
- Suggest alternatives (YouTube/Drive)
- Show retry option

### Fix 5: Compression Option
For very large files:
- Offer client-side compression
- Or suggest recording at lower quality
- Or use YouTube/Drive for long videos

## iPhone-Specific Issues

### Common Problems:
1. **Safari Restrictions**
   - Safari has strict file upload limits
   - May timeout on slow connections
   - Solution: Use chunked uploads (already implemented)

2. **iOS Video Format**
   - `.mov` files with HEVC codec
   - May not play in all browsers
   - Solution: Accept format but warn about compatibility

3. **Memory Limits**
   - iOS Safari has memory constraints
   - Large files can crash the browser
   - Solution: Stream uploads, don't load entire file into memory

4. **Network Switching**
   - iOS switches between WiFi/Cellular
   - Can interrupt uploads
   - Solution: Implement resume capability

## Testing Checklist

- [ ] Test upload on iPhone Safari
- [ ] Test upload on iPhone Chrome
- [ ] Test with WiFi connection
- [ ] Test with cellular connection
- [ ] Test with 1-minute video (~100MB)
- [ ] Test with 5-minute video (~500MB)
- [ ] Test with 10-minute video (~1GB)
- [ ] Test upload interruption/resume
- [ ] Test YouTube link submission
- [ ] Test Google Drive link submission

## Status
✅ **FRONTEND UPDATED** - File size message corrected to 2GB and mobile improvements added
📱 **MOBILE TESTING NEEDED** - Need real iPhone testing to identify specific issues

## Changes Made

### 1. File Size Message ✅ FIXED
- Changed from "Maximum file size: 500MB" to "Maximum file size: 2GB"
- Added mobile-specific tip about using YouTube/Drive for long videos

### 2. File Input Improvements ✅ FIXED
- Updated `accept` attribute to be more specific: `video/mp4,video/quicktime,video/x-m4v,video/*`
- Added `capture="environment"` for better mobile camera access
- This helps iOS devices handle video selection better

### 3. Mobile User Guidance ✅ ADDED
- Added tip: "📱 Mobile tip: For videos longer than 5 minutes, consider using YouTube or Google Drive link instead"
- Helps users avoid upload failures with very large files
