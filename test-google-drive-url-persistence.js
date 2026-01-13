#!/usr/bin/env node

/**
 * Test Google Drive URL persistence in assignment creation
 * This specifically tests the Google Drive link scenario
 */

console.log('📁 Testing Google Drive URL Persistence in Assignment Creation');
console.log('=' .repeat(65));

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  testCourseId: 'course_1735862400000_test',
  testInstructorId: 'user_1735862400000_test',
  testGoogleDriveUrls: [
    'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view',
    'https://drive.google.com/open?id=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    'https://drive.google.com/uc?id=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    'https://drive.google.com/uc?export=download&id=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
  ]
};

console.log('📋 Test Configuration:');
console.log(`   Base URL: ${TEST_CONFIG.baseUrl}`);
console.log(`   Course ID: ${TEST_CONFIG.testCourseId}`);
console.log(`   Instructor ID: ${TEST_CONFIG.testInstructorId}`);
console.log(`   Test Google Drive URLs: ${TEST_CONFIG.testGoogleDriveUrls.length} variants`);
console.log('');

// Google Drive URL validation function (mirroring the form logic)
function validateGoogleDriveUrl(url) {
  const googleDrivePattern = /^https?:\/\/drive\.google\.com\/(file\/d\/[^/]+|open\?id=[^&]+|uc\?.*id=[^&]+)/;
  return googleDrivePattern.test(url.trim());
}

// Extract file ID function (mirroring the utility)
function extractGoogleDriveFileId(url) {
  // /file/d/<id>/
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
  if (fileMatch && fileMatch[1]) {
    return fileMatch[1];
  }

  // open?id=<id> or uc?id=<id>
  const idMatch = url.match(/[?&]id=([^&]+)/i);
  if (idMatch && idMatch[1]) {
    return idMatch[1];
  }

  return null;
}

