#!/usr/bin/env node

/**
 * Test Google Drive URL validation patterns
 */

// Test URLs from the user's error log
const testUrls = [
  'https://drive.google.com/file/d/1iOJdthPmtM9Zup26yn-nQHWRLRhxzWxt/view?usp=sharing',
  'https://drive.google.com/file/d/1iOJdthPmtM9Zup26yn-nQHWRLRhxzWxt/view',
  'https://drive.google.com/file/d/1iOJdthPmtM9Zup26yn-nQHWRLRhxzWxt/',
  'https://drive.google.com/file/d/1iOJdthPmtM9Zup26yn-nQHWRLRhxzWxt',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://youtu.be/dQw4w9WgXcQ',
  'invalid-url',
  ''
];

// Current validation patterns from the code
const youtubeUrlPattern = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
const googleDrivePattern = /^https?:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9_-]+/;

console.log('🔍 Testing URL validation patterns...\n');

testUrls.forEach((url, index) => {
  const trimmedUrl = url.trim();
  const isValidYouTube = youtubeUrlPattern.test(trimmedUrl);
  const isValidGoogleDrive = googleDrivePattern.test(trimmedUrl);
  const isValid = isValidYouTube || isValidGoogleDrive;
  
  console.log(`Test ${index + 1}: ${url || '(empty)'}`);
  console.log(`  YouTube: ${isValidYouTube ? '✅' : '❌'}`);
  console.log(`  Google Drive: ${isValidGoogleDrive ? '✅' : '❌'}`);
  console.log(`  Overall: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
  console.log('');
});

console.log('📝 Pattern Analysis:');
console.log(`YouTube Pattern: ${youtubeUrlPattern}`);
console.log(`Google Drive Pattern: ${googleDrivePattern}`);
console.log('');

// Test the specific URL from the error log
const problemUrl = 'https://drive.google.com/file/d/1iOJdthPmtM9Zup26yn-nQHWRLRhxzWxt/view?usp=sharing';
console.log('🎯 Testing the specific URL from the error log:');
console.log(`URL: ${problemUrl}`);
console.log(`Google Drive Pattern Match: ${googleDrivePattern.test(problemUrl) ? '✅ PASS' : '❌ FAIL'}`);

// Extract the file ID to verify pattern
const fileIdMatch = problemUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
if (fileIdMatch) {
  console.log(`File ID extracted: ${fileIdMatch[1]}`);
  console.log(`File ID length: ${fileIdMatch[1].length}`);
  console.log(`File ID characters: ${fileIdMatch[1].split('').map(c => c.match(/[a-zA-Z0-9_-]/) ? c : `'${c}'`).join('')}`);
}