#!/usr/bin/env node

/**
 * Monitoring Alerts Setup
 * Configures CloudWatch alarms and SNS notifications for critical issues
 */

const { CloudWatchClient, PutMetricAlarmCommand, PutDashboardCommand } = require('@aws-sdk/client-cloudwatch');
const { SNSClient, CreateTopicCommand, SubscribeCommand, SetTopicAttributesCommand } = require('@aws-sdk/client-sns');
const { IAMClient, CreateRoleCommand, AttachRolePolicyCommand, PutRolePolicyCommand } = require('@aws-sdk/client-iam');

const cloudWatch = new CloudWatchClient({ region: 'us-east-1' });
const sns = new SNSClient({ region: 'us-east-1' });
const iam = new IAMClient({ region: 'us-east-1' });

// Configuration
const ALARM_EMAIL = process.env.ALARM_EMAIL || 'wilson.danny@me.com';
const ALARM_PHONE = process.env.ALARM_PHONE || '+1234567890';
const TOPIC_NAME = 'classcast-production-alerts';
const DASHBOARD_NAME = 'ClassCast-Production-Alerts';

// Alarm configurations
const alarms = [
  {
    name: 'ClassCast-High-Error-Rate',
    description: 'High error rate detected in ClassCast application',
    metricName: 'Errors',
    namespace: 'ClassCast/API',
    statistic: 'Sum',
    threshold: 10,
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 2,
    period: 300, // 5 minutes
    severity: 'HIGH'
  },
  {
    name: 'ClassCast-High-Response-Time',
    description: 'API response time is too high',
    metricName: 'API_Duration',
    namespace: 'ClassCast/API',
    statistic: 'Average',
    threshold: 2000, // 2 seconds
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 3,
    period: 300,
    severity: 'MEDIUM'
  },
  {
    name: 'ClassCast-Low-Health-Check',
    description: 'Health check is failing',
    metricName: 'Health_Check_Status',
    namespace: 'ClassCast/API',
    statistic: 'Minimum',
    threshold: 1,
    comparisonOperator: 'LessThanThreshold',
    evaluationPeriods: 1,
    period: 60,
    severity: 'CRITICAL'
  },
  {
    name: 'ClassCast-High-CPU-Usage',
    description: 'High CPU usage detected',
    metricName: 'CPUUtilization',
    namespace: 'AWS/EC2',
    statistic: 'Average',
    threshold: 80, // 80%
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 2,
    period: 300,
    severity: 'HIGH'
  },
  {
    name: 'ClassCast-High-Memory-Usage',
    description: 'High memory usage detected',
    metricName: 'MemoryUtilization',
    namespace: 'ClassCast/API',
    statistic: 'Average',
    threshold: 85, // 85%
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 2,
    period: 300,
    severity: 'HIGH'
  },
  {
    name: 'ClassCast-Database-Connection-Errors',
    description: 'Database connection errors detected',
    metricName: 'Database_Connection_Errors',
    namespace: 'ClassCast/API',
    statistic: 'Sum',
    threshold: 5,
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 1,
    period: 300,
    severity: 'CRITICAL'
  },
  {
    name: 'ClassCast-File-Upload-Failures',
    description: 'File upload failures detected',
    metricName: 'File_Upload_Failures',
    namespace: 'ClassCast/API',
    statistic: 'Sum',
    threshold: 10,
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 2,
    period: 300,
    severity: 'MEDIUM'
  },
  {
    name: 'ClassCast-Authentication-Failures',
    description: 'High number of authentication failures',
    metricName: 'Authentication_Failures',
    namespace: 'ClassCast/API',
    statistic: 'Sum',
    threshold: 20,
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 1,
    period: 300,
    severity: 'HIGH'
  }
];

async function createSNSTopic() {
  console.log('📧 Creating SNS topic for alerts...');
  
  try {
    const topicResult = await sns.send(new CreateTopicCommand({
      Name: TOPIC_NAME,
      Attributes: {
        DisplayName: 'ClassCast Production Alerts',
        DeliveryPolicy: JSON.stringify({
          http: {
            defaultHealthyRetryPolicy: {
              minDelayTarget: 1,
              maxDelayTarget: 60,
              numRetries: 3,
              numMaxDelayRetries: 0,
              numMinDelayRetries: 0,
              numNoDelayRetries: 0
            }
          }
        })
      }
    }));
    
    console.log(`✅ Created SNS topic: ${topicResult.TopicArn}`);
    return topicResult.TopicArn;
  } catch (error) {
    if (error.name === 'TopicAlreadyExistsException') {
      console.log(`ℹ️  SNS topic ${TOPIC_NAME} already exists`);
      // Get existing topic ARN
      return `arn:aws:sns:us-east-1:${process.env.AWS_ACCOUNT_ID || '463470937777'}:${TOPIC_NAME}`;
    } else {
      console.error('❌ Error creating SNS topic:', error.message);
      throw error;
    }
  }
}

