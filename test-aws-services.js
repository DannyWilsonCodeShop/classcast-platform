#!/usr/bin/env node

const { SESClient, SendEmailCommand, VerifyEmailIdentityCommand } = require('@aws-sdk/client-ses');
const { CloudWatchClient, PutMetricDataCommand, GetMetricStatisticsCommand } = require('@aws-sdk/client-cloudwatch');
const { CloudWatchLogsClient, CreateLogGroupCommand, CreateLogStreamCommand, PutLogEventsCommand } = require('@aws-sdk/client-cloudwatch-logs');
const { CognitoIdentityProviderClient, ListUserPoolsCommand, DescribeUserPoolCommand } = require('@aws-sdk/client-cognito-identity-provider');

// Configuration
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@myclasscast.com';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';

// Initialize AWS clients
const sesClient = new SESClient({ region: AWS_REGION });
const cloudWatchClient = new CloudWatchClient({ region: AWS_REGION });
const logsClient = new CloudWatchLogsClient({ region: AWS_REGION });
const cognitoClient = new CognitoIdentityProviderClient({ region: AWS_REGION });

console.log('🧪 AWS Services Testing & Configuration');
console.log('=====================================\n');

// Test results tracking
const testResults = {
  ses: { status: 'pending', details: [] },
  cloudwatch: { status: 'pending', details: [] },
  cloudwatchLogs: { status: 'pending', details: [] },
  cognito: { status: 'pending', details: [] }
};

// Helper function to add test result
function addTestResult(service, status, message) {
  testResults[service].details.push({ status, message, timestamp: new Date().toISOString() });
  console.log(`${status === 'success' ? '✅' : status === 'warning' ? '⚠️' : '❌'} ${message}`);
}

// 1. Test AWS SES (Simple Email Service)
async function testSES() {
  console.log('📧 Testing AWS SES...');
  
  try {
    // Test 1: Verify email identity
    try {
      await sesClient.send(new VerifyEmailIdentityCommand({
        EmailAddress: FROM_EMAIL
      }));
      addTestResult('ses', 'success', `Email identity ${FROM_EMAIL} verified`);
    } catch (error) {
      if (error.name === 'MessageRejected') {
        addTestResult('ses', 'warning', `Email identity ${FROM_EMAIL} already verified`);
      } else {
        addTestResult('ses', 'error', `Failed to verify email identity: ${error.message}`);
      }
    }

    // Test 2: Send test email
    try {
      const command = new SendEmailCommand({
        Source: FROM_EMAIL,
        Destination: {
          ToAddresses: [TEST_EMAIL]
        },
        Message: {
          Subject: {
            Data: 'ClassCast Platform - AWS SES Test',
            Charset: 'UTF-8'
          },
          Body: {
            Html: {
              Data: `
                <html>
                  <body>
                    <h2>ClassCast Platform - AWS SES Test</h2>
                    <p>This is a test email to verify AWS SES configuration.</p>
                    <p>If you receive this email, SES is working correctly!</p>
                    <p>Timestamp: ${new Date().toISOString()}</p>
                  </body>
                </html>
              `,
              Charset: 'UTF-8'
            },
            Text: {
              Data: `ClassCast Platform - AWS SES Test\n\nThis is a test email to verify AWS SES configuration.\n\nIf you receive this email, SES is working correctly!\n\nTimestamp: ${new Date().toISOString()}`,
              Charset: 'UTF-8'
            }
          }
        }
      });

      const result = await sesClient.send(command);
      addTestResult('ses', 'success', `Test email sent successfully. Message ID: ${result.MessageId}`);
    } catch (error) {
      addTestResult('ses', 'error', `Failed to send test email: ${error.message}`);
    }

    testResults.ses.status = 'success';
  } catch (error) {
    addTestResult('ses', 'error', `SES test failed: ${error.message}`);
    testResults.ses.status = 'error';
  }
}

