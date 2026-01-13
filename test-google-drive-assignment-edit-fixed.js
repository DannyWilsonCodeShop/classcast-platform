#!/usr/bin/env node

/**
 * Test Google Drive URL assignment editing with improved error handling
 */

const testAssignmentUpdate = async () => {
  const assignmentId = 'assignment_1768236058635_d5pqld9go'; // From user's example
  const googleDriveUrl = 'https://drive.google.com/file/d/1iOJdthPmtM9Zup26yn-nQHWRLRhxzWxt/view?usp=sharing';
  
  console.log('🧪 Testing Google Drive URL assignment update...');
  console.log(`Assignment ID: ${assignmentId}`);
  console.log(`Google Drive URL: ${googleDriveUrl}`);
  console.log('');
  
  // Test the validation patterns first
  const youtubeUrlPattern = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
  const googleDrivePattern = /^https?:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9_-]+/;
  
  const isValidYouTube = youtubeUrlPattern.test(googleDriveUrl);
  const isValidGoogleDrive = googleDrivePattern.test(googleDriveUrl);
  
  console.log('🔍 URL Validation:');
  console.log(`  YouTube pattern: ${isValidYouTube ? '✅' : '❌'}`);
  console.log(`  Google Drive pattern: ${isValidGoogleDrive ? '✅' : '❌'}`);
  console.log(`  Overall valid: ${isValidYouTube || isValidGoogleDrive ? '✅' : '❌'}`);
  console.log('');
  
  if (!isValidYouTube && !isValidGoogleDrive) {
    console.log('❌ URL validation would fail - this is the issue!');
    return;
  }
  
  console.log('✅ URL validation passes - proceeding with API test...');
  
  try {
    const response = await fetch(`http://localhost:3000/api/assignments/${assignmentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instructionalVideoUrl: googleDriveUrl,
        title: '🎥 Quadratic Formula Video Project',
        description: '<p>Test update with Google Drive URL</p>',
        assignmentType: 'video_assignment',
        dueDate: new Date('2025-11-13T21:00:00.000Z').toISOString(),
        maxScore: 100
      })
    });
    
    console.log(`📡 API Response Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Assignment update successful!');
      console.log('Response data:', JSON.stringify(data, null, 2));
    } else {
      const errorData = await response.text();
      console.log('❌ Assignment update failed!');
      console.log('Error response:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
};

// Run the test
testAssignmentUpdate().catch(console.error);