#!/usr/bin/env node

/**
 * Debug Assignment Update Error
 * Simulates the exact request that's failing to identify the issue
 */

// Test the validation logic locally first
function testValidation() {
  console.log('🧪 Testing validation logic locally...\n');
  
  const formData = {
    title: '🎥 Quadratic Formula Video Project',
    description: '<p>You will select one quadratic equation from the list below and create a step-by-step video explanation.</p>',
    assignmentType: 'video_assignment',
    dueDate: new Date('2025-11-13T21:00:00.000Z'),
    responseDueDate: new Date('2025-11-14T21:00:00.000Z'),
    instructionalVideoType: 'youtube',
    instructionalVideoUrl: 'https://drive.google.com/file/d/1iOJdthPmtM9Zup26yn-nQHWRLRhxzWxt/view?usp=sharing',
    maxScore: 100,
    enablePeerResponses: false
  };
  
  // Simulate the validation logic from the form
  const errors = {};
  
  // Title validation
  if (!formData.title.trim()) {
    errors.title = 'Title is required';
  } else if (formData.title.length > 200) {
    errors.title = 'Title must be less than 200 characters';
  }
  
  // Description validation
  if (!formData.description.trim()) {
    errors.description = 'Description is required';
  }
  
  // Due date validation
  if (!formData.dueDate) {
    errors.dueDate = 'Due date is required';
  }
  
  // Instructional video validation
  if (formData.instructionalVideoType === 'youtube') {
    if (!formData.instructionalVideoUrl.trim()) {
      errors.instructionalVideoUrl = 'Video URL is required when video URL type is selected';
    } else {
      // Updated validation patterns
      const trimmedUrl = formData.instructionalVideoUrl.trim();
      const youtubeUrlPattern = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
      const googleDrivePattern = /^https?:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9_-]+/;
      
      const isValidYouTube = youtubeUrlPattern.test(trimmedUrl);
      const isValidGoogleDrive = googleDrivePattern.test(trimmedUrl);
      
      console.log('🔍 URL Validation Results:');
      console.log(`   URL: ${trimmedUrl}`);
      console.log(`   YouTube valid: ${isValidYouTube}`);
      console.log(`   Google Drive valid: ${isValidGoogleDrive}`);
      console.log(`   Overall valid: ${isValidYouTube || isValidGoogleDrive}`);
      
      if (!isValidYouTube && !isValidGoogleDrive) {
        errors.instructionalVideoUrl = 'Please enter a valid YouTube or Google Drive URL. Google Drive URLs should be in the format: https://drive.google.com/file/d/FILE_ID/...';
      }
    }
  }
  
  // Max score validation
  if (formData.maxScore <= 0) {
    errors.maxScore = 'Maximum score must be greater than 0';
  }
  
  console.log('\n📊 Validation Results:');
  console.log(`   Valid: ${Object.keys(errors).length === 0}`);
  console.log(`   Errors: ${JSON.stringify(errors, null, 2)}`);
  
  return Object.keys(errors).length === 0;
}

