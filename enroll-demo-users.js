#!/usr/bin/env node

/**
 * Script to enroll demo user and target user in courses for demo purposes
 * Usage: node enroll-demo-users.js
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const COURSES_TABLE = 'classcast-courses';
const TARGET_USER = 'dwilson1919@gmail.com';
const DEMO_USER = 'demo@email.com';

async function enrollUsersInCourses() {
  console.log('🎓 Enrolling demo and target users in courses...');
  console.log('');

  try {
    // Get all courses
    const coursesResult = await docClient.send(new ScanCommand({
      TableName: COURSES_TABLE
    }));

    if (!coursesResult.Items || coursesResult.Items.length === 0) {
      console.log('❌ No courses found');
      return;
    }

    // Find courses with existing students to enroll our users in
    const coursesWithStudents = coursesResult.Items.filter(course => 
      course.enrollment && course.enrollment.students && course.enrollment.students.length > 0
    );

    if (coursesWithStudents.length === 0) {
      console.log('❌ No courses with existing students found');
      return;
    }

    console.log(`📚 Found ${coursesWithStudents.length} courses with students:`);
    coursesWithStudents.forEach(course => {
      console.log(`  - ${course.courseId}: ${course.name || 'Unnamed'} (${course.enrollment.students.length} students)`);
    });
    console.log('');

    // Enroll both users in the first 2 courses (or all if less than 2)
    const coursesToEnrollIn = coursesWithStudents.slice(0, 2);
    
    for (const course of coursesToEnrollIn) {
      console.log(`📝 Enrolling users in: ${course.courseId} - ${course.name || 'Unnamed'}`);
      
      // Check if users are already enrolled
      const targetUserExists = course.enrollment.students.some(s => s.userId === TARGET_USER);
      const demoUserExists = course.enrollment.students.some(s => s.userId === DEMO_USER);
      
      let studentsToAdd = [];
      
      if (!targetUserExists) {
        studentsToAdd.push({
          userId: TARGET_USER,
          name: 'David Wilson',
          email: TARGET_USER,
          enrolledAt: new Date().toISOString(),
          status: 'active'
        });
        console.log(`  ✅ Adding target user: ${TARGET_USER}`);
      } else {
        console.log(`  ⚠️  Target user already enrolled: ${TARGET_USER}`);
      }
      
      if (!demoUserExists) {
        studentsToAdd.push({
          userId: DEMO_USER,
          name: 'Demo User',
          email: DEMO_USER,
          enrolledAt: new Date().toISOString(),
          status: 'active',
          isDemoUser: true
        });
        console.log(`  ✅ Adding demo user: ${DEMO_USER}`);
      } else {
        console.log(`  ⚠️  Demo user already enrolled: ${DEMO_USER}`);
      }
      
      if (studentsToAdd.length > 0) {
        // Add the new students to the existing enrollment
        const updatedStudents = [...course.enrollment.students, ...studentsToAdd];
        
        await docClient.send(new UpdateCommand({
          TableName: COURSES_TABLE,
          Key: { courseId: course.courseId },
          UpdateExpression: 'SET enrollment.students = :students, updatedAt = :updatedAt',
          ExpressionAttributeValues: {
            ':students': updatedStudents,
            ':updatedAt': new Date().toISOString()
          }
        }));
        
        console.log(`  ✅ Successfully enrolled ${studentsToAdd.length} new users`);
      } else {
        console.log(`  ℹ️  No new enrollments needed`);
      }
      
      console.log('');
    }

    console.log('🎉 Enrollment complete!');
    console.log('');
    console.log('📋 Summary:');
    console.log(`  • Target user (${TARGET_USER}) enrolled in ${coursesToEnrollIn.length} courses`);
    console.log(`  • Demo user (${DEMO_USER}) enrolled in ${coursesToEnrollIn.length} courses`);
    console.log('');
    console.log('🎭 Demo user will now see:');
    console.log('  • Course navigation and content');
    console.log('  • Assignments from enrolled courses');
    console.log('  • Feed content from course activities');
    console.log('  • All course-related features (read-only)');
    console.log('');
    console.log('🚀 Ready to test! Login with demo@email.com / Demo1234!');

  } catch (error) {
    console.error('❌ Error enrolling users:', error);
    process.exit(1);
  }
}

async function verifyEnrollments() {
  console.log('🔍 Verifying enrollments...');
  
  try {
    const coursesResult = await docClient.send(new ScanCommand({
      TableName: COURSES_TABLE
    }));

    if (coursesResult.Items) {
      let targetUserCourses = 0;
      let demoUserCourses = 0;
      
      coursesResult.Items.forEach(course => {
        if (course.enrollment && course.enrollment.students) {
          const hasTargetUser = course.enrollment.students.some(s => s.userId === TARGET_USER);
          const hasDemoUser = course.enrollment.students.some(s => s.userId === DEMO_USER);
          
          if (hasTargetUser) {
            targetUserCourses++;
            console.log(`✅ Target user in: ${course.courseId} - ${course.name || 'Unnamed'}`);
          }
          
          if (hasDemoUser) {
            demoUserCourses++;
            console.log(`✅ Demo user in: ${course.courseId} - ${course.name || 'Unnamed'}`);
          }
        }
      });
      
      console.log('');
      console.log(`📊 Enrollment Summary:`);
      console.log(`  • Target user enrolled in: ${targetUserCourses} courses`);
      console.log(`  • Demo user enrolled in: ${demoUserCourses} courses`);
    }
  } catch (error) {
    console.error('Error verifying enrollments:', error.message);
  }
}

// Main execution
async function main() {
  console.log('🎭 ClassCast Demo User Course Enrollment');
  console.log('========================================');
  console.log('');

  await enrollUsersInCourses();
  await verifyEnrollments();
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { enrollUsersInCourses, verifyEnrollments };