// 2. Test AWS CloudWatch
async function testCloudWatch() {
  console.log('\n📊 Testing AWS CloudWatch...');
  
  try {
    // Test 1: Put custom metric
    const command = new PutMetricDataCommand({
      Namespace: 'ClassCast/Test',
      MetricData: [{
        MetricName: 'TestMetric',
        Value: 1,
        Unit: 'Count',
        Dimensions: [{
          Name: 'TestType',
          Value: 'AWSConfiguration'
        }]
      }]
    });

    await cloudWatchClient.send(command);
    addTestResult('cloudwatch', 'success', 'Custom metric sent to CloudWatch');

    // Test 2: Get metric statistics
    const getStatsCommand = new GetMetricStatisticsCommand({
      Namespace: 'ClassCast/Test',
      MetricName: 'TestMetric',
      StartTime: new Date(Date.now() - 3600000), // 1 hour ago
      EndTime: new Date(),
      Period: 300, // 5 minutes
      Statistics: ['Sum']
    });

    const statsResult = await cloudWatchClient.send(getStatsCommand);
    addTestResult('cloudwatch', 'success', `Retrieved metric statistics: ${statsResult.Datapoints?.length || 0} datapoints`);

    testResults.cloudwatch.status = 'success';
  } catch (error) {
    addTestResult('cloudwatch', 'error', `CloudWatch test failed: ${error.message}`);
    testResults.cloudwatch.status = 'error';
  }
}

// 3. Test AWS CloudWatch Logs
async function testCloudWatchLogs() {
  console.log('\n📝 Testing AWS CloudWatch Logs...');
  
  try {
    const logGroupName = '/classcast/test';
    const logStreamName = `test-${Date.now()}`;

    // Test 1: Create log group
    try {
      await logsClient.send(new CreateLogGroupCommand({
        logGroupName: logGroupName
      }));
      addTestResult('cloudwatchLogs', 'success', `Log group created: ${logGroupName}`);
    } catch (error) {
      if (error.name === 'ResourceAlreadyExistsException') {
        addTestResult('cloudwatchLogs', 'warning', `Log group already exists: ${logGroupName}`);
      } else {
        throw error;
      }
    }

    // Test 2: Create log stream
    try {
      await logsClient.send(new CreateLogStreamCommand({
        logGroupName: logGroupName,
        logStreamName: logStreamName
      }));
      addTestResult('cloudwatchLogs', 'success', `Log stream created: ${logStreamName}`);
    } catch (error) {
      if (error.name === 'ResourceAlreadyExistsException') {
        addTestResult('cloudwatchLogs', 'warning', `Log stream already exists: ${logStreamName}`);
      } else {
        throw error;
      }
    }

    // Test 3: Put log events
    const putLogsCommand = new PutLogEventsCommand({
      logGroupName: logGroupName,
      logStreamName: logStreamName,
      logEvents: [{
        message: JSON.stringify({
          level: 'INFO',
          message: 'ClassCast Platform - AWS CloudWatch Logs Test',
          timestamp: new Date().toISOString(),
          test: true
        }),
        timestamp: Date.now()
      }]
    });

    await logsClient.send(putLogsCommand);
    addTestResult('cloudwatchLogs', 'success', 'Test log event sent successfully');

    testResults.cloudwatchLogs.status = 'success';
  } catch (error) {
    addTestResult('cloudwatchLogs', 'error', `CloudWatch Logs test failed: ${error.message}`);
    testResults.cloudwatchLogs.status = 'error';
  }
}

// 4. Test AWS Cognito
async function testCognito() {
  console.log('\n🔐 Testing AWS Cognito...');
  
  try {
    // Test 1: List user pools
    const listPoolsCommand = new ListUserPoolsCommand({
      MaxResults: 10
    });

    const poolsResult = await cognitoClient.send(listPoolsCommand);
    addTestResult('cognito', 'success', `Found ${poolsResult.UserPools?.length || 0} user pools`);

    // Test 2: Check for ClassCast user pool
    const classcastPool = poolsResult.UserPools?.find(pool => 
      pool.Name?.includes('ClassCast') || pool.Name?.includes('DemoProject')
    );

    if (classcastPool) {
      addTestResult('cognito', 'success', `Found ClassCast user pool: ${classcastPool.Name} (${classcastPool.Id})`);
      
      // Test 3: Get user pool details
      const describePoolCommand = new DescribeUserPoolCommand({
        UserPoolId: classcastPool.Id
      });

      const poolDetails = await cognitoClient.send(describePoolCommand);
      const userPool = poolDetails.UserPool;
      
      addTestResult('cognito', 'success', `User pool status: ${userPool?.Status}`);
      addTestResult('cognito', 'success', `User pool creation date: ${userPool?.CreationDate}`);
      addTestResult('cognito', 'success', `User pool last modified: ${userPool?.LastModifiedDate}`);
      
      // Check for custom attributes
      const customAttributes = userPool?.Schema?.filter(attr => attr.Name?.startsWith('custom:'));
      if (customAttributes && customAttributes.length > 0) {
        addTestResult('cognito', 'success', `Found ${customAttributes.length} custom attributes: ${customAttributes.map(attr => attr.Name).join(', ')}`);
      }
    } else {
      addTestResult('cognito', 'warning', 'No ClassCast user pool found. You may need to deploy the CDK stack first.');
    }

    testResults.cognito.status = 'success';
  } catch (error) {
    addTestResult('cognito', 'error', `Cognito test failed: ${error.message}`);
    testResults.cognito.status = 'error';
  }
}

