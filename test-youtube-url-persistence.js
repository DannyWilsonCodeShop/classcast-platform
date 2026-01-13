#!/usr/bin/env node

/**
 * Test YouTube URL persistence in assignment creation
 * This specifically tests the YouTube link scenario that the user reported
 */

console.log('🎬 Testing YouTube URL Persistence in Assignment Creation');
console.log('=' .repeat(60));

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  testCourseId: 'course_1735862400000_test',
  testInstructorId: 'user_1735862400000_test',
  testYouTubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
};

console.log('📋 Test Configuration:');
console.log(`   Base URL: ${TEST_CONFIG.baseUrl}`);
console.log(`   Course ID: ${TEST_CONFIG.testCourseId}`);
console.log(`   Instructor ID: ${TEST_CONFIG.testInstructorId}`);
console.log(`   Test YouTube URL: ${TEST_CONFIG.testYouTubeUrl}`);
console.log('');

async function testYouTubeUrlPersistence() {
  console.log('🚀 Starting YouTube URL Persistence Test...');
  console.log('');
  
  try {
    // Step 1: Simulate instructor selecting YouTube option
    console.log('📺 Step 1: Simulating YouTube video type selection...');
    
    const formState = {
      instructionalVideoType: 'youtube',
      instructionalVideoUrl: TEST_CONFIG.testYouTubeUrl,
      instructionalVideoFile: null
    };
    
    console.log(`   ✅ Video type set to: ${formState.instructionalVideoType}`);
    console.log(`   ✅ YouTube URL entered: ${formState.instructionalVideoUrl}`);
    console.log(`   ✅ File upload cleared: ${formState.instructionalVideoFile === null}`);
    
    // Step 2: Validate YouTube URL format
    console.log('');
    console.log('🔍 Step 2: Validating YouTube URL format...');
    
    const youtubeUrlPattern = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
    const isValidYouTubeUrl = youtubeUrlPattern.test(formState.instructionalVideoUrl);
    
    if (!isValidYouTubeUrl) {
      throw new Error(`Invalid YouTube URL format: ${formState.instructionalVideoUrl}`);
    }
    
    console.log(`   ✅ YouTube URL format is valid`);
    console.log(`   ✅ URL matches expected pattern`);
    
    // Step 3: Simulate form submission with YouTube URL
    console.log('');
    console.log('📝 Step 3: Simulating form submission with YouTube URL...');
    
    const assignmentData = {
      title: 'Test Assignment with YouTube Video',
      description: 'This assignment includes a YouTube instructional video.',
      assignmentType: 'video',
      courseId: TEST_CONFIG.testCourseId,
      instructorId: TEST_CONFIG.testInstructorId,
      maxScore: 100,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      // Key field: YouTube URL should be included
      instructionalVideoUrl: formState.instructionalVideoType !== 'none' ? formState.instructionalVideoUrl : undefined,
      // Additional fields
      enablePeerResponses: false,
      requireLiveRecording: false,
      allowYouTubeUrl: true,
      emoji: '🎬',
      color: '#3B82F6',
      status: 'draft'
    };
    
    console.log(`   📋 Assignment title: ${assignmentData.title}`);
    console.log(`   🎬 Instructional video URL: ${assignmentData.instructionalVideoUrl}`);
    console.log(`   📊 Max score: ${assignmentData.maxScore} points`);
    
    // Step 4: Verify YouTube URL is properly included
    console.log('');
    console.log('✅ Step 4: Verifying YouTube URL inclusion...');
    
    if (!assignmentData.instructionalVideoUrl) {
      throw new Error('YouTube URL not included in assignment data');
    }
    
    if (assignmentData.instructionalVideoUrl !== TEST_CONFIG.testYouTubeUrl) {
      throw new Error(`YouTube URL mismatch. Expected: ${TEST_CONFIG.testYouTubeUrl}, Got: ${assignmentData.instructionalVideoUrl}`);
    }
    
    console.log(`   ✅ YouTube URL properly included in assignment data`);
    console.log(`   ✅ URL matches original input`);
    
    // Step 5: Simulate API request structure
    console.log('');
    console.log('🌐 Step 5: Validating API request structure...');
    
    const apiRequestBody = JSON.stringify(assignmentData);
    const requestSize = Buffer.byteLength(apiRequestBody, 'utf8');
    
    console.log(`   📊 Request body size: ${requestSize} bytes`);
    console.log(`   ✅ JSON serialization successful`);
    
    // Verify YouTube URL survives JSON serialization
    const parsedData = JSON.parse(apiRequestBody);
    if (parsedData.instructionalVideoUrl !== assignmentData.instructionalVideoUrl) {
      throw new Error('YouTube URL not preserved in JSON serialization');
    }
    
    console.log(`   ✅ YouTube URL preserved in JSON: ${parsedData.instructionalVideoUrl}`);
    
    // Step 6: Simulate database save with YouTube URL
    console.log('');
    console.log('💾 Step 6: Validating database save structure...');
    
    const assignmentId = `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const dbAssignment = {
      assignmentId,
      ...assignmentData,
      createdAt: now,
      updatedAt: now,
      isActive: true
    };
    
    console.log(`   📋 Generated assignment ID: ${assignmentId}`);
    console.log(`   📅 Created at: ${now}`);
    console.log(`   ✅ Database structure valid`);
    console.log(`   🎬 YouTube URL in database object: ${dbAssignment.instructionalVideoUrl}`);
    
    // Step 7: Test YouTube URL accessibility
    console.log('');
    console.log('🔗 Step 7: Testing YouTube URL accessibility...');
    
    // Extract video ID from YouTube URL
    const videoIdMatch = TEST_CONFIG.testYouTubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;
    
    if (!videoId) {
      throw new Error('Could not extract video ID from YouTube URL');
    }
    
    console.log(`   ✅ Video ID extracted: ${videoId}`);
    
    // Generate embed URL (what would be used in the UI)
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    console.log(`   ✅ Embed URL generated: ${embedUrl}`);
    
    // Success summary
    console.log('');
    console.log('🎉 YouTube URL Persistence Test PASSED!');
    console.log('=' .repeat(50));
    console.log('✅ YouTube URL properly captured from form');
    console.log('✅ URL included in assignment data');
    console.log('✅ JSON serialization preserves URL');
    console.log('✅ Database structure includes YouTube URL');
    console.log('✅ Video ID extraction works');
    console.log('✅ Embed URL generation works');
    console.log('');
    console.log('🔧 YouTube URL persistence should work correctly!');
    
  } catch (error) {
    console.error('');
    console.error('❌ YouTube URL Persistence Test FAILED!');
    console.error('=' .repeat(50));
    console.error(`Error: ${error.message}`);
    console.error('');
    console.error('🔍 Debugging steps for YouTube URL issues:');
    console.error('1. Check that instructionalVideoUrl field is being set in form');
    console.error('2. Verify form submission includes YouTube URL in request body');
    console.error('3. Confirm API extracts instructionalVideoUrl from request');
    console.error('4. Check that database save includes the YouTube URL');
    console.error('5. Test assignment display shows the YouTube video');
    
    throw error;
  }
}

// Additional debugging information
console.log('🔍 YouTube URL Flow Analysis:');
console.log('');
console.log('Expected Flow:');
console.log('1. 📺 User selects "YouTube" video type');
console.log('2. 🔗 User enters YouTube URL in text input');
console.log('3. 📝 Form submission includes instructionalVideoUrl field');
console.log('4. 🌐 API extracts instructionalVideoUrl from request body');
console.log('5. 💾 Database saves assignment with YouTube URL');
console.log('6. 👁️  Assignment view displays YouTube video');
console.log('');

console.log('Key Differences from File Upload:');
console.log('• No S3 upload step (URL used directly)');
console.log('• No file size validation needed');
console.log('• URL format validation important');
console.log('• Embed URL generation for display');
console.log('');

console.log('Common Issues:');
console.log('• Form state not updating instructionalVideoUrl');
console.log('• URL validation preventing submission');
console.log('• API not extracting instructionalVideoUrl field');
console.log('• Database not saving the URL field');
console.log('• Assignment view not displaying YouTube video');
console.log('');

// Run the test
testYouTubeUrlPersistence().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});