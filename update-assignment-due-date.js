const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function updateDueDate() {
  try {
    const assignmentId = 'assignment_1768361755173_ti155u2nf';
    
    // January 16, 2026 at 9:00 PM EST
    const newDueDate = new Date('2026-01-16T21:00:00-05:00').toISOString();
    
    console.log('📅 Updating assignment due date...');
    console.log('   Assignment ID:', assignmentId);
    console.log('   New Due Date:', newDueDate);
    console.log('   Display:', new Date(newDueDate).toLocaleString('en-US', {
      timeZone: 'America/New_York',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    }));
    console.log('');
    
    const result = await docClient.send(new UpdateCommand({
      TableName: 'classcast-assignments',
      Key: { assignmentId },
      UpdateExpression: 'SET dueDate = :dueDate, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':dueDate': newDueDate,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    }));
    
    console.log('✅ Due date updated successfully!');
    console.log('');
    console.log('Updated assignment:');
    console.log('   Title:', result.Attributes.title);
    console.log('   Old Due Date:', result.Attributes.dueDate);
    console.log('   New Due Date:', newDueDate);
    
  } catch (error) {
    console.error('❌ Error updating due date:', error);
  }
}

updateDueDate();
