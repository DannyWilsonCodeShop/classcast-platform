import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

export class VideoInteractionsStack extends cdk.Stack {
  public readonly videosTable: dynamodb.Table;
  public readonly commentsTable: dynamodb.Table;
  public readonly responsesTable: dynamodb.Table;
  public readonly sharesTable: dynamodb.Table;
  public readonly videoStorageBucket: s3.Bucket;
  public readonly notificationsTopic: sns.Topic;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 Bucket for video storage
    this.videoStorageBucket = new s3.Bucket(this, 'VideoStorageBucket', {
      bucketName: `classcast-videos-${this.account}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'VideoLifecycle',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30)
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90)
            }
          ]
        }
      ],
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
          allowedOrigins: ['*'],
          allowedHeaders: ['*']
        }
      ]
    });

    // Videos Table
    this.videosTable = new dynamodb.Table(this, 'VideosTable', {
      tableName: 'ClassCastVideos',
      partitionKey: { name: 'videoId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    // Add GSI for user videos
    this.videosTable.addGlobalSecondaryIndex({
      indexName: 'UserVideosIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING }
    });

    // Add GSI for assignment videos
    this.videosTable.addGlobalSecondaryIndex({
      indexName: 'AssignmentVideosIndex',
      partitionKey: { name: 'assignmentId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING }
    });

    // Comments Table
    this.commentsTable = new dynamodb.Table(this, 'CommentsTable', {
      tableName: 'ClassCastComments',
      partitionKey: { name: 'videoId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'commentId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    // Add GSI for user comments
    this.commentsTable.addGlobalSecondaryIndex({
      indexName: 'UserCommentsIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING }
    });

    // Add GSI for parent comments (replies)
    this.commentsTable.addGlobalSecondaryIndex({
      indexName: 'ParentCommentsIndex',
      partitionKey: { name: 'parentCommentId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING }
    });

    // Responses Table
    this.responsesTable = new dynamodb.Table(this, 'ResponsesTable', {
      tableName: 'ClassCastResponses',
      partitionKey: { name: 'videoId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'responseId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    // Add GSI for user responses
    this.responsesTable.addGlobalSecondaryIndex({
      indexName: 'UserResponsesIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING }
    });

    // Add GSI for assignment responses
    this.responsesTable.addGlobalSecondaryIndex({
      indexName: 'AssignmentResponsesIndex',
      partitionKey: { name: 'assignmentId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING }
    });

    // Add GSI for grading queue
    this.responsesTable.addGlobalSecondaryIndex({
      indexName: 'GradingQueueIndex',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING }
    });

    // Shares Table
    this.sharesTable = new dynamodb.Table(this, 'SharesTable', {
      tableName: 'ClassCastShares',
      partitionKey: { name: 'videoId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'shareId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    // Add GSI for user shares
    this.sharesTable.addGlobalSecondaryIndex({
      indexName: 'UserSharesIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING }
    });

    // SNS Topic for notifications
    this.notificationsTopic = new sns.Topic(this, 'NotificationsTopic', {
      topicName: 'ClassCastNotifications',
      displayName: 'ClassCast Notifications'
    });

    // Lambda function for video processing
    const videoProcessingLambda = new lambda.Function(this, 'VideoProcessingLambda', {
      functionName: 'ClassCastVideoProcessing',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/video-processing'),
      timeout: cdk.Duration.minutes(15),
      memorySize: 1024,
      environment: {
        VIDEOS_TABLE_NAME: this.videosTable.tableName,
        VIDEO_BUCKET_NAME: this.videoStorageBucket.bucketName,
        REGION: this.region
      }
    });

    // Grant permissions
    this.videosTable.grantReadWriteData(videoProcessingLambda);
    this.videoStorageBucket.grantReadWrite(videoProcessingLambda);

    // Lambda function for comment moderation
    const commentModerationLambda = new lambda.Function(this, 'CommentModerationLambda', {
      functionName: 'ClassCastCommentModeration',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/comment-moderation'),
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      environment: {
        COMMENTS_TABLE_NAME: this.commentsTable.tableName,
        REGION: this.region
      }
    });

    this.commentsTable.grantReadWriteData(commentModerationLambda);

    // Lambda function for grading notifications
    const gradingNotificationLambda = new lambda.Function(this, 'GradingNotificationLambda', {
      functionName: 'ClassCastGradingNotification',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/grading-notification'),
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      environment: {
        RESPONSES_TABLE_NAME: this.responsesTable.tableName,
        NOTIFICATIONS_TOPIC_ARN: this.notificationsTopic.topicArn,
        REGION: this.region
      }
    });

    this.responsesTable.grantReadWriteData(gradingNotificationLambda);
    this.notificationsTopic.grantPublish(gradingNotificationLambda);

    // Outputs
    new cdk.CfnOutput(this, 'VideosTableName', {
      value: this.videosTable.tableName,
      description: 'Name of the videos DynamoDB table'
    });

    new cdk.CfnOutput(this, 'CommentsTableName', {
      value: this.commentsTable.tableName,
      description: 'Name of the comments DynamoDB table'
    });

    new cdk.CfnOutput(this, 'ResponsesTableName', {
      value: this.responsesTable.tableName,
      description: 'Name of the responses DynamoDB table'
    });

    new cdk.CfnOutput(this, 'SharesTableName', {
      value: this.sharesTable.tableName,
      description: 'Name of the shares DynamoDB table'
    });

    new cdk.CfnOutput(this, 'VideoBucketName', {
      value: this.videoStorageBucket.bucketName,
      description: 'Name of the video storage S3 bucket'
    });

    new cdk.CfnOutput(this, 'NotificationsTopicArn', {
      value: this.notificationsTopic.topicArn,
      description: 'ARN of the notifications SNS topic'
    });
  }
}
