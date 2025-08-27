# Monitoring and Logging Infrastructure

This document describes the comprehensive monitoring and logging infrastructure for the DemoProject application, including CloudWatch dashboards, error tracking, performance monitoring, and critical system alerts.

## Overview

The monitoring and logging infrastructure consists of three main CDK stacks:

1. **MonitoringStack** - CloudWatch dashboards, alarms, and basic monitoring
2. **LoggingStack** - Centralized logging, log aggregation, and log analysis
3. **ErrorTrackingStack** - Error tracking, performance monitoring, and external integrations

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Application   │    │   API Gateway    │    │   Lambda       │
│   (ECS/Fargate) │◄──►│   (REST API)     │◄──►│   Functions    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CloudWatch    │    │   CloudWatch     │    │   CloudWatch   │
│   Logs (ECS)    │    │   Logs (API)     │    │   Logs (Lambda)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │   Central Log Group     │
                    │   (DemoProject/Central) │
                    └─────────────────────────┘
                                 │
                    ┌─────────────────────────┐
                    │   Kinesis Stream        │
                    │   (Real-time processing)│
                    └─────────────────────────┘
                                 │
                    ┌─────────────────────────┐
                    │   Kinesis Firehose      │
                    │   (S3 archival)         │
                    └─────────────────────────┘
                                 │
                    ┌─────────────────────────┐
                    │   S3 Log Archive        │
                    │   (Long-term storage)   │
                    └─────────────────────────┘
```

## Monitoring Stack

### CloudWatch Dashboards

The monitoring stack creates three main dashboards:

#### 1. Application Dashboard (`DemoProject-Application-{environment}`)
- **Application Response Time**: Average response time and request count
- **Error Rates**: 4XX and 5XX error counts
- **ECS Service Metrics**: CPU, memory utilization, and running task count

#### 2. Infrastructure Dashboard (`DemoProject-Infrastructure-{environment}`)
- **Database Performance**: CPU, memory, connections, and storage
- **Storage Metrics**: S3 object count and bucket size
- **Network Performance**: Network I/O metrics

#### 3. Security Dashboard (`DemoProject-Security-{environment}`)
- **Authentication Metrics**: Sign-in successes and failures
- **API Gateway Security**: Request count and error rates

### Alarms and Notifications

#### Application Alarms
- **High Error Rate**: Triggers when 5XX errors exceed threshold
- **High Response Time**: Triggers when response time exceeds 5 seconds
- **ECS Service Unhealthy**: Triggers when insufficient healthy tasks

#### Infrastructure Alarms
- **Database CPU High**: Triggers when CPU utilization exceeds 80%
- **Database Connections High**: Triggers when connection count exceeds 80%
- **Storage Space Low**: Triggers when free storage falls below 5GB

#### Security Alarms
- **High Authentication Failures**: Triggers when failures exceed 50 per 5 minutes
- **API Gateway 4XX Errors**: Triggers when 4XX errors exceed 100 per 5 minutes

### SNS Topics
- **Monitoring Topic**: General monitoring notifications
- **Critical Alerts Topic**: Critical system failure notifications

## Logging Stack

### Log Groups

#### Centralized Logging
- **Central Log Group**: `/DemoProject/Central/{environment}`
- **Application Log Group**: `/DemoProject/Application/{environment}`
- **Database Log Group**: `/DemoProject/Database/{environment}`
- **Security Log Group**: `/DemoProject/Security/{environment}`
- **Performance Log Group**: `/DemoProject/Performance/{environment}`

#### Environment-Specific Log Groups
- **Development**: 1 week retention
- **Staging**: 1 month retention
- **Production**: 1 year retention (3 years for security, 7 years for compliance)

### Log Processing Pipeline

#### 1. Kinesis Stream
- **Purpose**: Real-time log processing
- **Shard Count**: 1 for dev/staging, 4 for production
- **Retention**: 24 hours

#### 2. Kinesis Firehose
- **Purpose**: Log delivery to S3
- **Buffering**: 5 minutes or 50MB
- **Compression**: GZIP
- **Destination**: S3 with lifecycle policies

#### 3. S3 Log Archive
- **Lifecycle Rules**:
  - 30 days: Standard → Infrequent Access
  - 90 days: Infrequent Access → Glacier
  - 1 year: Glacier → Deep Archive
  - 7 years: Expiration

### Log Insights Queries

#### Application Error Analysis
```sql
fields @timestamp, @message, @logStream, @requestId
| filter @logStream like /DemoProject/
| filter @message like /ERROR/
| parse @message /(?<level>ERROR|WARN|INFO|DEBUG): (?<message>.*)/
| stats count() by level, bin(5m)
| sort @timestamp desc
```

#### Performance Analysis
```sql
fields @timestamp, @message, @duration, @requestId
| filter @logStream like /DemoProject/
| filter @message like /API/
| parse @message /API (?<method>\w+) (?<endpoint>\S+) - (?<duration>\d+)ms/
| stats avg(@duration), max(@duration), min(@duration) by endpoint, bin(5m)
| sort avg(@duration) desc
```

#### Security Event Analysis
```sql
fields @timestamp, @message, @user, @ip, @action
| filter @logStream like /DemoProject/
| filter @message like /AUTH|SECURITY|LOGIN|LOGOUT/
| parse @message /(?<action>\w+): (?<details>.*)/
| stats count() by action, bin(5m)
| sort @timestamp desc
```

## Error Tracking Stack

### Lambda Functions

#### 1. Error Aggregation Lambda
- **Purpose**: Process and aggregate error events
- **Features**:
  - Error enrichment with metadata
  - Severity-based SNS notifications
  - Custom CloudWatch metrics
  - CloudWatch Logs integration

#### 2. Performance Analyzer Lambda
- **Purpose**: Analyze performance metrics
- **Features**:
  - Response time analysis
  - Request/response size tracking
  - Performance threshold alerts
  - Custom performance metrics

### Custom Metrics

#### Error Metrics
- **ErrorCount**: Count of errors by type, severity, and endpoint
- **ErrorRate**: Error rate per second
- **AuthErrorCount**: Authentication-specific errors
- **DatabaseErrorCount**: Database-specific errors
- **APIErrorCount**: API-specific errors
- **ValidationErrorCount**: Validation errors

#### Performance Metrics
- **ResponseTime**: Response time by endpoint and method
- **RequestCount**: Request count by endpoint and status code
- **RequestSize**: Request size in bytes
- **ResponseSize**: Response size in bytes
- **UserActivityCount**: User activity tracking
- **AssignmentSubmissionCount**: Assignment submission metrics
- **GradingOperationCount**: Grading operation metrics

### Dashboards

#### Error Dashboard (`DemoProject-Errors-{environment}`)
- Error rate by type
- Error count by severity
- Errors by endpoint

#### Performance Dashboard (`DemoProject-Performance-{environment}`)
- Response time by endpoint (average, p95, p99)
- Request count by endpoint
- Request/response size metrics

### Alarms

#### Error Tracking Alarms
- **High Error Rate**: 5 errors/min for production, 10 for others
- **Critical Error**: Immediate alert for any critical error

#### Performance Alarms
- **High Response Time**: P95 > 3s for production, 5s for others
- **Low Request Count**: Potential service degradation detection

## External Integrations

### Supported Services

#### 1. Sentry
- **Purpose**: Error tracking and performance monitoring
- **Configuration**: Set `SENTRY_DSN` environment variable
- **Features**: Error aggregation, performance tracking, release tracking

#### 2. DataDog
- **Purpose**: Application performance monitoring
- **Configuration**: Set `DATADOG_API_KEY` environment variable
- **Features**: APM, infrastructure monitoring, log management

#### 3. New Relic
- **Purpose**: Application performance monitoring
- **Configuration**: Set `NEW_RELIC_LICENSE_KEY` environment variable
- **Features**: APM, error tracking, performance insights

## Deployment

### Prerequisites

1. **AWS CDK**: Ensure CDK is installed and bootstrapped
2. **Environment Variables**: Set required environment variables
3. **Dependencies**: Deploy base infrastructure stacks first

### Environment Variables

```bash
# Required
export ENVIRONMENT=production  # or staging, development
export CDK_DEFAULT_ACCOUNT=your-aws-account-id
export CDK_DEFAULT_REGION=us-east-1

