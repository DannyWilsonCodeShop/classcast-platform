/**
 * Test script to verify Google Drive URL handling
 * Run with: node test-google-drive-urls.js
 */

// Simulate the Google Drive utility functions
function extractGoogleDriveFileId(url) {
  if (!url) return null;

  // /file/d/<id>/
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
  if (fileMatch && fileMatch[1]) {
    return fileMatch[1];
  }

  // open?id=<id>
  const openMatch = url.match(/[?&]id=([^&]+)/i);
  if (openMatch && openMatch[1]) {
    return openMatch[1];
  }

  // uc?export=download&id=<id> or uc?id=<id>
  const ucMatch = url.match(/drive\.google\.com\/uc\?(?:export=download&)?id=([^&]+)/i);
  if (ucMatch && ucMatch[1]) {
    return ucMatch[1];
  }

  return null;
}

function getGoogleDrivePreviewUrl(urlOrId) {
  const fileId = urlOrId.includes('drive.google.com')
    ? extractGoogleDriveFileId(urlOrId)
    : urlOrId;

  if (!fileId) return null;
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

function isValidGoogleDriveUrl(url) {
  if (!url) return false;
  const normalized = url.trim();
  const drivePatterns = [
    /https?:\/\/drive\.google\.com\/file\/d\/[^/]+\/?(view|preview)?/i,
    /https?:\/\/drive\.google\.com\/open\?id=[^&]+/i,
    /https?:\/\/drive\.google\.com\/uc\?(export=download&)?id=[^&]+/i,
    /https?:\/\/drive\.google\.com\/uc\?id=[^&]+/i,
    /https?:\/\/drive\.google\.com\/folderview\?id=[^&]+/i,
  ];
  return drivePatterns.some((pattern) => pattern.test(normalized));
}

// Test cases
const testUrls = [
  'https://drive.google.com/file/d/1ABC123xyz/view',
  'https://drive.google.com/file/d/1ABC123xyz/preview',
  'https://drive.google.com/file/d/1ABC123xyz',
  'https://drive.google.com/open?id=1ABC123xyz',
  'https://drive.google.com/uc?id=1ABC123xyz',
  'https://drive.google.com/uc?export=download&id=1ABC123xyz',
  'https://drive.google.com/file/d/1ABC123xyz/view?usp=sharing',
  'https://drive.google.com/file/d/1ABC123xyz/view?usp=drive_link',
  'invalid-url',
  'https://youtube.com/watch?v=123'
];

console.log('📁 Testing Google Drive URL Handling\n');
console.log('='.repeat(80));

testUrls.forEach((url, index) => {
  console.log(`\nTest ${index + 1}: ${url}`);
  const isValid = isValidGoogleDriveUrl(url);
  const fileId = extractGoogleDriveFileId(url);
  const previewUrl = getGoogleDrivePreviewUrl(url);
  
  console.log(`  Valid Drive URL: ${isValid ? '✅ Yes' : '❌ No'}`);
  console.log(`  File ID: ${fileId || '❌ Not found'}`);
  console.log(`  Preview URL: ${previewUrl || '❌ Not generated'}`);
  
  if (isValid && fileId && previewUrl) {
    console.log(`  ✅ SUCCESS`);
  } else if (url.includes('drive.google.com')) {
    console.log(`  ❌ FAILED - Google Drive URL not parsed correctly`);
  } else {
    console.log(`  ℹ️  Not a Google Drive URL (expected)`);
  }
});

console.log('\n' + '='.repeat(80));
console.log('\n✅ All Google Drive URL formats should be converted to:');
console.log('   https://drive.google.com/file/d/FILE_ID/preview\n');
console.log('💡 This format allows embedding in iframes for video playback\n');
