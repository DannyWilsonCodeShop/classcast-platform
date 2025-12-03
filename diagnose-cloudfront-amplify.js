const https = require('https');
const { CloudFrontClient, ListDistributionsCommand, GetDistributionCommand } = require('@aws-sdk/client-cloudfront');
const { AmplifyClient, GetAppCommand, GetDomainAssociationCommand } = require('@aws-sdk/client-amplify');

const cloudfront = new CloudFrontClient({ region: 'us-east-1' });
const amplify = new AmplifyClient({ region: 'us-east-1' });

const APP_ID = 'd166bugwfgjggz';
const DOMAIN = 'class-cast.com';

async function diagnose() {
  console.log('🔍 Comprehensive CloudFront & Amplify Diagnosis\n');
  console.log('='.repeat(60));

  // Test 1: Check if site is accessible
  console.log('\n1️⃣  Testing Site Accessibility...');
  await testSiteAccess();

  // Test 2: Check Amplify domain configuration
  console.log('\n2️⃣  Checking Amplify Domain Configuration...');
  await checkAmplifyDomain();

  // Test 3: Check CloudFront distributions
  console.log('\n3️⃣  Checking CloudFront Distributions...');
  await checkCloudFrontDistributions();

  // Test 4: Test direct Amplify URL
  console.log('\n4️⃣  Testing Direct Amplify URL...');
  await testAmplifyDirect();

  // Test 5: Check DNS resolution
  console.log('\n5️⃣  Checking DNS Resolution...');
  await checkDNS();

  console.log('\n' + '='.repeat(60));
  console.log('📋 DIAGNOSIS COMPLETE');
  console.log('='.repeat(60));
}

async function testSiteAccess() {
  return new Promise((resolve) => {
    https.get(`https://${DOMAIN}`, (res) => {
      console.log('   Status Code:', res.statusCode);
      console.log('   Server:', res.headers.server);
      console.log('   X-Cache:', res.headers['x-cache']);
      console.log('   X-Amz-Cf-Id:', res.headers['x-amz-cf-id'] ? 'Present' : 'Missing');
      console.log('   X-Amz-Cf-Pop:', res.headers['x-amz-cf-pop'] || 'N/A');
      
      if (res.headers['x-cache']?.includes('Error')) {
        console.log('\n   ❌ CloudFront Error Detected');
        console.log('   This means CloudFront cannot fetch from origin');
      } else {
        console.log('\n   ✅ CloudFront working correctly');
      }
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (data.includes('<!DOCTYPE html>') || data.includes('<html')) {
          console.log('   ✅ HTML content received');
        } else {
          console.log('   ⚠️  Unexpected content type');
        }
        resolve();
      });
    }).on('error', (err) => {
      console.log('   ❌ Error:', err.message);
      resolve();
    });
  });
}

async function checkAmplifyDomain() {
  try {
    const appResponse = await amplify.send(new GetAppCommand({
      appId: APP_ID
    }));

    console.log('   App Name:', appResponse.app.name);
    console.log('   Default Domain:', appResponse.app.defaultDomain);
    console.log('   Platform:', appResponse.app.platform);
    
    // Check custom domain
    try {
      const domainResponse = await amplify.send(new GetDomainAssociationCommand({
        appId: APP_ID,
        domainName: DOMAIN
      }));

      console.log('\n   Custom Domain Status:', domainResponse.domainAssociation.domainStatus);
      console.log('   Certificate ARN:', domainResponse.domainAssociation.certificateVerificationDNSRecord ? 'Present' : 'Missing');
      
      if (domainResponse.domainAssociation.subDomains) {
        console.log('\n   Subdomains:');
        domainResponse.domainAssociation.subDomains.forEach(sub => {
          console.log(`     - ${sub.subDomainSetting.prefix || '@'}.${DOMAIN}`);
          console.log(`       DNS: ${sub.dnsRecord}`);
          console.log(`       Verified: ${sub.verified}`);
        });
      }

      if (domainResponse.domainAssociation.domainStatus !== 'AVAILABLE') {
        console.log('\n   ⚠️  Domain not fully configured');
      } else {
        console.log('\n   ✅ Domain properly configured');
      }
    } catch (error) {
      console.log('   ⚠️  Custom domain not found or error:', error.message);
    }
  } catch (error) {
    console.log('   ❌ Error checking Amplify:', error.message);
  }
}

