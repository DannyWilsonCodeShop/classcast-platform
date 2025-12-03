#!/usr/bin/env node

const { AmplifyClient, GetDomainAssociationCommand } = require('@aws-sdk/client-amplify');
const { execSync } = require('child_process');

const amplify = new AmplifyClient({ region: 'us-east-1' });
const APP_ID = 'd166bugwfgjggz';
const DOMAIN_NAME = 'class-cast.com';

async function checkDNS() {
  try {
    const result = execSync(`nslookup ${DOMAIN_NAME}`, { encoding: 'utf-8' });
    const hasNewCloudFront = result.includes('d3hb958vtn5ryr.cloudfront.net');
    const hasOldCloudFront = result.includes('dt7gqfihc5ffq.cloudfront.net');
    
    return { hasNewCloudFront, hasOldCloudFront, result };
  } catch (error) {
    return { hasNewCloudFront: false, hasOldCloudFront: false, result: error.message };
  }
}

async function checkAmplifyStatus() {
  try {
    const response = await amplify.send(new GetDomainAssociationCommand({
      appId: APP_ID,
      domainName: DOMAIN_NAME
    }));
    
    return {
      status: response.domainAssociation.domainStatus,
      subDomains: response.domainAssociation.subDomains
    };
  } catch (error) {
    return { status: 'ERROR', error: error.message };
  }
}

async function monitor() {
  console.log('🔄 Monitoring Domain Fix Progress\n');
  console.log('Press Ctrl+C to stop\n');
  console.log('='.repeat(70));
  
  let iteration = 0;
  
  const interval = setInterval(async () => {
    iteration++;
    const timestamp = new Date().toLocaleTimeString();
    
    console.log(`\n[${timestamp}] Check #${iteration}`);
    console.log('-'.repeat(70));
    
    // Check DNS
    const dns = await checkDNS();
    console.log('\n📡 DNS Status:');
    if (dns.hasNewCloudFront) {
      console.log('   ✅ Pointing to NEW CloudFront (d3hb958vtn5ryr)');
    } else if (dns.hasOldCloudFront) {
      console.log('   ❌ Still pointing to OLD CloudFront (dt7gqfihc5ffq)');
      console.log('   ⚠️  Please update DNS records in GoDaddy!');
    } else {
      console.log('   ⏳ DNS not resolved yet or propagating...');
    }
    
    // Check Amplify
    const amplify = await checkAmplifyStatus();
    console.log('\n🌐 Amplify Domain Status:');
    console.log(`   Status: ${amplify.status}`);
    
    if (amplify.subDomains) {
      const rootVerified = amplify.subDomains.find(s => !s.subDomainSetting.prefix)?.verified;
      const wwwVerified = amplify.subDomains.find(s => s.subDomainSetting.prefix === 'www')?.verified;
      
      console.log(`   Root (@): ${rootVerified ? '✅ Verified' : '❌ Not Verified'}`);
      console.log(`   WWW: ${wwwVerified ? '✅ Verified' : '❌ Not Verified'}`);
    }
    
    // Status interpretation
    console.log('\n💡 What This Means:');
    if (amplify.status === 'AVAILABLE' && dns.hasNewCloudFront) {
      console.log('   🎉 SUCCESS! Your domain is fully configured and working!');
      console.log('   🌐 Test it: https://class-cast.com');
      console.log('\n✅ Monitoring complete. Your site should be live!\n');
      clearInterval(interval);
    } else if (amplify.status === 'FAILED' && !dns.hasNewCloudFront) {
      console.log('   ⚠️  Waiting for DNS update in GoDaddy');
      console.log('   📋 See DNS_UPDATE_INSTRUCTIONS.md for details');
    } else if (amplify.status === 'PENDING_VERIFICATION') {
      console.log('   ⏳ DNS updated! Waiting for SSL certificate...');
      console.log('   ⏱️  This usually takes 20-30 minutes');
    } else if (amplify.status === 'AWAITING_APP_CNAME') {
      console.log('   ⏳ Waiting for DNS propagation...');
    } else {
      console.log(`   ⏳ In progress... (${amplify.status})`);
    }
    
    console.log('\n' + '='.repeat(70));
    
  }, 30000); // Check every 30 seconds
  
  // Initial check
  setTimeout(() => {}, 0);
}

console.log('🚀 Domain Fix Monitor\n');
console.log('This will check your domain status every 30 seconds.\n');
console.log('📋 Make sure you\'ve updated DNS records in GoDaddy first!');
console.log('   See: DNS_UPDATE_INSTRUCTIONS.md\n');

monitor().catch(console.error);