# Optional (for external integrations)
export SENTRY_DSN=your-sentry-dsn
export DATADOG_API_KEY=your-datadog-api-key
export NEW_RELIC_LICENSE_KEY=your-new-relic-license-key
```

### Deployment Commands

```bash
# Deploy all stacks
cd cdk
npm run deploy:all

# Deploy specific stacks
cdk deploy DemoProject-MonitoringStack
cdk deploy DemoProject-LoggingStack
cdk deploy DemoProject-ErrorTrackingStack

# View stack outputs
cdk list-exports
```

### Stack Dependencies

```
NetworkStack
    ↓
DatabaseStack
    ↓
StorageStack
    ↓
AuthStack
    ↓
ApplicationStack
    ↓
ApiGatewayStack
    ↓
MonitoringStack
    ↓
LoggingStack
    ↓
ErrorTrackingStack
```

## Configuration

### Dashboard Customization

#### Adding Custom Widgets
```typescript
// In monitoring-stack.ts
dashboard.addWidgets(
  new cloudwatch.GraphWidget({
    title: 'Custom Metric',
    left: [
      new cloudwatch.Metric({
        namespace: 'DemoProject/Custom',
        metricName: 'CustomMetric',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
    ],
  })
);
```

#### Custom Metrics
```typescript
// In error-tracking-stack.ts
new cloudwatch.Metric({
  namespace: 'DemoProject/Custom',
  metricName: 'BusinessMetric',
  statistic: 'Sum',
  period: cdk.Duration.minutes(5),
  dimensionsMap: {
    Environment: props.environment,
    MetricType: 'Business',
  },
});
```

### Alarm Thresholds

#### Environment-Specific Thresholds
```typescript
// Production: stricter thresholds
const threshold = props.environment === 'production' ? 5 : 10;

// Staging: medium thresholds
const responseTimeThreshold = props.environment === 'staging' ? 5000 : 10000;
```

## Monitoring and Maintenance

### Regular Tasks

#### Daily
- Review CloudWatch dashboards
- Check alarm status
- Monitor error rates and performance metrics

#### Weekly
- Review log insights queries
- Analyze performance trends
- Check S3 log archive lifecycle

#### Monthly
- Review and adjust alarm thresholds
- Analyze cost optimization opportunities
- Review external service integrations

### Troubleshooting

#### Common Issues

1. **High Error Rate**
   - Check application logs for specific errors
   - Review recent deployments
   - Check database connectivity

2. **High Response Time**
   - Review database performance
   - Check ECS service health
   - Analyze API Gateway metrics

3. **Log Processing Issues**
   - Check Kinesis stream status
   - Verify Firehose delivery
   - Check S3 bucket permissions

#### Debug Commands

```bash
# Check CloudWatch logs
aws logs describe-log-groups --log-group-name-prefix "/DemoProject"

# Check Kinesis stream status
aws kinesis describe-stream --stream-name DemoProject-LogProcessing-production

# Check S3 log archive
aws s3 ls s3://demoproject-logs-production-account-id/logs/

# Check CloudWatch alarms
aws cloudwatch describe-alarms --alarm-names-prefix "DemoProject"
```

## Cost Optimization

### Monitoring Costs

#### CloudWatch Costs
- **Metrics**: $0.30 per metric per month
- **Logs**: $0.50 per GB ingested
- **Dashboards**: $3.00 per dashboard per month
- **Alarms**: $0.10 per alarm metric per month

#### Kinesis Costs
- **Stream**: $0.014 per shard hour
- **Firehose**: $0.029 per GB processed

#### S3 Costs
- **Standard**: $0.023 per GB per month
- **Infrequent Access**: $0.0125 per GB per month
- **Glacier**: $0.004 per GB per month
- **Deep Archive**: $0.00099 per GB per month

### Optimization Strategies

1. **Log Retention**: Use appropriate retention periods for each environment
2. **Metric Granularity**: Use 5-minute periods for non-critical metrics
3. **S3 Lifecycle**: Implement aggressive lifecycle policies for development
4. **Alarm Consolidation**: Group related metrics in single alarms

## Security

### IAM Permissions

#### Least Privilege Access
- **Lambda Functions**: Minimal permissions for CloudWatch and SNS
- **Firehose**: S3 and Kinesis access only
- **Log Groups**: Write access for specific services only

#### Encryption
- **S3**: Server-side encryption enabled
- **Kinesis**: Encryption at rest enabled
- **CloudWatch Logs**: Encryption at rest enabled

### Compliance

#### Data Retention
- **Development**: 1 week (minimal retention)
- **Staging**: 1 month (standard retention)
- **Production**: 1-7 years (compliance retention)

#### Audit Logging
- **CloudTrail**: API calls logged
- **CloudWatch Logs**: Application activity logged
- **S3 Access Logs**: S3 access logged

## Best Practices

### Monitoring

1. **Set Appropriate Thresholds**: Use environment-specific thresholds
2. **Use Percentiles**: Monitor p95 and p99 for performance metrics
3. **Implement SLOs**: Define service level objectives
4. **Regular Review**: Review and adjust thresholds monthly

### Logging

1. **Structured Logging**: Use JSON format for machine readability
2. **Log Levels**: Implement appropriate log levels (DEBUG, INFO, WARN, ERROR)
3. **Correlation IDs**: Include request IDs for tracing
4. **Sensitive Data**: Never log sensitive information

### Error Tracking

1. **Error Categorization**: Categorize errors by type and severity
2. **Context Information**: Include relevant context with errors
3. **Alert Fatigue**: Avoid too many alerts
4. **Escalation**: Implement proper escalation procedures

## Support and Resources

### Documentation
- [AWS CloudWatch Documentation](https://docs.aws.amazon.com/cloudwatch/)
- [AWS CloudWatch Logs Documentation](https://docs.aws.amazon.com/cloudwatch/latest/logs/)
- [AWS Kinesis Documentation](https://docs.aws.amazon.com/kinesis/)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)

### Tools
- **CloudWatch Console**: Web-based monitoring interface
- **AWS CLI**: Command-line interface for AWS services
- **CDK CLI**: Infrastructure as code deployment
- **CloudWatch Logs Insights**: Log query and analysis

### Contact
- **Development Team**: [team@company.com]
- **DevOps Team**: [devops@company.com]
- **AWS Support**: [support case number]

---

*This document is maintained by the DevOps team and should be updated with any infrastructure changes.*