async function subscribeToAlerts(topicArn) {
  console.log('📬 Setting up alert subscriptions...');
  
  try {
    // Subscribe email
    await sns.send(new SubscribeCommand({
      TopicArn: topicArn,
      Protocol: 'email',
      Endpoint: ALARM_EMAIL
    }));
    console.log(`✅ Subscribed email: ${ALARM_EMAIL}`);
    
    // Subscribe SMS (if phone number provided)
    if (ALARM_PHONE && ALARM_PHONE !== '+1234567890') {
      await sns.send(new SubscribeCommand({
        TopicArn: topicArn,
        Protocol: 'sms',
        Endpoint: ALARM_PHONE
      }));
      console.log(`✅ Subscribed SMS: ${ALARM_PHONE}`);
    }
    
    // Set topic attributes for better delivery
    try {
      await sns.send(new SetTopicAttributesCommand({
        TopicArn: topicArn,
        AttributeName: 'DeliveryStatusSuccessSamplingRate',
        AttributeValue: '100'
      }));
    } catch (error) {
      console.log('ℹ️  Could not set topic attributes (this is optional)');
    }
    
  } catch (error) {
    console.error('❌ Error setting up subscriptions:', error.message);
    throw error;
  }
}

async function createAlarms(topicArn) {
  console.log('🚨 Creating CloudWatch alarms...');
  
  for (const alarm of alarms) {
    try {
      await cloudWatch.send(new PutMetricAlarmCommand({
        AlarmName: alarm.name,
        AlarmDescription: alarm.description,
        MetricName: alarm.metricName,
        Namespace: alarm.namespace,
        Statistic: alarm.statistic,
        Period: alarm.period,
        EvaluationPeriods: alarm.evaluationPeriods,
        Threshold: alarm.threshold,
        ComparisonOperator: alarm.comparisonOperator,
        TreatMissingData: 'notBreaching',
        AlarmActions: [topicArn],
        OKActions: [topicArn],
        InsufficientDataActions: [topicArn],
        Tags: [
          { Key: 'Environment', Value: 'Production' },
          { Key: 'Application', Value: 'ClassCast' },
          { Key: 'Severity', Value: alarm.severity }
        ]
      }));
      
      console.log(`✅ Created alarm: ${alarm.name} (${alarm.severity})`);
    } catch (error) {
      console.error(`❌ Error creating alarm ${alarm.name}:`, error.message);
    }
  }
}

async function createAlertingDashboard(topicArn) {
  console.log('📊 Creating alerting dashboard...');
  
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
            ['ClassCast/API', 'Errors'],
            ['.', 'API_Duration'],
            ['.', 'Health_Check_Status']
          ],
          view: 'timeSeries',
          stacked: false,
          region: 'us-east-1',
          title: 'Critical Metrics',
          period: 300,
          stat: 'Average'
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
            ['ClassCast/API', 'API_Calls'],
            ['.', 'Database_Operations'],
            ['.', 'File_Uploads']
          ],
          view: 'timeSeries',
          stacked: false,
          region: 'us-east-1',
          title: 'System Activity',
          period: 300,
          stat: 'Sum'
        }
      },
      {
        type: 'metric',
        x: 0,
        y: 6,
        width: 24,
        height: 6,
        properties: {
          metrics: [
            ['AWS/SNS', 'NumberOfMessagesPublished', 'TopicName', TOPIC_NAME],
            ['.', 'NumberOfNotificationsDelivered', '.', '.'],
            ['.', 'NumberOfNotificationsFailed', '.', '.']
          ],
          view: 'timeSeries',
          stacked: false,
          region: 'us-east-1',
          title: 'Alert Delivery Status',
          period: 300,
          stat: 'Sum'
        }
      }
    ]
  };
  
  try {
    await cloudWatch.send(new PutDashboardCommand({
      DashboardName: DASHBOARD_NAME,
      DashboardBody: JSON.stringify(dashboardBody)
    }));
    console.log(`✅ Created alerting dashboard: ${DASHBOARD_NAME}`);
  } catch (error) {
    console.error('❌ Error creating dashboard:', error.message);
  }
}

