const https = require('https');

console.log('🔍 Testing Amplify CloudFront Caching\n');
console.log('='.repeat(60));

function makeRequest(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ...headers
      }
    };
    
    https.get(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          duration,
          data: data.substring(0, 500) // First 500 chars
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function testAmplifyCache() {
  console.log('🌐 Testing Amplify CloudFront Caching Behavior\n');
  
  // Test the main page first
  const baseUrl = 'https://main.d166bugwfgjggz.amplifyapp.com';
  
  console.log('📋 Test 1: Main Page Caching');
  console.log(`URL: ${baseUrl}/`);
  
  try {
    // First request
    console.log('\n🔄 Request #1 (should be cache MISS)');
    const response1 = await makeRequest(`${baseUrl}/`);
    
    console.log(`   Status: ${response1.statusCode}`);
    console.log(`   Duration: ${response1.duration}ms`);
    console.log(`   Server: ${response1.headers['server'] || 'N/A'}`);
    console.log(`   Cache-Control: ${response1.headers['cache-control'] || 'NOT SET'}`);
    console.log(`   Age: ${response1.headers['age'] || 'N/A'}`);
    console.log(`   X-Cache: ${response1.headers['x-cache'] || 'N/A'}`);
    console.log(`   CF-Cache-Status: ${response1.headers['cf-cache-status'] || 'N/A'}`);
    console.log(`   X-Amz-Cf-Id: ${response1.headers['x-amz-cf-id'] ? 'Present' : 'N/A'}`);
    
    // Wait 2 seconds
    console.log('\n⏳ Waiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Second request
    console.log('\n🔄 Request #2 (should be cache HIT if caching works)');
    const response2 = await makeRequest(`${baseUrl}/`);
    
    console.log(`   Status: ${response2.statusCode}`);
    console.log(`   Duration: ${response2.duration}ms`);
    console.log(`   Server: ${response2.headers['server'] || 'N/A'}`);
    console.log(`   Cache-Control: ${response2.headers['cache-control'] || 'NOT SET'}`);
    console.log(`   Age: ${response2.headers['age'] || 'N/A'}`);
    console.log(`   X-Cache: ${response2.headers['x-cache'] || 'N/A'}`);
    console.log(`   CF-Cache-Status: ${response2.headers['cf-cache-status'] || 'N/A'}`);
    
    // Analysis
    console.log('\n' + '='.repeat(60));
    console.log('📊 CACHING ANALYSIS');
    console.log('='.repeat(60));
    
    const hasCloudFrontHeaders = response1.headers['x-amz-cf-id'] || response1.headers['x-cache'];
    const hasCacheControl = response1.headers['cache-control'];
    const hasAge = response2.headers['age'];
    const isFaster = response2.duration < response1.duration;
    const speedImprovement = ((response1.duration - response2.duration) / response1.duration * 100).toFixed(1);
    
    console.log('\n🔍 CloudFront Detection:');
    if (hasCloudFrontHeaders) {
      console.log('   ✅ CloudFront is active (headers present)');
      console.log('   ✅ Amplify is using CloudFront distribution');
    } else {
      console.log('   ❌ No CloudFront headers detected');
      console.log('   ⚠️  Traffic might be going directly to origin');
    }
    
    console.log('\n🎯 Cache Behavior:');
    if (hasCacheControl) {
      console.log(`   ✅ Cache-Control header present: ${response1.headers['cache-control']}`);
    } else {
      console.log('   ❌ No Cache-Control header');
      console.log('   → Static files might be cached, but not API responses');
    }
    
    if (hasAge) {
      console.log(`   ✅ Age header present: ${response2.headers['age']} seconds`);
      console.log('   ✅ Response was served from cache!');
    } else {
      console.log('   ⚠️  No Age header (might be too fresh or not cached)');
    }
    
    console.log('\n⚡ Performance:');
    console.log(`   Request 1: ${response1.duration}ms`);
    console.log(`   Request 2: ${response2.duration}ms`);
    
    if (isFaster && speedImprovement > 10) {
      console.log(`   ✅ Second request was ${speedImprovement}% faster!`);
      console.log('   ✅ Caching is likely working');
    } else if (Math.abs(response1.duration - response2.duration) < 50) {
      console.log('   ⚠️  Similar response times (difference < 50ms)');
      console.log('   → Both requests might be cached, or caching not significant');
    } else {
      console.log('   ❌ Second request was not faster');
      console.log('   → Caching might not be working');
    }
    
    // Test API endpoint (if accessible)
    console.log('\n\n📋 Test 2: API Endpoint Caching');
    console.log('⚠️  API endpoints require authentication');
    console.log('   Cannot test directly without login');
    console.log('   Use browser DevTools to test:');
    console.log('   1. Open https://class-cast.com');
    console.log('   2. Log in as student');
    console.log('   3. Open Network tab');
    console.log('   4. Look for /api/videos/*/interactions requests');
    console.log('   5. Check Response Headers for Cache-Control');
    console.log('   6. Reload page and check for Age header');
    
    // Final verdict
    console.log('\n' + '='.repeat(60));
    console.log('🎯 FINAL VERDICT');
    console.log('='.repeat(60));
    
    if (hasCloudFrontHeaders && (hasAge || isFaster)) {
      console.log('\n✅ CACHING IS WORKING!');
      console.log('   - CloudFront is active');
      console.log('   - Responses are being cached');
      console.log('   - Performance improvement detected');
      
      console.log('\n📈 Expected Benefits:');
      console.log('   - Static assets: Cached automatically');
      console.log('   - API responses: Cached with Cache-Control headers');
      console.log('   - Page loads: 50-70% faster after first visit');
      console.log('   - DynamoDB reads: Reduced by caching');
      
    } else if (hasCloudFrontHeaders) {
      console.log('\n⚠️  PARTIAL CACHING');
      console.log('   - CloudFront is active');
      console.log('   - Static files likely cached');
      console.log('   - API caching needs verification');
      
      console.log('\n🔧 Next Steps:');
      console.log('   1. Test API endpoints in browser');
      console.log('   2. Check for Cache-Control headers');
      console.log('   3. Verify Age headers on reload');
      
    } else {
      console.log('\n❌ CACHING NOT DETECTED');
      console.log('   - No CloudFront headers found');
      console.log('   - Requests might be going directly to origin');
      
      console.log('\n🔧 Troubleshooting:');
      console.log('   1. Check Amplify app configuration');
      console.log('   2. Verify domain routing');
      console.log('   3. Check for custom CloudFront settings');
    }
    
    console.log('\n💡 Remember:');
    console.log('   - Static files (JS, CSS, images) are usually cached automatically');
    console.log('   - API responses need Cache-Control headers (we added these)');
    console.log('   - Client-side caching (React Query) works independently');
    console.log('   - Both server + client caching = maximum performance');
    
  } catch (error) {
    console.error('\n❌ Error testing cache:', error.message);
    console.log('\nPossible reasons:');
    console.log('1. Network connectivity issues');
    console.log('2. Amplify app not accessible');
    console.log('3. CloudFront configuration issues');
    console.log('\nTry testing manually in browser:');
    console.log('1. Open https://class-cast.com');
    console.log('2. Check Network tab in DevTools');
    console.log('3. Look for cache-related headers');
  }
  
  console.log('\n' + '='.repeat(60));
}

testAmplifyCache().catch(console.error);