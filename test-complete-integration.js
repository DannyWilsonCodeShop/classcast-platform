#!/usr/bin/env node

const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');
const { CognitoIdentityProviderClient, InitiateAuthCommand, SignUpCommand } = require('@aws-sdk/client-cognito-identity-provider');

// Configuration
const AWS_REGION = 'us-east-1';
const USER_POOL_ID = 'us-east-1_uK50qBrap';
const CLIENT_ID = '7tbaq74itv3gdda1bt25iqafvh';
const FROM_EMAIL = 'noreply@myclasscast.com';
const TEST_EMAIL = 'test@example.com';

// Initialize clients
const sesClient = new SESClient({ region: AWS_REGION });
const cloudWatchClient = new CloudWatchClient({ region: AWS_REGION });
const cognitoClient = new CognitoIdentityProviderClient({ region: AWS_REGION });

console.log('🧪 Complete Integration Test');
console.log('============================\n');

async function testCompleteIntegration() {
  const results = {
    email: { status: 'pending', message: '' },
    cloudwatch: { status: 'pending', message: '' },
    cognito: { status: 'pending', message: '' },
    overall: 'pending'
  };

  try {
    // 1. Test Email Service
    console.log('📧 Testing Email Service...');
    try {
      const emailCommand = new SendEmailCommand({
        Source: FROM_EMAIL,
        Destination: { ToAddresses: [TEST_EMAIL] },
        Message: {
          Subject: { Data: 'ClassCast Integration Test', Charset: 'UTF-8' },
          Body: {
            Html: {
              Data: '<h2>ClassCast Integration Test</h2><p>All services are working correctly!</p>',
              Charset: 'UTF-8'
            }
          }
        }
      });
      
      await sesClient.send(emailCommand);
      results.email = { status: 'success', message: 'Email sent successfully' };
      console.log('✅ Email service working');
    } catch (error) {
      results.email = { status: 'error', message: error.message };
      console.log('❌ Email service error:', error.message);
    }

    // 2. Test CloudWatch
    console.log('\n📊 Testing CloudWatch...');
    try {
      const metricCommand = new PutMetricDataCommand({
        Namespace: 'ClassCast/IntegrationTest',
        MetricData: [{
          MetricName: 'IntegrationTest',
          Value: 1,
          Unit: 'Count',
          Dimensions: [{
            Name: 'TestType',
            Value: 'CompleteIntegration'
          }]
        }]
      });
      
      await cloudWatchClient.send(metricCommand);
      results.cloudwatch = { status: 'success', message: 'Metric sent successfully' };
      console.log('✅ CloudWatch working');
    } catch (error) {
      results.cloudwatch = { status: 'error', message: error.message };
      console.log('❌ CloudWatch error:', error.message);
    }

    // 3. Test Cognito (without actually creating a user)
    console.log('\n🔐 Testing Cognito...');
    try {
      // Test if we can access the user pool (this will fail if not accessible)
      const testCommand = new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: CLIENT_ID,
        AuthParameters: {
          USERNAME: 'test@nonexistent.com',
          PASSWORD: 'TestPassword123!'
        }
      });
      
      try {
        await cognitoClient.send(testCommand);
      } catch (error) {
        // We expect this to fail with "User does not exist" which means Cognito is working
        if (error.name === 'UserNotFoundException' || error.name === 'NotAuthorizedException') {
          results.cognito = { status: 'success', message: 'Cognito accessible and responding' };
          console.log('✅ Cognito working');
        } else {
          throw error;
        }
      }
    } catch (error) {
      results.cognito = { status: 'error', message: error.message };
      console.log('❌ Cognito error:', error.message);
    }

    // 4. Overall assessment
    const successCount = Object.values(results).filter(r => r.status === 'success').length;
    const totalTests = Object.keys(results).length - 1; // Exclude 'overall'
    
    if (successCount === totalTests) {
      results.overall = 'success';
    } else if (successCount >= totalTests * 0.7) {
      results.overall = 'warning';
    } else {
      results.overall = 'error';
    }

    // 5. Generate test report
    console.log('\n📋 INTEGRATION TEST REPORT');
    console.log('==========================');
    console.log(`Email Service: ${results.email.status === 'success' ? '✅' : '❌'} ${results.email.message}`);
    console.log(`CloudWatch: ${results.cloudwatch.status === 'success' ? '✅' : '❌'} ${results.cloudwatch.message}`);
    console.log(`Cognito: ${results.cognito.status === 'success' ? '✅' : '❌'} ${results.cognito.message}`);
    console.log(`\nOverall Status: ${results.overall === 'success' ? '🎉 SUCCESS' : results.overall === 'warning' ? '⚠️ WARNING' : '❌ ERROR'}`);

    // 6. Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      configuration: {
        userPoolId: USER_POOL_ID,
        clientId: CLIENT_ID,
        region: AWS_REGION,
        fromEmail: FROM_EMAIL
      },
      results: results,
      summary: {
        totalTests: totalTests,
        successfulTests: successCount,
        successRate: `${Math.round((successCount / totalTests) * 100)}%`
      }
    };

    require('fs').writeFileSync('integration-test-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report saved to: integration-test-report.json');

    if (results.overall === 'success') {
      console.log('\n🚀 Your ClassCast platform is fully integrated and ready for production!');
      console.log('   All AWS services are configured and working correctly.');
    } else {
      console.log('\n⚠️ Some services need attention. Check the details above.');
    }

  } catch (error) {
    console.error('\n❌ Integration test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testCompleteIntegration();
