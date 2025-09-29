#!/usr/bin/env node

/**
 * Production Monitoring Setup Script
 * Sets up CloudWatch log groups, alarms, and monitoring dashboards
 */

const { CloudWatchLogsClient, CreateLogGroupCommand, PutRetentionPolicyCommand } = require('@aws-sdk/client-cloudwatch-logs');
const { CloudWatchClient, PutMetricAlarmCommand, PutDashboardCommand } = require('@aws-sdk/client-cloudwatch');
const { SNSClient, CreateTopicCommand, SubscribeCommand } = require('@aws-sdk/client-sns');

const cloudWatchLogs = new CloudWatchLogsClient({ region: 'us-east-1' });
const cloudWatch = new CloudWatchClient({ region: 'us-east-1' });
const sns = new SNSClient({ region: 'us-east-1' });

// Configuration
const LOG_GROUP_NAME = 'classcast-application-logs';
const ALARM_EMAIL = process.env.ALARM_EMAIL || 'admin@class-cast.com';
const DASHBOARD_NAME = 'ClassCast-Production-Dashboard';

async function setupLogGroups() {
  console.log('📝 Setting up CloudWatch log groups...');
  
  try {
    // Create main application log group
    await cloudWatchLogs.send(new CreateLogGroupCommand({
      logGroupName: LOG_GROUP_NAME
    }));
    console.log(`✅ Created log group: ${LOG_GROUP_NAME}`);
    
    // Set retention policy (30 days)
    await cloudWatchLogs.send(new PutRetentionPolicyCommand({
      logGroupName: LOG_GROUP_NAME,
      retentionInDays: 30
    }));
    console.log(`✅ Set retention policy for ${LOG_GROUP_NAME}: 30 days`);
    
  } catch (error) {
    if (error.name === 'ResourceAlreadyExistsException') {
      console.log(`ℹ️  Log group ${LOG_GROUP_NAME} already exists`);
    } else {
      console.error('❌ Error creating log group:', error.message);
    }
  }
}

async function setupAlarms() {
  console.log('🚨 Setting up CloudWatch alarms...');
  
  const alarms = [
    {
      name: 'ClassCast-High-Error-Rate',
      description: 'High error rate in ClassCast application',
      metricName: 'Errors',
      namespace: 'ClassCast/API',
      threshold: 10,
      period: 300, // 5 minutes
      evaluationPeriods: 2,
      comparisonOperator: 'GreaterThanThreshold'
    },
    {
      name: 'ClassCast-High-Response-Time',
      description: 'High response time in ClassCast application',
      metricName: 'API_Duration',
      namespace: 'ClassCast/API',
      threshold: 5000, // 5 seconds
      period: 300,
      evaluationPeriods: 2,
      comparisonOperator: 'GreaterThanThreshold'
    },
    {
      name: 'ClassCast-Low-Health-Check',
      description: 'Health check failing',
      metricName: 'Health_Check_Status',
      namespace: 'ClassCast/API',
      threshold: 1,
      period: 60,
      evaluationPeriods: 1,
      comparisonOperator: 'LessThanThreshold'
    }
  ];
  
  for (const alarm of alarms) {
    try {
      await cloudWatch.send(new PutMetricAlarmCommand({
        AlarmName: alarm.name,
        AlarmDescription: alarm.description,
        MetricName: alarm.metricName,
        Namespace: alarm.namespace,
        Statistic: 'Sum',
        Period: alarm.period,
        EvaluationPeriods: alarm.evaluationPeriods,
        Threshold: alarm.threshold,
        ComparisonOperator: alarm.comparisonOperator,
        TreatMissingData: 'notBreaching'
      }));
      console.log(`✅ Created alarm: ${alarm.name}`);
    } catch (error) {
      console.error(`❌ Error creating alarm ${alarm.name}:`, error.message);
    }
  }
}

async function setupDashboard() {
  console.log('📊 Setting up CloudWatch dashboard...');
  
  const dashboardBody = {
    widgets: [
      {
        type: 'metric',
        x: 0,
        y: 0,
        width: 12,
        height: 6,
        properties: {
          metrics: [
            ['ClassCast/API', 'API_Calls'],
            ['.', 'Errors'],
            ['.', 'API_Duration']
          ],
          view: 'timeSeries',
          stacked: false,
          region: 'us-east-1',
          title: 'API Performance',
          period: 300
        }
      },
      {
        type: 'metric',
        x: 12,
        y: 0,
        width: 12,
        height: 6,
        properties: {
          metrics: [
            ['ClassCast/API', 'Health_Check_Status'],
            ['.', 'Database_Operations'],
            ['.', 'File_Uploads']
          ],
          view: 'timeSeries',
          stacked: false,
          region: 'us-east-1',
          title: 'System Health',
          period: 300
        }
      },
      {
        type: 'log',
        x: 0,
        y: 6,
        width: 24,
        height: 6,
        properties: {
          query: `SOURCE '${LOG_GROUP_NAME}' | fields @timestamp, @message\n| filter @message like /ERROR/\n| sort @timestamp desc\n| limit 20`,
          region: 'us-east-1',
          title: 'Recent Errors',
          view: 'table'
        }
      }
    ]
  };
  
  try {
    await cloudWatch.send(new PutDashboardCommand({
      DashboardName: DASHBOARD_NAME,
      DashboardBody: JSON.stringify(dashboardBody)
    }));
    console.log(`✅ Created dashboard: ${DASHBOARD_NAME}`);
  } catch (error) {
    console.error('❌ Error creating dashboard:', error.message);
  }
}

async function setupSNSAlerts() {
  console.log('📧 Setting up SNS alerts...');
  
  try {
    // Create SNS topic
    const topicResult = await sns.send(new CreateTopicCommand({
      Name: 'classcast-alerts'
    }));
    
    const topicArn = topicResult.TopicArn;
    console.log(`✅ Created SNS topic: ${topicArn}`);
    
    // Subscribe email to topic
    await sns.send(new SubscribeCommand({
      TopicArn: topicArn,
      Protocol: 'email',
      Endpoint: ALARM_EMAIL
    }));
    console.log(`✅ Subscribed ${ALARM_EMAIL} to alerts`);
    
    return topicArn;
  } catch (error) {
    console.error('❌ Error setting up SNS alerts:', error.message);
    return null;
  }
}

async function setupMonitoring() {
  console.log('🚀 Setting up production monitoring...');
  
  try {
    await setupLogGroups();
    await setupAlarms();
    await setupDashboard();
    const topicArn = await setupSNSAlerts();
    
    console.log('\n🎉 Production monitoring setup completed!');
    console.log('\n📋 Summary:');
    console.log(`   - Log Group: ${LOG_GROUP_NAME}`);
    console.log(`   - Dashboard: ${DASHBOARD_NAME}`);
    console.log(`   - Alerts: ${ALARM_EMAIL}`);
    if (topicArn) {
      console.log(`   - SNS Topic: ${topicArn}`);
    }
    
    console.log('\n📖 Next Steps:');
    console.log('   1. Check your email and confirm the SNS subscription');
    console.log('   2. Visit the CloudWatch dashboard to view metrics');
    console.log('   3. Configure additional alarms as needed');
    console.log('   4. Set up log-based alerts for specific error patterns');
    
  } catch (error) {
    console.error('❌ Error setting up monitoring:', error);
    process.exit(1);
  }
}

// Run the setup
setupMonitoring();
