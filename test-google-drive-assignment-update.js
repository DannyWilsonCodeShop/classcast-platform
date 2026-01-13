#!/usr/bin/env node

/**
 * Test Google Drive URL Assignment Update
 * 
 * This script tests updating an assignment with a Google Drive instructional video URL
 * to ensure the 403 error is resolved.
 */

const https = require('https');

// Test configuration
const TEST_CONFIG = {
  // Use a real assignment ID from your system
  assignmentId: 'assignment_1768236058635_d5pqld9go', // From the error log
  googleDriveUrl: 'https://drive.google.com/file/d/1iOJdthPmtM9Zup26yn-nQHWRLRhxzWxt/view?usp=sharing',
  baseUrl: 'https://class-cast.com' // Production URL from error log
};

async function testAssignmentUpdate() {
  console.log('🧪 Testing Google Drive URL Assignment Update');
  console.log('=' .repeat(50));
  
  const updateData = {
    title: 'Graphing Piecewise Function (full)',
    description: '<p><strong>Objective:</strong> You will create a step-by-step video explanation of how to graph a piecewise function.</p>',
    instructionalVideoUrl: TEST_CONFIG.googleDriveUrl,
    assignmentType: 'video_assignment',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    maxScore: 100
  };
  
  console.log('📝 Update data:');
  console.log('  Assignment ID:', TEST_CONFIG.assignmentId);
  console.log('  Google Drive URL:', TEST_CONFIG.googleDriveUrl);
  console.log('  Title:', updateData.title);
  console.log('');
  
  try {
    // Test the assignment update
    console.log('🔄 Sending PUT request to update assignment...');
    
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/assignments/${TEST_CONFIG.assignmentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    console.log('📡 Response status:', response.status, response.statusText);
    
    if (response.status === 403) {
      console.log('❌ Still getting 403 Forbidden error');
      console.log('   This suggests the API changes haven\'t been deployed yet');
      console.log('   or there\'s still an authentication/authorization issue');
      return false;
    }
    
    const responseData = await response.json();
    console.log('📄 Response data:', JSON.stringify(responseData, null, 2));
    
    if (response.ok && responseData.success) {
      console.log('✅ Assignment update successful!');
      
      // Verify the instructional video URL was saved
      if (responseData.assignment && responseData.assignment.instructionalVideoUrl === TEST_CONFIG.googleDriveUrl) {
        console.log('✅ Google Drive URL was saved correctly');
        return true;
      } else {
        console.log('⚠️ Assignment updated but Google Drive URL may not have been saved correctly');
        console.log('   Expected:', TEST_CONFIG.googleDriveUrl);
        console.log('   Got:', responseData.assignment?.instructionalVideoUrl);
        return false;
      }
    } else {
      console.log('❌ Assignment update failed');
      console.log('   Error:', responseData.error || 'Unknown error');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  }
}

async function testAssignmentRetrieval() {
  console.log('\n🔍 Testing assignment retrieval to verify update...');
  
  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/assignments/${TEST_CONFIG.assignmentId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log('📡 GET Response status:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.success && data.data.assignment) {
        const assignment = data.data.assignment;
        console.log('✅ Assignment retrieved successfully');
        console.log('   Title:', assignment.title);
        console.log('   Instructional Video URL:', assignment.instructionalVideoUrl || 'Not set');
        
        if (assignment.instructionalVideoUrl === TEST_CONFIG.googleDriveUrl) {
          console.log('✅ Google Drive URL is correctly stored');
          return true;
        } else {
          console.log('⚠️ Google Drive URL not found or incorrect');
          return false;
        }
      } else {
        console.log('❌ Failed to retrieve assignment data');
        return false;
      }
    } else {
      console.log('❌ Failed to retrieve assignment');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Retrieval test failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Google Drive Assignment Update Tests');
  console.log('Time:', new Date().toISOString());
  console.log('');
  
  // Test 1: Update assignment with Google Drive URL
  const updateSuccess = await testAssignmentUpdate();
  
  // Test 2: Retrieve assignment to verify the update
  const retrievalSuccess = await testAssignmentRetrieval();
  
  console.log('\n📊 Test Results:');
  console.log('=' .repeat(30));
  console.log('Update test:', updateSuccess ? '✅ PASS' : '❌ FAIL');
  console.log('Retrieval test:', retrievalSuccess ? '✅ PASS' : '❌ FAIL');
  
  if (updateSuccess && retrievalSuccess) {
    console.log('\n🎉 All tests passed! Google Drive URL assignment update is working correctly.');
    process.exit(0);
  } else {
    console.log('\n💥 Some tests failed. Check the API deployment and error logs.');
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});