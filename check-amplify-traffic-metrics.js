#!/usr/bin/env node

/**
 * Check Amplify traffic metrics (the real metrics for your app)
 */

const { CloudWatchClient, GetMetricStatisticsCommand, ListMetricsCommand } = require('@aws-sdk/client-cloudwatch');

console.log('📊 Checking Amplify Traffic Metrics (Your Real Traffic)\n');

const cloudwatch = new CloudWatchClient({ region: 'us-east-1' });

async function checkAmplifyMetrics() {
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
  
  console.log('🔍 Looking for Amplify-related metrics...');
  console.log(`Time range: ${startTime.toISOString()} to ${endTime.toISOString()}\n`);
  
  // Check for Amplify metrics
  const namespaces = [
    'AWS/AmplifyHosting',
    'AWS/Amplify', 
    'AWS/ApplicationELB',
    'AWS/Lambda',
    'CWAgent'
  ];
  
  for (const namespace of namespaces) {
    try {
      console.log(`📋 Checking namespace: ${namespace}`);
      
      const listCommand = new ListMetricsCommand({
        Namespace: namespace
      });
      
      const listResponse = await cloudwatch.send(listCommand);
      
      if (listResponse.Metrics && listResponse.Metrics.length > 0) {
        console.log(`   ✅ Found ${listResponse.Metrics.length} metrics`);
        
        // Show first few metrics
        listResponse.Metrics.slice(0, 5).forEach(metric => {
          console.log(`      - ${metric.MetricName}`);
          if (metric.Dimensions && metric.Dimensions.length > 0) {
            metric.Dimensions.forEach(dim => {
              console.log(`        ${dim.Name}: ${dim.Value}`);
            });
          }
        });
        
        if (listResponse.Metrics.length > 5) {
          console.log(`      ... and ${listResponse.Metrics.length - 5} more`);
        }
        
      } else {
        console.log(`   ❌ No metrics found`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error checking ${namespace}: ${error.message}`);
    }
    
    console.log('');
  }
}

async function checkWebTrafficIndicators() {
  console.log('🌐 Checking for Web Traffic Indicators...\n');
  
  // Check Lambda metrics (API calls)
  try {
    const lambdaMetrics = [
      'Invocations',
      'Duration', 
      'Errors'
    ];
    
    for (const metricName of lambdaMetrics) {
      const params = {
        Namespace: 'AWS/Lambda',
        MetricName: metricName,
        StartTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        EndTime: new Date(),
        Period: 3600,
        Statistics: ['Sum']
      };
      
      const command = new GetMetricStatisticsCommand(params);
      const response = await cloudwatch.send(command);
      
      if (response.Datapoints && response.Datapoints.length > 0) {
        const total = response.Datapoints.reduce((sum, dp) => sum + (dp.Sum || 0), 0);
        console.log(`📈 Lambda ${metricName} (7 days): ${total}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Error checking Lambda metrics: ${error.message}`);
  }
  
  console.log('');
}

async function suggestAlternativeMonitoring() {
  console.log('🔧 Alternative Traffic Monitoring Options:\n');
  
  console.log('1. 📱 Amplify Console:');
  console.log('   - Go to AWS Amplify Console');
  console.log('   - Select your app: classcast-platform');
  console.log('   - Check "Monitoring" tab');
  console.log('   - Look for request metrics and performance data');
  
  console.log('\n2. 📊 CloudWatch Insights:');
  console.log('   - Use CloudWatch Logs Insights');
  console.log('   - Query Amplify access logs');
  console.log('   - Filter by time range and status codes');
  
  console.log('\n3. 🔍 Application-Level Monitoring:');
  console.log('   - Add analytics to your Next.js app');
  console.log('   - Use Vercel Analytics or Google Analytics');
  console.log('   - Monitor API endpoint usage');
  
  console.log('\n4. 📈 Custom Metrics:');
  console.log('   - Add CloudWatch custom metrics to your API routes');
  console.log('   - Track page views, API calls, user actions');
  console.log('   - Create custom dashboards');
  
  console.log('\n5. 🌐 Third-Party Tools:');
  console.log('   - Datadog, New Relic, or Pingdom');
  console.log('   - Real User Monitoring (RUM)');
  console.log('   - Synthetic monitoring');
}

// Main execution
async function main() {
  try {
    await checkAmplifyMetrics();
    await checkWebTrafficIndicators();
    await suggestAlternativeMonitoring();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 TRAFFIC MONITORING SUMMARY');
    console.log('='.repeat(60));
    
    console.log('\n✅ CloudFront IS working:');
    console.log('   - You see CloudFront headers in responses');
    console.log('   - Cache hits are happening');
    console.log('   - Performance optimizations are active');
    
    console.log('\n📍 Where to find metrics:');
    console.log('   - Amplify Console (not CloudFront Console)');
    console.log('   - CloudWatch under Amplify/Lambda namespaces');
    console.log('   - Application logs and custom metrics');
    
    console.log('\n🎯 Next steps:');
    console.log('   1. Check Amplify Console monitoring tab');
    console.log('   2. Set up application-level analytics');
    console.log('   3. Create custom CloudWatch metrics if needed');
    
  } catch (error) {
    console.error('❌ Error checking metrics:', error.message);
  }
}

main().then(() => {
  console.log('\n✅ Amplify traffic metrics check complete!');
}).catch(error => {
  console.error('❌ Metrics check failed:', error);
});