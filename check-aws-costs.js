const { CostExplorerClient, GetCostAndUsageCommand } = require('@aws-sdk/client-cost-explorer');

const costExplorer = new CostExplorerClient({ region: 'us-east-1' });

async function checkAWSCosts() {
  try {
    console.log('💰 Checking AWS costs...\n');
    
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const response = await costExplorer.send(new GetCostAndUsageCommand({
      TimePeriod: {
        Start: firstDayOfMonth.toISOString().split('T')[0],
        End: today.toISOString().split('T')[0]
      },
      Granularity: 'MONTHLY',
      Metrics: ['UnblendedCost'],
      GroupBy: [
        {
          Type: 'DIMENSION',
          Key: 'SERVICE'
        }
      ]
    }));

    console.log('📊 Current Month Costs (Month-to-Date)\n');
    console.log('='.repeat(60));
    
    let totalCost = 0;
    const services = response.ResultsByTime[0].Groups;
    
    // Sort by cost (highest first)
    services.sort((a, b) => {
      const costA = parseFloat(a.Metrics.UnblendedCost.Amount);
      const costB = parseFloat(b.Metrics.UnblendedCost.Amount);
      return costB - costA;
    });
    
    services.forEach(service => {
      const serviceName = service.Keys[0];
      const cost = parseFloat(service.Metrics.UnblendedCost.Amount);
      totalCost += cost;
      
      if (cost > 0.01) { // Only show services costing more than 1 cent
        console.log(`${serviceName.padEnd(40)} $${cost.toFixed(2)}`);
      }
    });
    
    console.log('='.repeat(60));
    console.log(`${'TOTAL'.padEnd(40)} $${totalCost.toFixed(2)}`);
    
    // Estimate end of month
    const daysInMonth = lastDayOfMonth.getDate();
    const daysPassed = today.getDate();
    const estimatedMonthly = (totalCost / daysPassed) * daysInMonth;
    
    console.log('\n📈 Projected Monthly Total: $' + estimatedMonthly.toFixed(2));
    
    // Breakdown by service category
    console.log('\n🔍 Key Services:');
    const keyServices = {
      'CloudFront': services.find(s => s.Keys[0].includes('CloudFront')),
      'S3': services.find(s => s.Keys[0].includes('S3')),
      'DynamoDB': services.find(s => s.Keys[0].includes('DynamoDB')),
      'Cognito': services.find(s => s.Keys[0].includes('Cognito')),
      'API Gateway': services.find(s => s.Keys[0].includes('API Gateway')),
      'Lambda': services.find(s => s.Keys[0].includes('Lambda')),
      'Amplify': services.find(s => s.Keys[0].includes('Amplify'))
    };
    
    Object.entries(keyServices).forEach(([name, service]) => {
      if (service) {
        const cost = parseFloat(service.Metrics.UnblendedCost.Amount);
        console.log(`   ${name}: $${cost.toFixed(2)}`);
      } else {
        console.log(`   ${name}: $0.00 (or not used)`);
      }
    });
    
    // Warnings
    console.log('\n⚠️  Cost Alerts:');
    if (estimatedMonthly > 100) {
      console.log('   ⚠️  Projected monthly cost exceeds $100');
    } else if (estimatedMonthly > 50) {
      console.log('   ⚠️  Projected monthly cost exceeds $50');
    } else {
      console.log('   ✅ Costs are within reasonable range');
    }
    
    console.log('\n💡 Tips to Reduce Costs:');
    console.log('   - Enable S3 Intelligent-Tiering for old files');
    console.log('   - Set up S3 lifecycle policies to archive old videos');
    console.log('   - Use CloudFront caching effectively');
    console.log('   - Monitor and delete unused resources');
    console.log('   - Set up AWS Budgets for cost alerts');

  } catch (error) {
    console.error('❌ Error checking costs:', error);
    
    if (error.name === 'AccessDeniedException') {
      console.log('\n⚠️  Your AWS credentials don\'t have Cost Explorer permissions.');
      console.log('   Add the "ce:GetCostAndUsage" permission to your IAM user/role.');
    }
  }
}

checkAWSCosts();