function testFormSubmissionData() {
  console.log('\n🎯 Testing form submission data structure...\n');
  
  const formData = {
    title: '🎥 Quadratic Formula Video Project',
    description: '<p>You will select one quadratic equation from the list below and create a step-by-step video explanation.</p>',
    assignmentType: 'video_assignment',
    dueDate: new Date('2025-11-13T21:00:00.000Z'),
    responseDueDate: new Date('2025-11-14T21:00:00.000Z'),
    maxScore: 100,
    requirements: ['Create a step-by-step video explanation'],
    allowLateSubmission: true,
    latePenalty: 10,
    maxSubmissions: 1,
    groupAssignment: false,
    maxGroupSize: 2,
    allowedFileTypes: ['mp4', 'webm', 'mov', 'avi'],
    maxFileSize: 104857600,
    enablePeerResponses: false,
    minResponsesRequired: 0,
    maxResponsesPerVideo: 0,
    responseWordLimit: 0,
    responseCharacterLimit: 0,
    hidePeerVideosUntilInstructorPosts: false,
    coverPhoto: '',
    emoji: '🎥',
    color: '#3B82F6',
    requireLiveRecording: false,
    allowYouTubeUrl: true,
    rubricType: 'none',
    customRubricCategories: [],
    targetSections: [],
    allSections: true,
    peerReviewScope: 'course',
    resources: [],
    instructionalVideoUrl: 'https://drive.google.com/file/d/1iOJdthPmtM9Zup26yn-nQHWRLRhxzWxt/view?usp=sharing',
    instructionalVideoType: 'youtube'
  };
  
  // Transform to assignment data (similar to form submission)
  const assignmentData = {
    title: formData.title.trim(),
    description: formData.description.trim(),
    assignmentType: formData.assignmentType,
    dueDate: formData.dueDate.toISOString(),
    responseDueDate: formData.responseDueDate.toISOString(),
    maxScore: formData.maxScore,
    requirements: formData.requirements,
    allowLateSubmission: formData.allowLateSubmission,
    latePenalty: formData.latePenalty,
    maxSubmissions: formData.maxSubmissions,
    groupAssignment: formData.groupAssignment,
    maxGroupSize: formData.maxGroupSize,
    allowedFileTypes: formData.allowedFileTypes,
    maxFileSize: formData.maxFileSize,
    enablePeerResponses: formData.enablePeerResponses,
    minResponsesRequired: formData.minResponsesRequired,
    maxResponsesPerVideo: formData.maxResponsesPerVideo,
    responseWordLimit: formData.responseWordLimit,
    responseCharacterLimit: formData.responseCharacterLimit,
    hidePeerVideosUntilInstructorPosts: formData.hidePeerVideosUntilInstructorPosts,
    peerReviewScope: formData.peerReviewScope,
    coverPhoto: formData.coverPhoto,
    emoji: formData.emoji,
    color: formData.color,
    requireLiveRecording: formData.requireLiveRecording,
    allowYouTubeUrl: formData.allowYouTubeUrl,
    resources: formData.resources,
    instructionalVideoUrl: formData.instructionalVideoUrl
  };
  
  console.log('📤 Assignment data that would be sent to API:');
  console.log(JSON.stringify(assignmentData, null, 2));
  
  console.log('\n🎬 Instructional video details:');
  console.log(`   Type: ${formData.instructionalVideoType}`);
  console.log(`   URL: ${formData.instructionalVideoUrl}`);
  console.log(`   URL Length: ${formData.instructionalVideoUrl.length}`);
  
  return assignmentData;
}

function analyzeError() {
  console.log('🔍 Analyzing the reported error...\n');
  
  console.log('📋 Error Details from Logs:');
  console.log('   - Form validation result: false');
  console.log('   - Errors object: {} (empty)');
  console.log('   - Form data includes Google Drive URL');
  console.log('   - Instructional video type: youtube');
  
  console.log('\n🤔 Possible Issues:');
  console.log('   1. Validation logic has a bug that sets validation to false without setting errors');
  console.log('   2. There might be a timing issue with state updates');
  console.log('   3. The validation might be checking a different field than expected');
  console.log('   4. There could be a race condition in the validation function');
  
  console.log('\n💡 Recommendations:');
  console.log('   1. Add more detailed logging to the validation function');
  console.log('   2. Check if all required fields are properly filled');
  console.log('   3. Verify the validation function is using the latest form state');
  console.log('   4. Test the validation logic in isolation');
}

async function runDebug() {
  console.log('🐛 Debug Assignment Update Error\n');
  console.log('=' .repeat(50));
  
  // Test 1: Validation logic
  const isValid = testValidation();
  
  console.log('\n' + '=' .repeat(50));
  
  // Test 2: Form submission data
  const assignmentData = testFormSubmissionData();
  
  console.log('\n' + '=' .repeat(50));
  
  // Test 3: Error analysis
  analyzeError();
  
  console.log('\n' + '=' .repeat(50));
  console.log('\n🎯 Summary:');
  console.log(`   Local validation passes: ${isValid}`);
  console.log(`   Assignment data structure looks correct: ${!!assignmentData}`);
  console.log('   Next step: Check for timing issues in the actual form component');
}

runDebug().catch(console.error);