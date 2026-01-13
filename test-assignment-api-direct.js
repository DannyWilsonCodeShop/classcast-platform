#!/usr/bin/env node

/**
 * Test Assignment API Directly
 * 
 * This script tests the assignment API directly to debug the 403 error
 */

const https = require('https');

async function testAssignmentAPI() {
  console.log('🔍 Testing Assignment API Directly...\n');

  const assignmentId = 'assignment_1768236058635_d5pqld9go';
  const baseUrl = 'https://class-cast.com';

  console.log(`📋 Testing Assignment ID: ${assignmentId}\n`);

  // Test 1: GET request to check if assignment exists
  console.log('1️⃣ Testing GET request...');
  try {
    const getResponse = await fetch(`${baseUrl}/api/assignments/${assignmentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log(`   Status: ${getResponse.status}`);
    console.log(`   Headers:`, Object.fromEntries(getResponse.headers.entries()));

    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log('   ✅ GET successful');
      console.log(`   Assignment exists: ${getData.success}`);
    } else {
      console.log('   ❌ GET failed');
      const errorText = await getResponse.text();
      console.log(`   Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ GET request failed: ${error.message}`);
  }

  console.log('');

  // Test 2: OPTIONS request to check CORS
  console.log('2️⃣ Testing OPTIONS request (CORS preflight)...');
  try {
    const optionsResponse = await fetch(`${baseUrl}/api/assignments/${assignmentId}`, {
      method: 'OPTIONS',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Request-Method': 'PUT',
        'Access-Control-Request-Headers': 'Content-Type',
      }
    });

    console.log(`   Status: ${optionsResponse.status}`);
    console.log(`   CORS Headers:`, {
      'Access-Control-Allow-Origin': optionsResponse.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': optionsResponse.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': optionsResponse.headers.get('Access-Control-Allow-Headers'),
    });

    if (optionsResponse.ok) {
      console.log('   ✅ OPTIONS successful - CORS configured');
    } else {
      console.log('   ❌ OPTIONS failed - CORS issue');
    }
  } catch (error) {
    console.log(`   ❌ OPTIONS request failed: ${error.message}`);
  }

  console.log('');

  // Test 3: PUT request with minimal data
  console.log('3️⃣ Testing PUT request with minimal data...');
  const minimalData = {
    title: 'Test Update - ' + new Date().toISOString()
  };

  try {
    const putResponse = await fetch(`${baseUrl}/api/assignments/${assignmentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(minimalData)
    });

    console.log(`   Status: ${putResponse.status}`);
    console.log(`   Headers:`, Object.fromEntries(putResponse.headers.entries()));

    if (putResponse.ok) {
      const putData = await putResponse.json();
      console.log('   ✅ PUT successful');
      console.log(`   Response:`, putData);
    } else {
      console.log('   ❌ PUT failed');
      const errorText = await putResponse.text();
      console.log(`   Error Response: ${errorText}`);
      
      // Analyze the error
      if (putResponse.status === 403) {
        console.log('\n   🔍 403 Analysis:');
        console.log('   - This is a Forbidden error');
        console.log('   - The request reached the server but was rejected');
        console.log('   - Possible causes:');
        console.log('     * DynamoDB permissions issue');
        console.log('     * AWS credentials not configured');
        console.log('     * Table access restrictions');
        console.log('     * Lambda execution role missing permissions');
      }
    }
  } catch (error) {
    console.log(`   ❌ PUT request failed: ${error.message}`);
  }

  console.log('');

  // Test 4: PUT request with credentials (simulating browser)
  console.log('4️⃣ Testing PUT request with credentials...');
  try {
    const putWithCredsResponse = await fetch(`${baseUrl}/api/assignments/${assignmentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // This is what the browser sends
      body: JSON.stringify(minimalData)
    });

    console.log(`   Status: ${putWithCredsResponse.status}`);

    if (putWithCredsResponse.ok) {
      console.log('   ✅ PUT with credentials successful');
    } else {
      console.log('   ❌ PUT with credentials failed');
      const errorText = await putWithCredsResponse.text();
      console.log(`   Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ PUT with credentials failed: ${error.message}`);
  }

  console.log('\n🔧 Debugging Recommendations:');
  console.log('1. Check AWS CloudWatch logs for the API function');
  console.log('2. Verify DynamoDB table permissions');
  console.log('3. Check if AWS credentials are properly configured');
  console.log('4. Verify the Lambda execution role has DynamoDB:UpdateItem permission');
  console.log('5. Check if there are any AWS resource policies blocking the request');
}

// Run the test
testAssignmentAPI().catch(console.error);