const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function checkAssignment() {
  try {
    console.log('🔍 Checking assignment: assignment_1768361755173_ti155u2nf');
    
    const result = await docClient.send(new ScanCommand({
      TableName: 'classcast-assignments',
      FilterExpression: 'assignmentId = :assignmentId',
      ExpressionAttributeValues: {
        ':assignmentId': 'assignment_1768361755173_ti155u2nf'
      }
    }));
    
    if (result.Items && result.Items.length > 0) {
      const assignment = result.Items[0];
      console.log('\n✅ Assignment found in database:');
      console.log('Title:', assignment.title);
      console.log('Description:', assignment.description?.substring(0, 100) + '...');
      console.log('Resources:', JSON.stringify(assignment.resources, null, 2));
      console.log('Instructional Video URL:', assignment.instructionalVideoUrl);
      console.log('Updated At:', assignment.updatedAt);
      console.log('\n📋 Full assignment data:');
      console.log(JSON.stringify(assignment, null, 2));
    } else {
      console.log('❌ Assignment not found');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAssignment();
