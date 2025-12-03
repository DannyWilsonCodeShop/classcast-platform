#!/usr/bin/env node

const https = require('https');

async function checkURL(url, method = 'GET', headers = {}) {
  return new Promise((resolve) => {
    const options = {
      method,
      headers: {
        'User-Agent': 'Mozilla/5.0',
        ...headers
      }
    };
    
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          url,
          status: res.statusCode,
          xCache: res.headers['x-cache'],
          cacheControl: res.headers['cache-control'],
          contentType: res.headers['content-type'],
          age: res.headers['age']
        });
      });
    }).on('error', (err) => {
      resolve({ url, error: err.message });
    });
  });
}

async function main() {
  console.log('🔍 Checking Cache Behavior\n');
  console.log('='.repeat(70));
  
  const tests = [
    { url: 'https://class-cast.com', name: 'Home Page' },
    { url: 'https://class-cast.com/_next/static/css/app/layout.css', name: 'CSS Asset' },
    { url: 'https://class-cast.com/api/health', name: 'API Health' },
  ];
  
  for (const test of tests) {
    console.log(`\n📄 ${test.name}`);
    console.log(`   URL: ${test.url}`);
    
    // Test 3 times
    for (let i = 1; i <= 3; i++) {
      const result = await checkURL(test.url);
      
      if (result.error) {
        console.log(`   Attempt ${i}: ❌ ${result.error}`);
      } else {
        const cached = result.xCache?.includes('Hit') ? '✅ HIT' : 
                      result.xCache?.includes('Miss') ? '⚠️ MISS' :
                      result.xCache?.includes('Error') ? '❌ ERROR' : '❓';
        
        console.log(`   Attempt ${i}: ${result.status} | Cache: ${cached} | Age: ${result.age || 'N/A'}s`);
      }
      
      if (i < 3) await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('\n💡 Cache Behavior Summary:\n');
  
  // Test static assets
  console.log('Testing static asset caching...\n');
  
  const staticTests = [
    'https://class-cast.com',
    'https://class-cast.com',
    'https://class-cast.com'
  ];
  
  const results = [];
  for (const url of staticTests) {
    const result = await checkURL(url);
    results.push(result);
    await new Promise(r => setTimeout(r, 500));
  }
  
  const hits = results.filter(r => r.xCache?.includes('Hit')).length;
  const misses = results.filter(r => r.xCache?.includes('Miss')).length;
  
  console.log(`   Cache Hits: ${hits}/3`);
  console.log(`   Cache Misses: ${misses}/3`);
  
  if (hits > 0) {
    console.log('\n   ✅ CloudFront IS caching content!');
  } else if (misses === 3) {
    console.log('\n   ⚠️  CloudFront is NOT caching (all misses)');
    console.log('   This is normal for:');
    console.log('   - Dynamic pages (SSR)');
    console.log('   - Pages with cookies/auth');
    console.log('   - API routes');
  }
  
  console.log('\n' + '='.repeat(70));
}

main();