async function createIAMRole() {
  console.log('🔐 Creating IAM role for CloudWatch to SNS...');
  
  const trustPolicy = {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: {
          Service: 'cloudwatch.amazonaws.com'
        },
        Action: 'sts:AssumeRole'
      }
    ]
  };
  
  const rolePolicy = {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: [
          'sns:Publish'
        ],
        Resource: '*'
      }
    ]
  };
  
  try {
    await iam.send(new CreateRoleCommand({
      RoleName: 'ClassCastCloudWatchSNSRole',
      AssumeRolePolicyDocument: JSON.stringify(trustPolicy),
      Description: 'Role for CloudWatch to publish to SNS'
    }));
    
    await iam.send(new PutRolePolicyCommand({
      RoleName: 'ClassCastCloudWatchSNSRole',
      PolicyName: 'CloudWatchSNSPolicy',
      PolicyDocument: JSON.stringify(rolePolicy)
    }));
    
    console.log('✅ Created IAM role: ClassCastCloudWatchSNSRole');
  } catch (error) {
    if (error.name === 'EntityAlreadyExistsException') {
      console.log('ℹ️  IAM role already exists');
    } else {
      console.error('❌ Error creating IAM role:', error.message);
    }
  }
}

async function createAlertScript() {
  console.log('📝 Creating alert management script...');
  
  const alertScript = `#!/bin/bash

# ClassCast Alert Management Script
# This script provides manual alert testing and management

set -e

# Configuration
TOPIC_ARN="arn:aws:sns:us-east-1:${process.env.AWS_ACCOUNT_ID || '463470937777'}:classcast-production-alerts"
REGION="us-east-1"

# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
NC='\\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "\${GREEN}[INFO]\${NC} \$1"
}

print_warning() {
    echo -e "\${YELLOW}[WARNING]\${NC} \$1"
}

print_error() {
    echo -e "\${RED}[ERROR]\${NC} \$1"
}

print_alert() {
    echo -e "\${BLUE}[ALERT]\${NC} \$1"
}

# Function to test alert delivery
test_alert() {
    local severity=\${1:-"INFO"}
    local message=\${2:-"Test alert from ClassCast monitoring system"}
    
    print_alert "Sending test alert (Severity: \$severity)"
    
    aws sns publish \\
        --topic-arn "\$TOPIC_ARN" \\
        --message "{
            \\"severity\\": \\"\$severity\\",
            \\"message\\": \\"\$message\\",
            \\"timestamp\\": \\"\$(date -u +%Y-%m-%dT%H:%M:%SZ)\\",
            \\"source\\": \\"ClassCast-Monitoring\\",
            \\"environment\\": \\"Production\\"
        }" \\
        --subject "ClassCast Alert Test - \$severity" \\
        --region "\$REGION"
    
    if [ \$? -eq 0 ]; then
        print_status "Test alert sent successfully"
    else
        print_error "Failed to send test alert"
        return 1
    fi
}

# Function to list active alarms
list_alarms() {
    print_status "Listing active CloudWatch alarms..."
    
    aws cloudwatch describe-alarms \\
        --alarm-names-prefix "ClassCast-" \\
        --region "\$REGION" \\
        --query 'MetricAlarms[*].[AlarmName,StateValue,StateReason]' \\
        --output table
}

# Function to get alarm history
get_alarm_history() {
    local alarm_name=\$1
    local hours=\${2:-24}
    
    if [ -z "\$alarm_name" ]; then
        print_error "Please specify alarm name"
        echo "Usage: \$0 history <alarm_name> [hours]"
        return 1
    fi
    
    print_status "Getting alarm history for \$alarm_name (last \$hours hours)..."
    
    local start_time=\$(date -u -d "\$hours hours ago" +%Y-%m-%dT%H:%M:%S)
    local end_time=\$(date -u +%Y-%m-%dT%H:%M:%S)
    
    aws cloudwatch get-metric-statistics \\
        --namespace "ClassCast/API" \\
        --metric-name "Errors" \\
        --start-time "\$start_time" \\
        --end-time "\$end_time" \\
        --period 300 \\
        --statistics Sum \\
        --region "\$REGION" \\
        --output table
}

# Function to disable/enable alarms
toggle_alarm() {
    local alarm_name=\$1
    local action=\$2
    
    if [ -z "\$alarm_name" ] || [ -z "\$action" ]; then
        print_error "Please specify alarm name and action (enable/disable)"
        echo "Usage: \$0 toggle <alarm_name> <enable|disable>"
        return 1
    fi
    
    if [ "\$action" = "disable" ]; then
        print_status "Disabling alarm: \$alarm_name"
        aws cloudwatch disable-alarm-actions \\
            --alarm-names "\$alarm_name" \\
            --region "\$REGION"
    elif [ "\$action" = "enable" ]; then
        print_status "Enabling alarm: \$alarm_name"
        aws cloudwatch enable-alarm-actions \\
            --alarm-names "\$alarm_name" \\
            --region "\$REGION"
    else
        print_error "Invalid action. Use 'enable' or 'disable'"
        return 1
    fi
    
    if [ \$? -eq 0 ]; then
        print_status "Alarm \$action operation completed"
    else
        print_error "Failed to \$action alarm"
        return 1
    fi
}

# Function to get SNS topic statistics
get_topic_stats() {
    print_status "Getting SNS topic statistics..."
    
    aws cloudwatch get-metric-statistics \\
        --namespace "AWS/SNS" \\
        --metric-name "NumberOfMessagesPublished" \\
        --dimensions Name=TopicName,Value=classcast-production-alerts \\
        --start-time \$(date -u -d "1 hour ago" +%Y-%m-%dT%H:%M:%S) \\
        --end-time \$(date -u +%Y-%m-%dT%H:%M:%S) \\
        --period 300 \\
        --statistics Sum \\
        --region "\$REGION" \\
        --output table
}

# Main script logic
case "\$1" in
    "test")
        test_alert "\$2" "\$3"
        ;;
    
    "list")
        list_alarms
        ;;
    
    "history")
        get_alarm_history "\$2" "\$3"
        ;;
    
    "toggle")
        toggle_alarm "\$2" "\$3"
        ;;
    
    "stats")
        get_topic_stats
        ;;
    
    *)
        echo "ClassCast Alert Management Script"
        echo ""
        echo "Usage: \$0 {test|list|history|toggle|stats} [options]"
        echo ""
        echo "Commands:"
        echo "  test [severity] [message]     Send test alert"
        echo "  list                          List active alarms"
        echo "  history <alarm_name> [hours]  Get alarm history"
        echo "  toggle <alarm_name> <action>  Enable/disable alarm"
        echo "  stats                         Get SNS topic statistics"
        echo ""
        echo "Examples:"
        echo "  \$0 test CRITICAL 'Database connection failed'"
        echo "  \$0 list"
        echo "  \$0 history ClassCast-High-Error-Rate 48"
        echo "  \$0 toggle ClassCast-High-Error-Rate disable"
        ;;
esac
`;

  require('fs').writeFileSync('alert-management.sh', alertScript);
  require('fs').chmodSync('alert-management.sh', '755');
  
  console.log('✅ Created alert management script: alert-management.sh');
}

