const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function checkCourse() {
  try {
    const courseId = 'course_1760635875079_bcjiq11ho'; // Integrated Math 2
    
    console.log('🔍 Checking course:', courseId, '\n');
    
    const result = await docClient.send(new GetCommand({
      TableName: 'classcast-courses',
      Key: { courseId }
    }));
    
    if (result.Item) {
      console.log('📋 Full course data:');
      console.log(JSON.stringify(result.Item, null, 2));
      
      console.log('\n📝 Name fields:');
      console.log('  - title:', result.Item.title);
      console.log('  - courseName:', result.Item.courseName);
      console.log('  - name:', result.Item.name);
    } else {
      console.log('❌ Course not found');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkCourse();
