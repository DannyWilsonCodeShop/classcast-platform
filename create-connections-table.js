const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });

async function createConnectionsTable() {
  try {
    console.log('🔨 Creating classcast-connections table...');
    
    const command = new CreateTableCommand({
      TableName: 'classcast-connections',
      KeySchema: [
        { AttributeName: 'connectionId', KeyType: 'HASH' } // Primary key
      ],
      AttributeDefinitions: [
        { AttributeName: 'connectionId', AttributeType: 'S' }
      ],
      BillingMode: 'PAY_PER_REQUEST', // On-demand pricing
      Tags: [
        { Key: 'Project', Value: 'ClassCast' },
        { Key: 'Feature', Value: 'Study Buddy Connections' }
      ]
    });

    const response = await client.send(command);
    console.log('✅ Table created successfully:', response.TableDescription.TableName);
    console.log('📊 Table Status:', response.TableDescription.TableStatus);
    console.log('\n✨ The Study Buddy feature is now ready to use!');
    
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log('ℹ️  Table already exists - no action needed');
    } else {
      console.error('❌ Error creating table:', error.message);
      throw error;
    }
  }
}

createConnectionsTable();

