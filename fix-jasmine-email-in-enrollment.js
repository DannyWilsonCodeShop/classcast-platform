#!/usr/bin/env node

/**
 * Fix Jasmine's email in the course enrollment.students array
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const COURSES_TABLE = 'classcast-courses';
const MAT250_COURSE_ID = 'course_1760635875079_bcjiq11ho';
const JASMINE_USER_ID = 'user_1759495892039_5jm4hw3ay';
const CORRECT_EMAIL = 'jweatherspoon28@cristoreyatlanta.org';
const WRONG_EMAIL = 'jweatherspooJn28@cristoreyatlanta.org';

async function fixJasmineEmail() {
  try {
    console.log('\n🔧 Fixing Jasmine\'s Email in Course Enrollment\n');
    
    // Get the full course
    const result = await docClient.send(new GetCommand({
      TableName: COURSES_TABLE,
      Key: { courseId: MAT250_COURSE_ID }
    }));
    
    if (!result.Item) {
      console.error('❌ Course not found');
      return;
    }
    
    const course = result.Item;
    
    // Check if enrollment.students exists
    if (!course.enrollment || !course.enrollment.students || !Array.isArray(course.enrollment.students)) {
      console.error('❌ No enrollment.students array found in course');
      console.log('Course structure:', Object.keys(course));
      return;
    }
    
    console.log(`📚 Found enrollment.students array with ${course.enrollment.students.length} students`);
    
    // Find and update Jasmine's email
    let found = false;
    course.enrollment.students = course.enrollment.students.map(student => {
      if (student.userId === JASMINE_USER_ID) {
        found = true;
        console.log(`\n✓ Found Jasmine Weatherspoon:`);
        console.log(`   Current email: ${student.email}`);
        console.log(`   Section: ${student.sectionName} (${student.sectionId})`);
        console.log(`   Status: ${student.status}`);
        
        if (student.email === WRONG_EMAIL) {
          console.log(`   ⚠️  Email has typo - fixing to: ${CORRECT_EMAIL}`);
          return {
            ...student,
            email: CORRECT_EMAIL
          };
        } else if (student.email === CORRECT_EMAIL) {
          console.log(`   ✅ Email is already correct!`);
          return student;
        } else {
          console.log(`   ⚠️  Unexpected email - updating to: ${CORRECT_EMAIL}`);
          return {
            ...student,
            email: CORRECT_EMAIL
          };
        }
      }
      return student;
    });
    
    if (!found) {
      console.error('\n❌ Jasmine not found in enrollment.students array');
      console.log('\nSearching for any student with similar name...');
      course.enrollment.students.forEach(student => {
        if (student.firstName?.toLowerCase().includes('jasmine') || 
            student.lastName?.toLowerCase().includes('weather')) {
          console.log(`   Found: ${student.firstName} ${student.lastName} (${student.email})`);
        }
      });
      return;
    }
    
    // Save the updated course
    console.log('\n💾 Saving updated course...');
    await docClient.send(new PutCommand({
      TableName: COURSES_TABLE,
      Item: {
        ...course,
        updatedAt: new Date().toISOString()
      }
    }));
    
    console.log('✅ Course updated successfully!');
    console.log('\n📋 Verification:');
    
    // Verify the update
    const verifyResult = await docClient.send(new GetCommand({
      TableName: COURSES_TABLE,
      Key: { courseId: MAT250_COURSE_ID }
    }));
    
    const jasmine = verifyResult.Item?.enrollment?.students?.find(
      s => s.userId === JASMINE_USER_ID
    );
    
    if (jasmine) {
      console.log(`   Name: ${jasmine.firstName} ${jasmine.lastName}`);
      console.log(`   Email: ${jasmine.email}`);
      console.log(`   Section: ${jasmine.sectionName}`);
      console.log(`   Status: ${jasmine.status}`);
      
      if (jasmine.email === CORRECT_EMAIL) {
        console.log('\n✅ Email successfully updated to correct address!');
      } else {
        console.log('\n⚠️  Email still incorrect after update');
      }
    }
    
    console.log('\n✅ Done!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error('Details:', error.message);
  }
}

fixJasmineEmail();
