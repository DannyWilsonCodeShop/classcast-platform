const { AmplifyClient, UpdateDomainAssociationCommand, GetDomainAssociationCommand } = require('@aws-sdk/client-amplify');

const amplify = new AmplifyClient({ region: 'us-east-1' });
const APP_ID = 'd166bugwfgjggz';
const DOMAIN = 'class-cast.com';

async function fixAmplifyCloudFront() {
  console.log('🔧 Fixing Amplify CloudFront Configuration...\n');
  console.log('='.repeat(60));

  try {
    // Get current domain configuration
    console.log('\n1️⃣  Getting current domain configuration...');
    const currentConfig = await amplify.send(new GetDomainAssociationCommand({
      appId: APP_ID,
      domainName: DOMAIN
    }));

    console.log('   Current Status:', currentConfig.domainAssociation.domainStatus);
    console.log('   Current Subdomains:', currentConfig.domainAssociation.subDomains.length);

    // The issue is that the CloudFront distribution was deleted
    // We need to remove and re-add the custom domain to force Amplify to recreate it
    
    console.log('\n2️⃣  Solution: Remove and re-add custom domain');
    console.log('   This will force Amplify to create a new CloudFront distribution');
    
    console.log('\n⚠️  MANUAL STEPS REQUIRED:');
    console.log('\n   Go to AWS Amplify Console:');
    console.log('   1. Open https://console.aws.amazon.com/amplify/home?region=us-east-1#/d166bugwfgjggz');
    console.log('   2. Click "Domain management" in left sidebar');
    console.log('   3. Find "class-cast.com"');
    console.log('   4. Click "Actions" → "Remove domain"');
    console.log('   5. Wait 2 minutes');
    console.log('   6. Click "Add domain"');
    console.log('   7. Enter "class-cast.com"');
    console.log('   8. Follow the setup wizard');
    console.log('   9. Update DNS records in GoDaddy with NEW CloudFront domain');
    
    console.log('\n💡 Alternative: Use Amplify default domain temporarily');
    console.log('   Your app is accessible at:');
    console.log('   https://d166bugwfgjggz.amplifyapp.com');
    console.log('\n   This URL should work immediately without DNS changes.');

    // Test if Amplify default domain works
    console.log('\n3️⃣  Testing Amplify default domain...');
    const https = require('https');
    
    await new Promise((resolve) => {
      https.get('https://d166bugwfgjggz.amplifyapp.com', (res) => {
        console.log('   Status:', res.statusCode);
        
        if (res.statusCode === 200) {
          console.log('   ✅ Amplify default domain works!');
          console.log('   You can use this URL while fixing the custom domain.');
        } else if (res.statusCode === 403) {
          console.log('   ❌ Amplify default domain also returns 403');
          console.log('   This suggests a deeper issue with the Amplify app itself.');
        }
        
        res.on('data', () => {});
        res.on('end', resolve);
      }).on('error', (err) => {
        console.log('   ❌ Error:', err.message);
        resolve();
      });
    });

    console.log('\n' + '='.repeat(60));
    console.log('📋 SUMMARY');
    console.log('='.repeat(60));
    console.log('\n❌ Root Cause: CloudFront distribution was deleted');
    console.log('   DNS still points to old CloudFront: dt7gqfihc5ffq.cloudfront.net');
    console.log('   This distribution no longer exists');
    
    console.log('\n✅ Quick Fix: Use Amplify default domain');
    console.log('   https://d166bugwfgjggz.amplifyapp.com');
    
    console.log('\n🔧 Permanent Fix: Re-add custom domain in Amplify Console');
    console.log('   This will create a new CloudFront distribution');
    console.log('   Then update DNS in GoDaddy to point to new CloudFront');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

fixAmplifyCloudFront();
