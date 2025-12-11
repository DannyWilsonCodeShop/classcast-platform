const puppeteer = require('puppeteer');
const fs = require('fs');

async function measurePerformance() {
  console.log('🚀 Measuring Frontend Performance\n');
  console.log('='.repeat(60));
  
  let browser;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Enable performance monitoring
    await page.setCacheEnabled(false); // Disable cache for accurate measurement
    
    console.log('📊 Testing page load performance...\n');
    
    // Test URLs
    const testUrls = [
      { name: 'Homepage', url: 'https://main.d166bugwfgjggz.amplifyapp.com/' },
      // Add more URLs when authentication is available
    ];
    
    const results = [];
    
    for (const { name, url } of testUrls) {
      console.log(`🔍 Testing: ${name}`);
      console.log(`   URL: ${url}`);
      
      try {
        // Start performance measurement
        const startTime = Date.now();
        
        // Navigate to page
        const response = await page.goto(url, {
          waitUntil: 'networkidle2',
          timeout: 30000
        });
        
        const loadTime = Date.now() - startTime;
        
        // Get performance metrics
        const metrics = await page.evaluate(() => {
          const navigation = performance.getEntriesByType('navigation')[0];
          const paint = performance.getEntriesByType('paint');
          
          return {
            // Core Web Vitals
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
            
            // Paint metrics
            firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
            firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
            
            // Network metrics
            dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcpConnect: navigation.connectEnd - navigation.connectStart,
            serverResponse: navigation.responseEnd - navigation.requestStart,
            
            // Resource counts
            totalResources: performance.getEntriesByType('resource').length,
          };
        });
        
        // Get resource breakdown
        const resources = await page.evaluate(() => {
          const resources = performance.getEntriesByType('resource');
          const breakdown = {
            scripts: 0,
            stylesheets: 0,
            images: 0,
            fonts: 0,
            other: 0,
            totalSize: 0
          };
          
          resources.forEach(resource => {
            const size = resource.transferSize || 0;
            breakdown.totalSize += size;
            
            if (resource.name.includes('.js')) {
              breakdown.scripts++;
            } else if (resource.name.includes('.css')) {
              breakdown.stylesheets++;
            } else if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/)) {
              breakdown.images++;
            } else if (resource.name.match(/\.(woff|woff2|ttf|otf)$/)) {
              breakdown.fonts++;
            } else {
              breakdown.other++;
            }
          });
          
          return breakdown;
        });
        
        const result = {
          name,
          url,
          status: response?.status() || 'unknown',
          loadTime,
          metrics,
          resources,
          timestamp: new Date().toISOString()
        };
        
        results.push(result);
        
        // Display results
        console.log(`   Status: ${result.status}`);
        console.log(`   Load Time: ${loadTime}ms`);
        console.log(`   First Paint: ${metrics.firstPaint.toFixed(0)}ms`);
        console.log(`   First Contentful Paint: ${metrics.firstContentfulPaint.toFixed(0)}ms`);
        console.log(`   DOM Content Loaded: ${metrics.domContentLoaded.toFixed(0)}ms`);
        console.log(`   Total Resources: ${metrics.totalResources}`);
        console.log(`   Total Size: ${(resources.totalSize / 1024 / 1024).toFixed(2)} MB`);
        console.log('');
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        console.log('');
      }
    }
    
    // Performance analysis
    console.log('='.repeat(60));
    console.log('📈 PERFORMANCE ANALYSIS');
    console.log('='.repeat(60));
    
    if (results.length > 0) {
      const mainResult = results[0];
      
      console.log('\n🎯 Core Web Vitals Assessment:');
      
      // First Contentful Paint (FCP)
      const fcp = mainResult.metrics.firstContentfulPaint;
      console.log(`\n   First Contentful Paint: ${fcp.toFixed(0)}ms`);
      if (fcp < 1800) {
        console.log('   ✅ Good (< 1.8s)');
      } else if (fcp < 3000) {
        console.log('   ⚠️  Needs Improvement (1.8s - 3s)');
      } else {
        console.log('   ❌ Poor (> 3s)');
      }
      
      // Total Load Time
      const loadTime = mainResult.loadTime;
      console.log(`\n   Total Load Time: ${loadTime}ms`);
      if (loadTime < 2000) {
        console.log('   ✅ Excellent (< 2s)');
      } else if (loadTime < 4000) {
        console.log('   ⚠️  Good (2s - 4s)');
      } else if (loadTime < 6000) {
        console.log('   ⚠️  Needs Improvement (4s - 6s)');
      } else {
        console.log('   ❌ Poor (> 6s)');
      }
      
      // Resource Analysis
      console.log('\n📦 Resource Breakdown:');
      console.log(`   Scripts: ${mainResult.resources.scripts}`);
      console.log(`   Stylesheets: ${mainResult.resources.stylesheets}`);
      console.log(`   Images: ${mainResult.resources.images}`);
      console.log(`   Fonts: ${mainResult.resources.fonts}`);
      console.log(`   Other: ${mainResult.resources.other}`);
      console.log(`   Total Size: ${(mainResult.resources.totalSize / 1024 / 1024).toFixed(2)} MB`);
      
      // Recommendations
      console.log('\n💡 Optimization Recommendations:');
      
      if (fcp > 2000) {
        console.log('   🎯 Reduce First Contentful Paint:');
        console.log('      - Implement React Query caching');
        console.log('      - Add React.memo to components');
        console.log('      - Optimize critical CSS');
        console.log('      - Preload key resources');
      }
      
      if (mainResult.resources.totalSize > 5 * 1024 * 1024) { // 5MB
        console.log('   📦 Reduce Bundle Size:');
        console.log('      - Enable code splitting');
        console.log('      - Optimize images (WebP/AVIF)');
        console.log('      - Remove unused dependencies');
        console.log('      - Use dynamic imports');
      }
      
      if (mainResult.resources.scripts > 20) {
        console.log('   ⚡ Reduce JavaScript:');
        console.log('      - Bundle vendor libraries');
        console.log('      - Use tree shaking');
        console.log('      - Lazy load non-critical components');
      }
      
      if (loadTime > 4000) {
        console.log('   🚀 Improve Load Time:');
        console.log('      - Enable server-side caching');
        console.log('      - Implement service worker');
        console.log('      - Optimize database queries');
        console.log('      - Use CDN for static assets');
      }
      
    } else {
      console.log('\n⚠️  No successful measurements. Possible issues:');
      console.log('   - Site is not accessible');
      console.log('   - Authentication required');
      console.log('   - Network connectivity issues');
      console.log('   - Server errors');
    }
    
    // Save results
    const reportPath = 'performance-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Performance measurement complete!');
    
  } catch (error) {
    console.error('❌ Error measuring performance:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Check if puppeteer is available
try {
  require.resolve('puppeteer');
  measurePerformance().catch(console.error);
} catch (error) {
  console.log('📊 Performance Measurement Tool');
  console.log('='.repeat(60));
  console.log('\n⚠️  Puppeteer not installed. To measure performance:');
  console.log('\n1. Install Puppeteer:');
  console.log('   npm install --save-dev puppeteer');
  console.log('\n2. Run measurement:');
  console.log('   node measure-performance.js');
  console.log('\n💡 Alternative: Use browser DevTools');
  console.log('   1. Open https://class-cast.com');
  console.log('   2. Press F12 → Lighthouse tab');
  console.log('   3. Run performance audit');
  console.log('   4. Check Core Web Vitals');
  console.log('\n🎯 Expected improvements after optimizations:');
  console.log('   - Load time: 50-70% faster');
  console.log('   - First Contentful Paint: < 1.5s');
  console.log('   - Bundle size: 30-50% smaller');
  console.log('   - Network requests: 70% fewer');
  console.log('\n' + '='.repeat(60));
}