/**
 * AWS Client Factory
 * Creates AWS clients with proper credential handling for both local and production environments
 */

import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { fromNodeProviderChain, fromEnv, fromInstanceMetadata } from '@aws-sdk/credential-providers';

// Check if we're in production (Amplify) environment
const isProduction = process.env.NODE_ENV === 'production';
const isAmplify = process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.AWS_EXECUTION_ENV || process.env.AWS_REGION;

/**
 * Create Cognito client with proper credentials
 */
export function createCognitoClient(): CognitoIdentityProviderClient {
  const config: any = {
    region: process.env.REGION || 'us-east-1',
  };

  // Only set explicit credentials in development if they exist
  if (!isProduction && !isAmplify && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    config.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
  } else if (isProduction || isAmplify) {
    // In production/Amplify, use default credential provider chain
    // This will automatically use the IAM role attached to the service
    config.credentials = fromNodeProviderChain();
  }
  // Otherwise, let AWS SDK use default credential provider chain

  return new CognitoIdentityProviderClient(config);
}

/**
 * Create DynamoDB client with proper credentials
 */
export function createDynamoDBClient(): DynamoDBClient {
  const config: any = {
    region: process.env.REGION || 'us-east-1',
  };

  // Only set explicit credentials in development if they exist
  if (!isProduction && !isAmplify && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    config.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
  } else if (isProduction || isAmplify) {
    // In production/Amplify, use default credential provider chain
    // This will automatically use the IAM role attached to the service
    config.credentials = fromNodeProviderChain();
  }
  // Otherwise, let AWS SDK use default credential provider chain

  return new DynamoDBClient(config);
}

/**
 * Create S3 client with proper credentials
 */
export function createS3Client(): S3Client {
  const config: any = {
    region: process.env.REGION || 'us-east-1',
  };

  // Only set explicit credentials in development if they exist
  if (!isProduction && !isAmplify && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    config.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
  } else if (isProduction || isAmplify) {
    // In production/Amplify, use default credential provider chain
    // This will automatically use the IAM role attached to the service
    config.credentials = fromNodeProviderChain();
  }
  // Otherwise, let AWS SDK use default credential provider chain

  return new S3Client(config);
}

/**
 * Get environment info for debugging
 */
export function getEnvironmentInfo() {
  return {
    isProduction,
    isAmplify,
    nodeEnv: process.env.NODE_ENV,
    hasExplicitCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
    region: process.env.REGION || 'us-east-1',
  };
}
