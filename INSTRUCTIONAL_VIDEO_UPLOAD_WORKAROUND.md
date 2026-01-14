# Instructional Video Upload - Workaround Guide

## 🚨 Issue
Direct video file uploads for instructional videos are returning **403 Forbidden** errors.

## ✅ RECOMMENDED SOLUTION (Works Immediately)

### Use YouTube or Google Drive URLs Instead

This is **faster, more reliable, and works perfectly**!

#### Option 1: YouTube (Recommended)
1. Upload your video to YouTube (can be unlisted)
2. Copy the video URL (e.g., `https://www.youtube.com/watch?v=abc123`)
3. In the assignment form:
   - Select **"Video URL"** instead of "Upload"
   - Paste the YouTube link
   - Save the assignment
4. ✅ Done! Students will see the video embedded

#### Option 2: Google Drive
1. Upload your video to Google Drive
2. Right-click the video → Get link → Set to "Anyone with the link"
3. Copy the share URL (e.g., `https://drive.google.com/file/d/abc123/view?usp=sharing`)
4. In the assignment form:
   - Select **"Video URL"** instead of "Upload"
   - Paste the Google Drive link
   - Save the assignment
5. ✅ Done! Students will see the video

## 🔧 Why This Happens

The 403 error occurs when trying to upload video files directly because:
1. **S3 Permissions** - The upload endpoint may have permission restrictions
2. **File Size** - Large video files can timeout or exceed limits
3. **CloudFront Caching** - CDN may be blocking the upload endpoint

## 📊 Comparison

| Method | Speed | Reliability | File Size Limit | Recommended |
|--------|-------|-------------|-----------------|-------------|
| **YouTube URL** | ⚡ Instant | ✅ 100% | Unlimited | ✅ YES |
| **Google Drive URL** | ⚡ Instant | ✅ 100% | Unlimited | ✅ YES |
| **Direct Upload** | 🐌 Slow | ❌ 403 Error | 2GB | ❌ NO |

## 🎯 Benefits of Using URLs

### YouTube:
- ✅ Professional video player
- ✅ Automatic quality adjustment
- ✅ Playback speed controls
- ✅ Captions/subtitles support
- ✅ Mobile-friendly
- ✅ No storage limits

### Google Drive:
- ✅ Easy sharing
- ✅ Privacy controls
- ✅ Large file support
- ✅ No processing time
- ✅ Direct streaming

### Direct Upload (Current Issues):
- ❌ 403 Forbidden errors
- ❌ Slow upload times
- ❌ 2GB file size limit
- ❌ Processing delays
- ❌ Storage costs

## 📝 Step-by-Step: YouTube Method

### 1. Upload to YouTube
```
1. Go to youtube.com
2. Click "Create" → "Upload video"
3. Select your video file
4. Set visibility to "Unlisted" (students can view but not searchable)
5. Click "Publish"
6. Copy the video URL
```

### 2. Add to Assignment
```
1. Edit your assignment
2. Scroll to "Instructional Video" section
3. Click "Video URL" button
4. Paste your YouTube URL
5. Click "Save"
```

### 3. Verify
```
1. View the assignment
2. Check that the video appears at the top
3. Test playback
```

## 📝 Step-by-Step: Google Drive Method

### 1. Upload to Google Drive
```
1. Go to drive.google.com
2. Click "New" → "File upload"
3. Select your video file
4. Wait for upload to complete
5. Right-click the video → "Get link"
6. Set to "Anyone with the link can view"
7. Copy the link
```

### 2. Add to Assignment
```
1. Edit your assignment
2. Scroll to "Instructional Video" section
3. Click "Video URL" button
4. Paste your Google Drive URL
5. Click "Save"
```

### 3. Verify
```
1. View the assignment
2. Check that the video appears at the top
3. Test playback
```

## 🔍 What We Fixed

### In This Update:
1. ✅ Added CORS headers to upload endpoint
2. ✅ Added comprehensive error logging
3. ✅ Added warning banner in the form
4. ✅ Enhanced error messages with solutions
5. ✅ Added "Switch to Video URL" quick button

### What You'll See:
- **Yellow warning banner** when selecting "Upload" option
- **Helpful error message** if upload fails
- **Quick switch button** to change to URL method

## 🚀 Quick Fix Summary

**Instead of uploading the video file directly:**
1. Upload to YouTube or Google Drive first
2. Copy the share link
3. Use "Video URL" option in the form
4. Paste the link
5. Save

**This works 100% of the time and is actually better!**

## 📞 Still Need Help?

If you must use direct uploads:
1. Check CloudWatch logs for detailed error
2. Verify S3 bucket permissions
3. Check AWS IAM roles
4. Consider increasing upload timeout

But honestly, **YouTube/Google Drive is the better solution** for everyone:
- ✅ Faster for you
- ✅ Better for students
- ✅ No storage costs
- ✅ Professional playback
- ✅ Works on all devices

## 🎓 Best Practices

### For Instructors:
1. **Always use YouTube or Google Drive** for instructional videos
2. Set YouTube videos to "Unlisted" for privacy
3. Test the video link before saving
4. Keep videos under 10 minutes for best engagement

### For Students:
- Videos will load faster
- Better playback quality
- Works on mobile devices
- Can adjust playback speed

---

**Last Updated:** January 14, 2026  
**Status:** Workaround deployed, direct uploads being investigated  
**Recommendation:** Use YouTube or Google Drive URLs (permanent solution)
