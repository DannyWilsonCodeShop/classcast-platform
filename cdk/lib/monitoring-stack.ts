import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export interface MonitoringStackProps extends cdk.StackProps {
  applicationStack: any; // Reference to ApplicationStack
  databaseStack: any; // Reference to DatabaseStack
  storageStack: any; // Reference to StorageStack
  apiGatewayStack: any; // Reference to ApiGatewayStack
  authStack: any; // Reference to AuthStack
  environment: string; // 'development', 'staging', or 'production'
}

export class MonitoringStack extends cdk.Stack {
  public readonly monitoringTopic: sns.Topic;
  public readonly criticalAlertsTopic: sns.Topic;
  public readonly applicationDashboard: cloudwatch.Dashboard;
  public readonly infrastructureDashboard: cloudwatch.Dashboard;
  public readonly securityDashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // Create SNS topics for notifications
    this.monitoringTopic = new sns.Topic(this, 'MonitoringTopic', {
      topicName: `DemoProject-Monitoring-${props.environment}`,
      displayName: `DemoProject Monitoring - ${props.environment}`,
    });

    this.criticalAlertsTopic = new sns.Topic(this, 'CriticalAlertsTopic', {
      topicName: `DemoProject-CriticalAlerts-${props.environment}`,
      displayName: `DemoProject Critical Alerts - ${props.environment}`,
    });

    // Create CloudWatch dashboards
    this.applicationDashboard = this.createApplicationDashboard(props);
    this.infrastructureDashboard = this.createInfrastructureDashboard(props);
    this.securityDashboard = this.createSecurityDashboard(props);

    // Create alarms and monitoring
    this.createApplicationAlarms(props);
    this.createInfrastructureAlarms(props);
    this.createSecurityAlarms(props);
    this.createCustomMetrics(props);

    // Create log insights queries
    this.createLogInsightsQueries(props);

