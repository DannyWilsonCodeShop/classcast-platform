const { AmplifyClient, GetAppCommand, GetDomainAssociationCommand, ListDomainAssociationsCommand } = require('@aws-sdk/client-amplify');

const amplify = new AmplifyClient({ region: 'us-east-1' });

const APP_ID = 'd166bugwfgjggz'; // From your amplify.yml

async function checkAmplifyDomain() {
  try {
    console.log('🔍 Checking Amplify app domain configuration...\n');
    
    // Get app details
    const appResponse = await amplify.send(new GetAppCommand({
      appId: APP_ID
    }));
    
    console.log('📱 Amplify App Details:');
    console.log('   Name:', appResponse.app.name);
    console.log('   Default Domain:', appResponse.app.defaultDomain);
    console.log('   App ARN:', appResponse.app.appArn);
    
    // List domain associations
    console.log('\n🌐 Checking custom domains...');
    const domainsResponse = await amplify.send(new ListDomainAssociationsCommand({
      appId: APP_ID
    }));
    
    if (domainsResponse.domainAssociations && domainsResponse.domainAssociations.length > 0) {
      console.log(`\nFound ${domainsResponse.domainAssociations.length} custom domain(s):\n`);
      
      domainsResponse.domainAssociations.forEach((domain, index) => {
        console.log(`${index + 1}. Domain: ${domain.domainName}`);
        console.log(`   Status: ${domain.domainStatus}`);
        console.log(`   Certificate ARN: ${domain.certificateVerificationDNSRecord || 'N/A'}`);
        
        if (domain.subDomains && domain.subDomains.length > 0) {
          console.log('   Subdomains:');
          domain.subDomains.forEach(sub => {
            console.log(`     - ${sub.subDomainSetting.prefix}.${domain.domainName} → ${sub.dnsRecord}`);
          });
        }
        console.log('');
      });
      
      console.log('💡 This is why you\'re getting the CNAME conflict!');
      console.log('   AWS Amplify has already created a CloudFront distribution for your domain.');
      console.log('\n📝 Options:');
      console.log('   1. Use Amplify\'s CloudFront distribution (recommended for Amplify apps)');
      console.log('   2. Remove the custom domain from Amplify first, then create your own CloudFront');
      console.log('   3. Use a subdomain like cdn.class-cast.com for your custom CloudFront');
      
    } else {
      console.log('No custom domains configured in Amplify.');
      console.log('\n🤔 The CNAME conflict might be from:');
      console.log('   - A recently deleted CloudFront distribution (wait 24 hours)');
      console.log('   - Another AWS service using the domain');
      console.log('   - A different AWS account');
    }

  } catch (error) {
    console.error('❌ Error checking Amplify domain:', error);
    
    if (error.name === 'NotFoundException') {
      console.log('\n⚠️  Amplify app not found. Check your APP_ID.');
    }
  }
}

checkAmplifyDomain();
