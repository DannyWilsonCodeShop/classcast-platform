#!/usr/bin/env node

/**
 * Test script to verify video thumbnail functionality in grading page
 */

const { getYouTubeEmbedUrl, isValidYouTubeUrl, getYouTubeThumbnail } = require('./src/lib/youtube.ts');
const { getGoogleDrivePreviewUrl, isValidGoogleDriveUrl, getGoogleDriveThumbnailUrl } = require('./src/lib/googleDrive.ts');

console.log('🎥 Testing Video Thumbnail Functionality\n');

// Test YouTube URLs
const youtubeUrls = [
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://youtu.be/dQw4w9WgXcQ',
  'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://youtube.com/watch?v=dQw4w9WgXcQ&t=30s'
];

console.log('📺 YouTube URL Tests:');
youtubeUrls.forEach(url => {
  console.log(`URL: ${url}`);
  console.log(`  Valid: ${isValidYouTubeUrl(url)}`);
  console.log(`  Embed: ${getYouTubeEmbedUrl(url)}`);
  console.log(`  Thumbnail: ${getYouTubeThumbnail(url)}`);
  console.log('');
});

// Test Google Drive URLs
const driveUrls = [
  'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view',
  'https://drive.google.com/open?id=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  'https://drive.google.com/uc?id=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
];

console.log('📁 Google Drive URL Tests:');
driveUrls.forEach(url => {
  console.log(`URL: ${url}`);
  console.log(`  Valid: ${isValidGoogleDriveUrl(url)}`);
  console.log(`  Preview: ${getGoogleDrivePreviewUrl(url)}`);
  console.log(`  Thumbnail: ${getGoogleDriveThumbnailUrl(url)}`);
  console.log('');
});

// Test invalid URLs
const invalidUrls = [
  'https://example.com/video.mp4',
  'not-a-url',
  '',
  null,
  undefined
];

console.log('❌ Invalid URL Tests:');
invalidUrls.forEach(url => {
  console.log(`URL: ${url}`);
  console.log(`  YouTube Valid: ${isValidYouTubeUrl(url)}`);
  console.log(`  Drive Valid: ${isValidGoogleDriveUrl(url)}`);
  console.log('');
});

console.log('✅ Video thumbnail functionality test completed!');
console.log('\n📋 Summary:');
console.log('- YouTube videos should display in iframe with embed URL');
console.log('- Google Drive videos should display in iframe with preview URL');
console.log('- Regular videos should show custom thumbnail overlay if no valid poster');
console.log('- All video types should have proper fallback displays');