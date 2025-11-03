// Test DynamoDB connection
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function testConnection() {
  console.log('🧪 Testing DynamoDB connection...');
  
  try {
    // Test 1: List tables to verify connection
    console.log('\n1. Testing basic connection...');
    const { ListTablesCommand } = require('@aws-sdk/client-dynamodb');
    const listResult = await client.send(new ListTablesCommand({}));
    console.log('✅ Connected to DynamoDB. Tables found:', listResult.TableNames?.length || 0);
    
    // Test 2: Check if our specific table exists
    const targetTable = 'classcast-peer-interactions';
    const tableExists = listResult.TableNames?.includes(targetTable);
    console.log(`📋 Table "${targetTable}" exists:`, tableExists);
    
    if (tableExists) {
      // Test 3: Try to scan the table (limit 1 item)
      console.log('\n2. Testing table access...');
      const scanResult = await docClient.send(new ScanCommand({
        TableName: targetTable,
        Limit: 1
      }));
      console.log('✅ Table scan successful. Items found:', scanResult.Count || 0);
    } else {
      console.log('❌ Target table does not exist!');
    }
    
    // Test 4: Check submissions table
    const submissionsTable = 'classcast-submissions';
    const submissionsExists = listResult.TableNames?.includes(submissionsTable);
    console.log(`📋 Table "${submissionsTable}" exists:`, submissionsExists);
    
  } catch (error) {
    console.error('❌ DynamoDB connection failed:', error.message);
    console.error('Error details:', error);
  }
}

testConnection();