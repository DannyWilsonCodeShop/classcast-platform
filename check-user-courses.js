#!/usr/bin/env node

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function findUserCourses() {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: 'classcast-courses'
    }));
    
    console.log('🔍 Looking for dwilson1919@gmail.com in courses...');
    
    if (result.Items) {
      let found = false;
      result.Items.forEach(course => {
        if (course.enrollment && course.enrollment.students) {
          const student = course.enrollment.students.find(s => s.userId === 'dwilson1919@gmail.com');
          if (student) {
            console.log('✅ Found in course:', course.courseId, '-', course.name || 'Unnamed');
            found = true;
          }
        }
      });
      
      if (!found) {
        console.log('❌ dwilson1919@gmail.com not found in any courses');
        console.log('');
        console.log('📚 Available courses with students:');
        result.Items.forEach(course => {
          if (course.enrollment && course.enrollment.students && course.enrollment.students.length > 0) {
            console.log('  -', course.courseId, ':', course.name || 'Unnamed', '(' + course.enrollment.students.length + ' students)');
          }
        });
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

findUserCourses();