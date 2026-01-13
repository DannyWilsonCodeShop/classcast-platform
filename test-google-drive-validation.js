#!/usr/bin/env node

/**
 * Test Google Drive URL Validation
 * Tests the updated regex patterns for Google Drive URLs
 */

// Test URLs
const testUrls = [
  // Valid Google Drive URLs
  'https://drive.google.com/file/d/1iOJdthPmtM9Zup26yn-nQHWRLRhxzWxt/view?usp=sharing',
  'https://drive.google.com/file/d/1ABC123def456GHI789jkl/view',
  'https://drive.google.com/file/d/1ABC123def456GHI789jkl/edit',
  'https://drive.google.com/file/d/1ABC123def456GHI789jkl',
  
  // Valid YouTube URLs
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://youtube.com/watch?v=dQw4w9WgXcQ',
  'https://youtu.be/dQw4w9WgXcQ',
  
  // Invalid URLs
  'https://example.com/video',
  'https://vimeo.com/123456',
  'not-a-url',
  '',
  'https://drive.google.com/invalid',
  'https://youtube.com/invalid'
];

// Updated patterns from the fix
const youtubeUrlPattern = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
const googleDrivePattern = /^https?:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9_-]+/;

console.log('🧪 Testing Google Drive URL Validation\n');

testUrls.forEach((url, index) => {
  const isValidYouTube = youtubeUrlPattern.test(url);
  const isValidGoogleDrive = googleDrivePattern.test(url);
  const isValid = isValidYouTube || isValidGoogleDrive;
  
  const type = isValidYouTube ? 'YouTube' : isValidGoogleDrive ? 'Google Drive' : 'Invalid';
  const status = isValid ? '✅' : '❌';
  
  console.log(`${status} Test ${index + 1}: ${type}`);
  console.log(`   URL: ${url}`);
  console.log(`   YouTube: ${isValidYouTube}, Google Drive: ${isValidGoogleDrive}`);
  console.log('');
});

// Test the specific failing URL
const failingUrl = 'https://drive.google.com/file/d/1iOJdthPmtM9Zup26yn-nQHWRLRhxzWxt/view?usp=sharing';
console.log('🎯 Testing the specific failing URL:');
console.log(`URL: ${failingUrl}`);
console.log(`YouTube test: ${youtubeUrlPattern.test(failingUrl)}`);
console.log(`Google Drive test: ${googleDrivePattern.test(failingUrl)}`);
console.log(`Overall valid: ${youtubeUrlPattern.test(failingUrl) || googleDrivePattern.test(failingUrl)}`);