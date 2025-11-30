const { CloudWatchClient, GetMetricStatisticsCommand } = require('@aws-sdk/client-cloudwatch');
const { CloudFrontClient, ListDistributionsCommand } = require('@aws-sdk/client-cloudfront');

const cloudwatch = new CloudWatchClient({ region: 'us-east-1' });
const cloudfront = new CloudFrontClient({ region: 'us-east-1' });

async function getCloudFrontMetrics(distributionId, days = 30) {
  try {
    console.log(`📊 CloudFront Metrics for Distribution: ${distributionId}\n`);
    console.log(`Period: Last ${days} days\n`);
    console.log('='.repeat(60));
    
    const endTime = new Date();
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - days);
    
    // Metrics to fetch
    const metrics = [
      { name: 'Requests', unit: 'Count', label: 'Total Requests' },
      { name: 'BytesDownloaded', unit: 'Bytes', label: 'Data Transfer Out' },
      { name: 'BytesUploaded', unit: 'Bytes', label: 'Data Transfer In' },
      { name: '4xxErrorRate', unit: 'Percent', label: '4xx Error Rate' },
      { name: '5xxErrorRate', unit: 'Percent', label: '5xx Error Rate' },
      { name: 'CacheHitRate', unit: 'Percent', label: 'Cache Hit Rate' }
    ];
    
    const results = {};
    
    for (const metric of metrics) {
      try {
        const response = await cloudwatch.send(new GetMetricStatisticsCommand({
          Namespace: 'AWS/CloudFront',
          MetricName: metric.name,
          Dimensions: [
            {
              Name: 'DistributionId',
              Value: distributionId
            }
          ],
          StartTime: startTime,
          EndTime: endTime,
          Period: 86400, // 1 day
          Statistics: ['Sum', 'Average'],
          Unit: metric.unit
        }));
        
        if (response.Datapoints && response.Datapoints.length > 0) {
          const total = response.Datapoints.reduce((sum, dp) => sum + (dp.Sum || dp.Average || 0), 0);
          const average = total / response.Datapoints.length;
          results[metric.name] = { total, average, datapoints: response.Datapoints.length };
        } else {
          results[metric.name] = { total: 0, average: 0, datapoints: 0 };
        }
      } catch (error) {
        console.log(`⚠️  Could not fetch ${metric.name}:`, error.message);
        results[metric.name] = { total: 0, average: 0, datapoints: 0, error: true };
      }
    }
    
    // Display results
    console.log('\n📈 Traffic Statistics:');
    
    const requests = results.Requests.total;
    console.log(`   Total Requests: ${requests.toLocaleString()}`);
    console.log(`   Avg Requests/Day: ${Math.round(results.Requests.average).toLocaleString()}`);
    
    const bytesOut = results.BytesDownloaded.total;
    const gbOut = bytesOut / (1024 * 1024 * 1024);
    console.log(`\n   Data Transfer Out: ${gbOut.toFixed(2)} GB`);
    console.log(`   Avg Transfer/Day: ${(gbOut / days).toFixed(2)} GB`);
    
    const bytesIn = results.BytesUploaded.total;
    const gbIn = bytesIn / (1024 * 1024 * 1024);
    if (gbIn > 0.01) {
      console.log(`\n   Data Transfer In: ${gbIn.toFixed(2)} GB`);
    }
    
    console.log('\n🎯 Cache Performance:');
    const cacheHitRate = results.CacheHitRate.average;
    if (cacheHitRate > 0) {
      console.log(`   Cache Hit Rate: ${cacheHitRate.toFixed(1)}%`);
      console.log(`   Cache Misses: ${(100 - cacheHitRate).toFixed(1)}%`);
      
      if (cacheHitRate > 80) {
        console.log('   ✅ Excellent cache performance!');
      } else if (cacheHitRate > 60) {
        console.log('   ✅ Good cache performance');
      } else if (cacheHitRate > 40) {
        console.log('   ⚠️  Moderate cache performance - consider optimizing');
      } else {
        console.log('   ⚠️  Low cache performance - needs optimization');
      }
    } else {
      console.log('   No cache data available yet (distribution is new)');
    }
    
    console.log('\n🚨 Error Rates:');
    const error4xx = results['4xxErrorRate'].average;
    const error5xx = results['5xxErrorRate'].average;
    
    if (error4xx > 0 || error5xx > 0) {
      console.log(`   4xx Errors: ${error4xx.toFixed(2)}%`);
      console.log(`   5xx Errors: ${error5xx.toFixed(2)}%`);
      
      if (error4xx > 5) {
        console.log('   ⚠️  High 4xx error rate - check file permissions');
      }
      if (error5xx > 1) {
        console.log('   ⚠️  High 5xx error rate - check origin health');
      }
    } else {
      console.log('   ✅ No significant errors');
    }
    
    // Cost estimation
    console.log('\n💰 Estimated Costs (Last ' + days + ' days):');
    const costPerGB = 0.085; // North America pricing
    const costPerRequest = 0.0075 / 10000;
    
    const dataCost = gbOut * costPerGB;
    const requestCost = requests * costPerRequest;
    const totalCost = dataCost + requestCost;
    
    console.log(`   Data Transfer: $${dataCost.toFixed(2)}`);
    console.log(`   Requests: $${requestCost.toFixed(2)}`);
    console.log(`   Total: $${totalCost.toFixed(2)}`);
    
    const monthlyCost = (totalCost / days) * 30;
    console.log(`   Projected Monthly: $${monthlyCost.toFixed(2)}`);
    
    // Cache savings
    if (cacheHitRate > 0) {
      const cacheSavings = (cacheHitRate / 100) * gbOut;
      console.log(`\n💾 Cache Savings:`);
      console.log(`   Data served from cache: ${cacheSavings.toFixed(2)} GB`);
      console.log(`   Origin requests avoided: ${Math.round((cacheHitRate / 100) * requests).toLocaleString()}`);
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (results.Requests.datapoints === 0) {
      console.log('\n⚠️  No data available yet.');
      console.log('   This is normal for a newly created distribution.');
      console.log('   Metrics will appear after the distribution receives traffic.');
      console.log('   Check again in 24-48 hours after deployment.');
    }
    
  } catch (error) {
    console.error('❌ Error fetching metrics:', error);
  }
}

async function checkAllDistributions() {
  try {
    console.log('🔍 Finding CloudFront distributions...\n');
    
    const response = await cloudfront.send(new ListDistributionsCommand({}));
    
    if (!response.DistributionList || response.DistributionList.Quantity === 0) {
      console.log('No CloudFront distributions found.');
      return;
    }
    
    console.log(`Found ${response.DistributionList.Quantity} distribution(s):\n`);
    
    for (let i = 0; i < response.DistributionList.Items.length; i++) {
      const dist = response.DistributionList.Items[i];
      console.log(`${i + 1}. ${dist.Id}`);
      console.log(`   Domain: ${dist.DomainName}`);
      console.log(`   Status: ${dist.Status}`);
      console.log('');
      
      // Get metrics for each distribution
      await getCloudFrontMetrics(dist.Id, 30);
      
      if (i < response.DistributionList.Items.length - 1) {
        console.log('\n' + '='.repeat(60) + '\n');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run for specific distribution or all
const distributionId = process.argv[2];

if (distributionId) {
  getCloudFrontMetrics(distributionId, 30);
} else {
  checkAllDistributions();
}
