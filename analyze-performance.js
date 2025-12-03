const https = require('https');
const { performance } = require('perf_hooks');

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://class-cast.com';

async function analyzePerformance() {
  console.log('🔍 Analyzing Website Performance...\n');
  console.log('Target:', APP_URL);
  console.log('='.repeat(60));

  const metrics = {
    dns: 0,
    tcp: 0,
    tls: 0,
    ttfb: 0, // Time to First Byte
    download: 0,
    total: 0
  };

  try {
    const start = performance.now();
    
    await new Promise((resolve, reject) => {
      const req = https.get(APP_URL, (res) => {
        const ttfb = performance.now() - start;
        metrics.ttfb = ttfb;
        
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          metrics.total = performance.now() - start;
          metrics.download = metrics.total - ttfb;
          
          console.log('\n📊 Performance Metrics:');
          console.log('   Time to First Byte (TTFB):', Math.round(metrics.ttfb), 'ms');
          console.log('   Download Time:', Math.round(metrics.download), 'ms');
          console.log('   Total Time:', Math.round(metrics.total), 'ms');
          
          console.log('\n📋 Response Headers:');
          Object.entries(res.headers).forEach(([key, value]) => {
            if (key.includes('cache') || key.includes('cdn') || key.includes('cloudfront') || key.includes('server')) {
              console.log(`   ${key}: ${value}`);
            }
          });
          
          console.log('\n🔍 Analysis:');
          
          // Check if using CloudFront
          if (res.headers['x-amz-cf-id'] || res.headers['via']?.includes('CloudFront')) {
            console.log('   ✅ CloudFront is active');
          } else {
            console.log('   ❌ CloudFront NOT detected');
            console.log('   💡 This is why your site is slow!');
          }
          
          // Check caching
          const cacheControl = res.headers['cache-control'];
          if (cacheControl) {
            console.log('   Cache-Control:', cacheControl);
            if (cacheControl.includes('no-cache') || cacheControl.includes('no-store')) {
              console.log('   ⚠️  Caching is disabled');
            } else {
              console.log('   ✅ Caching is enabled');
            }
          } else {
            console.log('   ⚠️  No cache headers found');
          }
          
          // Performance assessment
          console.log('\n⚡ Performance Assessment:');
          if (metrics.ttfb < 200) {
            console.log('   ✅ Excellent TTFB (< 200ms)');
          } else if (metrics.ttfb < 500) {
            console.log('   ⚠️  Good TTFB (200-500ms)');
          } else if (metrics.ttfb < 1000) {
            console.log('   ⚠️  Slow TTFB (500-1000ms)');
          } else {
            console.log('   ❌ Very Slow TTFB (> 1000ms)');
          }
          
          if (metrics.total < 1000) {
            console.log('   ✅ Fast page load (< 1s)');
          } else if (metrics.total < 3000) {
            console.log('   ⚠️  Moderate page load (1-3s)');
          } else {
            console.log('   ❌ Slow page load (> 3s)');
          }
          
          console.log('\n💡 Recommendations:');
          if (metrics.ttfb > 500) {
            console.log('   1. Enable CloudFront CDN');
            console.log('   2. Optimize API response times');
            console.log('   3. Add database query caching');
          }
          if (!res.headers['x-amz-cf-id']) {
            console.log('   4. Redeploy Amplify app to recreate CloudFront');
          }
          if (metrics.total > 2000) {
            console.log('   5. Implement code splitting');
            console.log('   6. Optimize images and assets');
            console.log('   7. Enable compression');
          }
          
          resolve();
        });
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => {
        reject(new Error('Request timeout'));
      });
    });
    
  } catch (error) {
    console.error('\n❌ Error analyzing performance:', error.message);
  }
}

analyzePerformance();
