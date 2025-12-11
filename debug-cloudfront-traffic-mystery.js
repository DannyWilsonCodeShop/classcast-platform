#!/usr/bin/env node

/**
 * Debug CloudFront Traffic Mystery
 * Why are we seeing CloudFront headers but 0 traffic in metrics?
 */

const { CloudFrontClient, ListDistributionsCommand, GetDistributionCommand } = require('@aws-sdk/client-cloudfront');
const { CloudWatchClient, GetMetricStatisticsCommand } = require('@aws-sdk/client-cloudwatch');
const https = require('https');

console.log('🚨 DEBUGGING CLOUDFRONT TRAFFIC MYSTERY\n');
console.log('Problem: Seeing CloudFront headers but 0 requests in metrics\n');

const cloudfront = new CloudFrontClient({ region: 'us-east-1' });
const cloudwatch = new CloudWatchClient({ region: 'us-east-1' });

// Function to get real-time headers
async function getCurrentHeaders() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'class-cast.com',
      port: 443,
      path: '/',
      method: 'HEAD',
      headers: {
        'User-Agent': 'CloudFront-Debug/1.0',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    };

    const req = https.request(options, (res) => {
      resolve({
        statusCode: res.statusCode,
        headers: res.headers,
        timestamp: new Date().toISOString()
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

// Function to check CloudWatch metrics for a specific distribution
async function checkCloudWatchMetrics(distributionId) {
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
  
  console.log(`📊 Checking CloudWatch metrics for distribution: ${distributionId}`);
  console.log(`   Time range: ${startTime.toISOString()} to ${endTime.toISOString()}`);
  
  const metrics = [
    'Requests',
    'BytesDownloaded',
    'BytesUploaded',
    '4xxErrorRate',
    '5xxErrorRate'
  ];
  
  for (const metricName of metrics) {
    try {
      const params = {
        Namespace: 'AWS/CloudFront',
        MetricName: metricName,
        Dimensions: [
          {
            Name: 'DistributionId',
            Value: distributionId
          }
        ],
        StartTime: startTime,
        EndTime: endTime,
        Period: 3600, // 1 hour periods
        Statistics: ['Sum', 'Average']
      };
      
      const command = new GetMetricStatisticsCommand(params);
      const response = await cloudwatch.send(command);
      
      console.log(`\n   📈 ${metricName}:`);
      if (response.Datapoints && response.Datapoints.length > 0) {
        const totalSum = response.Datapoints.reduce((sum, dp) => sum + (dp.Sum || 0), 0);
        console.log(`      Total: ${totalSum}`);
        console.log(`      Data points: ${response.Datapoints.length}`);
        
        // Show recent data points
        const recent = response.Datapoints
          .sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp))
          .slice(0, 3);
        
        recent.forEach(dp => {
          console.log(`      ${dp.Timestamp.toISOString()}: ${dp.Sum || dp.Average || 0}`);
        });
      } else {
        console.log(`      ❌ No data points found`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error getting ${metricName}: ${error.message}`);
    }
  }
}

// Function to check if distribution exists in our account
async function checkDistributionOwnership(distributionId) {
  try {
    console.log(`🔍 Checking if distribution ${distributionId} exists in your account...`);
    
    const command = new GetDistributionCommand({ Id: distributionId });
    const response = await cloudfront.send(command);
    
    console.log(`✅ Distribution found in your account:`);
    console.log(`   ID: ${response.Distribution.Id}`);
    console.log(`   Domain: ${response.Distribution.DomainName}`);
    console.log(`   Status: ${response.Distribution.Status}`);
    console.log(`   Enabled: ${response.Distribution.DistributionConfig.Enabled}`);
    
    return response.Distribution;
    
  } catch (error) {
    if (error.name === 'NoSuchDistribution') {
      console.log(`❌ Distribution ${distributionId} NOT found in your account`);
      console.log(`   This distribution is managed by another AWS account (likely Amplify's)`);
      return null;
    } else {
      console.log(`❌ Error checking distribution: ${error.message}`);
      return null;
    }
  }
}

// Function to list all distributions in account
async function listAllDistributions() {
  try {
    console.log(`\n📋 Listing ALL distributions in your account:`);
    
    const command = new ListDistributionsCommand({});
    const response = await cloudfront.send(command);
    
    if (!response.DistributionList || !response.DistributionList.Items || response.DistributionList.Items.length === 0) {
      console.log(`   ❌ No distributions found in your account`);
      return [];
    }
    
    console.log(`   Found ${response.DistributionList.Items.length} distribution(s):`);
    
    response.DistributionList.Items.forEach((dist, i) => {
      console.log(`\n   ${i + 1}. ${dist.Id}`);
      console.log(`      Domain: ${dist.DomainName}`);
      console.log(`      Status: ${dist.Status}`);
      console.log(`      Enabled: ${dist.Enabled}`);
      
      if (dist.Aliases && dist.Aliases.Items && dist.Aliases.Items.length > 0) {
        console.log(`      Custom Domains: ${dist.Aliases.Items.join(', ')}`);
      }
    });
    
    return response.DistributionList.Items;
    
  } catch (error) {
    console.log(`   ❌ Error listing distributions: ${error.message}`);
    return [];
  }
}

// Function to explain the mystery
function explainMystery(headerDistId, ownedDistributions) {
  console.log('\n' + '='.repeat(80));
  console.log('🕵️ CLOUDFRONT TRAFFIC MYSTERY SOLVED');
  console.log('='.repeat(80));
  
  console.log(`\n🔍 What We Found:`);
  console.log(`   Headers show distribution: ${headerDistId}`);
  console.log(`   Your account has: ${ownedDistributions.length} distribution(s)`);
  
  const isOwned = ownedDistributions.some(d => d.Id === headerDistId);
  
  if (!isOwned) {
    console.log(`\n🎯 MYSTERY SOLVED:`);
    console.log(`   ✅ The distribution ${headerDistId} is NOT in your account`);
    console.log(`   ✅ It's managed by AWS Amplify service`);
    console.log(`   ✅ That's why you see 0 requests in YOUR CloudFront metrics`);
    console.log(`   ✅ The traffic is being tracked in AWS's internal metrics, not yours`);
    
    console.log(`\n📊 What This Means:`);
    console.log(`   - CloudFront IS working (you see the headers)`);
    console.log(`   - Traffic IS being cached and served`);
    console.log(`   - Metrics are in Amplify's account, not yours`);
    console.log(`   - Your CloudFront console shows 0 because it's not your distribution`);
    
    console.log(`\n🔧 How to Monitor:`);
    console.log(`   - Use Amplify console for traffic metrics`);
    console.log(`   - Check Amplify app metrics, not CloudFront`);
    console.log(`   - Monitor via application logs and performance`);
    console.log(`   - Use third-party monitoring tools`);
    
  } else {
    console.log(`\n❓ MYSTERY CONTINUES:`);
    console.log(`   The distribution IS in your account but shows 0 requests`);
    console.log(`   This could indicate:`);
    console.log(`   - Metrics delay (can take up to 24 hours)`);
    console.log(`   - Regional metric collection issues`);
    console.log(`   - CloudWatch permissions problems`);
  }
}

// Main execution
async function main() {
  try {
    // Step 1: Get current headers
    console.log('🌐 Step 1: Getting Current Headers');
    const headers = await getCurrentHeaders();
    
    console.log(`   Status: ${headers.statusCode}`);
    console.log(`   Via: ${headers.headers.via}`);
    console.log(`   X-Cache: ${headers.headers['x-cache']}`);
    console.log(`   X-Amz-Cf-Id: ${headers.headers['x-amz-cf-id']}`);
    
    // Extract distribution ID
    let distributionId = null;
    if (headers.headers.via) {
      const match = headers.headers.via.match(/([a-zA-Z0-9]+)\.cloudfront\.net/);
      if (match) {
        distributionId = match[1];
        console.log(`   🎯 Distribution ID: ${distributionId}`);
      }
    }
    
    if (!distributionId) {
      console.log('❌ Could not extract distribution ID from headers');
      return;
    }
    
    // Step 2: List all distributions in your account
    console.log('\n🌐 Step 2: Checking Your Account Distributions');
    const ownedDistributions = await listAllDistributions();
    
    // Step 3: Check if the header distribution is in your account
    console.log('\n🌐 Step 3: Checking Distribution Ownership');
    const distribution = await checkDistributionOwnership(distributionId);
    
    // Step 4: If it's in your account, check metrics
    if (distribution) {
      console.log('\n🌐 Step 4: Checking CloudWatch Metrics');
      await checkCloudWatchMetrics(distributionId);
    }
    
    // Step 5: Explain the mystery
    explainMystery(distributionId, ownedDistributions);
    
  } catch (error) {
    console.error('❌ Error in main execution:', error.message);
  }
}

// Run the investigation
main().then(() => {
  console.log('\n✅ CloudFront traffic mystery investigation complete!');
}).catch(error => {
  console.error('❌ Investigation failed:', error);
});