#!/usr/bin/env node

/**
 * Check MAT250 course enrollment details
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USERS_TABLE = 'classcast-users';
const COURSES_TABLE = 'classcast-courses';
const SUBMISSIONS_TABLE = 'classcast-submissions';

async function checkMAT250() {
  try {
    console.log('\n🔍 Checking MAT250 Course Enrollment...\n');
    
    // Find MAT250 course
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
    console.log('📚 Course Details:');
    console.log(`   Name: ${course.courseName || course.title}`);
    console.log(`   Code: ${course.courseCode || course.code}`);
    console.log(`   ID: ${course.courseId}`);
    console.log(`   Instructor: ${course.instructorId}`);
    
    // Check enrollment fields
    const studentIds = course.studentIds || course.enrolledStudents || [];
    console.log(`\n👥 Enrolled Students: ${studentIds.length}`);
    
    if (studentIds.length > 0) {
      console.log('\nStudent IDs in course:');
      studentIds.forEach((id, index) => {
        console.log(`   ${index + 1}. ${id}`);
      });
      
      // Get student details
      console.log('\n📋 Student Details:');
      for (const studentId of studentIds) {
        try {
          const userResult = await docClient.send(new GetCommand({
            TableName: USERS_TABLE,
            Key: { userId: studentId }
          }));
          
          if (userResult.Item) {
            const user = userResult.Item;
            console.log(`   ✓ ${user.firstName} ${user.lastName} (${user.email})`);
          } else {
            console.log(`   ✗ ${studentId} - User not found`);
          }
        } catch (error) {
          console.log(`   ✗ ${studentId} - Error: ${error.message}`);
        }
      }
    } else {
      console.log('   No students enrolled');
    }
    
    // Check for submissions to this course (might indicate students who should be enrolled)
    console.log('\n📝 Checking submissions for this course...');
    const submissionsResult = await docClient.send(new ScanCommand({
      TableName: SUBMISSIONS_TABLE,
      FilterExpression: 'courseId = :courseId',
      ExpressionAttributeValues: {
        ':courseId': course.courseId
      }
    }));
    
    if (submissionsResult.Items && submissionsResult.Items.length > 0) {
      const uniqueStudents = [...new Set(submissionsResult.Items.map(s => s.studentId))];
      console.log(`   Found ${submissionsResult.Items.length} submissions from ${uniqueStudents.length} unique students`);
      
      console.log('\n   Students with submissions:');
      for (const studentId of uniqueStudents) {
        try {
          const userResult = await docClient.send(new GetCommand({
            TableName: USERS_TABLE,
            Key: { userId: studentId }
          }));
          
          if (userResult.Item) {
            const user = userResult.Item;
            const submissionCount = submissionsResult.Items.filter(s => s.studentId === studentId).length;
            const isEnrolled = studentIds.includes(studentId);
            console.log(`   ${isEnrolled ? '✓' : '✗'} ${user.firstName} ${user.lastName} - ${submissionCount} submission(s) ${isEnrolled ? '(enrolled)' : '(NOT ENROLLED!)'}`);
          }
        } catch (error) {
          console.log(`   ✗ ${studentId} - Error: ${error.message}`);
        }
      }
    } else {
      console.log('   No submissions found');
    }
    
    // Check all course fields
    console.log('\n🔍 All Course Fields:');
    console.log(JSON.stringify(course, null, 2));
    
  } catch (error) {
    console.error('\n❌ Error checking MAT250:', error);
    console.error('Error details:', error.message);
  }
}

checkMAT250();