async function checkCloudFrontDistributions() {
  try {
    const response = await cloudfront.send(new ListDistributionsCommand({}));
    
    if (!response.DistributionList || response.DistributionList.Quantity === 0) {
      console.log('   ⚠️  No CloudFront distributions found');
      console.log('   This is unusual - Amplify should create one automatically');
      return;
    }

    console.log(`   Found ${response.DistributionList.Quantity} distribution(s)\n`);

    for (const dist of response.DistributionList.Items) {
      console.log(`   Distribution: ${dist.Id}`);
      console.log(`   Domain: ${dist.DomainName}`);
      console.log(`   Status: ${dist.Status}`);
      console.log(`   Enabled: ${dist.Enabled}`);
      
      if (dist.Aliases && dist.Aliases.Quantity > 0) {
        console.log(`   Aliases: ${dist.Aliases.Items.join(', ')}`);
        
        if (dist.Aliases.Items.includes(DOMAIN)) {
          console.log('   ✅ This distribution serves your domain');
          
          // Get detailed config
          const detailResponse = await cloudfront.send(new GetDistributionCommand({
            Id: dist.Id
          }));
          
          const config = detailResponse.Distribution.DistributionConfig;
          console.log(`\n   Origin Domain: ${config.Origins.Items[0].DomainName}`);
          console.log(`   Origin Type: ${config.Origins.Items[0].CustomOriginConfig ? 'Custom' : 'S3'}`);
          
          // Check if origin is Amplify
          if (config.Origins.Items[0].DomainName.includes('amplifyapp.com')) {
            console.log('   ✅ Origin is Amplify');
          } else {
            console.log('   ⚠️  Origin is NOT Amplify');
            console.log('   This might be the problem!');
          }
        }
      }
      console.log('');
    }
  } catch (error) {
    console.log('   ❌ Error checking CloudFront:', error.message);
  }
}

async function testAmplifyDirect() {
  return new Promise((resolve) => {
    https.get(`https://${APP_ID}.amplifyapp.com`, (res) => {
      console.log('   Status Code:', res.statusCode);
      console.log('   Server:', res.headers.server);
      
      if (res.statusCode === 200) {
        console.log('   ✅ Amplify app is accessible directly');
      } else {
        console.log('   ⚠️  Amplify app returned non-200 status');
      }
      
      res.on('data', () => {});
      res.on('end', resolve);
    }).on('error', (err) => {
      console.log('   ❌ Cannot reach Amplify directly:', err.message);
      resolve();
    });
  });
}

async function checkDNS() {
  const { exec } = require('child_process');
  
  return new Promise((resolve) => {
    exec(`nslookup ${DOMAIN}`, (error, stdout, stderr) => {
      if (error) {
        console.log('   ❌ DNS lookup failed:', error.message);
        resolve();
        return;
      }
      
      console.log('   DNS Records:');
      const lines = stdout.split('\n');
      lines.forEach(line => {
        if (line.includes('Address:') || line.includes('Name:')) {
          console.log('   ', line.trim());
        }
      });
      
      if (stdout.includes('cloudfront.net')) {
        console.log('   ✅ DNS points to CloudFront');
      } else if (stdout.includes('amplifyapp.com')) {
        console.log('   ✅ DNS points to Amplify');
      } else {
        console.log('   ⚠️  DNS might not be configured correctly');
      }
      
      resolve();
    });
  });
}

diagnose();
