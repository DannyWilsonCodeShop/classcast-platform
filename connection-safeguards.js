require('dotenv').config({ path: '.env.local' });
const { DynamoDBClient, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
const { CognitoIdentityProviderClient, DescribeUserPoolCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { S3Client, HeadBucketCommand } = require('@aws-sdk/client-s3');

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const cognitoClient = new CognitoIdentityProviderClient({ region: 'us-east-1' });
const s3Client = new S3Client({ region: 'us-east-1' });

// Configuration - These should NEVER change
const CRITICAL_CONFIG = {
  USER_POOL_ID: 'us-east-1_uK50qBrap',
  USER_POOL_CLIENT_ID: '7tbaq74itv3gdda1bt25iqafvh',
  S3_BUCKET: 'classcast-videos-463470937777-us-east-1',
  DYNAMODB_TABLES: [
    'classcast-users',
    'classcast-assignments', 
    'classcast-courses',
    'classcast-submissions',
    'classcast-content-moderation'
  ],
  REGION: 'us-east-1'
};

class ConnectionSafeguards {
  constructor() {
    this.connectionStatus = {
      timestamp: new Date().toISOString(),
      overall: 'unknown',
      criticalServices: {},
      recommendations: []
    };
  }

  async checkCriticalConnections() {
    console.log('🛡️  CHECKING CRITICAL AWS CONNECTIONS...\n');
    console.log('This will help prevent future disconnections.\n');

    // Check 1: DynamoDB Tables
    await this.checkDynamoDBHealth();
    
    // Check 2: Cognito User Pool
    await this.checkCognitoHealth();
    
    // Check 3: S3 Bucket
    await this.checkS3Health();
    
    // Check 4: Environment Variables
    this.checkEnvironmentVariables();
    
    // Generate recommendations
    this.generateRecommendations();
    
    // Save configuration backup
    this.saveConfigurationBackup();
    
    console.log('\n' + '='.repeat(70));
    console.log('🛡️  CONNECTION SAFEGUARD REPORT');
    console.log('='.repeat(70));
    this.printReport();
  }

  async checkDynamoDBHealth() {
    console.log('📊 Checking DynamoDB Tables...');
    this.connectionStatus.criticalServices.dynamodb = { status: 'checking', tables: {} };
    
    let allHealthy = true;
    
    for (const tableName of CRITICAL_CONFIG.DYNAMODB_TABLES) {
      try {
        const command = new DescribeTableCommand({ TableName: tableName });
        const result = await dynamoClient.send(command);
        
        const isHealthy = result.Table.TableStatus === 'ACTIVE';
        this.connectionStatus.criticalServices.dynamodb.tables[tableName] = {
          status: isHealthy ? 'healthy' : 'degraded',
          tableStatus: result.Table.TableStatus,
          itemCount: result.Table.ItemCount,
          tableSize: result.Table.TableSizeBytes,
          lastUpdate: result.Table.TableStatusLastUpdatedDate
        };
        
        if (isHealthy) {
          console.log(`  ✅ ${tableName}: ACTIVE (${result.Table.ItemCount} items)`);
        } else {
          console.log(`  ⚠️  ${tableName}: ${result.Table.TableStatus}`);
          allHealthy = false;
        }
      } catch (error) {
        this.connectionStatus.criticalServices.dynamodb.tables[tableName] = {
          status: 'error',
          error: error.message
        };
        console.log(`  ❌ ${tableName}: ${error.message}`);
        allHealthy = false;
      }
    }
    
    this.connectionStatus.criticalServices.dynamodb.status = allHealthy ? 'healthy' : 'degraded';
  }

  async checkCognitoHealth() {
    console.log('\n👥 Checking Cognito User Pool...');
    this.connectionStatus.criticalServices.cognito = { status: 'checking' };
    
    try {
      const command = new DescribeUserPoolCommand({ 
        UserPoolId: CRITICAL_CONFIG.USER_POOL_ID 
      });
      const result = await cognitoClient.send(command);
      
      const isHealthy = result.UserPool.Status === 'ACTIVE';
      this.connectionStatus.criticalServices.cognito = {
        status: isHealthy ? 'healthy' : 'degraded',
        userPoolId: result.UserPool.Id,
        name: result.UserPool.Name,
        status: result.UserPool.Status,
        estimatedNumberOfUsers: result.UserPool.EstimatedNumberOfUsers,
        lastModified: result.UserPool.LastModifiedDate
      };
      
      if (isHealthy) {
        console.log(`  ✅ User Pool: ${result.UserPool.Name} (ACTIVE, ${result.UserPool.EstimatedNumberOfUsers} users)`);
      } else {
        console.log(`  ⚠️  User Pool: ${result.UserPool.Status}`);
      }
    } catch (error) {
      this.connectionStatus.criticalServices.cognito = {
        status: 'error',
        error: error.message
      };
      console.log(`  ❌ User Pool: ${error.message}`);
    }
  }

  async checkS3Health() {
    console.log('\n🪣 Checking S3 Bucket...');
    this.connectionStatus.criticalServices.s3 = { status: 'checking' };
    
    try {
      const command = new HeadBucketCommand({ 
        Bucket: CRITICAL_CONFIG.S3_BUCKET 
      });
      await s3Client.send(command);
      
      this.connectionStatus.criticalServices.s3 = {
        status: 'healthy',
        bucketName: CRITICAL_CONFIG.S3_BUCKET,
        region: CRITICAL_CONFIG.REGION
      };
      
      console.log(`  ✅ S3 Bucket: ${CRITICAL_CONFIG.S3_BUCKET} (accessible)`);
    } catch (error) {
      this.connectionStatus.criticalServices.s3 = {
        status: 'error',
        error: error.message
      };
      console.log(`  ❌ S3 Bucket: ${error.message}`);
    }
  }

  checkEnvironmentVariables() {
    console.log('\n🔧 Checking Environment Variables...');
    this.connectionStatus.criticalServices.environment = { status: 'checking', variables: {} };
    
    const requiredVars = {
      'NEXT_PUBLIC_COGNITO_USER_POOL_ID': CRITICAL_CONFIG.USER_POOL_ID,
      'NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID': CRITICAL_CONFIG.USER_POOL_CLIENT_ID,
      'AWS_REGION': CRITICAL_CONFIG.REGION
    };
    
    let allPresent = true;
    
    Object.entries(requiredVars).forEach(([varName, expectedValue]) => {
      const actualValue = process.env[varName];
      const isCorrect = actualValue === expectedValue;
      
      this.connectionStatus.criticalServices.environment.variables[varName] = {
        status: isCorrect ? 'correct' : 'incorrect',
        expected: expectedValue,
        actual: actualValue
      };
      
      if (isCorrect) {
        console.log(`  ✅ ${varName}: ${actualValue}`);
      } else {
        console.log(`  ❌ ${varName}: Expected ${expectedValue}, got ${actualValue}`);
        allPresent = false;
      }
    });
    
    this.connectionStatus.criticalServices.environment.status = allPresent ? 'healthy' : 'error';
  }

  generateRecommendations() {
    console.log('\n💡 Generating Recommendations...');
    this.connectionStatus.recommendations = [];
    
    // Check for common disconnection causes
    const services = this.connectionStatus.criticalServices;
    
    if (services.environment?.status === 'error') {
      this.connectionStatus.recommendations.push({
        priority: 'HIGH',
        issue: 'Environment variables mismatch',
        solution: 'Update .env.local with correct AWS configuration values',
        command: 'node update-cognito-env.js'
      });
    }
    
    if (services.dynamodb?.status === 'degraded') {
      this.connectionStatus.recommendations.push({
        priority: 'HIGH',
        issue: 'DynamoDB tables not active',
        solution: 'Check table status and wait for activation',
        command: 'aws dynamodb describe-table --table-name classcast-users'
      });
    }
    
    if (services.cognito?.status === 'degraded') {
      this.connectionStatus.recommendations.push({
        priority: 'HIGH',
        issue: 'Cognito User Pool not active',
        solution: 'Check User Pool status and configuration',
        command: 'aws cognito-idp describe-user-pool --user-pool-id us-east-1_uK50qBrap'
      });
    }
    
    // Add general recommendations
    this.connectionStatus.recommendations.push({
      priority: 'MEDIUM',
      issue: 'Prevent future disconnections',
      solution: 'Run this health check regularly and monitor AWS service status',
      command: 'node connection-safeguards.js'
    });
    
    this.connectionStatus.recommendations.push({
      priority: 'LOW',
      issue: 'Backup configuration',
      solution: 'Keep a backup of your AWS configuration for quick recovery',
      command: 'cp aws-config-backup.json aws-config-backup-$(date +%Y%m%d).json'
    });
  }

  saveConfigurationBackup() {
    const fs = require('fs');
    const backup = {
      timestamp: new Date().toISOString(),
      criticalConfig: CRITICAL_CONFIG,
      connectionStatus: this.connectionStatus
    };
    
    fs.writeFileSync('aws-config-backup.json', JSON.stringify(backup, null, 2));
    console.log('\n💾 Configuration backup saved to aws-config-backup.json');
  }

  printReport() {
    const services = this.connectionStatus.criticalServices;
    const healthyServices = Object.values(services).filter(s => s.status === 'healthy').length;
    const totalServices = Object.keys(services).length;
    
    console.log(`Overall Health: ${healthyServices}/${totalServices} services healthy`);
    console.log(`Timestamp: ${this.connectionStatus.timestamp}`);
    
    if (this.connectionStatus.recommendations.length > 0) {
      console.log('\n🚨 RECOMMENDATIONS:');
      this.connectionStatus.recommendations.forEach((rec, index) => {
        console.log(`\n${index + 1}. [${rec.priority}] ${rec.issue}`);
        console.log(`   Solution: ${rec.solution}`);
        console.log(`   Command: ${rec.command}`);
      });
    } else {
      console.log('\n✅ All systems healthy! No recommendations needed.');
    }
    
    console.log('\n' + '='.repeat(70));
  }
}

// Run the safeguard check
const safeguards = new ConnectionSafeguards();
safeguards.checkCriticalConnections().catch(console.error);
