import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';

export interface StorageStackProps extends cdk.StackProps {
  // Add any props you need
}

export class StorageStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;
  public readonly cloudfrontDistribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props?: StorageStackProps) {
    super(scope, id, props);

    // Create S3 bucket with proper configuration
    this.bucket = new s3.Bucket(this, 'DemoProjectStorage', {
      bucketName: `demoproject-storage-${this.account}-${this.region}`,
      versioned: true, // Enable versioning for file recovery
      encryption: s3.BucketEncryption.S3_MANAGED, // Server-side encryption
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // Block public access
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development - change to RETAIN for production
      autoDeleteObjects: true, // For development - disable for production
      
      // Lifecycle policies
      lifecycleRules: [
        // Move files to IA after 30 days
        {
          id: 'MoveToIA',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
        // Move files to Glacier after 90 days
        {
          id: 'MoveToGlacier',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
        // Move files to Deep Archive after 365 days
        {
          id: 'MoveToDeepArchive',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.DEEP_ARCHIVE,
              transitionAfter: cdk.Duration.days(365),
            },
          ],
        },
        // Delete incomplete multipart uploads after 7 days
        {
          id: 'AbortIncompleteMultipart',
          enabled: true,
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
        // Delete old versions after 1 year
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionTransitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
            {
              storageClass: s3.StorageClass.DEEP_ARCHIVE,
              transitionAfter: cdk.Duration.days(365),
            },
          ],
          noncurrentVersionExpiration: cdk.Duration.days(1095), // 3 years
        },
      ],

      // CORS configuration
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.POST,
            s3.HttpMethods.PUT,
            s3.HttpMethods.DELETE,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: [
            'http://localhost:3000',
            'https://localhost:3000',
            'https://*.vercel.app',
            'https://*.amazonaws.com',
          ],
          allowedHeaders: [
            '*',
          ],
          exposedHeaders: [
            'ETag',
            'x-amz-meta-custom-header',
          ],
          maxAge: 3000, // 50 minutes
        },
      ],

      // Object ownership - disable ACLs for security
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,

      // Intelligent tiering for cost optimization
      intelligentTieringConfigurations: [
        {
          id: 'GeneralPurpose',
          name: 'General Purpose',
          status: 'Enabled',
        },
      ],

      // Metrics and analytics
      metrics: [
        {
          id: 'EntireBucket',
          name: 'EntireBucket',
        },
      ],

      // Inventory configuration
      inventories: [
        {
          id: 'WeeklyInventory',
          destination: {
            bucket: this.bucket,
            prefix: 'inventory/',
          },
          format: s3.InventoryFormat.CSV,
          frequency: s3.InventoryFrequency.WEEKLY,
          includedObjectVersions: s3.IncludedObjectVersions.ALL,
        },
      ],
    });

    // Create CloudFront distribution for secure access
    this.cloudfrontDistribution = new cloudfront.Distribution(this, 'DemoProjectCDN', {
      defaultBehavior: {
        origin: new origins.S3Origin(this.bucket, {
          originAccessIdentity: new cloudfront.OriginAccessIdentity(this, 'DemoProjectOAI', {
            comment: 'OAI for DemoProject S3 bucket',
          }),
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        compress: true,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
      },
      additionalBehaviors: {
        '/uploads/*': {
          origin: new origins.S3Origin(this.bucket, {
            originAccessIdentity: new cloudfront.OriginAccessIdentity(this, 'UploadsOAI', {
              comment: 'OAI for uploads',
            }),
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
          compress: true,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
        },
        '/submissions/*': {
          origin: new origins.S3Origin(this.bucket, {
            originAccessIdentity: new cloudfront.OriginAccessIdentity(this, 'SubmissionsOAI', {
              comment: 'OAI for submissions',
            }),
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
          compress: true,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
        },
      },
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0),
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // Use only North America and Europe
      enableLogging: true,
      logBucket: new s3.Bucket(this, 'DemoProjectCDNLogs', {
        bucketName: `demoproject-cdn-logs-${this.account}-${this.region}`,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        lifecycleRules: [
          {
            id: 'DeleteOldLogs',
            enabled: true,
            expiration: cdk.Duration.days(90),
          },
        ],
      }),
    });

    // Grant read access to CloudFront
    this.bucket.grantRead(new iam.AccountPrincipal(this.account));

    // Create IAM policy for application access
    const bucketPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
        's3:DeleteObject',
        's3:ListBucket',
        's3:GetObjectVersion',
        's3:PutObjectAcl',
      ],
      resources: [
        this.bucket.bucketArn,
        `${this.bucket.bucketArn}/*`,
      ],
      principals: [
        new iam.ServicePrincipal('lambda.amazonaws.com'),
        new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      ],
    });

    this.bucket.addToResourcePolicy(bucketPolicy);

    // Create folder structure in S3
    const folderStructure = new s3deploy.BucketDeployment(this, 'CreateFolders', {
      sources: [s3deploy.Source.asset('./assets/s3-folders')],
      destinationBucket: this.bucket,
      destinationKeyPrefix: '',
      prune: false,
    });

    // Outputs
    new cdk.CfnOutput(this, 'StorageBucketName', {
      value: this.bucket.bucketName,
      description: 'S3 Storage bucket name',
      exportName: 'DemoProject-StorageBucketName',
    });

    new cdk.CfnOutput(this, 'StorageBucketArn', {
      value: this.bucket.bucketArn,
      description: 'S3 Storage bucket ARN',
      exportName: 'DemoProject-StorageBucketArn',
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: this.cloudfrontDistribution.distributionId,
      description: 'CloudFront distribution ID',
      exportName: 'DemoProject-CloudFrontDistributionId',
    });

    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      value: this.cloudfrontDistribution.distributionDomainName,
      description: 'CloudFront distribution domain name',
      exportName: 'DemoProject-CloudFrontDomainName',
    });

    // Add tags
    cdk.Tags.of(this).add('Project', 'DemoProject');
    cdk.Tags.of(this).add('Component', 'Storage');
    cdk.Tags.of(this).add('Environment', 'Development');
  }
}
