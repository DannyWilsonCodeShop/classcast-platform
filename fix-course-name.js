const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function fixCourseName() {
  try {
    const courseId = 'course_1760635875079_bcjiq11ho';
    
    console.log('🔧 Fixing course name for:', courseId);
    console.log('   Removing "(Copy)" from name field\n');
    
    const result = await docClient.send(new UpdateCommand({
      TableName: 'classcast-courses',
      Key: { courseId },
      UpdateExpression: 'SET #name = :name, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#name': 'name'
      },
      ExpressionAttributeValues: {
        ':name': 'Integrated Mathematics 2',
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    }));
    
    console.log('✅ Course updated successfully!');
    console.log('\n📝 Updated fields:');
    console.log('  - title:', result.Attributes.title);
    console.log('  - courseName:', result.Attributes.courseName);
    console.log('  - name:', result.Attributes.name);
    console.log('\n✨ The "(Copy)" has been removed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixCourseName();