    // Create performance monitoring
    this.createPerformanceMonitoring(props);
  }

  private createApplicationDashboard(props: MonitoringStackProps): cloudwatch.Dashboard {
    const dashboard = new cloudwatch.Dashboard(this, 'ApplicationDashboard', {
      dashboardName: `DemoProject-Application-${props.environment}`,
    });

    // Application Performance Metrics
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Application Response Time',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApplicationELB',
            metricName: 'TargetResponseTime',
            dimensionsMap: {
              LoadBalancer: props.applicationStack.loadBalancer.loadBalancerFullName,
              TargetGroup: props.applicationStack.service.serviceName,
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(1),
          }),
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApplicationELB',
            metricName: 'RequestCount',
            dimensionsMap: {
              LoadBalancer: props.applicationStack.loadBalancer.loadBalancerFullName,
              TargetGroup: props.applicationStack.service.serviceName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(1),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Error Rates',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApplicationELB',
            metricName: 'HTTPCode_Target_5XX_Count',
            dimensionsMap: {
              LoadBalancer: props.applicationStack.loadBalancer.loadBalancerFullName,
              TargetGroup: props.applicationStack.service.serviceName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(1),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/ApplicationELB',
            metricName: 'HTTPCode_Target_4XX_Count',
            dimensionsMap: {
              LoadBalancer: props.applicationStack.loadBalancer.loadBalancerFullName,
              TargetGroup: props.applicationStack.service.serviceName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(1),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'ECS Service Metrics',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ECS',
            metricName: 'CPUUtilization',
            dimensionsMap: {
              ClusterName: props.applicationStack.cluster.clusterName,
              ServiceName: props.applicationStack.service.serviceName,
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(1),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/ECS',
            metricName: 'MemoryUtilization',
            dimensionsMap: {
              ClusterName: props.applicationStack.cluster.clusterName,
              ServiceName: props.applicationStack.service.serviceName,
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(1),
          }),
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'AWS/ECS',
            metricName: 'RunningTaskCount',
            dimensionsMap: {
              ClusterName: props.applicationStack.cluster.clusterName,
              ServiceName: props.applicationStack.service.serviceName,
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(1),
          }),
        ],
      })
    );

    return dashboard;
  }

  private createInfrastructureDashboard(props: MonitoringStackProps): cloudwatch.Dashboard {
    const dashboard = new cloudwatch.Dashboard(this, 'InfrastructureDashboard', {
      dashboardName: `DemoProject-Infrastructure-${props.environment}`,
    });

    // Database Performance
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Database Performance',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/RDS',
            metricName: 'CPUUtilization',
            dimensionsMap: {
              DBInstanceIdentifier: props.databaseStack.database.instanceIdentifier,
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(1),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/RDS',
            metricName: 'DatabaseConnections',
            dimensionsMap: {
              DBInstanceIdentifier: props.databaseStack.database.instanceIdentifier,
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(1),
          }),
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'AWS/RDS',
            metricName: 'FreeableMemory',
            dimensionsMap: {
              DBInstanceIdentifier: props.databaseStack.database.instanceIdentifier,
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(1),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Storage Metrics',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/RDS',
            metricName: 'FreeStorageSpace',
            dimensionsMap: {
              DBInstanceIdentifier: props.databaseStack.database.instanceIdentifier,
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(1),
          }),
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'AWS/S3',
            metricName: 'NumberOfObjects',
            dimensionsMap: {
              BucketName: props.storageStack.bucket.bucketName,
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/S3',
            metricName: 'BucketSizeBytes',
            dimensionsMap: {
              BucketName: props.storageStack.bucket.bucketName,
              StorageType: 'StandardStorage',
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Network Performance',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/EC2',
            metricName: 'NetworkIn',
            statistic: 'Average',
            period: cdk.Duration.minutes(1),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/EC2',
            metricName: 'NetworkOut',
            statistic: 'Average',
            period: cdk.Duration.minutes(1),
          }),
        ],
      })
    );

    return dashboard;
  }

  private createSecurityDashboard(props: MonitoringStackProps): cloudwatch.Dashboard {
    const dashboard = new cloudwatch.Dashboard(this, 'SecurityDashboard', {
      dashboardName: `DemoProject-Security-${props.environment}`,
    });

    // Security Metrics
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Authentication Metrics',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/Cognito',
            metricName: 'SignInSuccesses',
            dimensionsMap: {
              UserPool: props.authStack.userPool.userPoolId,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/Cognito',
            metricName: 'SignInFailures',
            dimensionsMap: {
              UserPool: props.authStack.userPool.userPoolId,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'API Gateway Security',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Count',
            statistic: 'Sum',
            period: cdk.Duration.minutes(1),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: '4XXError',
            statistic: 'Sum',
            period: cdk.Duration.minutes(1),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: '5XXError',
            statistic: 'Sum',
            period: cdk.Duration.minutes(1),
          }),
        ],
      })
    );

    return dashboard;
  }

  private createApplicationAlarms(props: MonitoringStackProps): void {
    // High Error Rate Alarm
    const highErrorRateAlarm = new cloudwatch.Alarm(this, 'HighErrorRateAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        metricName: 'HTTPCode_Target_5XX_Count',
        dimensionsMap: {
          LoadBalancer: props.applicationStack.loadBalancer.loadBalancerFullName,
          TargetGroup: props.applicationStack.service.serviceName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: 'High 5XX error rate detected',
      alarmName: `DemoProject-HighErrorRate-${props.environment}`,
    });

    highErrorRateAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.criticalAlertsTopic));

    // High Response Time Alarm
    const highResponseTimeAlarm = new cloudwatch.Alarm(this, 'HighResponseTimeAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        metricName: 'TargetResponseTime',
        dimensionsMap: {
          LoadBalancer: props.applicationStack.loadBalancer.loadBalancerFullName,
          TargetGroup: props.applicationStack.service.serviceName,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5000, // 5 seconds
      evaluationPeriods: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: 'High response time detected',
      alarmName: `DemoProject-HighResponseTime-${props.environment}`,
    });

    highResponseTimeAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.monitoringTopic));

    // ECS Service Unhealthy Alarm
    const ecsUnhealthyAlarm = new cloudwatch.Alarm(this, 'ECSUnhealthyAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ECS',
        metricName: 'HealthyTaskCount',
        dimensionsMap: {
          ClusterName: props.applicationStack.cluster.clusterName,
          ServiceName: props.applicationStack.service.serviceName,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(1),
      }),
      threshold: 1,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      alarmDescription: 'ECS service has insufficient healthy tasks',
      alarmName: `DemoProject-ECSUnhealthy-${props.environment}`,
    });

    ecsUnhealthyAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.criticalAlertsTopic));
  }

  private createInfrastructureAlarms(props: MonitoringStackProps): void {
    // Database CPU High Alarm
    const dbCpuHighAlarm = new cloudwatch.Alarm(this, 'DatabaseCpuHighAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          DBInstanceIdentifier: props.databaseStack.database.instanceIdentifier,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: 'Database CPU utilization is high',
      alarmName: `DemoProject-DatabaseCpuHigh-${props.environment}`,
    });

    dbCpuHighAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.monitoringTopic));

    // Database Connection Count High Alarm
    const dbConnectionsHighAlarm = new cloudwatch.Alarm(this, 'DatabaseConnectionsHighAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'DatabaseConnections',
        dimensionsMap: {
          DBInstanceIdentifier: props.databaseStack.database.instanceIdentifier,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: 'Database connection count is high',
      alarmName: `DemoProject-DatabaseConnectionsHigh-${props.environment}`,
    });

    dbConnectionsHighAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.monitoringTopic));

    // Storage Space Low Alarm
    const storageSpaceLowAlarm = new cloudwatch.Alarm(this, 'StorageSpaceLowAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'FreeStorageSpace',
        dimensionsMap: {
          DBInstanceIdentifier: props.databaseStack.database.instanceIdentifier,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5 * 1024 * 1024 * 1024, // 5 GB
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      alarmDescription: 'Database storage space is low',
      alarmName: `DemoProject-StorageSpaceLow-${props.environment}`,
    });

    storageSpaceLowAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.criticalAlertsTopic));
  }

  private createSecurityAlarms(props: MonitoringStackProps): void {
    // High Authentication Failure Rate Alarm
    const authFailureAlarm = new cloudwatch.Alarm(this, 'AuthFailureAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Cognito',
        metricName: 'SignInFailures',
        dimensionsMap: {
          UserPool: props.authStack.userPool.userPoolId,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 50,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: 'High authentication failure rate detected',
      alarmName: `DemoProject-AuthFailure-${props.environment}`,
    });

    authFailureAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.criticalAlertsTopic));

    // API Gateway 4XX Error Rate Alarm
    const api4xxAlarm = new cloudwatch.Alarm(this, 'API4XXAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '4XXError',
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 100,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: 'High 4XX error rate in API Gateway',
      alarmName: `DemoProject-API4XX-${props.environment}`,
    });

    api4xxAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.monitoringTopic));
  }

  private createCustomMetrics(props: MonitoringStackProps): void {
    // Custom metric for business logic monitoring
    // This would typically be populated by your application code
    new cloudwatch.Metric({
      namespace: 'DemoProject/Custom',
      metricName: 'UserActivity',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
      dimensionsMap: {
        Environment: props.environment,
        Service: 'Application',
      },
    });

    new cloudwatch.Metric({
      namespace: 'DemoProject/Custom',
      metricName: 'AssignmentSubmissions',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
      dimensionsMap: {
        Environment: props.environment,
        Service: 'Application',
      },
    });
  }

  private createLogInsightsQueries(props: MonitoringStackProps): void {
    // Create CloudWatch Logs Insights queries for common troubleshooting
    // These queries can be saved and reused in the CloudWatch console
    
    // Example query for ECS service errors
    const ecsErrorQuery = `
      fields @timestamp, @message
      | filter @logStream like /DemoProject/
      | filter @message like /ERROR/
      | sort @timestamp desc
      | limit 100
    `;

    // Example query for application performance
    const performanceQuery = `
      fields @timestamp, @message, @duration
      | filter @logStream like /DemoProject/
      | filter @message like /API/
      | sort @duration desc
      | limit 50
    `;

    // Example query for authentication events
    const authQuery = `
      fields @timestamp, @message, @user
      | filter @logStream like /DemoProject/
      | filter @message like /AUTH/
      | sort @timestamp desc
      | limit 100
    `;

    // Store these queries as outputs for easy access
    new cdk.CfnOutput(this, 'ECSErrorQuery', {
      value: ecsErrorQuery,
      description: 'CloudWatch Logs Insights query for ECS errors',
      exportName: `DemoProject-ECSErrorQuery-${props.environment}`,
    });

    new cdk.CfnOutput(this, 'PerformanceQuery', {
      value: performanceQuery,
      description: 'CloudWatch Logs Insights query for performance analysis',
      exportName: `DemoProject-PerformanceQuery-${props.environment}`,
    });

    new cdk.CfnOutput(this, 'AuthQuery', {
      value: authQuery,
      description: 'CloudWatch Logs Insights query for authentication events',
      exportName: `DemoProject-AuthQuery-${props.environment}`,
    });
  }

  private createPerformanceMonitoring(props: MonitoringStackProps): void {
    // Enable X-Ray tracing for performance monitoring
    // This would be configured in your application code and API Gateway
    
    // Create custom dashboard for performance metrics
    const performanceDashboard = new cloudwatch.Dashboard(this, 'PerformanceDashboard', {
      dashboardName: `DemoProject-Performance-${props.environment}`,
    });

    performanceDashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Application Latency Percentiles',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApplicationELB',
            metricName: 'TargetResponseTime',
            dimensionsMap: {
              LoadBalancer: props.applicationStack.loadBalancer.loadBalancerFullName,
              TargetGroup: props.applicationStack.service.serviceName,
            },
            statistic: 'p95',
            period: cdk.Duration.minutes(5),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/ApplicationELB',
            metricName: 'TargetResponseTime',
            dimensionsMap: {
              LoadBalancer: props.applicationStack.loadBalancer.loadBalancerFullName,
              TargetGroup: props.applicationStack.service.serviceName,
            },
            statistic: 'p99',
            period: cdk.Duration.minutes(5),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Throughput Metrics',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApplicationELB',
            metricName: 'RequestCount',
            dimensionsMap: {
              LoadBalancer: props.applicationStack.loadBalancer.loadBalancerFullName,
              TargetGroup: props.applicationStack.service.serviceName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(1),
          }),
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApplicationELB',
            metricName: 'ProcessedBytes',
            dimensionsMap: {
              LoadBalancer: props.applicationStack.loadBalancer.loadBalancerFullName,
              TargetGroup: props.applicationStack.service.serviceName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(1),
          }),
        ],
      })
    );

    // Create performance alarms
    const p95LatencyAlarm = new cloudwatch.Alarm(this, 'P95LatencyAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        metricName: 'TargetResponseTime',
        dimensionsMap: {
          LoadBalancer: props.applicationStack.loadBalancer.loadBalancerFullName,
          TargetGroup: props.applicationStack.service.serviceName,
        },
        statistic: 'p95',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 3000, // 3 seconds
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: 'P95 response time is above threshold',
      alarmName: `DemoProject-P95Latency-${props.environment}`,
    });

    p95LatencyAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.monitoringTopic));
  }
}
