#!/usr/bin/env node

/**
 * Debug Assignment Update 403 Error
 * 
 * This script helps debug the 403 Forbidden error when updating assignments
 */

const https = require('https');

async function testAssignmentUpdate() {
  console.log('🔍 Debugging Assignment Update 403 Error...\n');

  // Test assignment ID from the logs
  const assignmentId = 'assignment_1768236058635_d5pqld9go';
  const testData = {
    title: 'Test Assignment Update',
    description: 'Testing assignment update functionality',
    instructionalVideoUrl: 'https://www.youtube.com/watch?v=test123'
  };

  console.log('📋 Test Details:');
  console.log(`   Assignment ID: ${assignmentId}`);
  console.log(`   Test Data:`, testData);
  console.log('');

  // Check if the assignment exists first
  console.log('1️⃣ Testing GET request to check if assignment exists...');
  
  try {
    const getResponse = await fetch(`https://class-cast.com/api/assignments/${assignmentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log(`   GET Status: ${getResponse.status}`);
    
    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log('   ✅ Assignment exists');
      console.log(`   Current instructionalVideoUrl: ${getData.data?.assignment?.instructionalVideoUrl || 'none'}`);
    } else {
      console.log('   ❌ Assignment not found or error');
      const errorText = await getResponse.text();
      console.log(`   Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ GET request failed: ${error.message}`);
  }

  console.log('');
  console.log('2️⃣ Testing PUT request to update assignment...');

  try {
    const putResponse = await fetch(`https://class-cast.com/api/assignments/${assignmentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log(`   PUT Status: ${putResponse.status}`);
    
    if (putResponse.ok) {
      const putData = await putResponse.json();
      console.log('   ✅ Update successful');
      console.log(`   Response:`, putData);
    } else {
      console.log('   ❌ Update failed');
      const errorText = await putResponse.text();
      console.log(`   Error Response: ${errorText}`);
      
      // Check for common 403 causes
      if (putResponse.status === 403) {
        console.log('');
        console.log('🔍 403 Forbidden Error Analysis:');
        console.log('   Possible causes:');
        console.log('   - Missing authentication headers');
        console.log('   - CORS issues');
        console.log('   - API route authentication middleware');
        console.log('   - DynamoDB permissions');
        console.log('   - Request format issues');
      }
    }
  } catch (error) {
    console.log(`   ❌ PUT request failed: ${error.message}`);
  }

  console.log('');
  console.log('🔧 Debugging Steps:');
  console.log('1. Check if the assignment exists in DynamoDB');
  console.log('2. Verify API route has proper CORS headers');
  console.log('3. Check if authentication middleware is blocking the request');
  console.log('4. Verify the request format matches what the API expects');
  console.log('5. Check DynamoDB permissions for the update operation');
}

// Run the test
testAssignmentUpdate().catch(console.error);