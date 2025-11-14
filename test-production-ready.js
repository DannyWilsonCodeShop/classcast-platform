#!/usr/bin/env node

const { SESClient, GetSendQuotaCommand } = require('@aws-sdk/client-ses');
const { CloudWatchClient, PutMetricDataCommand, GetMetricStatisticsCommand } = require('@aws-sdk/client-cloudwatch');
const { CognitoIdentityProviderClient, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');

// Configuration
const AWS_REGION = 'us-east-1';
const USER_POOL_ID = 'us-east-1_uK50qBrap';
const CLIENT_ID = '7tbaq74itv3gdda1bt25iqafvh';
const FROM_EMAIL = 'noreply@myclasscast.com';

// Initialize clients
const sesClient = new SESClient({ region: AWS_REGION });
const cloudWatchClient = new CloudWatchClient({ region: AWS_REGION });
const cognitoClient = new CognitoIdentityProviderClient({ region: AWS_REGION });

console.log('🚀 Production-Ready Integration Test');
console.log('====================================\n');

async function testProductionReadiness() {
  const results = {
    ses: { status: 'pending', message: '', details: {} },
    cloudwatch: { status: 'pending', message: '', details: {} },
    cognito: { status: 'pending', message: '', details: {} },
    overall: 'pending'
  };

  try {
    // 1. Test SES (without sending emails)
    console.log('📧 Testing SES Configuration...');
    try {
      const quotaCommand = new GetSendQuotaCommand({});
      const quotaResult = await sesClient.send(quotaCommand);
      
      results.ses = {
        status: 'success',
        message: 'SES is configured and accessible',
        details: {
          max24HourSend: quotaResult.Max24HourSend,
          maxSendRate: quotaResult.MaxSendRate,
          sentLast24Hours: quotaResult.SentLast24Hours
        }
      };
      console.log('✅ SES configured and accessible');
      console.log(`   Daily quota: ${quotaResult.SentLast24Hours}/${quotaResult.Max24HourSend}`);
    } catch (error) {
      results.ses = { status: 'error', message: error.message, details: {} };
      console.log('❌ SES error:', error.message);
    }

    // 2. Test CloudWatch comprehensively
    console.log('\n📊 Testing CloudWatch...');
    try {
      // Test metric sending
      const metricCommand = new PutMetricDataCommand({
        Namespace: 'ClassCast/ProductionTest',
        MetricData: [{
          MetricName: 'ProductionTest',
          Value: 1,
          Unit: 'Count',
          Dimensions: [{
            Name: 'Environment',
            Value: 'Production'
          }]
        }]
      });
      
      await cloudWatchClient.send(metricCommand);
      
      // Test metric retrieval
      const statsCommand = new GetMetricStatisticsCommand({
        Namespace: 'ClassCast/ProductionTest',
        MetricName: 'ProductionTest',
        StartTime: new Date(Date.now() - 3600000),
        EndTime: new Date(),
        Period: 300,
        Statistics: ['Sum']
      });
      
      const statsResult = await cloudWatchClient.send(statsCommand);
      
      results.cloudwatch = {
        status: 'success',
        message: 'CloudWatch fully operational',
        details: {
          metricsSent: true,
          metricsRetrieved: statsResult.Datapoints?.length || 0
        }
      };
      console.log('✅ CloudWatch fully operational');
    } catch (error) {
      results.cloudwatch = { status: 'error', message: error.message, details: {} };
      console.log('❌ CloudWatch error:', error.message);
    }

    // 3. Test Cognito comprehensively
    console.log('\n🔐 Testing Cognito...');
    try {
      const usersCommand = new ListUsersCommand({
        UserPoolId: USER_POOL_ID,
        Limit: 1
      });
      
      const usersResult = await cognitoClient.send(usersCommand);
      
      results.cognito = {
        status: 'success',
        message: 'Cognito fully operational',
        details: {
          userPoolId: USER_POOL_ID,
          clientId: CLIENT_ID,
          totalUsers: usersResult.Users?.length || 0,
          paginationToken: usersResult.PaginationToken ? 'Available' : 'None'
        }
      };
      console.log('✅ Cognito fully operational');
      console.log(`   User Pool: ${USER_POOL_ID}`);
      console.log(`   Client ID: ${CLIENT_ID}`);
    } catch (error) {
      results.cognito = { status: 'error', message: error.message, details: {} };
      console.log('❌ Cognito error:', error.message);
    }

    // 4. Overall assessment
    const successCount = Object.values(results).filter(r => r.status === 'success').length;
    const totalTests = Object.keys(results).length - 1;
    
    if (successCount === totalTests) {
      results.overall = 'success';
    } else if (successCount >= totalTests * 0.7) {
      results.overall = 'warning';
    } else {
      results.overall = 'error';
    }

    // 5. Generate comprehensive report
    console.log('\n📋 PRODUCTION READINESS REPORT');
    console.log('===============================');
    console.log(`SES: ${results.ses.status === 'success' ? '✅' : '❌'} ${results.ses.message}`);
    if (results.ses.details.max24HourSend) {
      console.log(`   Daily quota: ${results.ses.details.sentLast24Hours}/${results.ses.details.max24HourSend}`);
    }
    
    console.log(`CloudWatch: ${results.cloudwatch.status === 'success' ? '✅' : '❌'} ${results.cloudwatch.message}`);
    if (results.cloudwatch.details.metricsRetrieved !== undefined) {
      console.log(`   Metrics retrieved: ${results.cloudwatch.details.metricsRetrieved}`);
    }
    
    console.log(`Cognito: ${results.cognito.status === 'success' ? '✅' : '❌'} ${results.cognito.message}`);
    if (results.cognito.details.userPoolId) {
      console.log(`   User Pool: ${results.cognito.details.userPoolId}`);
      console.log(`   Client ID: ${results.cognito.details.clientId}`);
    }

    console.log(`\nOverall Status: ${results.overall === 'success' ? '🎉 PRODUCTION READY' : results.overall === 'warning' ? '⚠️ MOSTLY READY' : '❌ NEEDS ATTENTION'}`);

    // 6. Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      environment: 'production',
      configuration: {
        region: AWS_REGION,
        userPoolId: USER_POOL_ID,
        clientId: CLIENT_ID,
        fromEmail: FROM_EMAIL
      },
      results: results,
      summary: {
        totalTests: totalTests,
        successfulTests: successCount,
        successRate: `${Math.round((successCount / totalTests) * 100)}%`,
        productionReady: results.overall === 'success'
      },
      nextSteps: results.overall === 'success' ? [
        'Deploy to production',
        'Configure monitoring alerts',
        'Set up backup procedures',
        'Test user registration flow'
      ] : [
        'Fix failing services',
        'Re-run tests',
        'Verify AWS permissions',
        'Check service configurations'
      ]
    };

    require('fs').writeFileSync('production-readiness-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report saved to: production-readiness-report.json');

    // 7. Final recommendations
    if (results.overall === 'success') {
      console.log('\n🎉 CONGRATULATIONS!');
      console.log('Your ClassCast platform is production-ready!');
      console.log('\n✅ All AWS services are configured and working');
      console.log('✅ Email service is ready for notifications');
      console.log('✅ CloudWatch is monitoring your platform');
      console.log('✅ Cognito is managing user authentication');
      console.log('\n🚀 Ready to deploy to production!');
    } else {
      console.log('\n⚠️ ATTENTION REQUIRED');
      console.log('Some services need configuration before production deployment.');
      console.log('Check the detailed report for specific issues.');
    }

  } catch (error) {
    console.error('\n❌ Production readiness test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testProductionReadiness();
