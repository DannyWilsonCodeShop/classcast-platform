#!/usr/bin/env node

/**
 * Fix Jasmine Weatherspoon's email address
 * Current: jweatherspooJn28@cristoreyatlanta.org (typo with capital J)
 * Correct: jweatherspoon28@cristoreyatlanta.org
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USERS_TABLE = 'classcast-users';
const COURSES_TABLE = 'classcast-courses';

const JASMINE_USER_ID = 'user_1759495892039_5jm4hw3ay';
const MAT250_COURSE_ID = 'course_1760635875079_bcjiq11ho';
const SECTION_D_ID = '439ceedc-f0aa-48d8-a1e8-d4d4ed00b1ff';
const CORRECT_EMAIL = 'jweatherspoon28@cristoreyatlanta.org';

async function fixJasmineEmail() {
  try {
    console.log('\n🔧 Fixing Jasmine Weatherspoon\'s Email Address\n');
    
    // Step 1: Update user record
    console.log('Step 1: Updating user record...');
    console.log(`   User ID: ${JASMINE_USER_ID}`);
    console.log(`   New email: ${CORRECT_EMAIL}`);
    
    await docClient.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { userId: JASMINE_USER_ID },
      UpdateExpression: 'SET email = :email, updatedAt = :updated',
      ExpressionAttributeValues: {
        ':email': CORRECT_EMAIL,
        ':updated': new Date().toISOString()
      }
    }));
    
    console.log('✅ User email updated');
    
    // Step 2: Update course section enrollment
    console.log('\nStep 2: Updating course section enrollment...');
    console.log(`   Course ID: ${MAT250_COURSE_ID}`);
    console.log(`   Section: Section D (${SECTION_D_ID})`);
    
    // Get current course data
    const courseResult = await docClient.send(new GetCommand({
      TableName: COURSES_TABLE,
      Key: { courseId: MAT250_COURSE_ID }
    }));
    
    if (!courseResult.Item) {
      console.error('❌ Course not found');
      return;
    }
    
    const course = courseResult.Item;
    const sections = course.sections?.students || course.sections || [];
    
    console.log(`   Found ${sections.length} entries in sections`);
    
    // Find and update Jasmine's entry in sections
    let updated = false;
    const updatedSections = sections.map(student => {
      if (student.userId === JASMINE_USER_ID) {
        updated = true;
        const isInSectionD = student.sectionId === SECTION_D_ID;
        console.log(`   Found Jasmine in ${isInSectionD ? 'Section D ✓' : `Section ${student.sectionId}`}`);
        console.log(`   Current email: ${student.email}`);
        return {
          ...student,
          email: CORRECT_EMAIL
        };
      }
      return student;
    });
    
    if (!updated) {
      console.log('⚠️  Jasmine not found in sections array');
      console.log('   This might be okay if sections use a different structure');
    } else {
      // Update course with corrected sections
      const updateExpression = course.sections?.students 
        ? 'SET sections.students = :sections, updatedAt = :updated'
        : 'SET sections = :sections, updatedAt = :updated';
        
      await docClient.send(new UpdateCommand({
        TableName: COURSES_TABLE,
        Key: { courseId: MAT250_COURSE_ID },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: {
          ':sections': updatedSections,
          ':updated': new Date().toISOString()
        }
      }));
      
      console.log('✅ Course section enrollment updated');
    }
    
    // Step 3: Verify the changes
    console.log('\nStep 3: Verifying changes...');
    
    const userResult = await docClient.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId: JASMINE_USER_ID }
    }));
    
    const updatedCourseResult = await docClient.send(new GetCommand({
      TableName: COURSES_TABLE,
      Key: { courseId: MAT250_COURSE_ID }
    }));
    
    const user = userResult.Item;
    const updatedCourse = updatedCourseResult.Item;
    const updatedSectionsList = updatedCourse.sections?.students || updatedCourse.sections || [];
    const jasmineInSection = updatedSectionsList.find(s => s.userId === JASMINE_USER_ID);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Student: ${user.firstName} ${user.lastName}`);
    console.log(`User ID: ${user.userId}`);
    console.log(`Email in user record: ${user.email}`);
    console.log(`Email in course section: ${jasmineInSection?.email || 'Not found'}`);
    console.log(`Section: ${jasmineInSection?.sectionId === SECTION_D_ID ? 'Section D ✓' : 'Wrong section!'}`);
    console.log(`Status: ${jasmineInSection?.status || 'Unknown'}`);
    console.log('='.repeat(60));
    
    if (user.email === CORRECT_EMAIL && jasmineInSection?.email === CORRECT_EMAIL) {
      console.log('\n✅ Email address successfully corrected!\n');
    } else {
      console.log('\n⚠️  Email may not have been fully updated. Please check manually.\n');
    }
    
  } catch (error) {
    console.error('\n❌ Error fixing email:', error);
    console.error('Error details:', error.message);
  }
}

fixJasmineEmail();
