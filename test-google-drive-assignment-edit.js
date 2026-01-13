#!/usr/bin/env node

/**
 * Test Google Drive URL Assignment Edit
 * Tests the complete flow of editing an assignment with a Google Drive URL
 */

const https = require('https');
const querystring = require('querystring');

// Configuration
const BASE_URL = 'https://class-cast.com';
const TEST_ASSIGNMENT_ID = 'assignment_1768236058635_d5pqld9go'; // The assignment from the error logs
const GOOGLE_DRIVE_URL = 'https://drive.google.com/file/d/1iOJdthPmtM9Zup26yn-nQHWRLRhxzWxt/view?usp=sharing';

// Test credentials (you'll need to replace these with actual login credentials)
const TEST_EMAIL = 'dwilson1919@gmail.com';
const TEST_PASSWORD = 'your-password'; // Replace with actual password

let sessionCookie = '';

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        // Extract cookies from response
        if (res.headers['set-cookie']) {
          res.headers['set-cookie'].forEach(cookie => {
            if (cookie.includes('next-auth.session-token') || cookie.includes('__Secure-next-auth.session-token')) {
              sessionCookie = cookie.split(';')[0];
            }
          });
        }
        
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          cookies: res.headers['set-cookie']
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function login() {
  console.log('🔐 Attempting to login...');
  
  const loginData = JSON.stringify({
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  });
  
  const options = {
    hostname: 'class-cast.com',
    port: 443,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  };
  
  try {
    const response = await makeRequest(options, loginData);
    console.log(`📊 Login response status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      const responseData = JSON.parse(response.data);
      if (responseData.success) {
        console.log('✅ Login successful');
        return true;
      } else {
        console.log('❌ Login failed:', responseData.error);
        return false;
      }
    } else {
      console.log('❌ Login failed with status:', response.statusCode);
      return false;
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return false;
  }
}

async function testAssignmentUpdate() {
  console.log('🎯 Testing assignment update with Google Drive URL...');
  
  const updateData = JSON.stringify({
    title: 'Graphing Piecewise Function (full)',
    description: '<p><strong>Objective:</strong> You will create a step-by-step video explanation of how to graph a piecewise function.</p>',
    assignmentType: 'video_assignment',
    dueDate: new Date('2026-01-19T16:40:58.635Z').toISOString(),
    responseDueDate: new Date('2026-01-19T16:40:58.635Z').toISOString(),
    maxScore: 100,
    instructionalVideoUrl: GOOGLE_DRIVE_URL,
    instructionalVideoType: 'youtube' // This handles both YouTube and Google Drive
  });
  
  const options = {
    hostname: 'class-cast.com',
    port: 443,
    path: `/api/assignments/${TEST_ASSIGNMENT_ID}`,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(updateData),
      'Cookie': sessionCookie
    }
  };
  
  try {
    const response = await makeRequest(options, updateData);
    console.log(`📊 Assignment update response status: ${response.statusCode}`);
    console.log(`📄 Response data:`, response.data);
    
    if (response.statusCode === 200) {
      const responseData = JSON.parse(response.data);
      if (responseData.success) {
        console.log('✅ Assignment updated successfully with Google Drive URL');
        console.log('🎬 Instructional video URL:', responseData.assignment?.instructionalVideoUrl);
        return true;
      } else {
        console.log('❌ Assignment update failed:', responseData.error);
        return false;
      }
    } else {
      console.log('❌ Assignment update failed with status:', response.statusCode);
      console.log('📄 Error response:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Assignment update error:', error.message);
    return false;
  }
}

async function runTest() {
  console.log('🧪 Starting Google Drive URL Assignment Edit Test\n');
  
  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Test failed: Could not login');
    return;
  }
  
  console.log('');
  
  // Step 2: Test assignment update
  const updateSuccess = await testAssignmentUpdate();
  if (!updateSuccess) {
    console.log('❌ Test failed: Could not update assignment');
    return;
  }
  
  console.log('\n✅ All tests passed! Google Drive URL assignment edit is working correctly.');
}

// Only run if password is provided
if (process.argv[2]) {
  TEST_PASSWORD = process.argv[2];
  runTest().catch(console.error);
} else {
  console.log('Usage: node test-google-drive-assignment-edit.js <password>');
  console.log('Example: node test-google-drive-assignment-edit.js mypassword123');
}