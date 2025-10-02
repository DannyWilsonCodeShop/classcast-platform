/**
 * AWS Configuration for ClassCast Platform
 * Unified configuration for both Instructor and Student portals
 */

export interface AWSConfig {
  region: string;
  cognito: {
    userPoolId: string;
    clientId: string;
    identityPoolId: string;
  };
  apiGateway: {
    url: string;
    stage: string;
  };
  dynamodb: {
    region: string;
    tables: {
      users: string;
      assignments: string;
      submissions: string;
      courses: string;
      contentModeration: string;
    };
  };
  s3: {
    region: string;
    buckets: {
      videos: string;
      assets: string;
    };
  };
  ses: {
    region: string;
    fromEmail: string;
    replyToEmail: string;
  };
}

// Environment-based configuration
const getAWSConfig = (): AWSConfig => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    region: process.env.REGION || 'us-east-1',
    cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || 'us-east-1_uK50qBrap',
      clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '7tbaq74itv3gdda1bt25iqafvh',
      identityPoolId: process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID || 'us-east-1:463470937777',
    },
    apiGateway: {
      url: process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'https://785t4qadp8.execute-api.us-east-1.amazonaws.com/prod',
      stage: 'prod',
    },
    dynamodb: {
      region: process.env.REGION || 'us-east-1',
      tables: {
        users: process.env.USERS_TABLE_NAME || 'classcast-users',
        assignments: process.env.ASSIGNMENTS_TABLE_NAME || 'classcast-assignments',
        submissions: process.env.SUBMISSIONS_TABLE_NAME || 'classcast-submissions',
        courses: process.env.COURSES_TABLE_NAME || 'classcast-courses',
        contentModeration: process.env.CONTENT_MODERATION_TABLE_NAME || 'classcast-content-moderation',
      },
    },
    s3: {
      region: process.env.REGION || 'us-east-1',
      buckets: {
        videos: process.env.S3_VIDEOS_BUCKET || 'classcast-videos-463470937777-us-east-1',
        assets: process.env.S3_VIDEOS_BUCKET || 'classcast-videos-463470937777-us-east-1', // Use same bucket for assets
      },
    },
    ses: {
      region: process.env.REGION || 'us-east-1',
      fromEmail: process.env.FROM_EMAIL || 'noreply@myclasscast.com',
      replyToEmail: process.env.REPLY_TO_EMAIL || 'support@myclasscast.com',
    },
  };
};

// Export the configuration
export const awsConfig = getAWSConfig();

// Connection status checker
export class AWSConnectionChecker {
  private config: AWSConfig;

  constructor() {
    this.config = awsConfig;
  }

  /**
   * Check if all AWS services are properly configured
   */
  async checkAllConnections(): Promise<{
    cognito: boolean;
    apiGateway: boolean;
    dynamodb: boolean;
    s3: boolean;
    overall: boolean;
  }> {
    const results = {
      cognito: false,
      apiGateway: false,
      dynamodb: false,
      s3: false,
      overall: false,
    };

    try {
      // Check Cognito
      results.cognito = await this.checkCognitoConnection();
      
      // Check API Gateway
      results.apiGateway = await this.checkAPIGatewayConnection();
      
      // Check DynamoDB
      results.dynamodb = await this.checkDynamoDBConnection();
      
      // Check S3
      results.s3 = await this.checkS3Connection();
      
      // Overall status
      results.overall = Object.values(results).every(status => status === true);
      
    } catch (error) {
      console.error('AWS Connection Check Error:', error);
    }

    return results;
  }

  private async checkCognitoConnection(): Promise<boolean> {
    try {
      const { CognitoIdentityProviderClient, DescribeUserPoolCommand } = await import('@aws-sdk/client-cognito-identity-provider');
      
      const client = new CognitoIdentityProviderClient({
        region: this.config.region,
      });

      await client.send(new DescribeUserPoolCommand({
        UserPoolId: this.config.cognito.userPoolId,
      }));

      return true;
    } catch (error) {
      console.error('Cognito connection failed:', error);
      return false;
    }
  }

  private async checkAPIGatewayConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.apiGateway.url}/`);
      return response.ok;
    } catch (error) {
      console.error('API Gateway connection failed:', error);
      return false;
    }
  }

  private async checkDynamoDBConnection(): Promise<boolean> {
    try {
      const { DynamoDBClient, ListTablesCommand } = await import('@aws-sdk/client-dynamodb');
      
      const client = new DynamoDBClient({
        region: this.config.region,
      });

      const result = await client.send(new ListTablesCommand({}));
      return result.TableNames && result.TableNames.length > 0;
    } catch (error) {
      console.error('DynamoDB connection failed:', error);
      return false;
    }
  }

  private async checkS3Connection(): Promise<boolean> {
    try {
      const { S3Client, ListBucketsCommand } = await import('@aws-sdk/client-s3');
      
      const client = new S3Client({
        region: this.config.region,
      });

      const result = await client.send(new ListBucketsCommand({}));
      return result.Buckets && result.Buckets.length > 0;
    } catch (error) {
      console.error('S3 connection failed:', error);
      return false;
    }
  }

  /**
   * Get connection status for both portals
   */
  async getPortalConnectionStatus(): Promise<{
    instructor: boolean;
    student: boolean;
    shared: boolean;
  }> {
    const connections = await this.checkAllConnections();
    
    return {
      instructor: connections.cognito && connections.apiGateway && connections.dynamodb,
      student: connections.cognito && connections.apiGateway && connections.dynamodb,
      shared: connections.overall,
    };
  }
}

// Export singleton instance
export const awsConnectionChecker = new AWSConnectionChecker();

// Utility functions for both portals
export const getCognitoConfig = () => awsConfig.cognito;
export const getAPIGatewayConfig = () => awsConfig.apiGateway;
export const getDynamoDBConfig = () => awsConfig.dynamodb;
export const getS3Config = () => awsConfig.s3;
export const getSESConfig = () => awsConfig.ses;
