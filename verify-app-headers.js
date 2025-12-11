#!/usr/bin/env node

/**
 * Verify what headers your app is sending
 * Tests both Next.js config headers and API response headers
 */

const https = require('https');
const http = require('http');

const APP_URL = 'https://class-cast.com';
const LOCAL_URL = 'http://localhost:3000';

console.log('🔍 Verifying App Headers\n');

// Function to make HTTP request and check headers
function checkHeaders(url, path = '/') {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const options = {
      hostname: url.replace(/^https?:\/\//, ''),
      port: isHttps ? 443 : (url.includes(':3000') ? 3000 : 80),
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Header-Checker/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    };

    const req = client.request(options, (res) => {
      resolve({
        statusCode: res.statusCode,
        headers: res.headers,
        url: `${url}${path}`
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Function to display headers nicely
function displayHeaders(response, title) {
  console.log(`\n📋 ${title}`);
  console.log(`URL: ${response.url}`);
  console.log(`Status: ${response.statusCode}`);
  console.log('Headers:');
  
  // Security headers from Next.js config
  const securityHeaders = [
    'x-dns-prefetch-control',
    'strict-transport-security',
    'x-content-type-options',
    'x-frame-options',
    'x-xss-protection',
    'referrer-policy'
  ];
  
  // Caching headers
  const cachingHeaders = [
    'cache-control',
    'etag',
    'last-modified',
    'expires',
    'x-cache',
    'x-cache-status',
    'cf-cache-status'
  ];
  
  // Performance headers
  const performanceHeaders = [
    'content-encoding',
    'content-length',
    'server-timing',
    'x-powered-by'
  ];
  
  console.log('\n  🔒 Security Headers:');
  securityHeaders.forEach(header => {
    const value = response.headers[header];
    if (value) {
      console.log(`    ✅ ${header}: ${value}`);
    } else {
      console.log(`    ❌ ${header}: Not set`);
    }
  });
  
  console.log('\n  🚀 Caching Headers:');
  cachingHeaders.forEach(header => {
    const value = response.headers[header];
    if (value) {
      console.log(`    ✅ ${header}: ${value}`);
    } else {
      console.log(`    ❌ ${header}: Not set`);
    }
  });
  
  console.log('\n  ⚡ Performance Headers:');
  performanceHeaders.forEach(header => {
    const value = response.headers[header];
    if (value) {
      console.log(`    ✅ ${header}: ${value}`);
    } else {
      console.log(`    ❌ ${header}: Not set`);
    }
  });
  
  console.log('\n  📦 All Headers:');
  Object.entries(response.headers).forEach(([key, value]) => {
    console.log(`    ${key}: ${value}`);
  });
}

// Test endpoints
const testEndpoints = [
  { path: '/', description: 'Homepage' },
  { path: '/_next/static/css/app.css', description: 'Static CSS (should have long cache)' },
  { path: '/api/videos/test123/interactions', description: 'API with caching' },
  { path: '/api/videos/test123/rating', description: 'API with caching' },
  { path: '/student/dashboard', description: 'Protected page' }
];

async function runHeaderTests() {
  console.log('🌐 Testing Production App Headers');
  
  for (const endpoint of testEndpoints) {
    try {
      console.log(`\n🔍 Testing: ${endpoint.description}`);
      const response = await checkHeaders(APP_URL, endpoint.path);
      displayHeaders(response, `${endpoint.description} Headers`);
    } catch (error) {
      console.log(`❌ Error testing ${endpoint.path}: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 HEADER ANALYSIS SUMMARY');
  console.log('='.repeat(80));
  
  console.log('\n🔒 Expected Security Headers (from next.config.ts):');
  console.log('  - X-DNS-Prefetch-Control: on');
  console.log('  - Strict-Transport-Security: max-age=63072000; includeSubDomains; preload');
  console.log('  - X-Content-Type-Options: nosniff');
  console.log('  - X-Frame-Options: SAMEORIGIN');
  console.log('  - X-XSS-Protection: 1; mode=block');
  console.log('  - Referrer-Policy: strict-origin-when-cross-origin');
  
  console.log('\n🚀 Expected Caching Headers:');
  console.log('  - Static assets: Cache-Control: public, max-age=31536000, immutable');
  console.log('  - API responses: Cache-Control: public, max-age=300, stale-while-revalidate=300');
  console.log('  - CloudFront: X-Cache: Hit from cloudfront (when cached)');
  
  console.log('\n⚡ Performance Indicators:');
  console.log('  - Content-Encoding: gzip or br (compression enabled)');
  console.log('  - X-Powered-By: should be hidden for security');
  console.log('  - Server-Timing: performance metrics');
  
  console.log('\n📋 What to look for:');
  console.log('  ✅ Security headers are present and correct');
  console.log('  ✅ Static assets have long cache times');
  console.log('  ✅ API responses have appropriate cache headers');
  console.log('  ✅ CloudFront is serving cached content');
  console.log('  ✅ Compression is enabled');
  console.log('  ✅ No sensitive headers are exposed');
}

// Also create a simple curl command generator
function generateCurlCommands() {
  console.log('\n🛠️  CURL COMMANDS FOR MANUAL TESTING:');
  console.log('='.repeat(50));
  
  testEndpoints.forEach(endpoint => {
    console.log(`\n# ${endpoint.description}`);
    console.log(`curl -I "${APP_URL}${endpoint.path}"`);
  });
  
  console.log('\n# Check specific header');
  console.log(`curl -I "${APP_URL}/" | grep -i cache-control`);
  console.log(`curl -I "${APP_URL}/" | grep -i x-cache`);
  console.log(`curl -I "${APP_URL}/_next/static/" | grep -i cache-control`);
}

// Run the tests
runHeaderTests().then(() => {
  generateCurlCommands();
  console.log('\n✅ Header verification complete!');
}).catch(error => {
  console.error('❌ Error running header tests:', error);
});