import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export interface ApplicationStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  databaseStack: any; // Reference to DatabaseStack
  storageStack: any; // Reference to StorageStack
  authStack: any; // Reference to AuthStack
}

export class ApplicationStack extends cdk.Stack {
  public readonly cluster: ecs.Cluster;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly service: ecs.FargateService;
  public readonly repository: ecr.Repository;

  constructor(scope: Construct, id: string, props: ApplicationStackProps) {
    super(scope, id, props);

    // Create ECR repository
    this.repository = new ecr.Repository(this, 'DemoProjectRepository', {
      repositoryName: 'demoproject-app',
      imageScanOnPush: true,
      encryption: ecr.RepositoryEncryption.AES_256,
      lifecycleRules: [
        {
          maxImageCount: 10,
          rulePriority: 1,
          description: 'Keep only 10 most recent images',
        },
      ],
    });

    // Create ECS cluster
    this.cluster = new ecs.Cluster(this, 'DemoProjectCluster', {
      vpc: props.vpc,
      clusterName: 'DemoProject-Cluster',
      enableFargateCapacityProviders: true,
      containerInsights: true,
      defaultCloudMapNamespace: {
        name: 'demoproject.local',
      },
    });

    // Create task definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'DemoProjectTaskDef', {
      memoryLimitMiB: 512,
      cpu: 256,
      executionRole: this.createExecutionRole(),
      taskRole: this.createTaskRole(props.storageStack.bucket, props.authStack.userPool),
    });

    // Add container
    const container = taskDefinition.addContainer('DemoProjectContainer', {
      image: ecs.ContainerImage.fromEcrRepository(this.repository, 'latest'),
      containerName: 'demoproject-app',
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'DemoProject',
        logRetention: logs.RetentionDays.ONE_WEEK,
      }),
      environment: {
        NODE_ENV: 'production',
        PORT: '3000',
        AWS_REGION: this.region,
        COGNITO_USER_POOL_ID: props.authStack.userPool.userPoolId,
        COGNITO_USER_POOL_CLIENT_ID: props.authStack.userPoolClient.userPoolClientId,
        COGNITO_IDENTITY_POOL_ID: props.authStack.identityPool.ref,
        COGNITO_USER_POOL_DOMAIN: props.authStack.userPool.userPoolProviderName,
      },
      secrets: {
        DATABASE_URL: ecs.Secret.fromSecretsManager(props.databaseStack.databaseSecret, 'url'),
        REDIS_URL: ecs.Secret.fromSecretsManager(props.databaseStack.databaseSecret, 'redis_url'),
      },
      portMappings: [
        {
          containerPort: 3000,
          protocol: ecs.Protocol.TCP,
        },
      ],
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:3000/api/health || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });

    // Create Application Load Balancer
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'DemoProjectALB', {
      vpc: props.vpc,
      internetFacing: true,
      loadBalancerName: 'DemoProject-ALB',
      vpcSubnets: {
        subnets: props.vpc.publicSubnets,
      },
      securityGroup: this.createALBSecurityGroup(props.vpc),
    });

    // Add listener
    const listener = this.loadBalancer.addListener('DemoProjectListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.fixedResponse(200, {
        contentType: 'text/plain',
        messageBody: 'DemoProject ALB is working!',
      }),
    });

    // Create Fargate service
    this.service = new ecs.FargateService(this, 'DemoProjectService', {
      cluster: this.cluster,
      taskDefinition,
      serviceName: 'DemoProject-Service',
      desiredCount: 2,
      minHealthyPercent: 50,
      maxHealthyPercent: 200,
      securityGroups: [this.createServiceSecurityGroup(props.vpc)],
      vpcSubnets: {
        subnets: props.vpc.privateSubnets,
      },
      enableExecuteCommand: true,
    });

    // Add target group
    listener.addTargets('DemoProjectTarget', {
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [this.service],
      healthCheck: {
        path: '/api/health',
        healthyHttpCodes: '200',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      deregistrationDelay: cdk.Duration.seconds(30),
      stickinessCookieDuration: cdk.Duration.hours(1),
    });

    // Configure auto-scaling
    const scaling = this.service.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 10,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 80,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // Outputs
    new cdk.CfnOutput(this, 'ClusterName', {
      value: this.cluster.clusterName,
      description: 'ECS Cluster name',
      exportName: 'DemoProject-ClusterName',
    });

    new cdk.CfnOutput(this, 'ServiceName', {
      value: this.service.serviceName,
      description: 'ECS Service name',
      exportName: 'DemoProject-ServiceName',
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: this.loadBalancer.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
      exportName: 'DemoProject-LoadBalancerDNS',
    });

    new cdk.CfnOutput(this, 'RepositoryURI', {
      value: this.repository.repositoryUri,
      description: 'ECR Repository URI',
      exportName: 'DemoProject-RepositoryURI',
    });
  }

  private createExecutionRole(): iam.Role {
    return new iam.Role(this, 'DemoProjectExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
      inlinePolicies: {
        'DemoProjectExecutionPolicy': new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'secretsmanager:GetSecretValue',
                'kms:Decrypt',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });
  }

  private createTaskRole(storageBucket: s3.Bucket, userPool: cognito.UserPool): iam.Role {
    return new iam.Role(this, 'DemoProjectTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      inlinePolicies: {
        'DemoProjectTaskPolicy': new iam.PolicyDocument({
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
                storageBucket.bucketArn,
                `${storageBucket.bucketArn}/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogStreams',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'cognito-idp:AdminGetUser',
                'cognito-idp:AdminCreateUser',
                'cognito-idp:AdminUpdateUserAttributes',
                'cognito-idp:AdminDeleteUser',
                'cognito-idp:AdminAddUserToGroup',
                'cognito-idp:AdminRemoveUserFromGroup',
                'cognito-idp:AdminListGroupsForUser',
                'cognito-idp:AdminListUsers',
                'cognito-idp:AdminListUsersInGroup',
                'cognito-idp:AdminGetGroup',
                'cognito-idp:AdminListGroups',
                'cognito-idp:AdminCreateGroup',
                'cognito-idp:AdminUpdateGroup',
                'cognito-idp:AdminDeleteGroup',
              ],
              resources: [userPool.userPoolArn],
            }),
          ],
        }),
      },
    });
  }

  private createALBSecurityGroup(vpc: ec2.IVpc): ec2.SecurityGroup {
    const securityGroup = new ec2.SecurityGroup(this, 'DemoProjectALBSecurityGroup', {
      vpc,
      description: 'Security group for DemoProject ALB',
      allowAllOutbound: true,
    });

    // Allow HTTP from internet
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from internet'
    );

    // Allow HTTPS from internet (when you add SSL)
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from internet'
    );

    return securityGroup;
  }

  private createServiceSecurityGroup(vpc: ec2.IVpc): ec2.SecurityGroup {
    const securityGroup = new ec2.SecurityGroup(this, 'DemoProjectServiceSecurityGroup', {
      vpc,
      description: 'Security group for DemoProject ECS service',
      allowAllOutbound: true,
    });

    // Allow traffic from ALB
    securityGroup.addIngressRule(
      ec2.Peer.securityGroupId(this.createALBSecurityGroup(vpc).securityGroupId),
      ec2.Port.tcp(3000),
      'Allow traffic from ALB'
    );

    return securityGroup;
  }
}
