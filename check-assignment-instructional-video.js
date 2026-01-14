/**
 * Check if assignment has instructional video URL
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

require('dotenv').config({ path: '.env.local' });

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

async function checkAssignment() {
  const assignmentId = 'assignment_1768361755173_ti155u2nf';
  
  console.log('🔍 Checking assignment:', assignmentId);
  console.log('');

  try {
    const command = new GetCommand({
      TableName: process.env.ASSIGNMENTS_TABLE_NAME || 'classcast-assignments',
      Key: { assignmentId }
    });

    const response = await docClient.send(command);
    
    if (!response.Item) {
      console.log('❌ Assignment not found');
      return;
    }

    const assignment = response.Item;
    
    console.log('✅ Assignment found:');
    console.log('Title:', assignment.title);
    console.log('Course:', assignment.courseId);
    console.log('');
    
    console.log('📹 Instructional Video URL:');
    if (assignment.instructionalVideoUrl) {
      console.log('✅ EXISTS:', assignment.instructionalVideoUrl);
    } else {
      console.log('❌ NOT SET (field is empty or missing)');
    }
    console.log('');
    
    console.log('📋 All assignment fields:');
    console.log(JSON.stringify(assignment, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAssignment();
