const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function addCourseSampleData() {
  console.log('📚 Adding sample course data...');

  // Sample courses
  const courses = [
    {
      courseId: 'cs-101',
      name: 'Computer Science 101',
      description: 'Introduction to computer science concepts and programming fundamentals.',
      instructorId: '84c8b438-c061-700f-1051-0aecb612e646',
      instructorName: 'Test Instructor',
      subject: 'Computer Science',
      gradeLevel: 'High School',
      color: '#4A90E2',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      courseId: 'math-201',
      name: 'Advanced Mathematics',
      description: 'Advanced mathematical concepts including calculus and linear algebra.',
      instructorId: '84c8b438-c061-700f-1051-0aecb612e646',
      instructorName: 'Test Instructor',
      subject: 'Mathematics',
      gradeLevel: 'High School',
      color: '#E24A4A',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  try {
    // Add courses
    for (const course of courses) {
      await docClient.send(new PutCommand({
        TableName: 'classcast-courses',
        Item: course
      }));
      console.log(`✅ Added course: ${course.name}`);
    }

    console.log('🎉 Sample course data added successfully!');
    console.log(`📊 Added ${courses.length} courses`);

  } catch (error) {
    console.error('❌ Error adding sample course data:', error);
  }
}

addCourseSampleData();
