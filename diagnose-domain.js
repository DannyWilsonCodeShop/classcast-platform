#!/usr/bin/env node

const { AmplifyClient, GetDomainAssociationCommand, GetAppCommand } = require('@aws-sdk/client-amplify');
const { CloudFrontClient, ListDistributionsCommand, GetDistributionCommand } = require('@aws-sdk/client-cloudfront');

const amplify = new AmplifyClient({ region: 'us-east-1' });
const cloudfront = new CloudFrontClient({ region: 'us-east-1' });

const APP_ID = 'd166bugwfgjggz';
const DOMAIN_NAME = 'class-cast.com';

async function diagnose() {
  console.log('🔍 Diagnosing Domain Configuration\n');
  console.log('='.repeat(60));
  
  // Check Amplify app
  console.log('\n📱 AMPLIFY APP STATUS:');
  try {
    const app = await amplify.send(new GetAppCommand({ appId: APP_ID }));
    console.log(`✅ App Name: ${app.app.name}`);
    console.log(`✅ Default Domain: ${app.app.defaultDomain}`);
    console.log(`✅ App Status: ${app.app.status}`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  // Check custom domain
  console.log('\n🌐 CUSTOM DOMAIN STATUS:');
  try {
    const domain = await amplify.send(new GetDomainAssociationCommand({
      appId: APP_ID,
      domainName: DOMAIN_NAME
    }));
    
    console.log(`✅ Domain: ${domain.domainAssociation.domainName}`);
    console.log(`✅ Status: ${domain.domainAssociation.domainStatus}`);
    
    if (domain.domainAssociation.subDomains) {
      console.log('\n   Subdomains:');
      domain.domainAssociation.subDomains.forEach(sub => {
        const prefix = sub.subDomainSetting.prefix || 'root';
        console.log(`   - ${prefix}: ${sub.dnsRecord}`);
        console.log(`     Verified: ${sub.verified ? '✅' : '❌'}`);
      });
    }
  } catch (error) {
    if (error.name === 'NotFoundException') {
      console.log('❌ No custom domain configured');
    } else {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  // Check CloudFront distributions
  console.log('\n☁️  CLOUDFRONT DISTRIBUTIONS:');
  try {
    const distributions = await cloudfront.send(new ListDistributionsCommand({}));
    
    if (distributions.DistributionList?.Items) {
      const amplifyDists = distributions.DistributionList.Items.filter(d => 
        d.Comment?.includes('Amplify') || 
        d.Origins?.Items?.some(o => o.DomainName?.includes('amplifyapp'))
      );
      
      console.log(`Found ${amplifyDists.length} Amplify-related distributions:\n`);
      
      amplifyDists.forEach(dist => {
        console.log(`   Distribution: ${dist.DomainName}`);
        console.log(`   Status: ${dist.Status}`);
        console.log(`   Enabled: ${dist.Enabled ? '✅' : '❌'}`);
        if (dist.Aliases?.Items?.length > 0) {
          console.log(`   Aliases: ${dist.Aliases.Items.join(', ')}`);
        }
        console.log();
      });
    } else {
      console.log('No CloudFront distributions found');
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('='.repeat(60));
  console.log('\n💡 RECOMMENDATIONS:\n');
  console.log('If custom domain shows "NotFoundException":');
  console.log('  → Run: node fix-custom-domain.js\n');
  console.log('If domain status is "FAILED" or "PENDING":');
  console.log('  → Check DNS records in GoDaddy');
  console.log('  → Wait 30-60 minutes for propagation\n');
  console.log('Working URL (always available):');
  console.log('  → https://main.d166bugwfgjggz.amplifyapp.com\n');
}

diagnose().catch(console.error);
