#!/usr/bin/env node

const { AmplifyClient, UpdateDomainAssociationCommand, GetDomainAssociationCommand } = require('@aws-sdk/client-amplify');

const amplify = new AmplifyClient({ region: 'us-east-1' });
const APP_ID = 'd166bugwfgjggz';
const DOMAIN_NAME = 'class-cast.com';

async function retryVerification() {
  console.log('🔄 Retrying Domain Verification\n');
  console.log('='.repeat(70));
  
  try {
    // Get current domain config
    console.log('\n📋 Current status...');
    const current = await amplify.send(new GetDomainAssociationCommand({
      appId: APP_ID,
      domainName: DOMAIN_NAME
    }));
    
    console.log(`   Status: ${current.domainAssociation.domainStatus}`);
    console.log();
    
    // Trigger update to re-verify
    console.log('🔄 Triggering re-verification...\n');
    
    const response = await amplify.send(new UpdateDomainAssociationCommand({
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
    }));
    
    console.log('✅ Re-verification triggered!');
    console.log(`   New status: ${response.domainAssociation.domainStatus}\n`);
    
    console.log('='.repeat(70));
    console.log('\n⏳ Monitoring status (checking every 10 seconds)...\n');
    
    // Monitor for 2 minutes
    for (let i = 0; i < 12; i++) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      const check = await amplify.send(new GetDomainAssociationCommand({
        appId: APP_ID,
        domainName: DOMAIN_NAME
      }));
      
      const status = check.domainAssociation.domainStatus;
      const rootVerified = check.domainAssociation.subDomains?.find(s => !s.subDomainSetting.prefix)?.verified;
      const wwwVerified = check.domainAssociation.subDomains?.find(s => s.subDomainSetting.prefix === 'www')?.verified;
      
      console.log(`[${new Date().toLocaleTimeString()}] Status: ${status}`);
      console.log(`   Root: ${rootVerified ? '✅' : '❌'}  WWW: ${wwwVerified ? '✅' : '❌'}`);
      
      if (status === 'AVAILABLE' && rootVerified && wwwVerified) {
        console.log('\n🎉 SUCCESS! Domain is fully verified and available!\n');
        console.log('='.repeat(70));
        console.log('\n✅ Your site should now work at: https://class-cast.com\n');
        return;
      }
      
      if (status === 'FAILED') {
        console.log('\n⚠️  Status is still FAILED. This might need manual intervention.\n');
        break;
      }
    }
    
    console.log('\n⏰ Monitoring timeout. Check status later with: node diagnose-domain.js\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\nTry checking the Amplify console manually:\n');
    console.log('https://console.aws.amazon.com/amplify/home?region=us-east-1#/d166bugwfgjggz/settings/customdomains\n');
  }
}

retryVerification();
