#!/usr/bin/env node

/**
 * Fix Jasmine's email in the course sections array
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const COURSES_TABLE = 'classcast-courses';
const MAT250_COURSE_ID = 'course_1760635875079_bcjiq11ho';
const JASMINE_USER_ID = 'user_1759495892039_5jm4hw3ay';
const CORRECT_EMAIL = 'jweatherspoon28@cristoreyatlanta.org';

async function fixSections() {
  try {
    console.log('\n🔧 Fixing Jasmine in Course Sections\n');
    
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
    
    // Check if sections exists and has students property
    if (course.sections && course.sections.students && Array.isArray(course.sections.students)) {
      console.log(`Found sections.students array with ${course.sections.students.length} students`);
      
      // Update Jasmine's email in the array
      let found = false;
      course.sections.students = course.sections.students.map(student => {
        if (student.userId === JASMINE_USER_ID) {
          found = true;
          console.log(`✓ Found Jasmine - updating email from "${student.email}" to "${CORRECT_EMAIL}"`);
          return {
            ...student,
            email: CORRECT_EMAIL
          };
        }
        return student;
      });
      
      if (!found) {
        console.log('⚠️  Jasmine not found in sections.students array');
      } else {
        // Save the updated course
        await docClient.send(new PutCommand({
          TableName: COURSES_TABLE,
          Item: {
            ...course,
            updatedAt: new Date().toISOString()
          }
        }));
        
        console.log('✅ Course updated successfully');
      }
    } else {
      console.log('⚠️  No sections.students array found in course');
      console.log('Course structure:', Object.keys(course));
    }
    
    console.log('\n✅ Done!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error('Details:', error.message);
  }
}

fixSections();