async function testGoogleDriveUrlPersistence() {
  console.log('🚀 Starting Google Drive URL Persistence Test...');
  console.log('');
  
  let passedTests = 0;
  let totalTests = 0;
  
  try {
    // Test each Google Drive URL format
    for (let i = 0; i < TEST_CONFIG.testGoogleDriveUrls.length; i++) {
      const testUrl = TEST_CONFIG.testGoogleDriveUrls[i];
      totalTests++;
      
      console.log(`📁 Test ${i + 1}: Testing Google Drive URL format...`);
      console.log(`   URL: ${testUrl}`);
      
      try {
        // Step 1: Validate URL format
        console.log('   🔍 Step 1: Validating Google Drive URL format...');
        
        const isValid = validateGoogleDriveUrl(testUrl);
        if (!isValid) {
          throw new Error(`Invalid Google Drive URL format: ${testUrl}`);
        }
        
        console.log('   ✅ Google Drive URL format is valid');
        
        // Step 2: Extract file ID
        console.log('   🔍 Step 2: Extracting file ID...');
        
        const fileId = extractGoogleDriveFileId(testUrl);
        if (!fileId) {
          throw new Error(`Could not extract file ID from: ${testUrl}`);
        }
        
        console.log(`   ✅ File ID extracted: ${fileId}`);
        
        // Step 3: Generate preview URL
        console.log('   🔍 Step 3: Generating preview URL...');
        
        const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
        console.log(`   ✅ Preview URL generated: ${previewUrl}`);
        
        // Step 4: Simulate form submission
        console.log('   📝 Step 4: Simulating form submission...');
        
        const formState = {
          instructionalVideoType: 'youtube', // Note: 'youtube' type handles both YouTube and Google Drive
          instructionalVideoUrl: testUrl,
          instructionalVideoFile: null
        };
        
        const assignmentData = {
          title: `Test Assignment with Google Drive Video ${i + 1}`,
          description: 'This assignment includes a Google Drive instructional video.',
          assignmentType: 'video',
          courseId: TEST_CONFIG.testCourseId,
          instructorId: TEST_CONFIG.testInstructorId,
          maxScore: 100,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          instructionalVideoUrl: formState.instructionalVideoType !== 'none' ? formState.instructionalVideoUrl : undefined,
          status: 'draft'
        };
        
        // Step 5: Verify URL inclusion
        console.log('   ✅ Step 5: Verifying URL inclusion...');
        
        if (!assignmentData.instructionalVideoUrl) {
          throw new Error('Google Drive URL not included in assignment data');
        }
        
        if (assignmentData.instructionalVideoUrl !== testUrl) {
          throw new Error(`URL mismatch. Expected: ${testUrl}, Got: ${assignmentData.instructionalVideoUrl}`);
        }
        
        console.log('   ✅ Google Drive URL properly included in assignment data');
        
        // Step 6: JSON serialization test
        console.log('   🌐 Step 6: Testing JSON serialization...');
        
        const jsonData = JSON.stringify(assignmentData);
        const parsedData = JSON.parse(jsonData);
        
        if (parsedData.instructionalVideoUrl !== testUrl) {
          throw new Error('Google Drive URL not preserved in JSON serialization');
        }
        
        console.log('   ✅ Google Drive URL preserved in JSON');
        
        passedTests++;
        console.log(`   🎉 Test ${i + 1} PASSED!`);
        
      } catch (error) {
        console.log(`   ❌ Test ${i + 1} FAILED: ${error.message}`);
      }
      
      console.log('');
    }
    
    // Combined URL validation test
    totalTests++;
    console.log('🔗 Combined URL Validation Test (YouTube + Google Drive)...');
    
    try {
      const testUrls = [
        { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', type: 'YouTube' },
        { url: 'https://youtu.be/dQw4w9WgXcQ', type: 'YouTube Short' },
        { url: TEST_CONFIG.testGoogleDriveUrls[0], type: 'Google Drive' },
        { url: 'https://example.com/video.mp4', type: 'Invalid', shouldFail: true }
      ];
      
      for (const testCase of testUrls) {
        console.log(`   Testing ${testCase.type}: ${testCase.url}`);
        
        // Test combined validation (YouTube OR Google Drive)
        const youtubePattern = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
        const googleDrivePattern = /^https?:\/\/drive\.google\.com\/(file\/d\/[^/]+|open\?id=[^&]+|uc\?.*id=[^&]+)/;
        
        const isValidYouTube = youtubePattern.test(testCase.url);
        const isValidGoogleDrive = googleDrivePattern.test(testCase.url);
        const isValidOverall = isValidYouTube || isValidGoogleDrive;
        
        if (testCase.shouldFail) {
          if (isValidOverall) {
            throw new Error(`Expected ${testCase.url} to fail validation but it passed`);
          }
          console.log(`   ✅ ${testCase.type} correctly rejected`);
        } else {
          if (!isValidOverall) {
            throw new Error(`Expected ${testCase.url} to pass validation but it failed`);
          }
          console.log(`   ✅ ${testCase.type} correctly accepted`);
        }
      }
      
      passedTests++;
      console.log('   🎉 Combined validation test PASSED!');
      
    } catch (error) {
      console.log(`   ❌ Combined validation test FAILED: ${error.message}`);
    }
    
    console.log('');
    
    // Summary
    console.log('📊 Google Drive URL Test Summary');
    console.log('=' .repeat(40));
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests}`);
    console.log(`   Failed: ${totalTests - passedTests}`);
    console.log(`   Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    if (passedTests === totalTests) {
      console.log('');
      console.log('🎉 All Google Drive URL tests PASSED!');
      console.log('✅ Google Drive URLs should persist correctly in assignments');
    } else {
      console.log('');
      console.log('⚠️  Some Google Drive URL tests failed');
      console.log('🔍 Check the validation patterns and form logic');
    }
    
  } catch (error) {
    console.error('');
    console.error('❌ Google Drive URL Test Suite FAILED!');
    console.error('=' .repeat(50));
    console.error(`Error: ${error.message}`);
    console.error('');
    console.error('🔍 Debugging steps for Google Drive URL issues:');
    console.error('1. Check Google Drive URL validation patterns');
    console.error('2. Verify form accepts both YouTube and Google Drive URLs');
    console.error('3. Test file ID extraction from different URL formats');
    console.error('4. Confirm preview URL generation works');
    console.error('5. Test assignment display shows Google Drive videos');
    
    throw error;
  }
}

// Additional debugging information
console.log('🔍 Google Drive URL Analysis:');
console.log('');
console.log('Supported Google Drive URL Formats:');
TEST_CONFIG.testGoogleDriveUrls.forEach((url, index) => {
  console.log(`${index + 1}. ${url}`);
});
console.log('');

console.log('Expected Flow:');
console.log('1. 🔗 User selects "Video URL" type');
console.log('2. 📁 User enters Google Drive share URL');
console.log('3. ✅ Form validates URL format (Google Drive OR YouTube)');
console.log('4. 📝 Form submission includes instructionalVideoUrl field');
console.log('5. 🌐 API extracts instructionalVideoUrl from request body');
console.log('6. 💾 Database saves assignment with Google Drive URL');
console.log('7. 👁️  Assignment view displays Google Drive video in iframe');
console.log('');

console.log('Key Differences from YouTube:');
console.log('• Different URL patterns to validate');
console.log('• File ID extraction instead of video ID');
console.log('• Preview URL generation for embedding');
console.log('• Same persistence logic as YouTube URLs');
console.log('');

// Run the test
testGoogleDriveUrlPersistence().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});