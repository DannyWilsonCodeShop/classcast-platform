const { DynamoDBClient, CreateTableCommand, DescribeTableCommand, UpdateTimeToLiveCommand } = require('@aws-sdk/client-dynamodb');

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });

async function setupTable() {
  try {
    console.log('🔧 Setting up Password Reset Tokens Table...\n');
    
    const tableName = 'classcast-password-reset-tokens';
    
    // Check if table exists
    try {
      const describeResponse = await dynamoClient.send(new DescribeTableCommand({
        TableName: tableName
      }));
      console.log('✅ Table already exists:', tableName);
      console.log('   Status:', describeResponse.Table.TableStatus);
      return;
    } catch (error) {
      if (error.name !== 'ResourceNotFoundException') {
        throw error;
      }
    }
    
    // Create table
    console.log('📦 Creating table:', tableName);
    await dynamoClient.send(new CreateTableCommand({
      TableName: tableName,
      KeySchema: [
        { AttributeName: 'email', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'email', AttributeType: 'S' }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    }));
    
    console.log('✅ Table created successfully!');
    console.log('⏳ Waiting for table to become active...');
    
    // Wait for table to be active
    let tableActive = false;
    while (!tableActive) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const describeResponse = await dynamoClient.send(new DescribeTableCommand({
        TableName: tableName
      }));
      tableActive = describeResponse.Table.TableStatus === 'ACTIVE';
      console.log('   Status:', describeResponse.Table.TableStatus);
    }
    
    // Enable TTL
    console.log('\n⏰ Enabling Time-To-Live (TTL) for automatic token expiration...');
    await dynamoClient.send(new UpdateTimeToLiveCommand({
      TableName: tableName,
      TimeToLiveSpecification: {
        Enabled: true,
        AttributeName: 'ttl'
      }
    }));
    
    console.log('✅ TTL enabled!');
    console.log('\n🎉 Password reset table is ready!');
    console.log('\nTable structure:');
    console.log('   - email (Primary Key): User email address');
    console.log('   - tokenHash: Hashed reset token');
    console.log('   - expiresAt: Token expiration timestamp');
    console.log('   - ttl: Auto-delete timestamp (1 day after expiration)');
    console.log('   - used: Whether token has been used');
    console.log('   - createdAt: When token was created');
    
  } catch (error) {
    console.error('❌ Error setting up table:', error);
  }
}

setupTable();
