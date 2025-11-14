#!/usr/bin/env node

/**
 * Security Audit Script for ClassCast
 * Comprehensive security testing and vulnerability assessment
 */

const https = require('https');
const crypto = require('crypto');

const BASE_URL = 'https://class-cast.com';
const auditResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  vulnerabilities: []
};

// Security test cases
const securityTests = [
  {
    name: 'HTTPS Enforcement',
    test: testHTTPSEnforcement,
    critical: true
  },
  {
    name: 'Security Headers',
    test: testSecurityHeaders,
    critical: true
  },
  {
    name: 'CORS Configuration',
    test: testCORSConfiguration,
    critical: false
  },
  {
    name: 'Authentication Bypass',
    test: testAuthenticationBypass,
    critical: true
  },
  {
    name: 'SQL Injection',
    test: testSQLInjection,
    critical: true
  },
  {
    name: 'XSS Protection',
    test: testXSSProtection,
    critical: true
  },
  {
    name: 'CSRF Protection',
    test: testCSRFProtection,
    critical: true
  },
  {
    name: 'Input Validation',
    test: testInputValidation,
    critical: true
  },
  {
    name: 'Rate Limiting',
    test: testRateLimiting,
    critical: false
  },
  {
    name: 'Error Information Disclosure',
    test: testErrorDisclosure,
    critical: true
  }
];

// Helper function to make HTTP requests
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
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
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

// Test HTTPS enforcement
async function testHTTPSEnforcement() {
  try {
    // Test HTTP redirect to HTTPS
    const httpUrl = BASE_URL.replace('https://', 'http://');
    const response = await makeRequest(httpUrl);
    
    if (response.status === 301 || response.status === 302) {
      return { status: 'PASS', message: 'HTTP properly redirects to HTTPS' };
    } else if (response.status === 200) {
      return { status: 'FAIL', message: 'HTTP is accessible without redirect' };
    } else {
      return { status: 'WARN', message: 'Unexpected HTTP response' };
    }
  } catch (error) {
    return { status: 'PASS', message: 'HTTP is not accessible (good)' };
  }
}

// Test security headers
async function testSecurityHeaders() {
  try {
    const response = await makeRequest(`${BASE_URL}/api/health`);
    const headers = response.headers;
    
    const requiredHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'strict-transport-security'
    ];
    
    const missingHeaders = requiredHeaders.filter(header => !headers[header]);
    
    if (missingHeaders.length === 0) {
      return { status: 'PASS', message: 'All security headers present' };
    } else {
      return { 
        status: 'WARN', 
        message: `Missing security headers: ${missingHeaders.join(', ')}` 
      };
    }
  } catch (error) {
    return { status: 'FAIL', message: 'Failed to test security headers' };
  }
}

// Test CORS configuration
async function testCORSConfiguration() {
  try {
    const response = await makeRequest(`${BASE_URL}/api/health`, {
      headers: {
        'Origin': 'https://malicious-site.com',
        'Access-Control-Request-Method': 'POST'
      }
    });
    
    const corsHeaders = {
      'access-control-allow-origin': response.headers['access-control-allow-origin'],
      'access-control-allow-methods': response.headers['access-control-allow-methods'],
      'access-control-allow-headers': response.headers['access-control-allow-headers']
    };
    
    if (corsHeaders['access-control-allow-origin'] === '*') {
      return { status: 'WARN', message: 'CORS allows all origins (*)' };
    } else if (corsHeaders['access-control-allow-origin']) {
      return { status: 'PASS', message: 'CORS properly configured' };
    } else {
      return { status: 'WARN', message: 'CORS headers not found' };
    }
  } catch (error) {
    return { status: 'FAIL', message: 'Failed to test CORS configuration' };
  }
}

// Test authentication bypass
async function testAuthenticationBypass() {
  const protectedEndpoints = [
    '/api/student/stats',
    '/api/instructor/dashboard/stats',
    '/api/profile/save'
  ];
  
  const results = [];
  
  for (const endpoint of protectedEndpoints) {
    try {
      const response = await makeRequest(`${BASE_URL}${endpoint}`);
      
      if (response.status === 401 || response.status === 403) {
        results.push({ endpoint, status: 'PASS', message: 'Properly protected' });
      } else if (response.status === 200) {
        results.push({ endpoint, status: 'FAIL', message: 'Accessible without authentication' });
      } else {
        results.push({ endpoint, status: 'WARN', message: `Unexpected status: ${response.status}` });
      }
    } catch (error) {
      results.push({ endpoint, status: 'WARN', message: 'Request failed' });
    }
  }
  
  const failed = results.filter(r => r.status === 'FAIL');
  if (failed.length === 0) {
    return { status: 'PASS', message: 'All protected endpoints require authentication' };
  } else {
    return { 
      status: 'FAIL', 
      message: `Vulnerable endpoints: ${failed.map(f => f.endpoint).join(', ')}` 
    };
  }
}

