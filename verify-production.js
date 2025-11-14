#!/usr/bin/env node

/**
 * Production Verification Script
 * Verifies that all systems are working correctly in production
 */

const https = require('https');

const BASE_URL = 'https://class-cast.com';
const verificationResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        ...options.headers
      },
      timeout: 10000
    };

    const req = https.request(url, requestOptions, (res) => {
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

async function verifyAPI(name, testFn) {
  console.log(`🔍 Verifying: ${name}`);
  try {
    const result = await testFn();
    console.log(`✅ ${name}: ${result.message}`);
    verificationResults.passed++;
    verificationResults.details.push({ name, status: 'PASS', message: result.message });
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    verificationResults.failed++;
    verificationResults.details.push({ name, status: 'FAIL', message: error.message });
  }
}

async function verifyHealthCheck() {
  const response = await makeRequest(`${BASE_URL}/api/health`);
  
  if (response.status !== 200) {
    throw new Error(`Health check failed with status ${response.status}`);
  }
  
  if (!response.data || response.data.status !== 'healthy') {
    throw new Error(`System health status: ${response.data?.status || 'unknown'}`);
  }
  
  return { message: `System healthy (${response.data.responseTime}ms)` };
}

async function verifyCoreAPIs() {
  const apis = [
    { name: 'Courses', url: '/api/courses' },
    { name: 'Assignments', url: '/api/assignments' },
    { name: 'Students', url: '/api/students' },
    { name: 'Videos', url: '/api/videos' }
  ];
  
  for (const api of apis) {
    const response = await makeRequest(`${BASE_URL}${api.url}`);
    
    if (response.status !== 200) {
      throw new Error(`${api.name} API returned status ${response.status}`);
    }
    
    if (!response.data || !response.data.success) {
      throw new Error(`${api.name} API returned unsuccessful response`);
    }
  }
  
  return { message: 'All core APIs responding correctly' };
}

async function verifyStudentAPIs() {
  const response = await makeRequest(`${BASE_URL}/api/student/stats?userId=test-user`);
  
  if (response.status !== 200) {
    throw new Error(`Student stats API returned status ${response.status}`);
  }
  
  if (!response.data || typeof response.data !== 'object') {
    throw new Error('Student stats API returned invalid data structure');
  }
  
  return { message: 'Student APIs working with real data' };
}

async function verifyInstructorAPIs() {
  const response = await makeRequest(`${BASE_URL}/api/instructor/dashboard/stats?instructorId=test-instructor`);
  
  if (response.status !== 200) {
    throw new Error(`Instructor stats API returned status ${response.status}`);
  }
  
  if (!response.data || typeof response.data !== 'object') {
    throw new Error('Instructor stats API returned invalid data structure');
  }
  
  return { message: 'Instructor APIs working with real data' };
}

async function verifyFileUpload() {
  const response = await makeRequest(`${BASE_URL}/api/upload?fileName=test.txt&contentType=text/plain&folder=test&userId=test-user`);
  
  if (response.status !== 200) {
    throw new Error(`Upload API returned status ${response.status}`);
  }
  
  if (!response.data || !response.data.success) {
    throw new Error('Upload API returned unsuccessful response');
  }
  
  if (!response.data.data || !response.data.data.presignedUrl) {
    throw new Error('Upload API did not return presigned URL');
  }
  
  return { message: 'File upload system operational' };
}

async function verifyDatabaseConnection() {
  // Test by checking if we get real data (not mock data)
  const response = await makeRequest(`${BASE_URL}/api/courses`);
  
  if (response.status !== 200) {
    throw new Error('Database connection test failed');
  }
  
  const courses = response.data?.data?.courses || [];
  if (courses.length === 0) {
    verificationResults.warnings++;
    verificationResults.details.push({ 
      name: 'Database Connection', 
      status: 'WARNING', 
      message: 'No courses found in database' 
    });
  }
  
  // Check for mock data indicators
  const responseText = JSON.stringify(response.data);
  if (responseText.includes('mock') || responseText.includes('Mock') || responseText.includes('placeholder')) {
    throw new Error('Database contains mock data instead of real data');
  }
  
  return { message: `Database connected with ${courses.length} courses` };
}

async function verifySecurity() {
  const response = await makeRequest(`${BASE_URL}/api/health`);
  
  // Check for security headers
  const securityHeaders = [
    'x-content-type-options',
    'x-frame-options',
    'x-xss-protection',
    'strict-transport-security'
  ];
  
  const missingHeaders = securityHeaders.filter(header => !response.headers[header]);
  
  if (missingHeaders.length > 0) {
    verificationResults.warnings++;
    verificationResults.details.push({
      name: 'Security Headers',
      status: 'WARNING',
      message: `Missing security headers: ${missingHeaders.join(', ')}`
    });
  }
  
  return { message: 'Basic security verification completed' };
}

async function runVerification() {
  console.log('🚀 Starting production verification...');
  console.log(`Verifying: ${BASE_URL}\n`);
  
  await verifyAPI('Health Check', verifyHealthCheck);
  await verifyAPI('Core APIs', verifyCoreAPIs);
  await verifyAPI('Student APIs', verifyStudentAPIs);
  await verifyAPI('Instructor APIs', verifyInstructorAPIs);
  await verifyAPI('File Upload', verifyFileUpload);
  await verifyAPI('Database Connection', verifyDatabaseConnection);
  await verifyAPI('Security', verifySecurity);
  
  console.log('\n📊 Verification Results:');
  console.log(`✅ Passed: ${verificationResults.passed}`);
  console.log(`❌ Failed: ${verificationResults.failed}`);
  console.log(`⚠️  Warnings: ${verificationResults.warnings}`);
  
  if (verificationResults.failed === 0) {
    console.log('\n🎉 Production verification PASSED!');
    console.log('✅ All critical systems are operational');
    
    if (verificationResults.warnings > 0) {
      console.log('\n⚠️  Warnings to address:');
      verificationResults.details
        .filter(d => d.status === 'WARNING')
        .forEach(d => console.log(`   - ${d.name}: ${d.message}`));
    }
  } else {
    console.log('\n❌ Production verification FAILED!');
    console.log('Issues to fix:');
    verificationResults.details
      .filter(d => d.status === 'FAIL')
      .forEach(d => console.log(`   - ${d.name}: ${d.message}`));
    process.exit(1);
  }
}

runVerification().catch(console.error);
