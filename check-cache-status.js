#!/usr/bin/env node

const https = require('https');

const PAGES = [
  'https://class-cast.com',
  'https://class-cast.com/login',
  'https://class-cast.com/signup',
  'https://class-cast.com/student/dashboard',
  'https://class-cast.com/instructor/dashboard',
];

async function checkPage(url) {
  return new Promise((resolve) => {
    https.get(url, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          url,
          status: res.statusCode,
          headers: {
            xCache: res.headers['x-cache'],
            xNextjsCache: res.headers['x-nextjs-cache'],
            cacheControl: res.headers['cache-control'],
            age: res.headers['age'],
            cfId: res.headers['x-amz-cf-id'],
            cfPop: res.headers['x-amz-cf-pop']
          }
        });
      });
    }).on('error', (err) => {
      resolve({ url, error: err.message });
    });
  });
}

async function main() {
  console.log('🔍 Checking Cache Status After Browsing\n');
  console.log('='.repeat(70));
  
  for (const url of PAGES) {
    console.log(`\n📄 ${url.replace('https://class-cast.com', '')  || '/'}`);
    
    const result = await checkPage(url);
    
    if (result.error) {
      console.log(`   ❌ Error: ${result.error}`);
    } else {
      const xCache = result.headers.xCache || 'N/A';
      const nextCache = result.headers.xNextjsCache || 'N/A';
      const age = result.headers.age || 'N/A';
      
      const isCFCached = xCache.includes('Hit');
      const isCFMiss = xCache.includes('Miss');
      const isCFError = xCache.includes('Error');
      
      console.log(`   Status: ${result.status}`);
      console.log(`   CloudFront Cache: ${xCache} ${isCFCached ? '✅' : isCFMiss ? '⚠️' : isCFError ? '❌' : ''}`);
      console.log(`   Next.js Cache: ${nextCache}`);
      console.log(`   Cache-Control: ${result.headers.cacheControl || 'N/A'}`);
      console.log(`   Age: ${age}s`);
      if (result.headers.cfPop) {
        console.log(`   Edge Location: ${result.headers.cfPop}`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 Cache Analysis:\n');
  
  // Check all pages again to see cache behavior
  const results = await Promise.all(PAGES.map(checkPage));
  
  const cached = results.filter(r => r.headers?.xCache?.includes('Hit')).length;
  const missed = results.filter(r => r.headers?.xCache?.includes('Miss')).length;
  const errors = results.filter(r => r.headers?.xCache?.includes('Error')).length;
  
  console.log(`   CloudFront Cache Hits: ${cached}/${results.length} ${cached > 0 ? '✅' : '❌'}`);
  console.log(`   CloudFront Cache Misses: ${missed}/${results.length}`);
  console.log(`   CloudFront Errors: ${errors}/${results.length} ${errors > 0 ? '⚠️' : '✅'}`);
  
  if (errors > 0) {
    console.log('\n⚠️  CloudFront is returning cache errors.');
    console.log('   This usually means:');
    console.log('   - Origin (Amplify) returned an error');
    console.log('   - Content is not cacheable');
    console.log('   - Cache policy needs adjustment\n');
  }
  
  if (cached === 0 && missed === 0) {
    console.log('\n⚠️  No cache headers detected.');
    console.log('   CloudFront might not be caching this content.\n');
  }
  
  console.log('='.repeat(70));
}

main();
