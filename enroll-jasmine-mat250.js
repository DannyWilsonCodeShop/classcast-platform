#!/usr/bin/env node

/**
 * Manually enroll Jasmine W. in MAT250 class
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USERS_TABLE = 'classcast-users';
const COURSES_TABLE = 'classcast-courses';

async function enrollJasmine() {
  try {
    console.log('\n🔍 Finding Jasmine W. and MAT250 course...\n');
    
    // Find Jasmine W.
    console.log('Step 1: Looking for Jasmine W. in users table...');
    const usersResult = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: 'contains(firstName, :firstName)',
      ExpressionAttributeValues: {
        ':firstName': 'Jasmine'
      }
    }));
    
    if (!usersResult.Items || usersResult.Items.length === 0) {
      console.error('❌ Could not find Jasmine in the database');
      return;
    }
    
    // Find Jasmine Weatherspoon specifically
    const jasmine = usersResult.Items.find(u => 
      u.lastName && u.lastName.toLowerCase().startsWith('w')
    ) || usersResult.Items[0];
    
    console.log(`✅ Found: ${jasmine.firstName} ${jasmine.lastName} (${jasmine.email})`);
    console.log(`   User ID: ${jasmine.userId}`);
    
    // Find MAT250 course
    console.log('\nStep 2: Looking for MAT250 course...');
    const coursesResult = await docClient.send(new ScanCommand({
      TableName: COURSES_TABLE,
      FilterExpression: 'contains(courseCode, :code) OR contains(#code, :code)',
      ExpressionAttributeNames: {
        '#code': 'code'
      },
      ExpressionAttributeValues: {
        ':code': 'MAT250'
      }
    }));
    
    if (!coursesResult.Items || coursesResult.Items.length === 0) {
      console.error('❌ Could not find MAT250 course');
      return;
    }
    
    const course = coursesResult.Items[0];
    console.log(`✅ Found: ${course.courseCode || course.code} - ${course.courseName || course.title}`);
    console.log(`   Course ID: ${course.courseId}`);
    
    // Check current enrollment
    const currentStudents = course.studentIds || course.enrolledStudents || [];
    console.log(`\nCurrent enrollment: ${currentStudents.length} students`);
    
    // Check if already enrolled
    if (currentStudents.includes(jasmine.userId)) {
      console.log('⚠️  Jasmine is already enrolled in this course!');
      return;
    }
    
    console.log('✅ Not yet enrolled - proceeding with enrollment...');
    
    // Add student to course
    console.log('\nStep 3: Adding Jasmine to course...');
    const updatedStudents = [...currentStudents, jasmine.userId];
    
    await docClient.send(new UpdateCommand({
      TableName: COURSES_TABLE,
      Key: {
        courseId: course.courseId
      },
      UpdateExpression: 'SET studentIds = :students, currentEnrollment = :count, updatedAt = :updated',
      ExpressionAttributeValues: {
        ':students': updatedStudents,
        ':count': updatedStudents.length,
        ':updated': new Date().toISOString()
      }
    }));
    
    console.log('✅ Enrollment added successfully!');
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 ENROLLMENT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Student: ${jasmine.firstName} ${jasmine.lastName}`);
    console.log(`Email: ${jasmine.email}`);
    console.log(`User ID: ${jasmine.userId}`);
    console.log(`Course: ${course.courseCode || course.code} - ${course.courseName || course.title}`);
    console.log(`Previous enrollment: ${currentStudents.length} students`);
    console.log(`New enrollment: ${updatedStudents.length} students`);
    console.log(`Enrolled: ${new Date().toLocaleString()}`);
    console.log('='.repeat(60));
    console.log('\n✅ Jasmine W. has been successfully enrolled in MAT250!\n');
    
  } catch (error) {
    console.error('\n❌ Error enrolling Jasmine:', error);
    console.error('Error details:', error.message);
  }
}

enrollJasmine();
