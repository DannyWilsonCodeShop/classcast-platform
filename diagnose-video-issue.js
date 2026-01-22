#!/usr/bin/env node

/**
 * Diagnose Video Viewing Issue
 * 
 * This script helps diagnose why the specific video isn't showing in the old version
 */

console.log('🔍 Diagnosing Video Viewing Issue');
console.log('=================================');
console.log('');

const videoUrl = 's3://classcast-videos-463470937777-us-east-1/video-submissions/user_1759495913201_cdxydopct/assignment_1768361755173_ti155u2nf-1768438524092.webm';

console.log('📹 Video URL Analysis:');
console.log(`   Original: ${videoUrl}`);
console.log('');

// Parse the S3 URL
const s3Match = videoUrl.match(/s3:\/\/([^\/]+)\/(.+)/);
if (s3Match) {
  const bucket = s3Match[1];
  const key = s3Match[2];
  
  console.log('🪣 S3 Components:');
  console.log(`   Bucket: ${bucket}`);
  console.log(`   Key: ${key}`);
  console.log('');
  
  // Generate the expected HTTPS URL
  const httpsUrl = `https://${bucket}.s3.us-east-1.amazonaws.com/${key}`;
  console.log('🌐 Expected HTTPS URL:');
  console.log(`   ${httpsUrl}`);
  console.log('');
  
  // Check what the video player would do with this URL
  console.log('🎬 Video Player Processing:');
  console.log('   1. getVideoUrl() function called');
  console.log('   2. isYouTubeUrl() → false');
  console.log('   3. isGoogleDriveUrl() → false');
  console.log('   4. isS3VideoUrl() → true (contains "amazonaws.com")');
  console.log('   5. Returns direct S3 URL (no proxy)');
  console.log('');
  
  console.log('🔧 Potential Issues:');
  console.log('');
  
  console.log('1. 📝 Database Storage Format:');
  console.log('   • Video might be stored as s3:// URL in database');
  console.log('   • Frontend expects https:// URL');
  console.log('   • Need to convert s3:// to https:// format');
  console.log('');
  
  console.log('2. 🔐 S3 Permissions:');
  console.log('   • Bucket might not allow public read access');
  console.log('   • Video files might need signed URLs');
  console.log('   • CORS settings might block browser access');
  console.log('');
  
  console.log('3. 🌍 CloudFront vs Direct S3:');
  console.log('   • App might expect CloudFront URLs');
  console.log('   • Direct S3 URLs might be blocked');
  console.log('   • Need to check CDN configuration');
  console.log('');
  
  console.log('4. 🎥 Video Format Support:');
  console.log('   • File is .webm format');
  console.log('   • Some browsers have limited webm support');
  console.log('   • Safari might not play webm files');
  console.log('');
}

console.log('🔍 Diagnostic Steps:');
console.log('===================');
console.log('');

console.log('1. Check Database Format:');
console.log('   • Look at video_submissions table');
console.log('   • Check videoUrl field format');
console.log('   • See if URLs are s3:// or https://');
console.log('');

console.log('2. Test Direct S3 Access:');
console.log('   • Try accessing the HTTPS URL directly');
console.log('   • Check for 403 Forbidden errors');
console.log('   • Verify bucket permissions');
console.log('');

console.log('3. Check Video Player Code:');
console.log('   • See how videoUrl is processed');
console.log('   • Check if s3:// URLs are converted');
console.log('   • Verify video element src attribute');
console.log('');

console.log('4. Browser Console Check:');
console.log('   • Open browser dev tools');
console.log('   • Look for video loading errors');
console.log('   • Check network tab for failed requests');
console.log('');

console.log('💡 Quick Fixes to Try:');
console.log('======================');
console.log('');

console.log('1. Update videoUtils.ts:');
console.log('   Add s3:// to https:// conversion');
console.log('');

console.log('2. Check S3 Bucket Policy:');
console.log('   Ensure public read access for video files');
console.log('');

console.log('3. Use Video Proxy:');
console.log('   Route S3 URLs through /api/video-proxy');
console.log('');

console.log('4. Generate Signed URLs:');
console.log('   Create presigned URLs for private videos');
console.log('');

// Generate test URLs
console.log('🧪 Test URLs to Try:');
console.log('====================');
console.log('');

if (s3Match) {
  const bucket = s3Match[1];
  const key = s3Match[2];
  
  console.log('Direct S3 HTTPS:');
  console.log(`https://${bucket}.s3.us-east-1.amazonaws.com/${key}`);
  console.log('');
  
  console.log('Via Video Proxy:');
  console.log(`http://localhost:3000/api/video-proxy?url=${encodeURIComponent(`https://${bucket}.s3.us-east-1.amazonaws.com/${key}`)}`);
  console.log('');
  
  console.log('CloudFront (if configured):');
  console.log(`https://dimlqetlpy2s3.cloudfront.net/${key}`);
  console.log('');
}

console.log('🎯 Next Steps:');
console.log('==============');
console.log('1. Check the database to see how this video URL is stored');
console.log('2. Test the direct HTTPS URL in browser');
console.log('3. Update videoUtils.ts to handle s3:// URLs');
console.log('4. Verify S3 bucket permissions');
console.log('5. Test video playback in different browsers');
console.log('');

console.log('✅ Diagnostic complete! Use the information above to fix the video issue.');