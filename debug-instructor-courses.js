#!/usr/bin/env node

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const COURSES_TABLE = 'classcast-courses';

async function debugInstructorCourses() {
  console.log('🔍 Debugging Instructor Courses Issue\n');
  console.log('='.repeat(70));
  
  try {
    // Get all courses
    const result = await docClient.send(new ScanCommand({
      TableName: COURSES_TABLE
    }));
    
    const courses = result.Items || [];
    console.log(`\n📚 Total courses in database: ${courses.length}\n`);
    
    if (courses.length === 0) {
      console.log('❌ No courses found in database!');
      return;
    }
    
    // Group by instructorId
    const byInstructor = {};
    courses.forEach(course => {
      const instructorId = course.instructorId || 'NO_INSTRUCTOR_ID';
      if (!byInstructor[instructorId]) {
        byInstructor[instructorId] = [];
      }
      byInstructor[instructorId].push(course);
    });
    
    console.log('📊 Courses grouped by instructorId:\n');
    Object.entries(byInstructor).forEach(([instructorId, coursesForInstructor]) => {
      console.log(`Instructor ID: ${instructorId}`);
      console.log(`  Courses: ${coursesForInstructor.length}`);
      coursesForInstructor.forEach(course => {
        console.log(`    - ${course.courseName || course.title} (${course.courseCode || course.code})`);
        console.log(`      courseId: ${course.courseId}`);
        console.log(`      status: ${course.status}`);
      });
      console.log();
    });
    
    console.log('='.repeat(70));
    console.log('\n💡 If you see "NO_INSTRUCTOR_ID", those courses are missing the instructorId field.');
    console.log('💡 Make sure the instructorId in your user session matches one of the IDs above.\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugInstructorCourses();
