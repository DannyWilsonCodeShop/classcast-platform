const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function checkAssignment() {
  try {
    const assignmentId = 'assignment_1762810231627_vqgj30vea';
    
    console.log('🔍 Checking assignment:', assignmentId, '\n');
    
    const result = await docClient.send(new ScanCommand({
      TableName: 'classcast-assignments',
      FilterExpression: 'assignmentId = :assignmentId',
      ExpressionAttributeValues: {
        ':assignmentId': assignmentId
      }
    }));
    
    if (result.Items && result.Items.length > 0) {
      const assignment = result.Items[0];
      console.log('✅ Assignment found:');
      console.log('   Title:', assignment.title);
      console.log('   Description:', assignment.description?.substring(0, 100) + '...');
      console.log('   Resources:', JSON.stringify(assignment.resources, null, 2));
      console.log('   Instructional Video URL:', assignment.instructionalVideoUrl);
      
      if (!assignment.resources || assignment.resources.length === 0) {
        console.log('\n⚠️  This assignment has NO resources!');
        console.log('   That\'s why the Assignment Resources section doesn\'t appear.');
      } else {
        console.log('\n✅ This assignment has', assignment.resources.length, 'resource(s)');
      }
    } else {
      console.log('❌ Assignment not found');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAssignment();
