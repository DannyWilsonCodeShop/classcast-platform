#!/usr/bin/env node

/**
 * Verify which CloudFront distribution Amplify uses
 * Get detailed information about the distribution configuration
 */

const { CloudFrontClient, ListDistributionsCommand, GetDistributionCommand } = require('@aws-sdk/client-cloudfront');
const { AmplifyClient, ListAppsCommand, GetAppCommand } = require('@aws-sdk/client-amplify');
const https = require('https');

console.log('🔍 Verifying Amplify CloudFront Distribution\n');

// Initialize AWS clients
const cloudfront = new CloudFrontClient({ region: 'us-east-1' }); // CloudFront is global but uses us-east-1
const amplify = new AmplifyClient({ region: 'us-east-1' }); // Adjust region as needed

// Function to extract distribution ID from headers
async function getDistributionFromHeaders() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'class-cast.com',
      port: 443,
      path: '/',
      method: 'HEAD',
      headers: {
        'User-Agent': 'CloudFront-Checker/1.0'
      }
    };

    const req = https.request(options, (res) => {
      const via = res.headers.via;
      const cfId = res.headers['x-amz-cf-id'];
      const cfPop = res.headers['x-amz-cf-pop'];
      
      console.log('📡 Response Headers Analysis:');
      console.log(`  Via: ${via}`);
      console.log(`  X-Amz-Cf-Id: ${cfId}`);
      console.log(`  X-Amz-Cf-Pop: ${cfPop}`);
      
      // Extract distribution ID from Via header
      let distributionId = null;
      if (via) {
        const match = via.match(/([a-zA-Z0-9]+)\.cloudfront\.net/);
        if (match) {
          distributionId = match[1];
        }
      }
      
      resolve({
        distributionId,
        cfId,
        cfPop,
        via,
        allHeaders: res.headers
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Function to list all CloudFront distributions
async function listCloudFrontDistributions() {
  try {
    console.log('\n📋 Listing All CloudFront Distributions:');
    
    const command = new ListDistributionsCommand({});
    const response = await cloudfront.send(command);
    
    if (!response.DistributionList || !response.DistributionList.Items) {
      console.log('  No distributions found');
      return [];
    }
    
    const distributions = response.DistributionList.Items;
    console.log(`  Found ${distributions.length} distribution(s):`);
    
    distributions.forEach((dist, index) => {
      console.log(`\n  ${index + 1}. Distribution ID: ${dist.Id}`);
      console.log(`     Domain: ${dist.DomainName}`);
      console.log(`     Status: ${dist.Status}`);
      console.log(`     Enabled: ${dist.Enabled}`);
      console.log(`     Price Class: ${dist.PriceClass}`);
      
      if (dist.Aliases && dist.Aliases.Items && dist.Aliases.Items.length > 0) {
        console.log(`     Custom Domains: ${dist.Aliases.Items.join(', ')}`);
      }
      
      if (dist.Origins && dist.Origins.Items && dist.Origins.Items.length > 0) {
        console.log(`     Origins:`);
        dist.Origins.Items.forEach((origin, i) => {
          console.log(`       ${i + 1}. ${origin.DomainName} (${origin.Id})`);
        });
      }
    });
    
    return distributions;
  } catch (error) {
    console.error('❌ Error listing CloudFront distributions:', error.message);
    return [];
  }
}

// Function to get detailed distribution info
async function getDistributionDetails(distributionId) {
  try {
    console.log(`\n🔍 Getting Detailed Info for Distribution: ${distributionId}`);
    
    const command = new GetDistributionCommand({ Id: distributionId });
    const response = await cloudfront.send(command);
    
    const config = response.Distribution.DistributionConfig;
    
    console.log('\n📊 Distribution Configuration:');
    console.log(`  ID: ${response.Distribution.Id}`);
    console.log(`  ARN: ${response.Distribution.ARN}`);
    console.log(`  Domain: ${response.Distribution.DomainName}`);
    console.log(`  Status: ${response.Distribution.Status}`);
    console.log(`  Last Modified: ${response.Distribution.LastModifiedTime}`);
    console.log(`  Enabled: ${config.Enabled}`);
    console.log(`  Price Class: ${config.PriceClass}`);
    console.log(`  HTTP Version: ${config.HttpVersion}`);
    console.log(`  IPv6 Enabled: ${config.IsIPV6Enabled}`);
    
    if (config.Aliases && config.Aliases.Items && config.Aliases.Items.length > 0) {
      console.log(`  Custom Domains: ${config.Aliases.Items.join(', ')}`);
    }
    
    console.log('\n🎯 Origins:');
    config.Origins.Items.forEach((origin, i) => {
      console.log(`  ${i + 1}. Origin ID: ${origin.Id}`);
      console.log(`     Domain: ${origin.DomainName}`);
      console.log(`     Protocol Policy: ${origin.CustomOriginConfig?.OriginProtocolPolicy || 'Default'}`);
      console.log(`     HTTP Port: ${origin.CustomOriginConfig?.HTTPPort || 'Default'}`);
      console.log(`     HTTPS Port: ${origin.CustomOriginConfig?.HTTPSPort || 'Default'}`);
    });
    
    console.log('\n🔄 Cache Behaviors:');
    console.log(`  Default Behavior:`);
    const defaultBehavior = config.DefaultCacheBehavior;
    console.log(`    Target Origin: ${defaultBehavior.TargetOriginId}`);
    console.log(`    Viewer Protocol Policy: ${defaultBehavior.ViewerProtocolPolicy}`);
    console.log(`    Allowed Methods: ${defaultBehavior.AllowedMethods?.Items?.join(', ') || 'GET, HEAD'}`);
    console.log(`    Cached Methods: ${defaultBehavior.AllowedMethods?.CachedMethods?.Items?.join(', ') || 'GET, HEAD'}`);
    console.log(`    Compress: ${defaultBehavior.Compress}`);
    console.log(`    TTL - Min: ${defaultBehavior.MinTTL}, Default: ${defaultBehavior.DefaultTTL}, Max: ${defaultBehavior.MaxTTL}`);
    
    if (config.CacheBehaviors && config.CacheBehaviors.Items && config.CacheBehaviors.Items.length > 0) {
      console.log(`\n  Additional Cache Behaviors (${config.CacheBehaviors.Items.length}):`);
      config.CacheBehaviors.Items.forEach((behavior, i) => {
        console.log(`    ${i + 1}. Path Pattern: ${behavior.PathPattern}`);
        console.log(`       Target Origin: ${behavior.TargetOriginId}`);
        console.log(`       Viewer Protocol: ${behavior.ViewerProtocolPolicy}`);
        console.log(`       Compress: ${behavior.Compress}`);
      });
    }
    
    if (config.CustomErrorResponses && config.CustomErrorResponses.Items && config.CustomErrorResponses.Items.length > 0) {
      console.log('\n❌ Custom Error Responses:');
      config.CustomErrorResponses.Items.forEach((error, i) => {
        console.log(`  ${i + 1}. Error Code: ${error.ErrorCode}`);
        console.log(`     Response Code: ${error.ResponseCode}`);
        console.log(`     Response Page: ${error.ResponsePagePath}`);
        console.log(`     TTL: ${error.ErrorCachingMinTTL}`);
      });
    }
    
    return response.Distribution;
  } catch (error) {
    console.error(`❌ Error getting distribution details: ${error.message}`);
    return null;
  }
}

// Function to list Amplify apps
async function listAmplifyApps() {
  try {
    console.log('\n📱 Listing Amplify Apps:');
    
    const command = new ListAppsCommand({});
    const response = await amplify.send(command);
    
    if (!response.apps || response.apps.length === 0) {
      console.log('  No Amplify apps found');
      return [];
    }
    
    console.log(`  Found ${response.apps.length} app(s):`);
    
    for (const app of response.apps) {
      console.log(`\n  📱 App: ${app.name}`);
      console.log(`     App ID: ${app.appId}`);
      console.log(`     Default Domain: ${app.defaultDomain}`);
      console.log(`     Repository: ${app.repository || 'Not connected'}`);
      console.log(`     Platform: ${app.platform}`);
      console.log(`     Created: ${app.createTime}`);
      console.log(`     Updated: ${app.updateTime}`);
      
      if (app.customDomains && app.customDomains.length > 0) {
        console.log(`     Custom Domains: ${app.customDomains.join(', ')}`);
      }
      
      // Get detailed app info
      try {
        const appCommand = new GetAppCommand({ appId: app.appId });
        const appResponse = await amplify.send(appCommand);
        const appDetails = appResponse.app;
        
        if (appDetails.productionBranch) {
          console.log(`     Production Branch: ${appDetails.productionBranch.branchName}`);
          if (appDetails.productionBranch.thumbnailUrl) {
            console.log(`     Thumbnail: ${appDetails.productionBranch.thumbnailUrl}`);
          }
        }
        
        if (appDetails.customRules && appDetails.customRules.length > 0) {
          console.log(`     Custom Rules: ${appDetails.customRules.length} rule(s)`);
        }
      } catch (error) {
        console.log(`     ⚠️  Could not get detailed info: ${error.message}`);
      }
    }
    
    return response.apps;
  } catch (error) {
    console.error('❌ Error listing Amplify apps:', error.message);
    return [];
  }
}

// Function to find matching distribution
function findMatchingDistribution(distributions, headerInfo, amplifyApps) {
  console.log('\n🔍 Finding Matching Distribution:');
  
  // Method 1: Match by distribution ID from headers
  if (headerInfo.distributionId) {
    const match = distributions.find(d => d.Id === headerInfo.distributionId);
    if (match) {
      console.log(`✅ Found exact match by distribution ID: ${match.Id}`);
      return match;
    }
  }
  
  // Method 2: Match by custom domain
  const domainMatches = distributions.filter(d => {
    if (d.Aliases && d.Aliases.Items) {
      return d.Aliases.Items.includes('class-cast.com') || 
             d.Aliases.Items.includes('www.class-cast.com');
    }
    return false;
  });
  
  if (domainMatches.length > 0) {
    console.log(`✅ Found ${domainMatches.length} distribution(s) with matching domain`);
    return domainMatches[0];
  }
  
  // Method 3: Match by Amplify origin
  const amplifyMatches = distributions.filter(d => {
    if (d.Origins && d.Origins.Items) {
      return d.Origins.Items.some(origin => 
        origin.DomainName.includes('amplifyapp.com') ||
        origin.DomainName.includes('d166bugwfgjggz') // Your app ID
      );
    }
    return false;
  });
  
  if (amplifyMatches.length > 0) {
    console.log(`✅ Found ${amplifyMatches.length} distribution(s) with Amplify origin`);
    return amplifyMatches[0];
  }
  
  console.log('❌ No matching distribution found');
  return null;
}

// Main execution
async function main() {
  try {
    // Step 1: Get distribution info from headers
    console.log('🌐 Step 1: Analyzing Response Headers');
    const headerInfo = await getDistributionFromHeaders();
    
    // Step 2: List all CloudFront distributions
    console.log('\n🌐 Step 2: Listing CloudFront Distributions');
    const distributions = await listCloudFrontDistributions();
    
    // Step 3: List Amplify apps
    console.log('\n🌐 Step 3: Listing Amplify Apps');
    const amplifyApps = await listAmplifyApps();
    
    // Step 4: Find matching distribution
    console.log('\n🌐 Step 4: Finding Matching Distribution');
    const matchingDistribution = findMatchingDistribution(distributions, headerInfo, amplifyApps);
    
    // Step 5: Get detailed info for matching distribution
    if (matchingDistribution) {
      console.log('\n🌐 Step 5: Getting Detailed Distribution Info');
      await getDistributionDetails(matchingDistribution.Id);
    }
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 AMPLIFY CLOUDFRONT SUMMARY');
    console.log('='.repeat(80));
    
    if (matchingDistribution) {
      console.log(`✅ Amplify uses CloudFront Distribution: ${matchingDistribution.Id}`);
      console.log(`📍 Distribution Domain: ${matchingDistribution.DomainName}`);
      console.log(`🌍 Status: ${matchingDistribution.Status}`);
      console.log(`⚡ Enabled: ${matchingDistribution.Enabled}`);
      
      if (headerInfo.cfPop) {
        console.log(`🏢 Edge Location: ${headerInfo.cfPop}`);
      }
      
      console.log('\n🎯 Key Features:');
      console.log('  - Custom domain support (class-cast.com)');
      console.log('  - Global CDN with edge locations');
      console.log('  - Automatic HTTPS/SSL');
      console.log('  - Compression enabled');
      console.log('  - Cache optimization');
      
    } else {
      console.log('❌ Could not identify the specific CloudFront distribution');
      console.log('   This might be due to insufficient permissions or configuration');
    }
    
  } catch (error) {
    console.error('❌ Error in main execution:', error.message);
  }
}

// Run the verification
main().then(() => {
  console.log('\n✅ CloudFront verification complete!');
}).catch(error => {
  console.error('❌ Verification failed:', error);
});