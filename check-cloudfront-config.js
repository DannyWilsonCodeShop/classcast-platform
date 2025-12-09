const { CloudFrontClient, GetDistributionConfigCommand, ListDistributionsCommand } = require('@aws-sdk/client-cloudfront');

const client = new CloudFrontClient({ region: 'us-east-1' });

async function checkCloudfrontConfig() {
  console.log('🔍 Checking CloudFront Configuration\n');
  console.log('='.repeat(60));

  try {
    // List distributions
    const listCommand = new ListDistributionsCommand({});
    const { DistributionList } = await client.send(listCommand);

    if (!DistributionList?.Items || DistributionList.Items.length === 0) {
      console.log('❌ No CloudFront distributions found');
      return;
    }

    for (const dist of DistributionList.Items) {
      console.log(`\n📦 Distribution: ${dist.Id}`);
      console.log(`   Domain: ${dist.DomainName}`);
      console.log(`   Status: ${dist.Status}`);
      console.log(`   Enabled: ${dist.Enabled}`);

      // Get detailed config
      const configCommand = new GetDistributionConfigCommand({ Id: dist.Id });
      const { DistributionConfig } = await client.send(configCommand);

      console.log('\n🌐 Origins:');
      DistributionConfig.Origins.Items.forEach((origin, i) => {
        console.log(`   ${i + 1}. ${origin.DomainName}`);
        console.log(`      ID: ${origin.Id}`);
        if (origin.S3OriginConfig) {
          console.log(`      Type: S3`);
        } else if (origin.CustomOriginConfig) {
          console.log(`      Type: Custom (${origin.CustomOriginConfig.OriginProtocolPolicy})`);
        }
      });

      console.log('\n📋 Cache Behaviors:');
      
      // Default behavior
      const defaultBehavior = DistributionConfig.DefaultCacheBehavior;
      console.log('\n   Default Behavior:');
      console.log(`      Target Origin: ${defaultBehavior.TargetOriginId}`);
      console.log(`      Viewer Protocol: ${defaultBehavior.ViewerProtocolPolicy}`);
      console.log(`      Allowed Methods: ${defaultBehavior.AllowedMethods?.Items?.join(', ') || 'GET, HEAD'}`);
      console.log(`      Cached Methods: ${defaultBehavior.AllowedMethods?.CachedMethods?.Items?.join(', ') || 'GET, HEAD'}`);
      console.log(`      Compress: ${defaultBehavior.Compress}`);
      
      if (defaultBehavior.CachePolicyId) {
        console.log(`      Cache Policy ID: ${defaultBehavior.CachePolicyId}`);
      } else {
        console.log(`      Min TTL: ${defaultBehavior.MinTTL || 0}s`);
        console.log(`      Max TTL: ${defaultBehavior.MaxTTL || 31536000}s`);
        console.log(`      Default TTL: ${defaultBehavior.DefaultTTL || 86400}s`);
      }

      if (defaultBehavior.ForwardedValues) {
        console.log(`      Forward Query Strings: ${defaultBehavior.ForwardedValues.QueryString}`);
        console.log(`      Forward Cookies: ${defaultBehavior.ForwardedValues.Cookies?.Forward || 'none'}`);
        if (defaultBehavior.ForwardedValues.Headers?.Items) {
          console.log(`      Forward Headers: ${defaultBehavior.ForwardedValues.Headers.Items.join(', ')}`);
        }
      }

      // Additional behaviors
      if (DistributionConfig.CacheBehaviors?.Items?.length > 0) {
        console.log('\n   Path-Specific Behaviors:');
        DistributionConfig.CacheBehaviors.Items.forEach((behavior, i) => {
          console.log(`\n   ${i + 1}. Path: ${behavior.PathPattern}`);
          console.log(`      Target Origin: ${behavior.TargetOriginId}`);
          console.log(`      Viewer Protocol: ${behavior.ViewerProtocolPolicy}`);
          console.log(`      Compress: ${behavior.Compress}`);
          
          if (behavior.CachePolicyId) {
            console.log(`      Cache Policy ID: ${behavior.CachePolicyId}`);
          } else {
            console.log(`      Min TTL: ${behavior.MinTTL || 0}s`);
            console.log(`      Default TTL: ${behavior.DefaultTTL || 86400}s`);
          }
        });
      }

      console.log('\n🔒 Security:');
      console.log(`   Price Class: ${DistributionConfig.PriceClass}`);
      console.log(`   HTTP Version: ${DistributionConfig.HttpVersion}`);
      console.log(`   IPv6 Enabled: ${DistributionConfig.IsIPV6Enabled}`);

      if (DistributionConfig.Aliases?.Items?.length > 0) {
        console.log(`\n🌍 Custom Domains (CNAMEs):`);
        DistributionConfig.Aliases.Items.forEach(alias => {
          console.log(`   - ${alias}`);
        });
      } else {
        console.log(`\n⚠️  No custom domains configured`);
        console.log(`   Users are accessing: ${dist.DomainName}`);
        console.log(`   Should be: class-cast.com`);
      }

      console.log('\n💡 Caching Analysis:');
      
      // Check if caching is actually enabled
      const hasCaching = defaultBehavior.CachePolicyId || 
                        (defaultBehavior.DefaultTTL && defaultBehavior.DefaultTTL > 0);
      
      if (!hasCaching) {
        console.log('   ❌ CACHING IS DISABLED!');
        console.log('   All requests are going directly to origin');
        console.log('   This defeats the purpose of CloudFront');
      } else {
        console.log('   ✅ Caching is configured');
        
        // Check if it's being used
        if (!DistributionConfig.Aliases?.Items?.length) {
          console.log('   ⚠️  BUT: No custom domain configured');
          console.log('   Users are likely bypassing CloudFront');
          console.log('   Traffic is going directly to Amplify');
        }
      }

      // Check if API calls are being cached
      const hasApiCaching = DistributionConfig.CacheBehaviors?.Items?.some(
        b => b.PathPattern.includes('/api')
      );
      
      if (!hasApiCaching) {
        console.log('   ⚠️  API routes are not cached');
        console.log('   Every API call hits DynamoDB');
        console.log('   Consider adding cache behavior for /api/*');
      }
    }

    console.log('\n\n🎯 Recommendations:');
    console.log('='.repeat(60));
    console.log('1. Update DNS to point class-cast.com to CloudFront');
    console.log('2. Add CNAME alias to CloudFront distribution');
    console.log('3. Enable caching for static assets (images, CSS, JS)');
    console.log('4. Add short-TTL caching for API responses (60s)');
    console.log('5. Monitor CloudFront metrics to verify usage');

  } catch (error) {
    console.error('❌ Error checking CloudFront:', error.message);
  }
}

checkCloudfrontConfig().catch(console.error);
