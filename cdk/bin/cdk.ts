#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk-stack';
import { NetworkStack } from '../lib/network-stack';
import { StorageStack } from '../lib/storage-stack';
import { AuthStack } from '../lib/auth-stack';
import { DatabaseStack } from '../lib/database-stack';
import { ApplicationStack } from '../lib/application-stack';
import { ApiGatewayStack } from '../lib/api-gateway-stack';
import { MonitoringStack } from '../lib/monitoring-stack';
import { LoggingStack } from '../lib/logging-stack';
import { ErrorTrackingStack } from '../lib/error-tracking-stack';
import { VideoInteractionsStack } from '../lib/video-interactions-stack';

const app = new cdk.App();

// Environment configuration
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

// Network Stack (VPC, Subnets, Security Groups)
const networkStack = new NetworkStack(app, 'DemoProject-NetworkStack', {
  env,
  description: 'Network infrastructure for DemoProject',
});

// Storage Stack (S3, CloudFront)
const storageStack = new StorageStack(app, 'DemoProject-StorageStack', {
  env,
  description: 'Storage infrastructure for DemoProject',
});

// Auth Stack (Cognito User Pools, Identity Pools)
const authStack = new AuthStack(app, 'DemoProject-AuthStack', {
  env,
  description: 'Authentication infrastructure for DemoProject',
});

// Database Stack (RDS, ElastiCache, DynamoDB)
const databaseStack = new DatabaseStack(app, 'DemoProject-DatabaseStack', {
  env,
  vpc: networkStack.vpc,
  description: 'Database infrastructure for DemoProject',
});

// API Gateway Stack (REST API, Lambda integration)
const apiGatewayStack = new ApiGatewayStack(app, 'DemoProject-ApiGatewayStack', {
  env,
  authStack,
  databaseStack,
  storageStack,
  description: 'API Gateway with Lambda integration for DemoProject',
});

// Application Stack (ECS, ALB, etc.)
const applicationStack = new ApplicationStack(app, 'DemoProject-ApplicationStack', {
  env,
  vpc: networkStack.vpc,
  databaseStack,
  storageStack,
  authStack,
  description: 'Application infrastructure for DemoProject',
});

// Monitoring Stack (CloudWatch, Dashboards, Alarms)
const monitoringStack = new MonitoringStack(app, 'DemoProject-MonitoringStack', {
  env,
  applicationStack,
  databaseStack,
  storageStack,
  apiGatewayStack,
  authStack,
  environment: process.env.ENVIRONMENT || 'development',
  description: 'Monitoring and observability infrastructure for DemoProject',
});

// Logging Stack (CloudWatch Logs, Kinesis, S3)
const loggingStack = new LoggingStack(app, 'DemoProject-LoggingStack', {
  env,
  applicationStack,
  databaseStack,
  storageStack,
  apiGatewayStack,
  authStack,
  environment: process.env.ENVIRONMENT || 'development',
  description: 'Logging and log aggregation infrastructure for DemoProject',
});

// Error Tracking Stack (Error aggregation, Performance monitoring)
const errorTrackingStack = new ErrorTrackingStack(app, 'DemoProject-ErrorTrackingStack', {
  env,
  applicationStack,
  databaseStack,
  storageStack,
  apiGatewayStack,
  authStack,
  monitoringStack,
  loggingStack,
  environment: process.env.ENVIRONMENT || 'development',
  sentryDsn: process.env.SENTRY_DSN,
  datadogApiKey: process.env.DATADOG_API_KEY,
  newRelicLicenseKey: process.env.NEW_RELIC_LICENSE_KEY,
  description: 'Error tracking and performance monitoring infrastructure for DemoProject',
});

// Video Interactions Stack (Video processing, comments, responses, sharing)
const videoInteractionsStack = new VideoInteractionsStack(app, 'DemoProject-VideoInteractionsStack', {
  env,
  description: 'Video interactions infrastructure for DemoProject',
});

// Add dependencies
applicationStack.addDependency(databaseStack);
applicationStack.addDependency(storageStack);
applicationStack.addDependency(authStack);

monitoringStack.addDependency(applicationStack);
monitoringStack.addDependency(databaseStack);
monitoringStack.addDependency(storageStack);
monitoringStack.addDependency(apiGatewayStack);
monitoringStack.addDependency(authStack);

loggingStack.addDependency(applicationStack);
loggingStack.addDependency(databaseStack);
loggingStack.addDependency(storageStack);
loggingStack.addDependency(apiGatewayStack);
loggingStack.addDependency(authStack);

errorTrackingStack.addDependency(monitoringStack);
errorTrackingStack.addDependency(loggingStack);
errorTrackingStack.addDependency(applicationStack);
errorTrackingStack.addDependency(apiGatewayStack);

apiGatewayStack.addDependency(authStack);
apiGatewayStack.addDependency(databaseStack);
apiGatewayStack.addDependency(storageStack);
databaseStack.addDependency(networkStack);

// Legacy stack for backward compatibility
new CdkStack(app, 'CdkStack', {
  env,
  description: 'Legacy CDK stack for DemoProject',
});

// Add tags to all stacks
const tags = {
  Project: 'DemoProject',
  Environment: 'Development',
  ManagedBy: 'CDK',
  Owner: 'Development Team',
};

// Apply tags using the modern approach
cdk.Tags.of(app).add('Project', tags.Project);
cdk.Tags.of(app).add('Environment', tags.Environment);
cdk.Tags.of(app).add('ManagedBy', tags.ManagedBy);
cdk.Tags.of(app).add('Owner', tags.Owner);