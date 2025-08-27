import * as cdk from 'aws-cdk-lib';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as firehose from 'aws-cdk-lib/aws-kinesisfirehose';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export interface LoggingStackProps extends cdk.StackProps {
  applicationStack: any; // Reference to ApplicationStack
  databaseStack: any; // Reference to DatabaseStack
  storageStack: any; // Reference to StorageStack
  apiGatewayStack: any; // Reference to ApiGatewayStack
  authStack: any; // Reference to AuthStack
  environment: string; // 'development', 'staging', or 'production'
}

export class LoggingStack extends cdk.Stack {
  public readonly centralLogGroup: logs.LogGroup;
  public readonly applicationLogGroup: logs.LogGroup;
  public readonly databaseLogGroup: logs.LogGroup;
  public readonly securityLogGroup: logs.LogGroup;
  public readonly performanceLogGroup: logs.LogGroup;
  public readonly logArchiveBucket: s3.Bucket;
  public readonly logProcessingStream: kinesis.Stream;
  public readonly logProcessingFirehose: firehose.CfnDeliveryStream;

  constructor(scope: Construct, id: string, props: LoggingStackProps) {
    super(scope, id, props);

    // Create central log group for all application logs
    this.centralLogGroup = new logs.LogGroup(this, 'CentralLogGroup', {
      logGroupName: `/DemoProject/Central/${props.environment}`,
      retention: props.environment === 'production' ? logs.RetentionDays.ONE_YEAR : logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create application-specific log groups
    this.applicationLogGroup = new logs.LogGroup(this, 'ApplicationLogGroup', {
      logGroupName: `/DemoProject/Application/${props.environment}`,
      retention: props.environment === 'production' ? logs.RetentionDays.ONE_YEAR : logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    this.databaseLogGroup = new logs.LogGroup(this, 'DatabaseLogGroup', {
      logGroupName: `/DemoProject/Database/${props.environment}`,
      retention: props.environment === 'production' ? logs.RetentionDays.ONE_YEAR : logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    this.securityLogGroup = new logs.LogGroup(this, 'SecurityLogGroup', {
      logGroupName: `/DemoProject/Security/${props.environment}`,
      retention: props.environment === 'production' ? logs.RetentionDays.THREE_YEARS : logs.RetentionDays.ONE_YEAR,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    this.performanceLogGroup = new logs.LogGroup(this, 'PerformanceLogGroup', {
      logGroupName: `/DemoProject/Performance/${props.environment}`,
      retention: props.environment === 'production' ? logs.RetentionDays.ONE_YEAR : logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create S3 bucket for log archiving
    this.logArchiveBucket = new s3.Bucket(this, 'LogArchiveBucket', {
      bucketName: `demoproject-logs-${props.environment}-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'LogArchiveLifecycle',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
            {
              storageClass: s3.StorageClass.DEEP_ARCHIVE,
              transitionAfter: cdk.Duration.days(365),
            },
          ],
          expiration: cdk.Duration.days(2555), // 7 years
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create Kinesis stream for real-time log processing
    this.logProcessingStream = new kinesis.Stream(this, 'LogProcessingStream', {
      streamName: `DemoProject-LogProcessing-${props.environment}`,
      shardCount: props.environment === 'production' ? 4 : 1,
      retentionPeriod: cdk.Duration.hours(24),
    });

    // Create Kinesis Firehose for log delivery to S3
    this.logProcessingFirehose = new firehose.CfnDeliveryStream(this, 'LogProcessingFirehose', {
      deliveryStreamName: `DemoProject-LogProcessing-${props.environment}`,
      deliveryStreamType: 'KinesisStreamAsSource',
      kinesisStreamSourceConfiguration: {
        kinesisStreamArn: this.logProcessingStream.streamArn,
        roleArn: this.createFirehoseRole().roleArn,
      },
      extendedS3DestinationConfiguration: {
        bucketArn: this.logArchiveBucket.bucketArn,
        prefix: `logs/${props.environment}/!{timestamp:yyyy/MM/dd/HH}/`,
        errorOutputPrefix: `logs/${props.environment}/errors/!{timestamp:yyyy/MM/dd/HH}/`,
        bufferingHints: {
          intervalInSeconds: 300, // 5 minutes
          sizeInMBs: 50,
        },
        compressionFormat: 'GZIP',
        encryptionConfiguration: {
          noEncryptionConfig: 'NoEncryption',
        },
        cloudWatchLoggingOptions: {
          enabled: true,
          logGroupName: this.centralLogGroup.logGroupName,
          logStreamName: 'firehose-delivery',
        },
      },
    });

    // Create log processing Lambda function
    const logProcessorLambda = this.createLogProcessorLambda(props);

    // Create log insights queries
    this.createLogInsightsQueries(props);

    // Create log retention policies
    this.createLogRetentionPolicies(props);

    // Create log export configurations
    this.createLogExportConfigurations(props);

    // Create outputs
    this.createOutputs(props);
  }

  private createFirehoseRole(): iam.Role {
    return new iam.Role(this, 'FirehoseRole', {
      assumedBy: new iam.ServicePrincipal('firehose.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSKinesisFirehoseServiceRole'),
      ],
      inlinePolicies: {
        'S3Access': new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:ListBucket',
              ],
              resources: [
                this.logArchiveBucket.bucketArn,
                `${this.logArchiveBucket.bucketArn}/*`,
              ],
            }),
          ],
        }),
        'KinesisAccess': new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'kinesis:DescribeStream',
                'kinesis:GetShardIterator',
                'kinesis:GetRecords',
              ],
              resources: [this.logProcessingStream.streamArn],
            }),
          ],
        }),
        'CloudWatchLogsAccess': new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:PutLogEvents',
              ],
              resources: [this.centralLogGroup.logGroupArn],
            }),
          ],
        }),
      },
    });
  }

  private createLogProcessorLambda(props: LoggingStackProps): lambda.Function {
    const logProcessor = new lambda.Function(this, 'LogProcessorLambda', {
      functionName: `DemoProject-LogProcessor-${props.environment}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Processing logs:', JSON.stringify(event, null, 2));
          
          // Process Kinesis records
          for (const record of event.Records) {
            const payload = JSON.parse(Buffer.from(record.kinesis.data, 'base64').toString());
            
            // Add metadata
            const enrichedLog = {
              ...payload,
              processedAt: new Date().toISOString(),
              environment: '${props.environment}',
              source: 'kinesis-stream',
            };
            
            // Send to CloudWatch Logs
            console.log('Enriched log:', JSON.stringify(enrichedLog, null, 2));
          }
          
          return { statusCode: 200 };
        };
      `),
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      environment: {
        ENVIRONMENT: props.environment,
        CENTRAL_LOG_GROUP: this.centralLogGroup.logGroupName,
      },
    });

    // Grant permissions to write to CloudWatch Logs
    this.centralLogGroup.grantWrite(logProcessor);

    return logProcessor;
  }

  private createLogInsightsQueries(props: LoggingStackProps): void {
    // Create comprehensive log insights queries for different use cases
    
    // Application error analysis
    const appErrorQuery = `
      fields @timestamp, @message, @logStream, @requestId
      | filter @logStream like /DemoProject/
      | filter @message like /ERROR/
      | parse @message /(?<level>ERROR|WARN|INFO|DEBUG): (?<message>.*)/
      | stats count() by level, bin(5m)
      | sort @timestamp desc
    `;

    // Performance analysis
    const performanceQuery = `
      fields @timestamp, @message, @duration, @requestId
      | filter @logStream like /DemoProject/
      | filter @message like /API/
      | parse @message /API (?<method>\\w+) (?<endpoint>\\S+) - (?<duration>\\d+)ms/
      | stats avg(@duration), max(@duration), min(@duration) by endpoint, bin(5m)
      | sort avg(@duration) desc
    `;

    // Security event analysis
    const securityQuery = `
      fields @timestamp, @message, @user, @ip, @action
      | filter @logStream like /DemoProject/
      | filter @message like /AUTH|SECURITY|LOGIN|LOGOUT/
      | parse @message /(?<action>\\w+): (?<details>.*)/
      | stats count() by action, bin(5m)
      | sort @timestamp desc
    `;

    // Database query analysis
    const databaseQuery = `
      fields @timestamp, @message, @duration, @query
      | filter @logStream like /DemoProject/
      | filter @message like /DATABASE|QUERY|SQL/
      | parse @message /Query: (?<query>.*) - (?<duration>\\d+)ms/
      | stats avg(@duration), count() by query, bin(5m)
      | sort avg(@duration) desc
    `;

    // User activity analysis
    const userActivityQuery = `
      fields @timestamp, @message, @user, @action
      | filter @logStream like /DemoProject/
      | filter @message like /USER|ACTIVITY|ASSIGNMENT|SUBMISSION/
      | parse @message /(?<action>\\w+): (?<details>.*)/
      | stats count() by action, @user, bin(1h)
      | sort count() desc
    `;

    // Store queries as outputs
    new cdk.CfnOutput(this, 'AppErrorQuery', {
      value: appErrorQuery,
      description: 'Log Insights query for application error analysis',
      exportName: `DemoProject-AppErrorQuery-${props.environment}`,
    });

    new cdk.CfnOutput(this, 'PerformanceQuery', {
      value: performanceQuery,
      description: 'Log Insights query for performance analysis',
      exportName: `DemoProject-PerformanceQuery-${props.environment}`,
    });

    new cdk.CfnOutput(this, 'SecurityQuery', {
      value: securityQuery,
      description: 'Log Insights query for security event analysis',
      exportName: `DemoProject-SecurityQuery-${props.environment}`,
    });

    new cdk.CfnOutput(this, 'DatabaseQuery', {
      value: databaseQuery,
      description: 'Log Insights query for database query analysis',
      exportName: `DemoProject-DatabaseQuery-${props.environment}`,
    });

    new cdk.CfnOutput(this, 'UserActivityQuery', {
      value: userActivityQuery,
      description: 'Log Insights query for user activity analysis',
      exportName: `DemoProject-UserActivityQuery-${props.environment}`,
    });
  }

  private createLogRetentionPolicies(props: LoggingStackProps): void {
    // Create log retention policies based on environment and log type
    
    // Development environment: shorter retention
    if (props.environment === 'development') {
      new logs.LogGroup(this, 'DevLogGroup', {
        logGroupName: `/DemoProject/Development/${props.environment}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });
    }

    // Staging environment: medium retention
    if (props.environment === 'staging') {
      new logs.LogGroup(this, 'StagingLogGroup', {
        logGroupName: `/DemoProject/Staging/${props.environment}`,
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      });
    }

    // Production environment: extended retention for compliance
    if (props.environment === 'production') {
      new logs.LogGroup(this, 'ProductionLogGroup', {
        logGroupName: `/DemoProject/Production/${props.environment}`,
        retention: logs.RetentionDays.THREE_YEARS,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      });

      // Compliance logs with extended retention
      new logs.LogGroup(this, 'ComplianceLogGroup', {
        logGroupName: `/DemoProject/Compliance/${props.environment}`,
        retention: logs.RetentionDays.SEVEN_YEARS,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      });
    }
  }

  private createLogExportConfigurations(props: LoggingStackProps): void {
    // Create log export configurations for different destinations
    
    // Export to S3 for long-term storage
    new logs.CfnLogGroup(this, 'ExportLogGroup', {
      logGroupName: `/DemoProject/Export/${props.environment}`,
      retentionInDays: props.environment === 'production' ? 2555 : 90, // 7 years for production
    });

    // Export to CloudWatch Logs Insights for analysis
    new logs.CfnLogGroup(this, 'InsightsLogGroup', {
      logGroupName: `/DemoProject/Insights/${props.environment}`,
      retentionInDays: props.environment === 'production' ? 365 : 30,
    });

    // Export to external monitoring systems (if needed)
    if (props.environment === 'production') {
      new logs.CfnLogGroup(this, 'ExternalMonitoringLogGroup', {
        logGroupName: `/DemoProject/ExternalMonitoring/${props.environment}`,
        retentionInDays: 90,
      });
    }
  }

  private createOutputs(props: LoggingStackProps): void {
    // Create CloudFormation outputs for easy access to logging resources
    
    new cdk.CfnOutput(this, 'CentralLogGroupName', {
      value: this.centralLogGroup.logGroupName,
      description: 'Central log group name',
      exportName: `DemoProject-CentralLogGroup-${props.environment}`,
    });

    new cdk.CfnOutput(this, 'ApplicationLogGroupName', {
      value: this.applicationLogGroup.logGroupName,
      description: 'Application log group name',
      exportName: `DemoProject-ApplicationLogGroup-${props.environment}`,
    });

    new cdk.CfnOutput(this, 'DatabaseLogGroupName', {
      value: this.databaseLogGroup.logGroupName,
      description: 'Database log group name',
      exportName: `DemoProject-DatabaseLogGroup-${props.environment}`,
    });

    new cdk.CfnOutput(this, 'SecurityLogGroupName', {
      value: this.securityLogGroup.logGroupName,
      description: 'Security log group name',
      exportName: `DemoProject-SecurityLogGroup-${props.environment}`,
    });

    new cdk.CfnOutput(this, 'PerformanceLogGroupName', {
      value: this.performanceLogGroup.logGroupName,
      description: 'Performance log group name',
      exportName: `DemoProject-PerformanceLogGroup-${props.environment}`,
    });

    new cdk.CfnOutput(this, 'LogArchiveBucketName', {
      value: this.logArchiveBucket.bucketName,
      description: 'Log archive S3 bucket name',
      exportName: `DemoProject-LogArchiveBucket-${props.environment}`,
    });

    new cdk.CfnOutput(this, 'LogProcessingStreamName', {
      value: this.logProcessingStream.streamName,
      description: 'Log processing Kinesis stream name',
      exportName: `DemoProject-LogProcessingStream-${props.environment}`,
    });

    new cdk.CfnOutput(this, 'LogProcessingFirehoseName', {
      value: this.logProcessingFirehose.deliveryStreamName!,
      description: 'Log processing Firehose delivery stream name',
      exportName: `DemoProject-LogProcessingFirehose-${props.environment}`,
    });
  }
}
