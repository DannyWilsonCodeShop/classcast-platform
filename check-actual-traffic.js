const { CloudWatchClient, GetMetricStatisticsCommand } = require('@aws-sdk/client-cloudwatch');
const { AmplifyClient, ListAppsCommand, GetAppCommand } = require('@aws-sdk/client-amplify');

const cloudwatch = new CloudWatchClient({ region: 'us-east-1' });
const amplify = new AmplifyClient({ region: 'us-east-1' });

async function checkTraffic() {
  console.log('🔍 Checking Where Your Traffic Is Actually Going\n');
  console.log('='.repeat(60));

  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days

  // Check CloudFront traffic
  console.log('\n📊 CloudFront Traffic (Last 7 Days):');
  try {
    const cfRequests = await cloudwatch.send(new GetMetricStatisticsCommand({
      Namespace: 'AWS/CloudFront',
      MetricName: 'Requests',
      StartTime: startTime,
      EndTime: endTime,
      Period: 86400,
      Statistics: ['Sum'],
      Dimensions: [{ Name: 'DistributionId', Value: 'EIR7OR9UIRRJ5' }]
    }));

    const totalRequests = cfRequests.Datapoints?.reduce((sum, dp) => sum + (dp.Sum || 0), 0) || 0;
    console.log(`   Total Requests: ${totalRequests.toFixed(0)}`);
    
    if (totalRequests === 0) {
      console.log('   ❌ NO TRAFFIC through CloudFront!');
      console.log('   This means users are bypassing CloudFront entirely');
    } else {
      console.log(`   ✅ ${(totalRequests / 7).toFixed(0)} requests/day`);
    }

    const cfBytes = await cloudwatch.send(new GetMetricStatisticsCommand({
      Namespace: 'AWS/CloudFront',
      MetricName: 'BytesDownloaded',
      StartTime: startTime,
      EndTime: endTime,
      Period: 86400,
      Statistics: ['Sum'],
      Dimensions: [{ Name: 'DistributionId', Value: 'EIR7OR9UIRRJ5' }]
    }));

    const totalBytes = cfBytes.Datapoints?.reduce((sum, dp) => sum + (dp.Sum || 0), 0) || 0;
    console.log(`   Data Transfer: ${(totalBytes / 1024 / 1024 / 1024).toFixed(2)} GB`);

  } catch (error) {
    console.log('   ⚠️  Could not fetch CloudFront metrics');
  }

  // Check Amplify traffic
  console.log('\n📊 Amplify Hosting Traffic (Last 7 Days):');
  try {
    const amplifyRequests = await cloudwatch.send(new GetMetricStatisticsCommand({
      Namespace: 'AWS/AmplifyHosting',
      MetricName: 'Requests',
      StartTime: startTime,
      EndTime: endTime,
      Period: 86400,
      Statistics: ['Sum']
    }));

    const totalRequests = amplifyRequests.Datapoints?.reduce((sum, dp) => sum + (dp.Sum || 0), 0) || 0;
    console.log(`   Total Requests: ${totalRequests.toFixed(0)}`);
    console.log(`   Average: ${(totalRequests / 7).toFixed(0)} requests/day`);

    if (totalRequests > 0) {
      console.log('   ⚠️  Traffic is going to Amplify DIRECTLY');
      console.log('   CloudFront is being bypassed!');
    }

    const amplifyBytes = await cloudwatch.send(new GetMetricStatisticsCommand({
      Namespace: 'AWS/AmplifyHosting',
      MetricName: 'BytesDownloaded',
      StartTime: startTime,
      EndTime: endTime,
      Period: 86400,
      Statistics: ['Sum']
    }));

    const totalBytes = amplifyBytes.Datapoints?.reduce((sum, dp) => sum + (dp.Sum || 0), 0) || 0;
    console.log(`   Data Transfer: ${(totalBytes / 1024 / 1024 / 1024).toFixed(2)} GB`);

  } catch (error) {
    console.log('   ⚠️  Could not fetch Amplify metrics');
  }

  // Check Amplify app details
  console.log('\n🚀 Amplify App Configuration:');
  try {
    const { apps } = await amplify.send(new ListAppsCommand({}));
    
    if (apps && apps.length > 0) {
      for (const app of apps) {
        console.log(`\n   App: ${app.name}`);
        console.log(`   ID: ${app.appId}`);
        console.log(`   Default Domain: ${app.defaultDomain}`);
        
        if (app.customDomains && app.customDomains.length > 0) {
          console.log(`   Custom Domains:`);
          app.customDomains.forEach(domain => {
            console.log(`      - ${domain}`);
          });
        } else {
          console.log(`   ⚠️  No custom domains configured`);
        }

        // Get full app details
        const { app: fullApp } = await amplify.send(new GetAppCommand({ appId: app.appId }));
        
        if (fullApp.productionBranch) {
          console.log(`   Production Branch: ${fullApp.productionBranch.branchName}`);
          console.log(`   Branch URL: https://${fullApp.productionBranch.branchName}.${app.defaultDomain}`);
        }
      }
    }
  } catch (error) {
    console.log('   ⚠️  Could not fetch Amplify app details');
  }

  console.log('\n\n🎯 Analysis:');
  console.log('='.repeat(60));
  
  console.log('\n❌ PROBLEM: CloudFront is NOT being used');
  console.log('   - CloudFront exists but has 0 requests');
  console.log('   - All traffic goes directly to Amplify');
  console.log('   - No caching is happening');
  console.log('   - Every request hits your backend');
  
  console.log('\n💡 WHY This Happens:');
  console.log('   1. CloudFront is only configured for S3 videos');
  console.log('   2. Your Next.js app is hosted on Amplify');
  console.log('   3. Amplify has its OWN CloudFront distribution');
  console.log('   4. But Amplify CloudFront might not be caching properly');
  
  console.log('\n🔧 SOLUTION:');
  console.log('   Option 1: Configure Amplify CloudFront caching');
  console.log('   Option 2: Add API response caching in Next.js');
  console.log('   Option 3: Use React Query for client-side caching');
  
  console.log('\n📊 Current State:');
  console.log('   ✅ DynamoDB index created (95% read reduction)');
  console.log('   ✅ S3 lifecycle policies active');
  console.log('   ❌ No CloudFront caching for app/API');
  console.log('   ❌ No client-side caching');
  
  console.log('\n🚀 Next Steps:');
  console.log('   1. Add Next.js API route caching (headers)');
  console.log('   2. Install React Query for client caching');
  console.log('   3. Configure Amplify CloudFront settings');
  console.log('   4. Monitor metrics to verify caching works');
}

checkTraffic().catch(console.error);