async function setupAlerts() {
  console.log('🚨 Setting up monitoring alerts...');
  console.log(`📧 Alert email: ${ALARM_EMAIL}`);
  console.log(`📱 Alert phone: ${ALARM_PHONE}\n`);
  
  try {
    const topicArn = await createSNSTopic();
    await subscribeToAlerts(topicArn);
    await createAlarms(topicArn);
    await createAlertingDashboard(topicArn);
    await createIAMRole();
    await createAlertScript();
    
    console.log('\n🎉 Alert setup completed!');
    console.log('\n📋 Summary:');
    console.log(`   - SNS Topic: ${topicArn}`);
    console.log(`   - Alarms Created: ${alarms.length}`);
    console.log(`   - Dashboard: ${DASHBOARD_NAME}`);
    console.log(`   - Management Script: alert-management.sh`);
    
    console.log('\n🚨 Alarm Configuration:');
    alarms.forEach(alarm => {
      console.log(`   - ${alarm.name}: ${alarm.threshold} ${alarm.comparisonOperator} (${alarm.severity})`);
    });
    
    console.log('\n🔧 Management Commands:');
    console.log('   ./alert-management.sh test CRITICAL "Test alert"  # Send test alert');
    console.log('   ./alert-management.sh list                       # List active alarms');
    console.log('   ./alert-management.sh stats                      # Get alert statistics');
    
    console.log('\n⚠️  Next Steps:');
    console.log('   1. Check your email and confirm the SNS subscription');
    console.log('   2. Test the alert system with: ./alert-management.sh test');
    console.log('   3. Monitor the CloudWatch dashboard for alerts');
    console.log('   4. Set up additional alert channels as needed');
    
  } catch (error) {
    console.error('❌ Error setting up alerts:', error);
    process.exit(1);
  }
}

// Run the alert setup
setupAlerts();
