/**
 * Test script to verify YouTube URL handling
 * Run with: node test-youtube-urls.js
 */

// Simulate the YouTube utility functions
function extractYouTubeVideoId(url) {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

function getYouTubeEmbedUrl(urlOrId, useNoCookie = true) {
  // If it's already an embed URL, return it
  if (urlOrId.includes('youtube.com/embed/') || urlOrId.includes('youtube-nocookie.com/embed/')) {
    if (useNoCookie && urlOrId.includes('youtube.com/embed/')) {
      return urlOrId.replace('youtube.com', 'youtube-nocookie.com');
    }
    return urlOrId;
  }

  // Extract video ID
  const videoId = urlOrId.includes('youtube.com') || urlOrId.includes('youtu.be')
    ? extractYouTubeVideoId(urlOrId)
    : urlOrId;

  if (!videoId) return null;

  const domain = useNoCookie ? 'youtube-nocookie.com' : 'youtube.com';
  return `https://www.${domain}/embed/${videoId}`;
}

// Test cases
const testUrls = [
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://youtu.be/dQw4w9WgXcQ',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=share',
  'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://www.youtube.com/embed/dQw4w9WgXcQ',
  'https://www.youtube.com/v/dQw4w9WgXcQ',
  'https://youtube.com/watch?v=dQw4w9WgXcQ&t=30s',
  'https://www.youtube.com/watch?time_continue=30&v=dQw4w9WgXcQ',
  'invalid-url',
  'https://vimeo.com/123456789'
];

console.log('🎬 Testing YouTube URL Handling\n');
console.log('='.repeat(80));

testUrls.forEach((url, index) => {
  console.log(`\nTest ${index + 1}: ${url}`);
  const videoId = extractYouTubeVideoId(url);
  const embedUrl = getYouTubeEmbedUrl(url);
  
  console.log(`  Video ID: ${videoId || '❌ Not found'}`);
  console.log(`  Embed URL: ${embedUrl || '❌ Not generated'}`);
  
  if (videoId && embedUrl) {
    console.log(`  ✅ SUCCESS`);
  } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
    console.log(`  ❌ FAILED - YouTube URL not parsed correctly`);
  } else {
    console.log(`  ℹ️  Not a YouTube URL (expected)`);
  }
});

console.log('\n' + '='.repeat(80));
console.log('\n✅ All YouTube URL formats should be converted to:');
console.log('   https://www.youtube-nocookie.com/embed/VIDEO_ID\n');
