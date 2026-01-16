#!/usr/bin/env node

/**
 * Verify that Jasmine can see MAT250 in her student portal
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const COURSES_TABLE = 'classcast-courses';
const USERS_TABLE = 'classcast-users';
const JASMINE_USER_ID = 'user_1759495892039_5jm4hw3ay';

async function verifyAccess() {
  try {
    console.log('\n🔍 Verifying Jasmine\'s Course Access\n');
    
    // Get Jasmine's user info
    const userResult = await docClient.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId: JASMINE_USER_ID }
    }));
    
    if (!userResult.Item) {
      console.error('❌ User not found');
      return;
    }
    
    const user = userResult.Item;
    console.log('👤 User Information:');
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   User ID: ${user.userId}`);
    
    // Get all courses
    console.log('\n📚 Scanning all courses...');
    const coursesResult = await docClient.send(new ScanCommand({
      TableName: COURSES_TABLE
    }));
    
    console.log(`   Total courses in database: ${coursesResult.Items?.length || 0}`);
    
    // Filter courses where Jasmine is enrolled (same logic as API)
    const enrolledCourses = (coursesResult.Items || []).filter(course => {
      if (!course.enrollment?.students) {
        return false;
      }
      
      // Check if user is enrolled (handle both string and object formats)
      return course.enrollment.students.some((student) => {
        if (typeof student === 'string') {
          return student === JASMINE_USER_ID;
        } else if (typeof student === 'object' && student.userId) {
          return student.userId === JASMINE_USER_ID;
        }
        return false;
      });
    });
    
    console.log(`\n✅ Courses Jasmine is enrolled in: ${enrolledCourses.length}`);
    
    if (enrolledCourses.length === 0) {
      console.log('\n⚠️  Jasmine is not enrolled in any courses!');
    } else {
      console.log('\n📋 Course Details:\n');
      enrolledCourses.forEach((course, index) => {
        console.log(`${index + 1}. ${course.code || 'N/A'} - ${course.courseName || course.title}`);
        console.log(`   Course ID: ${course.courseId}`);
        
        // Find Jasmine's enrollment details
        const jasmineEnrollment = course.enrollment.students.find(s => 
          (typeof s === 'string' && s === JASMINE_USER_ID) ||
          (typeof s === 'object' && s.userId === JASMINE_USER_ID)
        );
        
        if (jasmineEnrollment && typeof jasmineEnrollment === 'object') {
          console.log(`   Section: ${jasmineEnrollment.sectionName || 'N/A'}`);
          console.log(`   Email in enrollment: ${jasmineEnrollment.email}`);
          console.log(`   Status: ${jasmineEnrollment.status}`);
          console.log(`   Enrolled at: ${jasmineEnrollment.enrolledAt}`);
        }
        console.log('');
      });
    }
    
    // Specifically check MAT250
    console.log('🎯 Checking MAT250 specifically...');
    const mat250 = coursesResult.Items?.find(c => 
      c.courseCode === 'MAT250' || c.code === 'MAT250'
    );
    
    if (!mat250) {
      console.log('   ❌ MAT250 course not found in database');
    } else {
      console.log(`   ✓ MAT250 found: ${mat250.courseName || mat250.title}`);
      
      const isEnrolled = mat250.enrollment?.students?.some(s => 
        (typeof s === 'string' && s === JASMINE_USER_ID) ||
        (typeof s === 'object' && s.userId === JASMINE_USER_ID)
      );
      
      if (isEnrolled) {
        console.log('   ✅ Jasmine IS enrolled in MAT250');
        
        const jasmineData = mat250.enrollment.students.find(s => 
          (typeof s === 'object' && s.userId === JASMINE_USER_ID)
        );
        
        if (jasmineData) {
          console.log(`   📧 Email in course: ${jasmineData.email}`);
          console.log(`   📍 Section: ${jasmineData.sectionName}`);
        }
      } else {
        console.log('   ❌ Jasmine is NOT enrolled in MAT250');
      }
    }
    
    console.log('\n✅ Verification complete!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error('Details:', error.message);
  }
}

verifyAccess();
