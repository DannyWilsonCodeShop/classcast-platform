#!/usr/bin/env node

/**
 * Fix Custom Domain Configuration for AWS Amplify
 * 
 * This script will:
 * 1. Check current domain configuration
 * 2. Remove the broken custom domain
 * 3. Re-add it with proper CloudFront distribution
 * 4. Provide DNS configuration instructions
 */

const { 
  AmplifyClient, 
  GetDomainAssociationCommand,
  DeleteDomainAssociationCommand,
  CreateDomainAssociationCommand,
  ListAppsCommand,
  GetAppCommand
} = require('@aws-sdk/client-amplify');

const amplify = new AmplifyClient({ region: 'us-east-1' });

const APP_ID = 'd166bugwfgjggz';
const DOMAIN_NAME = 'class-cast.com';

async function getAppDetails() {
  console.log('📱 Fetching Amplify app details...\n');
  
  try {
    const command = new GetAppCommand({ appId: APP_ID });
    const response = await amplify.send(command);
    
    console.log('✅ App found:');
    console.log(`   Name: ${response.app.name}`);
    console.log(`   Default Domain: ${response.app.defaultDomain}`);
    console.log(`   Status: ${response.app.status}`);
    console.log();
    
    return response.app;
  } catch (error) {
    console.error('❌ Error fetching app:', error.message);
    throw error;
  }
}

async function checkCurrentDomain() {
  console.log('🔍 Checking current domain configuration...\n');
  
  try {
    const command = new GetDomainAssociationCommand({
      appId: APP_ID,
      domainName: DOMAIN_NAME
    });
    
    const response = await amplify.send(command);
    
    console.log('📋 Current domain configuration:');
    console.log(`   Domain: ${response.domainAssociation.domainName}`);
    console.log(`   Status: ${response.domainAssociation.domainStatus}`);
    console.log(`   Certificate ARN: ${response.domainAssociation.certificateVerificationDNSRecord || 'N/A'}`);
    console.log();
    
    if (response.domainAssociation.subDomains) {
      console.log('   Subdomains:');
      response.domainAssociation.subDomains.forEach(sub => {
        console.log(`     - ${sub.subDomainSetting.prefix || '@'}.${DOMAIN_NAME}`);
        console.log(`       DNS Target: ${sub.dnsRecord || 'N/A'}`);
        console.log(`       Status: ${sub.verified ? '✅ Verified' : '⚠️  Not Verified'}`);
      });
      console.log();
    }
    
    return response.domainAssociation;
  } catch (error) {
    if (error.name === 'NotFoundException') {
      console.log('ℹ️  No custom domain currently configured\n');
      return null;
    }
    console.error('❌ Error checking domain:', error.message);
    throw error;
  }
}

async function removeDomain() {
  console.log('🗑️  Removing existing domain configuration...\n');
  
  try {
    const command = new DeleteDomainAssociationCommand({
      appId: APP_ID,
      domainName: DOMAIN_NAME
    });
    
    await amplify.send(command);
    console.log('✅ Domain removed successfully\n');
    
    // Wait for deletion to complete
    console.log('⏳ Waiting 10 seconds for deletion to complete...\n');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    return true;
  } catch (error) {
    if (error.name === 'NotFoundException') {
      console.log('ℹ️  Domain already removed\n');
      return true;
    }
    console.error('❌ Error removing domain:', error.message);
    return false;
  }
}

