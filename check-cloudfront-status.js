const { CloudFrontClient, GetDistributionCommand, ListDistributionsCommand } = require('@aws-sdk/client-cloudfront');

const cloudfront = new CloudFrontClient({ region: 'us-east-1' });

async function checkCloudFrontStatus(distributionId) {
  try {
    if (!distributionId) {
      // List all distributions
      console.log('📋 Listing all CloudFront distributions...\n');
      
      const listResponse = await cloudfront.send(new ListDistributionsCommand({}));
      
      if (!listResponse.DistributionList || listResponse.DistributionList.Quantity === 0) {
        console.log('No CloudFront distributions found.');
        return;
      }

      console.log(`Found ${listResponse.DistributionList.Quantity} distribution(s):\n`);
      
      listResponse.DistributionList.Items.forEach((dist, index) => {
        console.log(`${index + 1}. Distribution ID: ${dist.Id}`);
        console.log(`   Domain: ${dist.DomainName}`);
        console.log(`   Status: ${dist.Status}`);
        console.log(`   Enabled: ${dist.Enabled}`);
        if (dist.Aliases && dist.Aliases.Quantity > 0) {
          console.log(`   Custom Domains: ${dist.Aliases.Items.join(', ')}`);
        }
        console.log(`   Comment: ${dist.Comment || 'N/A'}`);
        console.log('');
      });
      
      return;
    }

    // Get specific distribution
    console.log(`🔍 Checking CloudFront distribution: ${distributionId}\n`);
    
    const response = await cloudfront.send(new GetDistributionCommand({
      Id: distributionId
    }));

    const dist = response.Distribution;
    const config = dist.DistributionConfig;

    console.log('📋 Distribution Details:');
    console.log('   ID:', dist.Id);
    console.log('   Domain:', dist.DomainName);
    console.log('   Status:', dist.Status);
    console.log('   Enabled:', config.Enabled);
    console.log('   ARN:', dist.ARN);
    console.log('   Last Modified:', dist.LastModifiedTime);
    
    if (config.Aliases && config.Aliases.Quantity > 0) {
      console.log('\n🌐 Custom Domains:');
      config.Aliases.Items.forEach(alias => {
        console.log(`   - ${alias}`);
      });
    }

    console.log('\n📦 Origins:');
    config.Origins.Items.forEach(origin => {
      console.log(`   - ${origin.Id}`);
      console.log(`     Domain: ${origin.DomainName}`);
    });

    console.log('\n🔒 SSL Certificate:');
    if (config.ViewerCertificate.CloudFrontDefaultCertificate) {
      console.log('   Using CloudFront default certificate');
    } else if (config.ViewerCertificate.ACMCertificateArn) {
      console.log('   ACM Certificate:', config.ViewerCertificate.ACMCertificateArn);
      console.log('   SSL Method:', config.ViewerCertificate.SSLSupportMethod);
    }

    console.log('\n💰 Price Class:', config.PriceClass);
    console.log('🌍 HTTP Version:', config.HttpVersion);
    console.log('📡 IPv6 Enabled:', config.IsIPV6Enabled);

    if (dist.Status === 'InProgress') {
      console.log('\n⏳ Distribution is still deploying...');
      console.log('   This typically takes 10-15 minutes.');
      console.log('   Run this script again to check the status.');
    } else if (dist.Status === 'Deployed') {
      console.log('\n✅ Distribution is fully deployed and ready to use!');
      console.log('\n📝 Add this to your .env.local:');
      console.log(`   CLOUDFRONT_DOMAIN=${dist.DomainName}`);
      
      if (config.Aliases && config.Aliases.Quantity > 0) {
        console.log('\n   Or use your custom domain:');
        console.log(`   CLOUDFRONT_DOMAIN=${config.Aliases.Items[0]}`);
      }
    }

  } catch (error) {
    console.error('❌ Error checking CloudFront status:', error);
    
    if (error.name === 'NoSuchDistribution') {
      console.log('\n⚠️  Distribution not found. It may have been deleted.');
      console.log('   Run without arguments to list all distributions:');
      console.log('   node check-cloudfront-status.js');
    }
  }
}

// Get distribution ID from command line or check all
const distributionId = process.argv[2];
checkCloudFrontStatus(distributionId);
