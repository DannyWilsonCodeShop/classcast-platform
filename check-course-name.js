const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function checkCourses() {
  try {
    console.log('🔍 Checking all courses...\n');
    
    const result = await docClient.send(new ScanCommand({
      TableName: 'classcast-courses'
    }));
    
    if (result.Items && result.Items.length > 0) {
      console.log(`Found ${result.Items.length} courses:\n`);
      
      result.Items.forEach((course, index) => {
        console.log(`${index + 1}. Course ID: ${course.courseId}`);
        console.log(`   Title/Name: ${course.title || course.courseName}`);
        console.log(`   Code: ${course.courseCode || course.code}`);
        console.log(`   Instructor: ${course.instructorName || course.instructorId}`);
        console.log(`   Status: ${course.status}`);
        console.log('');
      });
      
      // Find the one with "(Copy)"
      const copyCourse = result.Items.find(c => 
        (c.title || c.courseName || '').includes('(Copy)')
      );
      
      if (copyourse) {
        console.log('📋 Found course with "(Copy)":');
        console.log(JSON.stringify(copyourse, null, 2));
      }
    } else {
      console.log('❌ No courses found');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkCourses();
