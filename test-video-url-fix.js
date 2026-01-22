#!/usr/bin/env node

/**
 * Test Video URL Fix
 * 
 * This script tests the s3:// to https:// URL conversion
 */

console.log('🧪 Testing Video URL Fix');
console.log('========================');
console.log('');

// Simulate the conversion function
function convertS3UrlToHttps(s3Url) {
  if (!s3Url.startsWith('s3://')) {
    return s3Url;
  }

  // Parse s3://bucket-name/key/path
  const match = s3Url.match(/^s3:\/\/([^\/]+)\/(.+)$/);
  if (!match) {
    console.warn('Invalid s3:// URL format:', s3Url);
    return s3Url;
  }

  const [, bucket, key] = match;
  
  // Convert to https:// format
  const httpsUrl = `https://${bucket}.s3.us-east-1.amazonaws.com/${key}`;
  
  return httpsUrl;
}

// Test the problematic video URL
const testUrl = 's3://classcast-videos-463470937777-us-east-1/video-submissions/user_1759495913201_cdxydopct/assignment_1768361755173_ti155u2nf-1768438524092.webm';

console.log('📹 Original URL:');
console.log(testUrl);
console.log('');

console.log('🔄 Converted URL:');
const convertedUrl = convertS3UrlToHttps(testUrl);
console.log(convertedUrl);
console.log('');

console.log('✅ Conversion Test Results:');
console.log(`   Input format: ${testUrl.startsWith('s3://') ? 's3://' : 'other'}`);
console.log(`   Output format: ${convertedUrl.startsWith('https://') ? 'https://' : 'other'}`);
console.log(`   Contains bucket: ${convertedUrl.includes('classcast-videos-463470937777-us-east-1') ? 'Yes' : 'No'}`);
console.log(`   Contains key: ${convertedUrl.includes('video-submissions/user_1759495913201_cdxydopct') ? 'Yes' : 'No'}`);
console.log('');

// Test other URL formats
console.log('🧪 Testing Other URL Formats:');
console.log('');

const testUrls = [
  'https://classcast-videos-463470937777-us-east-1.s3.us-east-1.amazonaws.com/video.mp4',
  'https://youtube.com/watch?v=123',
  'https://drive.google.com/file/d/123/view',
  's3://another-bucket/path/to/video.mp4',
  'data:video/mp4;base64,xyz'
];

testUrls.forEach((url, index) => {
  const result = convertS3UrlToHttps(url);
  const changed = result !== url;
  console.log(`${index + 1}. ${changed ? '🔄' : '➡️'} ${url}`);
  if (changed) {
    console.log(`   → ${result}`);
  }
  console.log('');
});

console.log('🎯 Expected Behavior:');
console.log('=====================');
console.log('1. s3:// URLs should be converted to https://');
console.log('2. https:// URLs should remain unchanged');
console.log('3. YouTube URLs should remain unchanged');
console.log('4. Google Drive URLs should remain unchanged');
console.log('5. Other URLs should remain unchanged');
console.log('');

console.log('✅ Test complete! The fix should resolve the video viewing issue.');
console.log('');
console.log('💡 Next steps:');
console.log('1. Deploy the updated videoUtils.ts');
console.log('2. Test video playback in the app');
console.log('3. Check browser console for any errors');
console.log('4. Verify S3 bucket permissions if videos still don\'t load');