#!/usr/bin/env node

/**
 * Load Testing Script for ClassCast APIs
 * Tests system performance under various load conditions
 */

const https = require('https');
const { performance } = require('perf_hooks');

const BASE_URL = 'https://class-cast.com';
const CONCURRENT_USERS = 50;
const REQUESTS_PER_USER = 10;
const TEST_DURATION_MS = 60000; // 1 minute

// Test scenarios
const testScenarios = [
  {
    name: 'Health Check',
    endpoint: '/api/health',
    method: 'GET',
    weight: 0.1
  },
  {
    name: 'Student Stats',
    endpoint: '/api/student/stats?userId=test-user',
    method: 'GET',
    weight: 0.2
  },
  {
    name: 'Student Courses',
    endpoint: '/api/student/courses?userId=test-user',
    method: 'GET',
    weight: 0.2
  },
  {
    name: 'Courses List',
    endpoint: '/api/courses',
    method: 'GET',
    weight: 0.3
  },
  {
    name: 'Assignments List',
    endpoint: '/api/assignments',
    method: 'GET',
    weight: 0.2
  }
];

// Results tracking
const results = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  responseTimes: [],
  errors: [],
  throughput: 0,
  startTime: 0,
  endTime: 0
};

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    
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
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        results.responseTimes.push(responseTime);
        results.totalRequests++;
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          results.successfulRequests++;
        } else {
          results.failedRequests++;
          results.errors.push({
            endpoint: url,
            status: res.statusCode,
            timestamp: new Date().toISOString()
          });
        }
        
        resolve({
          status: res.statusCode,
          responseTime,
          data: data.substring(0, 100) // First 100 chars for logging
        });
      });
    });

    req.on('error', (error) => {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      results.responseTimes.push(responseTime);
      results.totalRequests++;
      results.failedRequests++;
      results.errors.push({
        endpoint: url,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      reject(error);
    });
    
    req.on('timeout', () => {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      results.responseTimes.push(responseTime);
      results.totalRequests++;
      results.failedRequests++;
      results.errors.push({
        endpoint: url,
        error: 'Request timeout',
        timestamp: new Date().toISOString()
      });
      
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Select test scenario based on weight
function selectTestScenario() {
  const random = Math.random();
  let cumulativeWeight = 0;
  
  for (const scenario of testScenarios) {
    cumulativeWeight += scenario.weight;
    if (random <= cumulativeWeight) {
      return scenario;
    }
  }
  
  return testScenarios[0]; // Fallback
}

// Simulate a single user
async function simulateUser(userId) {
  const userResults = {
    userId,
    requests: 0,
    successful: 0,
    failed: 0,
    avgResponseTime: 0,
    errors: []
  };
  
  const responseTimes = [];
  
  for (let i = 0; i < REQUESTS_PER_USER; i++) {
    try {
      const scenario = selectTestScenario();
      const url = `${BASE_URL}${scenario.endpoint}`;
      
      const response = await makeRequest(url, { method: scenario.method });
      userResults.requests++;
      userResults.successful++;
      responseTimes.push(response.responseTime);
      
      // Add some delay between requests (100-500ms)
      await new Promise(resolve => setTimeout(resolve, Math.random() * 400 + 100));
      
    } catch (error) {
      userResults.requests++;
      userResults.failed++;
      userResults.errors.push(error.message);
    }
  }
  
  userResults.avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  return userResults;
}

// Calculate statistics
function calculateStats() {
  const responseTimes = results.responseTimes;
  const sortedTimes = responseTimes.sort((a, b) => a - b);
  
  const stats = {
    totalRequests: results.totalRequests,
    successfulRequests: results.successfulRequests,
    failedRequests: results.failedRequests,
    successRate: (results.successfulRequests / results.totalRequests) * 100,
    avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
    minResponseTime: Math.min(...responseTimes),
    maxResponseTime: Math.max(...responseTimes),
    p50ResponseTime: sortedTimes[Math.floor(sortedTimes.length * 0.5)],
    p90ResponseTime: sortedTimes[Math.floor(sortedTimes.length * 0.9)],
    p95ResponseTime: sortedTimes[Math.floor(sortedTimes.length * 0.95)],
    p99ResponseTime: sortedTimes[Math.floor(sortedTimes.length * 0.99)],
    throughput: results.totalRequests / ((results.endTime - results.startTime) / 1000),
    errorRate: (results.failedRequests / results.totalRequests) * 100
  };
  
  return stats;
}

// Main load test function
async function runLoadTest() {
  console.log('🚀 Starting load test...');
  console.log(`📊 Configuration:`);
  console.log(`   - Concurrent Users: ${CONCURRENT_USERS}`);
  console.log(`   - Requests per User: ${REQUESTS_PER_USER}`);
  console.log(`   - Total Requests: ${CONCURRENT_USERS * REQUESTS_PER_USER}`);
  console.log(`   - Test Duration: ${TEST_DURATION_MS / 1000}s`);
  console.log(`   - Target URL: ${BASE_URL}\n`);
  
  results.startTime = performance.now();
  
  // Create user simulation promises
  const userPromises = [];
  for (let i = 0; i < CONCURRENT_USERS; i++) {
    userPromises.push(simulateUser(`user-${i + 1}`));
  }
  
  // Run all users concurrently
  console.log('👥 Simulating users...');
  const userResults = await Promise.all(userPromises);
  
  results.endTime = performance.now();
  
  // Calculate and display results
  const stats = calculateStats();
  
  console.log('\n📈 Load Test Results:');
  console.log('='.repeat(50));
  console.log(`Total Requests: ${stats.totalRequests}`);
  console.log(`Successful: ${stats.successfulRequests} (${stats.successRate.toFixed(2)}%)`);
  console.log(`Failed: ${stats.failedRequests} (${stats.errorRate.toFixed(2)}%)`);
  console.log(`Throughput: ${stats.throughput.toFixed(2)} requests/second`);
  console.log('\n⏱️  Response Times:');
  console.log(`   Average: ${stats.avgResponseTime.toFixed(2)}ms`);
  console.log(`   Minimum: ${stats.minResponseTime.toFixed(2)}ms`);
  console.log(`   Maximum: ${stats.maxResponseTime.toFixed(2)}ms`);
  console.log(`   50th percentile: ${stats.p50ResponseTime.toFixed(2)}ms`);
  console.log(`   90th percentile: ${stats.p90ResponseTime.toFixed(2)}ms`);
  console.log(`   95th percentile: ${stats.p95ResponseTime.toFixed(2)}ms`);
  console.log(`   99th percentile: ${stats.p99ResponseTime.toFixed(2)}ms`);
  
  // Performance analysis
  console.log('\n🔍 Performance Analysis:');
  if (stats.avgResponseTime < 500) {
    console.log('✅ Response times are excellent (< 500ms)');
  } else if (stats.avgResponseTime < 1000) {
    console.log('⚠️  Response times are acceptable (500-1000ms)');
  } else {
    console.log('❌ Response times are too slow (> 1000ms)');
  }
  
  if (stats.successRate > 99) {
    console.log('✅ Success rate is excellent (> 99%)');
  } else if (stats.successRate > 95) {
    console.log('⚠️  Success rate is acceptable (95-99%)');
  } else {
    console.log('❌ Success rate is too low (< 95%)');
  }
  
  if (stats.throughput > 100) {
    console.log('✅ Throughput is excellent (> 100 req/s)');
  } else if (stats.throughput > 50) {
    console.log('⚠️  Throughput is acceptable (50-100 req/s)');
  } else {
    console.log('❌ Throughput is too low (< 50 req/s)');
  }
  
  // Error analysis
  if (results.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    const errorCounts = {};
    results.errors.forEach(error => {
      const key = error.endpoint || error.error || 'Unknown';
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    });
    
    Object.entries(errorCounts).forEach(([error, count]) => {
      console.log(`   ${error}: ${count} occurrences`);
    });
  }
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  if (stats.avgResponseTime > 1000) {
    console.log('   - Consider implementing caching (Redis, CloudFront)');
    console.log('   - Optimize database queries and add indexes');
    console.log('   - Consider horizontal scaling');
  }
  
  if (stats.errorRate > 5) {
    console.log('   - Investigate and fix error causes');
    console.log('   - Implement better error handling and retry logic');
    console.log('   - Consider rate limiting to prevent overload');
  }
  
  if (stats.throughput < 50) {
    console.log('   - Consider load balancing across multiple instances');
    console.log('   - Optimize API endpoints for better performance');
    console.log('   - Consider using CDN for static content');
  }
  
  console.log('\n🎯 Load test completed!');
  
  return stats;
}

// Run the load test
runLoadTest().catch(console.error);
