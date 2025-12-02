const { DynamoDBClient, CreateTableCommand, DescribeTableCommand, UpdateTimeToLiveCommand } = require('@aws-sdk/client-dynamodb');
const { CloudWatchLogsClient, CreateLogGroupCommand, CreateLogStreamCommand } = require('@aws-sdk/client-cloudwatch-logs');

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const logsClient = new CloudWatchLogsClient({ region: 'us-east-1' });

async function setupSecurityEnhancements() {
  try {
    console.log('🔒 Setting up Security Enhancements...\n');
    console.log('='.repeat(60));
    
    // 1. Create Account Lockout Table
    console.log('\n1️⃣  Creating Account Lockout Table...');
    await createTable('classcast-account-lockouts', [
      { AttributeName: 'email', KeyType: 'HASH' }
    ], [
      { AttributeName: 'email', AttributeType: 'S' }
    ]);
    
    // 2. Create Password History Table
    console.log('\n2️⃣  Creating Password History Table...');
    await createTable('classcast-password-history', [
      { AttributeName: 'userId', KeyType: 'HASH' },
      { AttributeName: 'changedAt', KeyType: 'RANGE' }
    ], [
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'changedAt', AttributeType: 'N' }
    ]);
    
    // 3. Create Session Tracking Table
    console.log('\n3️⃣  Creating Session Tracking Table...');
    await createTable('classcast-sessions', [
      { AttributeName: 'sessionId', KeyType: 'HASH' }
    ], [
      { AttributeName: 'sessionId', AttributeType: 'S' }
    ]);
    
    // 4. Create CloudWatch Log Group
    console.log('\n4️⃣  Creating CloudWatch Log Group...');
    try {
      await logsClient.send(new CreateLogGroupCommand({
        logGroupName: '/classcast/auth'
      }));
      console.log('   ✅ Log group created');
      
      // Create log streams
      const streams = ['login-attempts', 'failed-logins', 'account-lockouts', 'password-changes'];
      for (const stream of streams) {
        try {
          await logsClient.send(new CreateLogStreamCommand({
            logGroupName: '/classcast/auth',
            logStreamName: stream
          }));
          console.log(`   ✅ Log stream created: ${stream}`);
        } catch (error) {
          if (error.name === 'ResourceAlreadyExistsException') {
            console.log(`   ✅ Log stream already exists: ${stream}`);
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      if (error.name === 'ResourceAlreadyExistsException') {
        console.log('   ✅ Log group already exists');
      } else {
        throw error;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ SECURITY ENHANCEMENTS SETUP COMPLETE');
    console.log('='.repeat(60));
    
    console.log('\n📋 What was created:');
    console.log('   ✅ DynamoDB table: classcast-account-lockouts');
    console.log('   ✅ DynamoDB table: classcast-password-history');
    console.log('   ✅ DynamoDB table: classcast-sessions');
    console.log('   ✅ CloudWatch log group: /classcast/auth');
    console.log('   ✅ CloudWatch log streams: login-attempts, failed-logins, etc.');
    
    console.log('\n🔒 Security Features:');
    console.log('   1. Account Lockout: 10 failed attempts = 30 min lockout');
    console.log('   2. Password History: Prevents reuse of last 5 passwords');
    console.log('   3. Session Timeout: Auto-logout after 24 hours inactivity');
    console.log('   4. CloudWatch Logging: All auth events logged');
    
    console.log('\n📝 Next Steps:');
    console.log('   - Update login route with new security features');
    console.log('   - Add session timeout middleware');
    console.log('   - Test account lockout functionality');
    
  } catch (error) {
    console.error('❌ Error setting up security enhancements:', error);
  }
}

async function createTable(tableName, keySchema, attributeDefinitions) {
  try {
    await dynamoClient.send(new DescribeTableCommand({ TableName: tableName }));
    console.log(`   ✅ Table already exists: ${tableName}`);
    return;
  } catch (error) {
    if (error.name !== 'ResourceNotFoundException') {
      throw error;
    }
  }
  
  console.log(`   📦 Creating table: ${tableName}`);
  await dynamoClient.send(new CreateTableCommand({
    TableName: tableName,
    KeySchema: keySchema,
    AttributeDefinitions: attributeDefinitions,
    BillingMode: 'PAY_PER_REQUEST'
  }));
  
  console.log(`   ⏳ Waiting for table to become active...`);
  let tableActive = false;
  while (!tableActive) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const describeResponse = await dynamoClient.send(new DescribeTableCommand({
      TableName: tableName
    }));
    tableActive = describeResponse.Table.TableStatus === 'ACTIVE';
  }
  
  // Enable TTL for sessions and lockouts
  if (tableName.includes('sessions') || tableName.includes('lockouts')) {
    console.log(`   ⏰ Enabling TTL for ${tableName}...`);
    await dynamoClient.send(new UpdateTimeToLiveCommand({
      TableName: tableName,
      TimeToLiveSpecification: {
        Enabled: true,
        AttributeName: 'ttl'
      }
    }));
  }
  
  console.log(`   ✅ Table created: ${tableName}`);
}

setupSecurityEnhancements();