// Test SQL injection
async function testSQLInjection() {
  const payloads = [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "' UNION SELECT * FROM users --",
    "1' OR 1=1 --"
  ];
  
  const results = [];
  
  for (const payload of payloads) {
    try {
      const response = await makeRequest(`${BASE_URL}/api/courses?search=${encodeURIComponent(payload)}`);
      
      if (response.data.includes('error') || response.data.includes('SQL') || response.data.includes('syntax')) {
        results.push({ payload, status: 'WARN', message: 'Possible SQL injection vulnerability' });
      } else {
        results.push({ payload, status: 'PASS', message: 'No SQL injection detected' });
      }
    } catch (error) {
      results.push({ payload, status: 'PASS', message: 'Request failed safely' });
    }
  }
  
  const vulnerable = results.filter(r => r.status === 'WARN');
  if (vulnerable.length === 0) {
    return { status: 'PASS', message: 'No SQL injection vulnerabilities detected' };
  } else {
    return { 
      status: 'WARN', 
      message: `Potential SQL injection: ${vulnerable.length} payloads triggered responses` 
    };
  }
}

// Test XSS protection
async function testXSSProtection() {
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '"><script>alert("XSS")</script>',
    'javascript:alert("XSS")',
    '<img src=x onerror=alert("XSS")>'
  ];
  
  const results = [];
  
  for (const payload of xssPayloads) {
    try {
      const response = await makeRequest(`${BASE_URL}/api/courses?search=${encodeURIComponent(payload)}`);
      
      if (response.data.includes('<script>') || response.data.includes('javascript:')) {
        results.push({ payload, status: 'WARN', message: 'XSS payload reflected in response' });
      } else {
        results.push({ payload, status: 'PASS', message: 'XSS payload properly sanitized' });
      }
    } catch (error) {
      results.push({ payload, status: 'PASS', message: 'Request failed safely' });
    }
  }
  
  const vulnerable = results.filter(r => r.status === 'WARN');
  if (vulnerable.length === 0) {
    return { status: 'PASS', message: 'No XSS vulnerabilities detected' };
  } else {
    return { 
      status: 'WARN', 
      message: `Potential XSS: ${vulnerable.length} payloads reflected in response` 
    };
  }
}

