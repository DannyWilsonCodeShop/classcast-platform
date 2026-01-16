const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function testResourcesDisplay() {
  try {
    const assignmentId = 'assignment_1768361755173_ti155u2nf';
    
    console.log('🧪 Testing Assignment Resources Display\n');
    console.log('Assignment ID:', assignmentId);
    console.log('URL: https://class-cast.com/student/assignments/' + assignmentId);
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Check database
    const result = await docClient.send(new ScanCommand({
      TableName: 'classcast-assignments',
      FilterExpression: 'assignmentId = :assignmentId',
      ExpressionAttributeValues: {
        ':assignmentId': assignmentId
      }
    }));
    
    if (result.Items && result.Items.length > 0) {
      const assignment = result.Items[0];
      
      console.log('✅ DATABASE CHECK:');
      console.log('   Title:', assignment.title);
      console.log('   Resources in DB:', assignment.resources ? assignment.resources.length : 0);
      
      if (assignment.resources && assignment.resources.length > 0) {
        console.log('\n📎 RESOURCES FOUND:');
        assignment.resources.forEach((resource, index) => {
          console.log(`\n   Resource ${index + 1}:`);
          console.log('   - Title:', resource.title);
          console.log('   - Type:', resource.type);
          console.log('   - URL:', resource.url);
          console.log('   - Description:', resource.description);
        });
      } else {
        console.log('\n❌ NO RESOURCES IN DATABASE');
      }
      
      console.log('\n' + '='.repeat(60) + '\n');
      console.log('🔧 FIX APPLIED:');
      console.log('   Changed /api/student/assignments to return "resources" instead of "attachments"');
      console.log('   This ensures consistency with the frontend component expectations.');
      
      console.log('\n' + '='.repeat(60) + '\n');
      console.log('✅ EXPECTED BEHAVIOR:');
      console.log('   1. Hard refresh the page (Cmd+Shift+R or Ctrl+Shift+R)');
      console.log('   2. Assignment Resources section should appear in blue box');
      console.log('   3. Section should be below "Submit Assignment" button');
      console.log('   4. Section should be above "Instructional Video"');
      
      console.log('\n' + '='.repeat(60) + '\n');
      console.log('🎯 WHAT TO LOOK FOR:');
      console.log('   - Blue box with "📎 Assignment Resources" heading');
      console.log('   - Resource card showing "Problem Sheet" link');
      console.log('   - "View Resource" button that opens Google Sheets');
      
    } else {
      console.log('❌ Assignment not found in database');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testResourcesDisplay();