async function addDomain() {
  console.log('➕ Adding custom domain with new CloudFront distribution...\n');
  
  try {
    const command = new CreateDomainAssociationCommand({
      appId: APP_ID,
      domainName: DOMAIN_NAME,
      enableAutoSubDomain: false,
      subDomainSettings: [
        {
          prefix: '',
          branchName: 'main'
        },
        {
          prefix: 'www',
          branchName: 'main'
        }
      ]
    });
    
    const response = await amplify.send(command);
    
    console.log('✅ Domain added successfully!\n');
    console.log('📋 New domain configuration:');
    console.log(`   Domain: ${response.domainAssociation.domainName}`);
    console.log(`   Status: ${response.domainAssociation.domainStatus}`);
    console.log();
    
    if (response.domainAssociation.subDomains) {
      console.log('🌐 DNS Configuration Required:\n');
      console.log('   Go to your DNS provider (GoDaddy) and update these records:\n');
      
      response.domainAssociation.subDomains.forEach(sub => {
        const prefix = sub.subDomainSetting.prefix || '@';
        const target = sub.dnsRecord;
        
        console.log(`   Record ${prefix === '@' ? '1' : '2'}:`);
        console.log(`     Type: CNAME`);
        console.log(`     Name: ${prefix}`);
        console.log(`     Value: ${target}`);
        console.log(`     TTL: 600 (or default)`);
        console.log();
      });
    }
    
    // Check for certificate verification
    if (response.domainAssociation.certificateVerificationDNSRecord) {
      console.log('📜 SSL Certificate Verification:\n');
      console.log('   AWS will automatically provision an SSL certificate.');
      console.log('   This may take 20-30 minutes to complete.\n');
    }
    
    return response.domainAssociation;
  } catch (error) {
    console.error('❌ Error adding domain:', error.message);
    throw error;
  }
}

async function monitorDomainStatus() {
  console.log('⏳ Monitoring domain status (this may take a few minutes)...\n');
  
  let attempts = 0;
  const maxAttempts = 12; // 2 minutes total
  
  while (attempts < maxAttempts) {
    try {
      const command = new GetDomainAssociationCommand({
        appId: APP_ID,
        domainName: DOMAIN_NAME
      });
      
      const response = await amplify.send(command);
      const status = response.domainAssociation.domainStatus;
      
      console.log(`   Status: ${status}`);
      
      if (status === 'AVAILABLE') {
        console.log('\n✅ Domain is now available!\n');
        return true;
      }
      
      if (status === 'FAILED') {
        console.log('\n❌ Domain configuration failed\n');
        return false;
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
    } catch (error) {
      console.error('Error checking status:', error.message);
      break;
    }
  }
  
  console.log('\n⏰ Status check timed out. Domain configuration is still in progress.');
  console.log('   Check AWS Amplify Console for updates.\n');
  return false;
}

async function main() {
  console.log('🚀 AWS Amplify Custom Domain Fix\n');
  console.log('='.repeat(50));
  console.log();
  
  try {
    // Step 1: Get app details
    await getAppDetails();
    
    // Step 2: Check current domain
    const currentDomain = await checkCurrentDomain();
    
    // Step 3: Remove domain if it exists
    if (currentDomain) {
      const removed = await removeDomain();
      if (!removed) {
        console.log('⚠️  Could not remove domain. Please remove manually in AWS Console.\n');
        return;
      }
    }
    
    // Step 4: Add domain with new configuration
    const newDomain = await addDomain();
    
    // Step 5: Monitor status
    await monitorDomainStatus();
    
    console.log('='.repeat(50));
    console.log('\n📝 Next Steps:\n');
    console.log('1. Update DNS records in GoDaddy (see configuration above)');
    console.log('2. Wait 20-60 minutes for DNS propagation');
    console.log('3. Wait for SSL certificate provisioning (automatic)');
    console.log('4. Test your domain: https://class-cast.com\n');
    console.log('💡 In the meantime, your app works at:');
    console.log('   https://main.d166bugwfgjggz.amplifyapp.com\n');
    
  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    console.log('\n📖 Manual Fix Instructions:\n');
    console.log('1. Go to AWS Amplify Console');
    console.log('2. Select your app');
    console.log('3. Go to "Domain management"');
    console.log('4. Remove class-cast.com');
    console.log('5. Add class-cast.com again');
    console.log('6. Follow the DNS configuration instructions\n');
    process.exit(1);
  }
}

main();
