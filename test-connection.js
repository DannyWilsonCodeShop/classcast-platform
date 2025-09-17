#!/usr/bin/env node

const https = require('https');
const http = require('http');

console.log('🔍 Testing ClassCast Platform Connection...\n');

// Test configuration
const tests = [
  {
    name: 'Local Development Server',
    url: 'http://localhost:3001',
    method: 'GET'
  },
  {
    name: 'Live Production Site',
    url: 'https://myclasscast.com',
    method: 'GET'
  },
  {
    name: 'Health Check API',
    url: 'http://localhost:3001/api/health',
    method: 'GET'
  },
  {
    name: 'Signup API Test',
    url: 'http://localhost:3001/api/auth/signup',
    method: 'POST',
    data: {
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      password: 'Test123!',
      role: 'instructor',
      department: 'Computer Science',
      agreeToTerms: true
    }
  },
  {
    name: 'Login API Test',
    url: 'http://localhost:3001/api/auth/login',
    method: 'POST',
    data: {
      email: 'instructor@classcast.com',
      password: 'password123'
    }
  }
];

// Helper function to make HTTP requests
function makeRequest(test) {
  return new Promise((resolve) => {
    const url = new URL(test.url);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: test.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ClassCast-Test-Script/1.0'
      }
    };

    if (test.data) {
      const data = JSON.stringify(test.data);
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          success: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          headers: res.headers,
          data: data,
          error: null
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        status: null,
        headers: null,
        data: null,
        error: error.message
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        success: false,
        status: null,
        headers: null,
        data: null,
        error: 'Request timeout'
      });
    });

    if (test.data) {
      req.write(JSON.stringify(test.data));
    }
    req.end();
  });
}

// Run all tests
async function runTests() {
  console.log('📋 Running Connection Tests...\n');
  
  for (const test of tests) {
    console.log(`🧪 Testing: ${test.name}`);
    console.log(`   URL: ${test.url}`);
    console.log(`   Method: ${test.method}`);
    
    const result = await makeRequest(test);
    
    if (result.success) {
      console.log(`   ✅ SUCCESS (${result.status})`);
      if (test.method === 'GET' && result.data) {
        // Check if it's HTML (likely a page)
        if (result.data.includes('<html>') || result.data.includes('<!DOCTYPE')) {
          console.log(`   📄 Response: HTML page (${result.data.length} bytes)`);
        } else {
          console.log(`   📄 Response: ${result.data.substring(0, 100)}...`);
        }
      }
    } else {
      console.log(`   ❌ FAILED`);
      if (result.error) {
        console.log(`   🔍 Error: ${result.error}`);
      } else {
        console.log(`   🔍 Status: ${result.status}`);
        if (result.data) {
          console.log(`   🔍 Response: ${result.data.substring(0, 200)}...`);
        }
      }
    }
    console.log('');
  }
  
  console.log('🎯 Connection Test Summary:');
  console.log('   - Local server: Check if npm run dev is running');
  console.log('   - Live site: Check DNS and SSL configuration');
  console.log('   - APIs: Check if endpoints are responding');
  console.log('   - Authentication: Check if Cognito is connected');
}

// Run the tests
runTests().catch(console.error);
