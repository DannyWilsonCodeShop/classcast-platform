// List all DynamoDB tables
const { DynamoDBClient, ListTablesCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });

async function listTables() {
  try {
    const result = await client.send(new ListTablesCommand({}));
    console.log('📋 All DynamoDB tables:');
    result.TableNames?.forEach((table, index) => {
      console.log(`${index + 1}. ${table}`);
    });
    
    // Check for interaction-related tables
    console.log('\n🔍 Looking for interaction-related tables:');
    const interactionTables = result.TableNames?.filter(table => 
      table.toLowerCase().includes('interaction') || 
      table.toLowerCase().includes('peer') ||
      table.toLowerCase().includes('comment')
    );
    
    if (interactionTables?.length) {
      interactionTables.forEach(table => console.log(`  - ${table}`));
    } else {
      console.log('  No interaction-related tables found');
    }
    
  } catch (error) {
    console.error('❌ Error listing tables:', error);
  }
}

listTables();