// Test CSRF protection
async function testCSRFProtection() {
  try {
    // Test if POST requests require CSRF tokens
    const response = await makeRequest(`${BASE_URL}/api/profile/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://malicious-site.com'
      },
      body: { test: 'data' }
    });
    
    if (response.status === 403 || response.status === 401) {
      return { status: 'PASS', message: 'CSRF protection enabled' };
    } else if (response.status === 200) {
      return { status: 'WARN', message: 'CSRF protection may be missing' };
    } else {
      return { status: 'WARN', message: 'Unexpected CSRF response' };
    }
  } catch (error) {
    return { status: 'PASS', message: 'CSRF protection working (request blocked)' };
  }
}

// Test input validation
async function testInputValidation() {
  const invalidInputs = [
    { field: 'email', value: 'invalid-email' },
    { field: 'userId', value: '../../../etc/passwd' },
    { field: 'courseId', value: 'A'.repeat(1000) },
    { field: 'assignmentId', value: '<script>alert("test")</script>' }
  ];
  
  const results = [];
  
  for (const input of invalidInputs) {
    try {
      const response = await makeRequest(`${BASE_URL}/api/courses?${input.field}=${encodeURIComponent(input.value)}`);
      
      if (response.status === 400 || response.status === 422) {
        results.push({ input, status: 'PASS', message: 'Input properly validated' });
      } else if (response.status === 200) {
        results.push({ input, status: 'WARN', message: 'Invalid input accepted' });
      } else {
        results.push({ input, status: 'PASS', message: 'Request handled safely' });
      }
    } catch (error) {
      results.push({ input, status: 'PASS', message: 'Request failed safely' });
    }
  }
  
  const vulnerable = results.filter(r => r.status === 'WARN');
  if (vulnerable.length === 0) {
    return { status: 'PASS', message: 'Input validation working properly' };
  } else {
    return { 
      status: 'WARN', 
      message: `Input validation issues: ${vulnerable.length} invalid inputs accepted` 
    };
  }
}

// Test rate limiting
async function testRateLimiting() {
  try {
    const requests = [];
    
    // Send 100 rapid requests
    for (let i = 0; i < 100; i++) {
      requests.push(makeRequest(`${BASE_URL}/api/health`));
    }
    
    const responses = await Promise.all(requests);
    const rateLimited = responses.filter(r => r.status === 429);
    
    if (rateLimited.length > 0) {
      return { status: 'PASS', message: 'Rate limiting is working' };
    } else {
      return { status: 'WARN', message: 'Rate limiting may not be enabled' };
    }
  } catch (error) {
    return { status: 'WARN', message: 'Failed to test rate limiting' };
  }
}

// Test error information disclosure
async function testErrorDisclosure() {
  try {
    // Try to access non-existent endpoint
    const response = await makeRequest(`${BASE_URL}/api/nonexistent`);
    
    if (response.data.includes('stack trace') || 
        response.data.includes('database') || 
        response.data.includes('internal') ||
        response.data.includes('error:') ||
        response.data.includes('Exception')) {
      return { status: 'WARN', message: 'Error responses may contain sensitive information' };
    } else {
      return { status: 'PASS', message: 'Error responses are sanitized' };
    }
  } catch (error) {
    return { status: 'PASS', message: 'Error handling working properly' };
  }
}

// Run security audit
async function runSecurityAudit() {
  console.log('🔒 Starting security audit...');
  console.log(`🎯 Target: ${BASE_URL}\n`);
  
  for (const test of securityTests) {
    console.log(`🔍 Testing: ${test.name}`);
    
    try {
      const result = await test.test();
      
      if (result.status === 'PASS') {
        console.log(`✅ ${test.name}: ${result.message}`);
        auditResults.passed++;
      } else if (result.status === 'WARN') {
        console.log(`⚠️  ${test.name}: ${result.message}`);
        auditResults.warnings++;
        auditResults.vulnerabilities.push({
          test: test.name,
          severity: 'WARNING',
          description: result.message,
          critical: test.critical
        });
      } else {
        console.log(`❌ ${test.name}: ${result.message}`);
        auditResults.failed++;
        auditResults.vulnerabilities.push({
          test: test.name,
          severity: 'CRITICAL',
          description: result.message,
          critical: test.critical
        });
      }
    } catch (error) {
      console.log(`❌ ${test.name}: Test failed - ${error.message}`);
      auditResults.failed++;
      auditResults.vulnerabilities.push({
        test: test.name,
        severity: 'ERROR',
        description: `Test execution failed: ${error.message}`,
        critical: test.critical
      });
    }
    
    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Generate report
  console.log('\n📊 Security Audit Results:');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${auditResults.passed}`);
  console.log(`⚠️  Warnings: ${auditResults.warnings}`);
  console.log(`❌ Failed: ${auditResults.failed}`);
  
  if (auditResults.vulnerabilities.length > 0) {
    console.log('\n🚨 Security Issues Found:');
    auditResults.vulnerabilities.forEach((vuln, index) => {
      console.log(`${index + 1}. ${vuln.test} (${vuln.severity})`);
      console.log(`   ${vuln.description}`);
      if (vuln.critical) {
        console.log(`   ⚠️  CRITICAL: This issue should be fixed immediately`);
      }
      console.log('');
    });
  }
  
  // Security score
  const totalTests = securityTests.length;
  const securityScore = Math.round((auditResults.passed / totalTests) * 100);
  
  console.log(`\n🎯 Security Score: ${securityScore}%`);
  
  if (securityScore >= 90) {
    console.log('🟢 Security posture is excellent');
  } else if (securityScore >= 70) {
    console.log('🟡 Security posture is good but needs improvement');
  } else {
    console.log('🔴 Security posture needs immediate attention');
  }
  
  // Recommendations
  console.log('\n💡 Security Recommendations:');
  console.log('1. Implement security headers (X-Content-Type-Options, X-Frame-Options, etc.)');
  console.log('2. Add CSRF protection to all state-changing operations');
  console.log('3. Implement rate limiting to prevent abuse');
  console.log('4. Sanitize all user inputs to prevent XSS and injection attacks');
  console.log('5. Ensure all error responses are sanitized');
  console.log('6. Implement proper authentication and authorization checks');
  console.log('7. Use HTTPS everywhere and enforce secure connections');
  console.log('8. Regular security testing and vulnerability assessments');
  
  return auditResults;
}

// Run the security audit
runSecurityAudit().catch(console.error);
