#!/usr/bin/env node

const dns = require('dns').promises;

async function checkDNS() {
  const domain = 'myclasscast.com';
  const sslDomain = '_amazonssl.myclasscast.com';
  
  console.log('🔍 Checking DNS configuration for myclasscast.com...\n');
  
  try {
    // Check main domain
    console.log('1. Checking main domain CNAME:');
    try {
      const mainRecords = await dns.resolveCname(domain);
      console.log(`   ✅ ${domain} → ${mainRecords.join(', ')}`);
      
      // Check if it points to Amplify
      if (mainRecords.some(record => record.includes('amplifyapp.com'))) {
        console.log('   ✅ Domain correctly points to Amplify');
      } else {
        console.log('   ❌ Domain does not point to Amplify');
      }
    } catch (error) {
      console.log(`   ❌ No CNAME record found for ${domain}`);
      console.log(`   Error: ${error.message}`);
    }
    
    console.log('\n2. Checking SSL validation domain:');
    try {
      const sslRecords = await dns.resolveCname(sslDomain);
      console.log(`   ✅ ${sslDomain} → ${sslRecords.join(', ')}`);
      
      // Check if it points to AWS ACM
      if (sslRecords.some(record => record.includes('acm-validations.aws'))) {
        console.log('   ✅ SSL validation domain correctly configured');
      } else {
        console.log('   ❌ SSL validation domain not pointing to AWS ACM');
      }
    } catch (error) {
      console.log(`   ❌ No CNAME record found for ${sslDomain}`);
      console.log(`   Error: ${error.message}`);
    }
    
    console.log('\n3. Checking A records (should not exist):');
    try {
      const aRecords = await dns.resolve4(domain);
      console.log(`   ⚠️  A records found: ${aRecords.join(', ')}`);
      console.log('   ⚠️  A records can interfere with CNAME records');
    } catch (error) {
      console.log('   ✅ No A records found (good for CNAME)');
    }
    
    console.log('\n4. Testing domain resolution:');
    try {
      const https = require('https');
      const options = {
        hostname: domain,
        port: 443,
        path: '/',
        method: 'HEAD',
        timeout: 5000
      };
      
      const req = https.request(options, (res) => {
        console.log(`   ✅ HTTPS response: ${res.statusCode}`);
        if (res.statusCode === 200) {
          console.log('   ✅ Domain is accessible via HTTPS');
        }
      });
      
      req.on('error', (error) => {
        console.log(`   ❌ HTTPS error: ${error.message}`);
      });
      
      req.on('timeout', () => {
        console.log('   ⏰ HTTPS request timed out');
        req.destroy();
      });
      
      req.end();
      
    } catch (error) {
      console.log(`   ❌ HTTPS test failed: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ DNS check failed:', error.message);
  }
  
  console.log('\n📋 Next Steps:');
  console.log('1. If CNAME records are missing, add them in GoDaddy DNS');
  console.log('2. If A records exist, remove them (they conflict with CNAME)');
  console.log('3. Wait 24-48 hours for DNS propagation');
  console.log('4. Retry SSL configuration in AWS Amplify');
  console.log('5. Check AWS Certificate Manager for certificate status');
}

checkDNS().catch(console.error);
