#!/usr/bin/env node

/**
 * Comprehensive API Testing Script
 * Tests all endpoints to ensure mock data is removed and real data is working
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.API_BASE_URL || 'https://class-cast.com';
const TEST_USER_ID = 'test-user-123';
const TEST_INSTRUCTOR_ID = 'test-instructor-456';
const TEST_COURSE_ID = 'test-course-789';
const TEST_ASSIGNMENT_ID = 'test-assignment-101';

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        ...options.headers
      },
      timeout: 10000
    };

    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          console.log('Failed to parse JSON response:', data.substring(0, 200));
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Test function wrapper
async function testAPI(name, testFn) {
  console.log(`\n🧪 Testing: ${name}`);
  try {
    await testFn();
    console.log(`✅ PASSED: ${name}`);
    testResults.passed++;
  } catch (error) {
    console.log(`❌ FAILED: ${name}`);
    console.log(`   Error: ${error.message}`);
    testResults.failed++;
    testResults.errors.push({ name, error: error.message });
  }
}

// Individual API tests
async function testStudentStats() {
  const response = await makeRequest(`${BASE_URL}/api/student/stats?userId=${TEST_USER_ID}`);
  
  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }
  
  if (!response.data || typeof response.data !== 'object') {
    throw new Error('Response should be an object');
  }
  
  // Check for expected fields
  const expectedFields = ['activeCourses', 'assignmentsDue', 'completed'];
  for (const field of expectedFields) {
    if (!(field in response.data)) {
      throw new Error(`Missing field: ${field}`);
    }
  }
  
  // Should not contain mock data indicators
  if (JSON.stringify(response.data).includes('mock') || 
      JSON.stringify(response.data).includes('Mock') ||
      JSON.stringify(response.data).includes('placeholder')) {
    throw new Error('Response contains mock data indicators');
  }
}

async function testStudentCourses() {
  const response = await makeRequest(`${BASE_URL}/api/student/courses?userId=${TEST_USER_ID}`);
  
  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }
  
  if (!response.data || !Array.isArray(response.data.courses)) {
    throw new Error('Response should contain courses array');
  }
  
  // Check for mock data indicators
  if (JSON.stringify(response.data).includes('mock') || 
      JSON.stringify(response.data).includes('Mock') ||
      JSON.stringify(response.data).includes('placeholder')) {
    throw new Error('Response contains mock data indicators');
  }
}

async function testStudentAssignments() {
  const response = await makeRequest(`${BASE_URL}/api/student/assignments?userId=${TEST_USER_ID}`);
  
  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }
  
  if (!response.data || !Array.isArray(response.data.assignments)) {
    throw new Error('Response should contain assignments array');
  }
  
  // Check for mock data indicators
  if (JSON.stringify(response.data).includes('mock') || 
      JSON.stringify(response.data).includes('Mock') ||
      JSON.stringify(response.data).includes('placeholder')) {
    throw new Error('Response contains mock data indicators');
  }
}

async function testInstructorStats() {
  const response = await makeRequest(`${BASE_URL}/api/instructor/dashboard/stats?instructorId=${TEST_INSTRUCTOR_ID}`);
  
  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }
  
  if (!response.data || typeof response.data !== 'object') {
    throw new Error('Response should be an object');
  }
  
  // Check for expected fields
  const expectedFields = ['activeCourses', 'ungradedAssignments', 'messages'];
  for (const field of expectedFields) {
    if (!(field in response.data)) {
      throw new Error(`Missing field: ${field}`);
    }
  }
  
  // Check for mock data indicators
  if (JSON.stringify(response.data).includes('mock') || 
      JSON.stringify(response.data).includes('Mock') ||
      JSON.stringify(response.data).includes('placeholder')) {
    throw new Error('Response contains mock data indicators');
  }
}

async function testCoursesAPI() {
  const response = await makeRequest(`${BASE_URL}/api/courses`);
  
  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }
  
  if (!response.data || !response.data.success) {
    throw new Error('Response should indicate success');
  }
  
  if (!response.data.data || !Array.isArray(response.data.data.courses)) {
    throw new Error('Response should contain courses array');
  }
  
  // Check for mock data indicators
  if (JSON.stringify(response.data).includes('mock') || 
      JSON.stringify(response.data).includes('Mock') ||
      JSON.stringify(response.data).includes('placeholder')) {
    throw new Error('Response contains mock data indicators');
  }
}

async function testAssignmentsAPI() {
  const response = await makeRequest(`${BASE_URL}/api/assignments`);
  
  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }
  
  if (!response.data || !response.data.data || !Array.isArray(response.data.data.assignments)) {
    throw new Error('Response should contain assignments array');
  }
  
  // Check for mock data indicators (but allow legitimate placeholder URLs)
  const responseStr = JSON.stringify(response.data);
  if (responseStr.includes('mock') || 
      responseStr.includes('Mock') ||
      (responseStr.includes('placeholder') && !responseStr.includes('/api/placeholder/'))) {
    throw new Error('Response contains mock data indicators');
  }
}

async function testSubmissionsAPI() {
  const response = await makeRequest(`${BASE_URL}/api/submissions`);
  
  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }
  
  if (!response.data || !response.data.data || !Array.isArray(response.data.data.submissions)) {
    throw new Error('Response should contain submissions array');
  }
  
  // Check for mock data indicators
  if (JSON.stringify(response.data).includes('mock') || 
      JSON.stringify(response.data).includes('Mock') ||
      JSON.stringify(response.data).includes('placeholder')) {
    throw new Error('Response contains mock data indicators');
  }
}

async function testStudentsAPI() {
  const response = await makeRequest(`${BASE_URL}/api/students`);
  
  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }
  
  if (!response.data || !Array.isArray(response.data.data)) {
    throw new Error('Response should contain students array');
  }
  
  // Check for mock data indicators (but allow legitimate placeholder URLs)
  const responseStr = JSON.stringify(response.data);
  if (responseStr.includes('mock') || 
      responseStr.includes('Mock') ||
      (responseStr.includes('placeholder') && !responseStr.includes('/api/placeholder/'))) {
    throw new Error('Response contains mock data indicators');
  }
}

async function testVideosAPI() {
  const response = await makeRequest(`${BASE_URL}/api/videos`);
  
  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }
  
  if (!response.data || !Array.isArray(response.data.videos)) {
    throw new Error('Response should contain videos array');
  }
  
  // Check for mock data indicators
  if (JSON.stringify(response.data).includes('mock') || 
      JSON.stringify(response.data).includes('Mock') ||
      JSON.stringify(response.data).includes('placeholder')) {
    throw new Error('Response contains mock data indicators');
  }
}

async function testCommunityPostsAPI() {
  const response = await makeRequest(`${BASE_URL}/api/community/posts`);
  
  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }
  
  if (!Array.isArray(response.data)) {
    throw new Error('Response should be an array');
  }
  
  // Should return empty array (no mock data)
  if (response.data.length > 0 && JSON.stringify(response.data).includes('mock')) {
    throw new Error('Response contains mock data');
  }
}

async function testUploadAPI() {
  // Test the presigned URL generation instead of direct upload
  const response = await makeRequest(`${BASE_URL}/api/upload?fileName=test.txt&contentType=text/plain&folder=test-uploads&userId=${TEST_USER_ID}`);
  
  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }
  
  if (!response.data || !response.data.success) {
    throw new Error('Upload URL generation should be successful');
  }
  
  if (!response.data.data || !response.data.data.presignedUrl) {
    throw new Error('Response should contain presigned URL');
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting comprehensive API testing...');
  console.log(`Testing against: ${BASE_URL}`);
  
  // Core student APIs
  await testAPI('Student Stats API', testStudentStats);
  await testAPI('Student Courses API', testStudentCourses);
  await testAPI('Student Assignments API', testStudentAssignments);
  
  // Core instructor APIs
  await testAPI('Instructor Stats API', testInstructorStats);
  
  // Core data APIs
  await testAPI('Courses API', testCoursesAPI);
  await testAPI('Assignments API', testAssignmentsAPI);
  await testAPI('Submissions API', testSubmissionsAPI);
  await testAPI('Students API', testStudentsAPI);
  await testAPI('Videos API', testVideosAPI);
  
  // Community and upload APIs
  await testAPI('Community Posts API', testCommunityPostsAPI);
  await testAPI('Upload API', testUploadAPI);
  
  // Print results
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.errors.forEach(error => {
      console.log(`   - ${error.name}: ${error.error}`);
    });
  }
  
  if (testResults.failed === 0) {
    console.log('\n🎉 All tests passed! APIs are ready for production.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review and fix the issues.');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(console.error);
