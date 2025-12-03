#!/usr/bin/env node

const https = require('https');

const DOMAIN = 'class-cast.com';
const URLS = [
  `https://${DOMAIN}`,
  `https://www.${DOMAIN}`,
  `https://main.d166bugwfgjggz.amplifyapp.com`
];

async function testURL(url) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    https.get(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }, (res) => {
      const duration = Date.now() - startTime;
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          url,
          status: res.statusCode,
          duration,
          headers: {
            server: res.headers['server'],
            xCache: res.headers['x-cache'],
            via: res.headers['via'],
            cfId: res.headers['x-amz-cf-id'],
            cfPop: res.headers['x-amz-cf-pop'],
            age: res.headers['age']
          },
          bodySize: data.length
        });
      });
    }).on('error', (err) => {
      resolve({
        url,
        error: err.message
      });
    });
  });
}

async function main() {
  console.log('🧪 Comprehensive CloudFront Test\n');
  console.log('='.repeat(70));
  
  for (const url of URLS) {
    console.log(`\n🔍 Testing: ${url}\n`);
    
    // Test 3 times to check caching
    for (let i = 1; i <= 3; i++) {
      const result = await testURL(url);
      
      if (result.error) {
        console.log(`   Attempt ${i}: ❌ ${result.error}`);
      } else {
        const cacheStatus = result.headers.xCache || 'N/A';
        const isCached = cacheStatus.includes('Hit');
        const isCloudFront = result.headers.server?.includes('CloudFront') || result.headers.via?.includes('cloudfront');
        
        console.log(`   Attempt ${i}:`);
        console.log(`     Status: ${result.status} ${result.status === 200 ? '✅' : '❌'}`);
        console.log(`     Duration: ${result.duration}ms`);
        console.log(`     Server: ${result.headers.server || 'N/A'}`);
        console.log(`     X-Cache: ${cacheStatus} ${isCached ? '✅' : '⚠️'}`);
        console.log(`     CloudFront: ${isCloudFront ? '✅' : '❌'}`);
        if (result.headers.cfPop) {
          console.log(`     CF-POP: ${result.headers.cfPop}`);
        }
        console.log(`     Body Size: ${(result.bodySize / 1024).toFixed(2)} KB`);
      }
      
      // Wait 500ms between requests
      if (i < 3) await new Promise(r => setTimeout(r, 500));
    }
    
    console.log();
  }
  
  console.log('='.repeat(70));
  console.log('\n📊 Summary:\n');
  
  // Test all URLs one more time for final status
  const finalResults = await Promise.all(URLS.map(testURL));
  
  finalResults.forEach(result => {
    if (result.error) {
      console.log(`❌ ${result.url}`);
      console.log(`   Error: ${result.error}\n`);
    } else {
      const isWorking = result.status === 200;
      const isCloudFront = result.headers.server?.includes('CloudFront') || result.headers.via?.includes('cloudfront');
      const cacheStatus = result.headers.xCache || 'N/A';
      
      console.log(`${isWorking ? '✅' : '❌'} ${result.url}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   CloudFront: ${isCloudFront ? 'Active ✅' : 'Not detected ❌'}`);
      console.log(`   Cache: ${cacheStatus}`);
      console.log(`   Speed: ${result.duration}ms\n`);
    }
  });
  
  console.log('='.repeat(70));
}

main();
