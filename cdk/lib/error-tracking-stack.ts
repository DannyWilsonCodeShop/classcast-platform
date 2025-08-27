import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export interface ErrorTrackingStackProps extends cdk.StackProps {
  applicationStack: any; // Reference to ApplicationStack
  databaseStack: any; // Reference to DatabaseStack
  storageStack: any; // Reference to StorageStack
  apiGatewayStack: any; // Reference to ApiGatewayStack
  authStack: any; // Reference to AuthStack
  monitoringStack: any; // Reference to MonitoringStack
  loggingStack: any; // Reference to LoggingStack
  environment: string; // 'development', 'staging', or 'production'
  sentryDsn?: string; // Sentry DSN for error tracking
  datadogApiKey?: string; // DataDog API key for monitoring
  newRelicLicenseKey?: string; // New Relic license key
}

export class ErrorTrackingStack extends cdk.Stack {
  public readonly errorTrackingTopic: sns.Topic;
  public readonly performanceMonitoringTopic: sns.Topic;
  public readonly errorAggregationLambda: lambda.Function;
  public readonly performanceAnalyzerLambda: lambda.Function;
  public readonly errorDashboard: cloudwatch.Dashboard;
  public readonly performanceDashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: ErrorTrackingStackProps) {
    super(scope, id, props);

    // Create SNS topics for error tracking and performance monitoring
    this.errorTrackingTopic = new sns.Topic(this, 'ErrorTrackingTopic', {
      topicName: `DemoProject-ErrorTracking-${props.environment}`,
      displayName: `DemoProject Error Tracking - ${props.environment}`,
    });

    this.performanceMonitoringTopic = new sns.Topic(this, 'PerformanceMonitoringTopic', {
      topicName: `DemoProject-PerformanceMonitoring-${props.environment}`,
      displayName: `DemoProject Performance Monitoring - ${props.environment}`,
    });

    // Create Lambda functions for error aggregation and performance analysis
    this.errorAggregationLambda = this.createErrorAggregationLambda(props);
    this.performanceAnalyzerLambda = this.createPerformanceAnalyzerLambda(props);

    // Create CloudWatch dashboards
    this.errorDashboard = this.createErrorDashboard(props);
    this.performanceDashboard = this.createPerformanceDashboard(props);

    // Create error tracking alarms
    this.createErrorTrackingAlarms(props);

    // Create performance monitoring alarms
    this.createPerformanceMonitoringAlarms(props);

    // Create custom metrics for error tracking
    this.createCustomErrorMetrics(props);

    // Create performance monitoring metrics
    this.createPerformanceMetrics(props);

    // Create error reporting endpoints
    this.createErrorReportingEndpoints(props);

    // Create performance monitoring endpoints
    this.createPerformanceMonitoringEndpoints(props);
  }

  private createErrorAggregationLambda(props: ErrorTrackingStackProps): lambda.Function {
    const errorAggregator = new lambda.Function(this, 'ErrorAggregationLambda', {
      functionName: `DemoProject-ErrorAggregator-${props.environment}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const cloudwatch = new AWS.CloudWatch();
        const sns = new AWS.SNS();
        
        exports.handler = async (event) => {
          console.log('Processing error event:', JSON.stringify(event, null, 2));
          
          try {
            // Parse error event
            const errorData = JSON.parse(event.body || '{}');
            const {
              errorType,
              errorMessage,
              stackTrace,
              userId,
              requestId,
              endpoint,
              method,
              timestamp,
              environment,
              severity,
              metadata
            } = errorData;
            
            // Enrich error data
            const enrichedError = {
              ...errorData,
              processedAt: new Date().toISOString(),
              environment: '${props.environment}',
              source: 'error-aggregator',
              errorId: generateErrorId(),
            };
            
            // Send to CloudWatch Logs
            console.log('Enriched error:', JSON.stringify(enrichedError, null, 2));
            
            // Send to SNS for notifications
            if (severity === 'CRITICAL' || severity === 'HIGH') {
              await sns.publish({
                TopicArn: '${this.errorTrackingTopic.topicArn}',
                Message: JSON.stringify({
                  type: 'ERROR_ALERT',
                  error: enrichedError,
                  timestamp: new Date().toISOString(),
                }),
                Subject: \`[ERROR] \${errorType} - \${severity}\`,
              }).promise();
            }
            
            // Put custom metric
            await cloudwatch.putMetricData({
              Namespace: 'DemoProject/Errors',
              MetricData: [
                {
                  MetricName: 'ErrorCount',
                  Dimensions: [
                    { Name: 'Environment', Value: '${props.environment}' },
                    { Name: 'ErrorType', Value: errorType || 'Unknown' },
                    { Name: 'Severity', Value: severity || 'Unknown' },
                    { Name: 'Endpoint', Value: endpoint || 'Unknown' },
                  ],
                  Value: 1,
                  Unit: 'Count',
                  Timestamp: new Date(),
                },
                {
                  MetricName: 'ErrorRate',
                  Dimensions: [
                    { Name: 'Environment', Value: '${props.environment}' },
                    { Name: 'ErrorType', Value: errorType || 'Unknown' },
                  ],
                  Value: 1,
                  Unit: 'Count/Second',
                  Timestamp: new Date(),
                },
              ],
            }).promise();
            
            return {
              statusCode: 200,
              body: JSON.stringify({
                message: 'Error processed successfully',
                errorId: enrichedError.errorId,
              }),
            };
          } catch (error) {
            console.error('Error processing error event:', error);
            throw error;
          }
        };
        
        function generateErrorId() {
          return 'err_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
      `),
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      environment: {
        ENVIRONMENT: props.environment,
        ERROR_TRACKING_TOPIC_ARN: this.errorTrackingTopic.topicArn,
        PERFORMANCE_MONITORING_TOPIC_ARN: this.performanceMonitoringTopic.topicArn,
        SENTRY_DSN: props.sentryDsn || '',
        DATADOG_API_KEY: props.datadogApiKey || '',
        NEW_RELIC_LICENSE_KEY: props.newRelicLicenseKey || '',
      },
    });

    // Grant permissions
    this.errorTrackingTopic.grantPublish(errorAggregator);
    this.performanceMonitoringTopic.grantPublish(errorAggregator);
    props.loggingStack.centralLogGroup.grantWrite(errorAggregator);

    return errorAggregator;
  }

  private createPerformanceAnalyzerLambda(props: ErrorTrackingStackProps): lambda.Function {
    const performanceAnalyzer = new lambda.Function(this, 'PerformanceAnalyzerLambda', {
      functionName: `DemoProject-PerformanceAnalyzer-${props.environment}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const cloudwatch = new AWS.CloudWatch();
        const sns = new AWS.SNS();
        
        exports.handler = async (event) => {
          console.log('Processing performance event:', JSON.stringify(event, null, 2));
          
          try {
            // Parse performance event
            const perfData = JSON.parse(event.body || '{}');
            const {
              endpoint,
              method,
              responseTime,
              requestSize,
              responseSize,
              userId,
              requestId,
              timestamp,
              statusCode,
              metadata
            } = perfData;
            
            // Enrich performance data
            const enrichedPerf = {
              ...perfData,
              processedAt: new Date().toISOString(),
              environment: '${props.environment}',
              source: 'performance-analyzer',
            };
            
            // Send to CloudWatch Logs
            console.log('Enriched performance data:', JSON.stringify(enrichedPerf, null, 2));
            
            // Check for performance thresholds
            const responseTimeThreshold = ${props.environment === 'production' ? 5000 : 10000}; // 5s for prod, 10s for others
            if (responseTime > responseTimeThreshold) {
              await sns.publish({
                TopicArn: '${this.performanceMonitoringTopic.topicArn}',
                Message: JSON.stringify({
                  type: 'PERFORMANCE_ALERT',
                  performance: enrichedPerf,
                  threshold: responseTimeThreshold,
                  timestamp: new Date().toISOString(),
                }),
                Subject: '[PERFORMANCE] High Response Time Alert',
              }).promise();
            }
            
            // Put custom metrics
            await cloudwatch.putMetricData({
              Namespace: 'DemoProject/Performance',
              MetricData: [
                {
                  MetricName: 'ResponseTime',
                  Dimensions: [
                    { Name: 'Environment', Value: '${props.environment}' },
                    { Name: 'Endpoint', Value: endpoint || 'Unknown' },
                    { Name: 'Method', Value: method || 'Unknown' },
                  ],
                  Value: responseTime,
                  Unit: 'Milliseconds',
                  Timestamp: new Date(),
                },
                {
                  MetricName: 'RequestCount',
                  Dimensions: [
                    { Name: 'Environment', Value: '${props.environment}' },
                    { Name: 'Endpoint', Value: endpoint || 'Unknown' },
                    { Name: 'StatusCode', Value: statusCode?.toString() || 'Unknown' },
                  ],
                  Value: 1,
                  Unit: 'Count',
                  Timestamp: new Date(),
                },
                {
                  MetricName: 'RequestSize',
                  Dimensions: [
                    { Name: 'Environment', Value: '${props.environment}' },
                    { Name: 'Endpoint', Value: endpoint || 'Unknown' },
                  ],
                  Value: requestSize || 0,
                  Unit: 'Bytes',
                  Timestamp: new Date(),
                },
                {
                  MetricName: 'ResponseSize',
                  Dimensions: [
                    { Name: 'Environment', Value: '${props.environment}' },
                    { Name: 'Endpoint', Value: endpoint || 'Unknown' },
                  ],
                  Value: responseSize || 0,
                  Unit: 'Bytes',
                  Timestamp: new Date(),
                },
              ],
            }).promise();
            
            return {
              statusCode: 200,
              body: JSON.stringify({
                message: 'Performance data processed successfully',
                processedAt: enrichedPerf.processedAt,
              }),
            };
          } catch (error) {
            console.error('Error processing performance event:', error);
            throw error;
          }
        };
      `),
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      environment: {
        ENVIRONMENT: props.environment,
        ERROR_TRACKING_TOPIC_ARN: this.errorTrackingTopic.topicArn,
        PERFORMANCE_MONITORING_TOPIC_ARN: this.performanceMonitoringTopic.topicArn,
      },
    });

    // Grant permissions
    this.performanceMonitoringTopic.grantPublish(performanceAnalyzer);
    props.loggingStack.centralLogGroup.grantWrite(performanceAnalyzer);

    return performanceAnalyzer;
  }

  private createErrorDashboard(props: ErrorTrackingStackProps): cloudwatch.Dashboard {
    const dashboard = new cloudwatch.Dashboard(this, 'ErrorDashboard', {
      dashboardName: `DemoProject-Errors-${props.environment}`,
    });

    // Error Rate Widget
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Error Rate by Type',
        left: [
          new cloudwatch.Metric({
            namespace: 'DemoProject/Errors',
            metricName: 'ErrorRate',
            dimensionsMap: {
              Environment: props.environment,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Error Count by Severity',
        left: [
          new cloudwatch.Metric({
            namespace: 'DemoProject/Errors',
            metricName: 'ErrorCount',
            dimensionsMap: {
              Environment: props.environment,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Errors by Endpoint',
        left: [
          new cloudwatch.Metric({
            namespace: 'DemoProject/Errors',
            metricName: 'ErrorCount',
            dimensionsMap: {
              Environment: props.environment,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
      })
    );

    return dashboard;
  }

  private createPerformanceDashboard(props: ErrorTrackingStackProps): cloudwatch.Dashboard {
    const dashboard = new cloudwatch.Dashboard(this, 'PerformanceDashboard', {
      dashboardName: `DemoProject-Performance-${props.environment}`,
    });

    // Response Time Widget
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Response Time by Endpoint',
        left: [
          new cloudwatch.Metric({
            namespace: 'DemoProject/Performance',
            metricName: 'ResponseTime',
            dimensionsMap: {
              Environment: props.environment,
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
          new cloudwatch.Metric({
            namespace: 'DemoProject/Performance',
            metricName: 'ResponseTime',
            dimensionsMap: {
              Environment: props.environment,
            },
            statistic: 'p95',
            period: cdk.Duration.minutes(5),
          }),
          new cloudwatch.Metric({
            namespace: 'DemoProject/Performance',
            metricName: 'ResponseTime',
            dimensionsMap: {
              Environment: props.environment,
            },
            statistic: 'p99',
            period: cdk.Duration.minutes(5),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Request Count by Endpoint',
        left: [
          new cloudwatch.Metric({
            namespace: 'DemoProject/Performance',
            metricName: 'RequestCount',
            dimensionsMap: {
              Environment: props.environment,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Request/Response Size',
        left: [
          new cloudwatch.Metric({
            namespace: 'DemoProject/Performance',
            metricName: 'RequestSize',
            dimensionsMap: {
              Environment: props.environment,
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'DemoProject/Performance',
            metricName: 'ResponseSize',
            dimensionsMap: {
              Environment: props.environment,
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
        ],
      })
    );

    return dashboard;
  }

  private createErrorTrackingAlarms(props: ErrorTrackingStackProps): void {
    // High Error Rate Alarm
    const highErrorRateAlarm = new cloudwatch.Alarm(this, 'HighErrorRateAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'DemoProject/Errors',
        metricName: 'ErrorRate',
        dimensionsMap: {
          Environment: props.environment,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: props.environment === 'production' ? 5 : 10, // 5 errors/min for prod, 10 for others
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: 'High error rate detected',
      alarmName: `DemoProject-HighErrorRate-${props.environment}`,
    });

    highErrorRateAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.errorTrackingTopic));

    // Critical Error Alarm
    const criticalErrorAlarm = new cloudwatch.Alarm(this, 'CriticalErrorAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'DemoProject/Errors',
        metricName: 'ErrorCount',
        dimensionsMap: {
          Environment: props.environment,
          Severity: 'CRITICAL',
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: 'Critical error detected',
      alarmName: `DemoProject-CriticalError-${props.environment}`,
    });

    criticalErrorAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(props.monitoringStack.criticalAlertsTopic));
  }

  private createPerformanceMonitoringAlarms(props: ErrorTrackingStackProps): void {
    // High Response Time Alarm
    const highResponseTimeAlarm = new cloudwatch.Alarm(this, 'HighResponseTimeAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'DemoProject/Performance',
        metricName: 'ResponseTime',
        dimensionsMap: {
          Environment: props.environment,
        },
        statistic: 'p95',
        period: cdk.Duration.minutes(5),
      }),
      threshold: props.environment === 'production' ? 3000 : 5000, // 3s for prod, 5s for others
      evaluationPeriods: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: 'High response time detected',
      alarmName: `DemoProject-HighResponseTime-${props.environment}`,
    });

    highResponseTimeAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.performanceMonitoringTopic));

    // Low Request Count Alarm (potential service degradation)
    const lowRequestCountAlarm = new cloudwatch.Alarm(this, 'LowRequestCountAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'DemoProject/Performance',
        metricName: 'RequestCount',
        dimensionsMap: {
          Environment: props.environment,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: props.environment === 'production' ? 10 : 5, // 10 req/5min for prod, 5 for others
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      alarmDescription: 'Low request count detected - potential service degradation',
      alarmName: `DemoProject-LowRequestCount-${props.environment}`,
    });

    lowRequestCountAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.performanceMonitoringTopic));
  }

  private createCustomErrorMetrics(props: ErrorTrackingStackProps): void {
    // Create custom metrics for specific error types
    
    // Authentication errors
    new cloudwatch.Metric({
      namespace: 'DemoProject/Errors',
      metricName: 'AuthErrorCount',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
      dimensionsMap: {
        Environment: props.environment,
        ErrorType: 'Authentication',
      },
    });

    // Database errors
    new cloudwatch.Metric({
      namespace: 'DemoProject/Errors',
      metricName: 'DatabaseErrorCount',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
      dimensionsMap: {
        Environment: props.environment,
        ErrorType: 'Database',
      },
    });

    // API errors
    new cloudwatch.Metric({
      namespace: 'DemoProject/Errors',
      metricName: 'APIErrorCount',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
      dimensionsMap: {
        Environment: props.environment,
        ErrorType: 'API',
      },
    });

    // Validation errors
    new cloudwatch.Metric({
      namespace: 'DemoProject/Errors',
      metricName: 'ValidationErrorCount',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
      dimensionsMap: {
        Environment: props.environment,
        ErrorType: 'Validation',
      },
    });
  }

  private createPerformanceMetrics(props: ErrorTrackingStackProps): void {
    // Create custom performance metrics
    
    // User activity metrics
    new cloudwatch.Metric({
      namespace: 'DemoProject/Performance',
      metricName: 'UserActivityCount',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
      dimensionsMap: {
        Environment: props.environment,
        MetricType: 'UserActivity',
      },
    });

    // Assignment submission metrics
    new cloudwatch.Metric({
      namespace: 'DemoProject/Performance',
      metricName: 'AssignmentSubmissionCount',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
      dimensionsMap: {
        Environment: props.environment,
        MetricType: 'AssignmentSubmission',
      },
    });

    // Grading operation metrics
    new cloudwatch.Metric({
      namespace: 'DemoProject/Performance',
      metricName: 'GradingOperationCount',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
      dimensionsMap: {
        Environment: props.environment,
        MetricType: 'GradingOperation',
      },
    });
  }

  private createErrorReportingEndpoints(props: ErrorTrackingStackProps): void {
    // Create API Gateway endpoints for error reporting
    
    // Error reporting endpoint
    new cdk.CfnOutput(this, 'ErrorReportingEndpoint', {
      value: `https://${props.apiGatewayStack.restApi.restApiId}.execute-api.${this.region}.amazonaws.com/prod/errors`,
      description: 'Error reporting endpoint',
      exportName: `DemoProject-ErrorReportingEndpoint-${props.environment}`,
    });

    // Performance monitoring endpoint
    new cdk.CfnOutput(this, 'PerformanceMonitoringEndpoint', {
      value: `https://${props.apiGatewayStack.restApi.restApiId}.execute-api.${this.region}.amazonaws.com/prod/performance`,
      description: 'Performance monitoring endpoint',
      exportName: `DemoProject-PerformanceMonitoringEndpoint-${props.environment}`,
    });
  }

  private createPerformanceMonitoringEndpoints(props: ErrorTrackingStackProps): void {
    // Create outputs for performance monitoring endpoints
    
    // Health check endpoint
    new cdk.CfnOutput(this, 'HealthCheckEndpoint', {
      value: `https://${props.apiGatewayStack.restApi.restApiId}.execute-api.${this.region}.amazonaws.com/prod/health`,
      description: 'Health check endpoint',
      exportName: `DemoProject-HealthCheckEndpoint-${props.environment}`,
    });

    // Metrics endpoint
    new cdk.CfnOutput(this, 'MetricsEndpoint', {
      value: `https://${props.apiGatewayStack.restApi.restApiId}.execute-api.${this.region}.amazonaws.com/prod/metrics`,
      description: 'Metrics endpoint',
      exportName: `DemoProject-MetricsEndpoint-${props.environment}`,
    });
  }
}
