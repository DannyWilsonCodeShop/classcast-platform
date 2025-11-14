const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

// Initialize DynamoDB client
const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function testDynamoDBIntegration() {
  console.log('🧪 Testing DynamoDB Integration...\n');

  try {
    // Check if users are being created in DynamoDB
    console.log('1️⃣ Checking users in DynamoDB...');
    
    const scanCommand = new ScanCommand({
      TableName: 'classcast-users',
      Limit: 10
    });

    const result = await docClient.send(scanCommand);
    
    console.log(`Found ${result.Items?.length || 0} users in DynamoDB:`);
    
    if (result.Items && result.Items.length > 0) {
      result.Items.forEach((user, index) => {
        console.log(`\nUser ${index + 1}:`);
        console.log(`  - User ID: ${user.userId?.S || user.userId}`);
        console.log(`  - Email: ${user.email?.S || user.email}`);
        console.log(`  - Name: ${user.firstName?.S || user.firstName} ${user.lastName?.S || user.lastName}`);
        console.log(`  - Role: ${user.role?.S || user.role}`);
        console.log(`  - Department: ${user.department?.S || user.department || 'N/A'}`);
        console.log(`  - Student ID: ${user.studentId?.S || user.studentId || 'N/A'}`);
        console.log(`  - Instructor ID: ${user.instructorId?.S || user.instructorId || 'N/A'}`);
        console.log(`  - Status: ${user.status?.S || user.status}`);
        console.log(`  - Created: ${user.createdAt?.S || user.createdAt}`);
        console.log(`  - Last Login: ${user.lastLogin?.S || user.lastLogin}`);
      });
    } else {
      console.log('❌ No users found in DynamoDB');
      console.log('💡 This could mean:');
      console.log('   - No users have signed up yet');
      console.log('   - The post-confirmation Lambda trigger is not working');
      console.log('   - There are permission issues');
    }

    // Check table structure
    console.log('\n2️⃣ Checking table structure...');
    const tableInfo = await client.send(new (require('@aws-sdk/client-dynamodb').DescribeTableCommand)({
      TableName: 'classcast-users'
    }));
    
    console.log('Table Status:', tableInfo.Table.TableStatus);
    console.log('Item Count:', tableInfo.Table.ItemCount);
    console.log('Table Size (bytes):', tableInfo.Table.TableSizeBytes);

  } catch (error) {
    console.error('❌ Error testing DynamoDB integration:', error.message);
    
    if (error.name === 'ResourceNotFoundException') {
      console.log('💡 The classcast-users table does not exist');
    } else if (error.name === 'AccessDeniedException') {
      console.log('💡 Access denied - check IAM permissions');
    }
  }
}

// Run the test
testDynamoDBIntegration().catch(console.error);
