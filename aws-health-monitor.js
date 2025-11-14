const { DynamoDBClient, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
const { CognitoIdentityProviderClient, DescribeUserPoolCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { S3Client, HeadBucketCommand } = require('@aws-sdk/client-s3');
const { LambdaClient, GetFunctionCommand } = require('@aws-sdk/client-lambda');
const { APIGatewayClient, GetRestApiCommand } = require('@aws-sdk/client-api-gateway');

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const cognitoClient = new CognitoIdentityProviderClient({ region: 'us-east-1' });
const s3Client = new S3Client({ region: 'us-east-1' });
const lambdaClient = new LambdaClient({ region: 'us-east-1' });
const apiGatewayClient = new APIGatewayClient({ region: 'us-east-1' });

// Configuration
const CONFIG = {
  USER_POOL_ID: 'us-east-1_uK50qBrap',
  S3_BUCKET: 'classcast-videos-463470937777-us-east-1',
  LAMBDA_FUNCTIONS: [
    'classcast-post-confirmation',
    'classcast-assignment-handler',
    'classcast-submission-handler',
    'classcast-course-handler'
  ],
  DYNAMODB_TABLES: [
    'classcast-users',
    'classcast-assignments',
    'classcast-courses',
    'classcast-submissions',
    'classcast-content-moderation'
  ]
};

class AWSHealthMonitor {
  constructor() {
    this.healthStatus = {
      timestamp: new Date().toISOString(),
      overall: 'unknown',
      services: {}
    };
  }

  async checkAllServices() {
    console.log('🔍 Checking AWS Services Health...\n');
    
    try {
      // Check DynamoDB Tables
      await this.checkDynamoDBTables();
      
      // Check Cognito User Pool
      await this.checkCognitoUserPool();
      
      // Check S3 Bucket
      await this.checkS3Bucket();
      
      // Check Lambda Functions
      await this.checkLambdaFunctions();
      
      // Check API Gateway
      await this.checkAPIGateway();
      
      // Determine overall health
      this.determineOverallHealth();
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      this.healthStatus.overall = 'error';
    }
  }

  async checkDynamoDBTables() {
    console.log('📊 Checking DynamoDB Tables...');
    this.healthStatus.services.dynamodb = { status: 'checking', tables: {} };
    
    for (const tableName of CONFIG.DYNAMODB_TABLES) {
      try {
        const command = new DescribeTableCommand({ TableName: tableName });
        const result = await dynamoClient.send(command);
        
        this.healthStatus.services.dynamodb.tables[tableName] = {
          status: 'healthy',
          tableStatus: result.Table.TableStatus,
          itemCount: result.Table.ItemCount,
          tableSize: result.Table.TableSizeBytes
        };
        
        console.log(`  ✅ ${tableName}: ${result.Table.TableStatus} (${result.Table.ItemCount} items)`);
      } catch (error) {
        this.healthStatus.services.dynamodb.tables[tableName] = {
          status: 'error',
          error: error.message
        };
        console.log(`  ❌ ${tableName}: ${error.message}`);
      }
    }
  }

  async checkCognitoUserPool() {
    console.log('\n👥 Checking Cognito User Pool...');
    this.healthStatus.services.cognito = { status: 'checking' };
    
    try {
      const command = new DescribeUserPoolCommand({ 
        UserPoolId: CONFIG.USER_POOL_ID 
      });
      const result = await cognitoClient.send(command);
      
      this.healthStatus.services.cognito = {
        status: 'healthy',
        userPoolId: result.UserPool.Id,
        name: result.UserPool.Name,
        status: result.UserPool.Status,
        estimatedNumberOfUsers: result.UserPool.EstimatedNumberOfUsers
      };
      
      console.log(`  ✅ User Pool: ${result.UserPool.Name} (${result.UserPool.Status})`);
    } catch (error) {
      this.healthStatus.services.cognito = {
        status: 'error',
        error: error.message
      };
      console.log(`  ❌ User Pool: ${error.message}`);
    }
  }

  async checkS3Bucket() {
    console.log('\n🪣 Checking S3 Bucket...');
    this.healthStatus.services.s3 = { status: 'checking' };
    
    try {
      const command = new HeadBucketCommand({ 
        Bucket: CONFIG.S3_BUCKET 
      });
      await s3Client.send(command);
      
      this.healthStatus.services.s3 = {
        status: 'healthy',
        bucketName: CONFIG.S3_BUCKET,
        region: 'us-east-1'
      };
      
      console.log(`  ✅ S3 Bucket: ${CONFIG.S3_BUCKET} (accessible)`);
    } catch (error) {
      this.healthStatus.services.s3 = {
        status: 'error',
        error: error.message
      };
      console.log(`  ❌ S3 Bucket: ${error.message}`);
    }
  }

  async checkLambdaFunctions() {
    console.log('\n⚡ Checking Lambda Functions...');
    this.healthStatus.services.lambda = { status: 'checking', functions: {} };
    
    for (const functionName of CONFIG.LAMBDA_FUNCTIONS) {
      try {
        const command = new GetFunctionCommand({ 
          FunctionName: functionName 
        });
        const result = await lambdaClient.send(command);
        
        this.healthStatus.services.lambda.functions[functionName] = {
          status: 'healthy',
          runtime: result.Configuration.Runtime,
          state: result.Configuration.State,
          lastModified: result.Configuration.LastModified
        };
        
        console.log(`  ✅ ${functionName}: ${result.Configuration.State}`);
      } catch (error) {
        this.healthStatus.services.lambda.functions[functionName] = {
          status: 'error',
          error: error.message
        };
        console.log(`  ❌ ${functionName}: ${error.message}`);
      }
    }
  }

  async checkAPIGateway() {
    console.log('\n🌐 Checking API Gateway...');
    this.healthStatus.services.apiGateway = { status: 'checking' };
    
    try {
      // Try to find the API Gateway
      const command = new GetRestApiCommand({ 
        restApiId: 'classcast-api' // This might need to be updated with actual API ID
      });
      const result = await apiGatewayClient.send(command);
      
      this.healthStatus.services.apiGateway = {
        status: 'healthy',
        apiId: result.id,
        name: result.name,
        description: result.description
      };
      
      console.log(`  ✅ API Gateway: ${result.name} (${result.id})`);
    } catch (error) {
      this.healthStatus.services.apiGateway = {
        status: 'error',
        error: error.message
      };
      console.log(`  ❌ API Gateway: ${error.message}`);
    }
  }

  determineOverallHealth() {
    const services = Object.values(this.healthStatus.services);
    const hasErrors = services.some(service => 
      service.status === 'error' || 
      (service.tables && Object.values(service.tables).some(table => table.status === 'error')) ||
      (service.functions && Object.values(service.functions).some(func => func.status === 'error'))
    );
    
    this.healthStatus.overall = hasErrors ? 'degraded' : 'healthy';
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 AWS SERVICES HEALTH REPORT');
    console.log('='.repeat(60));
    console.log(`Overall Status: ${this.healthStatus.overall.toUpperCase()}`);
    console.log(`Timestamp: ${this.healthStatus.timestamp}`);
    console.log('\nService Details:');
    
    Object.entries(this.healthStatus.services).forEach(([service, details]) => {
      console.log(`\n${service.toUpperCase()}:`);
      if (details.tables) {
        Object.entries(details.tables).forEach(([table, info]) => {
          console.log(`  - ${table}: ${info.status}`);
        });
      } else if (details.functions) {
        Object.entries(details.functions).forEach(([func, info]) => {
          console.log(`  - ${func}: ${info.status}`);
        });
      } else {
        console.log(`  Status: ${details.status}`);
      }
    });
    
    console.log('\n' + '='.repeat(60));
    
    // Save report to file
    const fs = require('fs');
    fs.writeFileSync('aws-health-report.json', JSON.stringify(this.healthStatus, null, 2));
    console.log('📄 Health report saved to aws-health-report.json');
  }
}

// Run the health check
const monitor = new AWSHealthMonitor();
monitor.checkAllServices().catch(console.error);
