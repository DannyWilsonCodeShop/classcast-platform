#!/usr/bin/env node

// ClassCast API Testing Script
// Run with: node test-api.js

const baseUrl = 'http://localhost:3001';

async function testEndpoint(url, method = 'GET', data = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);
    const result = await response.json();
    
    console.log(`✅ ${method} ${url}`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(result, null, 2));
    console.log('---');
    
    return { success: true, status: response.status, data: result };
  } catch (error) {
    console.log(`❌ ${method} ${url}`);
    console.log(`   Error:`, error.message);
    console.log('---');
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 ClassCast API Testing Script');
  console.log('================================\n');
  
  // Test 1: Health Check
  console.log('1. Testing Health Check...');
  await testEndpoint(`${baseUrl}/api/health`);
  
  // Test 2: Simple Test
  console.log('2. Testing Simple Test...');
  await testEndpoint(`${baseUrl}/api/simple-test`);
  
  // Test 3: Direct Test
  console.log('3. Testing Direct Test...');
  await testEndpoint(`${baseUrl}/api/direct-test`);
  
  // Test 4: Mock Test
  console.log('4. Testing Mock Test...');
  await testEndpoint(`${baseUrl}/api/test-mock`);
  
  // Test 5: Users API
  console.log('5. Testing Users API...');
  await testEndpoint(`${baseUrl}/api/users`);
  
  // Test 6: Submissions API
  console.log('6. Testing Submissions API...');
  await testEndpoint(`${baseUrl}/api/submissions`);
  
  // Test 7: Login API (with test credentials)
  console.log('7. Testing Login API...');
  await testEndpoint(`${baseUrl}/api/auth/login`, 'POST', {
    email: 'instructor@classcast.com',
    password: 'Instructor123!'
  });
  
  // Test 8: Signup API (with test data)
  console.log('8. Testing Signup API...');
  await testEndpoint(`${baseUrl}/api/auth/signup`, 'POST', {
    email: 'testuser@example.com',
    firstName: 'Test',
    lastName: 'User',
    password: 'TestPassword123!',
    role: 'student',
    studentId: 'TEST123'
  });
  
  console.log('🎉 API Testing Complete!');
}

// Run the tests
runTests().catch(console.error);
