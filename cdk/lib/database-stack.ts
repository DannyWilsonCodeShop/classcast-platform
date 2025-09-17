import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export interface DatabaseStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
}

export class DatabaseStack extends cdk.Stack {
  public readonly database: rds.DatabaseInstance;
  public readonly redisCache: elasticache.CfnCacheCluster;
  public readonly databaseSecret: secretsmanager.Secret;
  public readonly usersTable: dynamodb.Table;
  public readonly assignmentsTable: dynamodb.Table;
  public readonly submissionsTable: dynamodb.Table;
  public readonly videosTable: dynamodb.Table;
  public readonly videoInteractionsTable: dynamodb.Table;
  public readonly enrollmentsTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    // Create database secret
    this.databaseSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      secretName: 'DemoProject/DatabaseCredentials',
      description: 'Database credentials for DemoProject',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
        passwordLength: 32,
      },
    });

    // Create RDS PostgreSQL instance
    this.database = new rds.DatabaseInstance(this, 'DemoProjectDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_4,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      databaseName: 'demoproject',
      credentials: rds.Credentials.fromSecret(this.databaseSecret),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      backupRetention: cdk.Duration.days(7),
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      storageEncrypted: true,
      monitoringInterval: cdk.Duration.minutes(1),
      enablePerformanceInsights: true,
              performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
    });

    // Create ElastiCache Redis cluster
    this.redisCache = new elasticache.CfnCacheCluster(this, 'DemoProjectRedis', {
      engine: 'redis',
      cacheNodeType: 'cache.t3.micro',
      numCacheNodes: 1,
      port: 6379,
      vpcSecurityGroupIds: [this.createRedisSecurityGroup(props.vpc).securityGroupId],
      cacheSubnetGroupName: this.createRedisSubnetGroup(props.vpc).ref,
      engineVersion: '7.0',
      autoMinorVersionUpgrade: true,
              cacheParameterGroupName: 'default.redis7',
      preferredAvailabilityZone: props.vpc.privateSubnets[0].availabilityZone,
    });

    // Create DynamoDB Users table
    this.usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'DemoProject-Users',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      contributorInsightsEnabled: true,
    });

    // Add GSIs to Users table
    this.usersTable.addGlobalSecondaryIndex({
      indexName: 'EmailIndex',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.usersTable.addGlobalSecondaryIndex({
      indexName: 'RoleIndex',
      partitionKey: { name: 'role', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: ['userId', 'email', 'firstName', 'lastName', 'status'],
    });

    this.usersTable.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'lastLoginAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: ['userId', 'email', 'role', 'firstName', 'lastName'],
    });

    // Create DynamoDB Assignments table
    this.assignmentsTable = new dynamodb.Table(this, 'AssignmentsTable', {
      tableName: 'DemoProject-Assignments',
      partitionKey: { name: 'assignmentId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'courseId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      contributorInsightsEnabled: true,
    });

    // Add GSIs to Assignments table
    this.assignmentsTable.addGlobalSecondaryIndex({
      indexName: 'CourseIndex',
      partitionKey: { name: 'courseId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'dueDate', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.assignmentsTable.addGlobalSecondaryIndex({
      indexName: 'InstructorIndex',
      partitionKey: { name: 'instructorId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: ['assignmentId', 'title', 'courseId', 'dueDate', 'status'],
    });

    this.assignmentsTable.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'dueDate', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: ['assignmentId', 'title', 'courseId', 'instructorId'],
    });

    this.assignmentsTable.addGlobalSecondaryIndex({
      indexName: 'TypeIndex',
      partitionKey: { name: 'assignmentType', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'dueDate', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: ['assignmentId', 'title', 'courseId', 'instructorId', 'status'],
    });

    // Create DynamoDB Submissions table
    this.submissionsTable = new dynamodb.Table(this, 'SubmissionsTable', {
      tableName: 'DemoProject-Submissions',
      partitionKey: { name: 'submissionId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'assignmentId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      contributorInsightsEnabled: true,
    });

    // Add GSIs to Submissions table
    this.submissionsTable.addGlobalSecondaryIndex({
      indexName: 'AssignmentIndex',
      partitionKey: { name: 'assignmentId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'submittedAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.submissionsTable.addGlobalSecondaryIndex({
      indexName: 'StudentIndex',
      partitionKey: { name: 'studentId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'submittedAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: ['submissionId', 'assignmentId', 'status', 'score', 'feedback'],
    });

    this.submissionsTable.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'submittedAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: ['submissionId', 'assignmentId', 'studentId', 'score'],
    });

    this.submissionsTable.addGlobalSecondaryIndex({
      indexName: 'CourseIndex',
      partitionKey: { name: 'courseId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'submittedAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: ['submissionId', 'assignmentId', 'studentId', 'status', 'score'],
    });

    // Add TTL to tables for automatic cleanup
    this.usersTable.addGlobalSecondaryIndex({
      indexName: 'TTLIndex',
      partitionKey: { name: 'ttl', type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.KEYS_ONLY,
    });

    this.assignmentsTable.addGlobalSecondaryIndex({
      indexName: 'TTLIndex',
      partitionKey: { name: 'ttl', type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: 'assignmentId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.KEYS_ONLY,
    });

    this.submissionsTable.addGlobalSecondaryIndex({
      indexName: 'TTLIndex',
      partitionKey: { name: 'ttl', type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: 'submissionId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.KEYS_ONLY,
    });

    // Create DynamoDB Videos table
    this.videosTable = new dynamodb.Table(this, 'VideosTable', {
      tableName: 'classcast-videos',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      contributorInsightsEnabled: true,
    });

    // Add GSIs to Videos table
    this.videosTable.addGlobalSecondaryIndex({
      indexName: 'CourseIndex',
      partitionKey: { name: 'courseId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.videosTable.addGlobalSecondaryIndex({
      indexName: 'UserIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Create DynamoDB Video Interactions table
    this.videoInteractionsTable = new dynamodb.Table(this, 'VideoInteractionsTable', {
      tableName: 'classcast-video-interactions',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      contributorInsightsEnabled: true,
    });

    // Add GSIs to Video Interactions table
    this.videoInteractionsTable.addGlobalSecondaryIndex({
      indexName: 'VideoIndex',
      partitionKey: { name: 'videoId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.videoInteractionsTable.addGlobalSecondaryIndex({
      indexName: 'UserIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.videoInteractionsTable.addGlobalSecondaryIndex({
      indexName: 'TypeIndex',
      partitionKey: { name: 'type', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Create DynamoDB Enrollments table
    this.enrollmentsTable = new dynamodb.Table(this, 'EnrollmentsTable', {
      tableName: 'classcast-enrollments',
      partitionKey: { name: 'enrollmentId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      contributorInsightsEnabled: true,
    });

    // Add GSIs to Enrollments table
    this.enrollmentsTable.addGlobalSecondaryIndex({
      indexName: 'UserIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'enrolledAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.enrollmentsTable.addGlobalSecondaryIndex({
      indexName: 'CourseIndex',
      partitionKey: { name: 'courseId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'enrolledAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.enrollmentsTable.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'enrolledAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Outputs
    new cdk.CfnOutput(this, 'UsersTableName', {
      value: this.usersTable.tableName,
      description: 'DynamoDB Users table name',
      exportName: 'DemoProject-UsersTableName',
    });

    new cdk.CfnOutput(this, 'AssignmentsTableName', {
      value: this.assignmentsTable.tableName,
      description: 'DynamoDB Assignments table name',
      exportName: 'DemoProject-AssignmentsTableName',
    });

    new cdk.CfnOutput(this, 'SubmissionsTableName', {
      value: this.submissionsTable.tableName,
      description: 'DynamoDB Submissions table name',
      exportName: 'DemoProject-SubmissionsTableName',
    });

    new cdk.CfnOutput(this, 'VideosTableName', {
      value: this.videosTable.tableName,
      description: 'DynamoDB Videos table name',
      exportName: 'DemoProject-VideosTableName',
    });

    new cdk.CfnOutput(this, 'VideoInteractionsTableName', {
      value: this.videoInteractionsTable.tableName,
      description: 'DynamoDB Video Interactions table name',
      exportName: 'DemoProject-VideoInteractionsTableName',
    });

    new cdk.CfnOutput(this, 'EnrollmentsTableName', {
      value: this.enrollmentsTable.tableName,
      description: 'DynamoDB Enrollments table name',
      exportName: 'DemoProject-EnrollmentsTableName',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.database.instanceEndpoint.hostname,
      description: 'RDS PostgreSQL endpoint',
      exportName: 'DemoProject-DatabaseEndpoint',
    });

    new cdk.CfnOutput(this, 'RedisEndpoint', {
      value: this.redisCache.attrRedisEndpointAddress,
      description: 'ElastiCache Redis endpoint',
      exportName: 'DemoProject-RedisEndpoint',
    });
  }

  private createRedisSecurityGroup(vpc: ec2.IVpc): ec2.SecurityGroup {
    const securityGroup = new ec2.SecurityGroup(this, 'RedisSecurityGroup', {
      vpc,
      description: 'Security group for Redis cache',
      allowAllOutbound: true,
    });

    // Allow access from private subnets
    securityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(6379),
      'Allow Redis access from VPC'
    );

    return securityGroup;
  }

  private createRedisSubnetGroup(vpc: ec2.IVpc): elasticache.CfnSubnetGroup {
    return new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'Subnet group for Redis cache',
      subnetIds: vpc.privateSubnets.map(subnet => subnet.subnetId),
    });
  }
}
