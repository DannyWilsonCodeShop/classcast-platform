const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function findKidist() {
  console.log('🔍 Searching for students with "sh" in name...');
  
  try {
    const command = new ScanCommand({
      TableName: 'classcast-users',
      FilterExpression: 'contains(#name, :search)',
      ExpressionAttributeNames: {
        '#name': 'name'
      },
      ExpressionAttributeValues: {
        ':search': 'sh'
      }
    });
    
    const result = await docClient.send(command);
    
    console.log(`\n✅ Found ${result.Items?.length || 0} students with "sh":`);
    result.Items?.forEach(student => {
      if (student.name.toLowerCase().includes('kid') || student.name.toLowerCase().includes('sh')) {
        console.log(`\n👤 Name: ${student.name}`);
        console.log(`   ID: ${student.userId || student.id}`);
        console.log(`   Email: ${student.email}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

findKidist();