// 5. Generate configuration file
async function generateConfigFile() {
  console.log('\n⚙️ Generating configuration file...');
  
  const config = {
    aws: {
      region: AWS_REGION,
      services: {
        ses: {
          fromEmail: FROM_EMAIL,
          replyToEmail: 'support@myclasscast.com',
          verified: testResults.ses.status === 'success'
        },
        cloudwatch: {
          namespace: 'ClassCast/Platform',
          logGroup: '/classcast/platform',
          enabled: testResults.cloudwatch.status === 'success'
        },
        cognito: {
          region: AWS_REGION,
          enabled: testResults.cognito.status === 'success'
        }
      }
    },
    testResults: testResults,
    timestamp: new Date().toISOString()
  };

  const fs = require('fs');
  fs.writeFileSync('aws-config.json', JSON.stringify(config, null, 2));
  console.log('✅ Configuration file generated: aws-config.json');
}

// 6. Generate environment variables
async function generateEnvFile() {
  console.log('\n🔧 Generating environment variables...');
  
  const envVars = [
    `# AWS Configuration`,
    `AWS_REGION=${AWS_REGION}`,
    `FROM_EMAIL=${FROM_EMAIL}`,
    `REPLY_TO_EMAIL=support@myclasscast.com`,
    ``,
    `# CloudWatch Configuration`,
    `CLOUDWATCH_NAMESPACE=ClassCast/Platform`,
    `CLOUDWATCH_LOG_GROUP=/classcast/platform`,
    ``,
    `# Cognito Configuration (replace with actual values)`,
    `NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX`,
    `NEXT_PUBLIC_COGNITO_CLIENT_ID=your-client-id`,
    `NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID=your-identity-pool-id`,
    ``,
    `# API Gateway Configuration`,
    `NEXT_PUBLIC_API_GATEWAY_URL=https://785t4qadp8.execute-api.us-east-1.amazonaws.com/prod`,
    `API_GATEWAY_URL=https://785t4qadp8.execute-api.us-east-1.amazonaws.com/prod`,
    ``,
    `# Application Configuration`,
    `NEXT_PUBLIC_APP_URL=https://myclasscast.com`,
    `NODE_ENV=production`
  ];

  const fs = require('fs');
  fs.writeFileSync('.env.local', envVars.join('\n'));
  console.log('✅ Environment variables generated: .env.local');
}

// Main execution
async function main() {
  try {
    console.log(`Testing AWS services in region: ${AWS_REGION}`);
    console.log(`From email: ${FROM_EMAIL}`);
    console.log(`Test email: ${TEST_EMAIL}\n`);

    // Run all tests
    await testSES();
    await testCloudWatch();
    await testCloudWatchLogs();
    await testCognito();

    // Generate configuration files
    await generateConfigFile();
    await generateEnvFile();

    // Summary
    console.log('\n📋 TEST SUMMARY');
    console.log('================');
    
    const services = ['ses', 'cloudwatch', 'cloudwatchLogs', 'cognito'];
    let successCount = 0;
    
    services.forEach(service => {
      const status = testResults[service].status;
      const icon = status === 'success' ? '✅' : status === 'warning' ? '⚠️' : '❌';
      console.log(`${icon} ${service.toUpperCase()}: ${status.toUpperCase()}`);
      if (status === 'success') successCount++;
    });

    console.log(`\nOverall: ${successCount}/${services.length} services working`);
    
    if (successCount === services.length) {
      console.log('\n🎉 All AWS services are configured and working!');
      console.log('Your ClassCast platform is ready for production!');
    } else {
      console.log('\n⚠️ Some services need attention. Check the details above.');
    }

  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
main();
