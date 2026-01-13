#!/usr/bin/env node

/**
 * Debug course enrollment and assignment access
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const COURSES_TABLE = 'classcast-courses';
const ASSIGNMENTS_TABLE = 'classcast-assignments';

const debugEnrollment = async () => {
  console.log('🔍 Debugging Course Enrollment...');
  console.log('');
  
  try {
    // Check course structure
    console.log('📚 Checking course enrollment structure...');
    const coursesResult = await docClient.send(new ScanCommand({
      TableName: COURSES_TABLE
    }));
    
    const courses = coursesResult.Items || [];
    console.log(`Found ${courses.length} courses`);
    
    courses.forEach((course, index) => {
      console.log(`\n${index + 1}. ${course.courseName || course.title}`);
      console.log(`   ID: ${course.courseId}`);
      console.log(`   Code: ${course.courseCode || course.code}`);
      
      // Check enrollment structure
      if (course.enrollment) {
        console.log(`   Enrollment structure: ${JSON.stringify(course.enrollment, null, 2)}`);
        if (course.enrollment.students) {
          console.log(`   Students enrolled: ${course.enrollment.students.length}`);
          console.log(`   Sample students: ${course.enrollment.students.slice(0, 3).join(', ')}`);
        }
      } else {
        console.log('   No enrollment data found');
      }
      
      // Check other possible student fields
      if (course.students) {
        console.log(`   Direct students field: ${course.students.length} students`);
      }
      if (course.enrolledStudents) {
        console.log(`   enrolledStudents field: ${course.enrolledStudents.length} students`);
      }
    });
    
    // Test assignment access for a specific course
    if (courses.length > 0) {
      const testCourse = courses[0];
      console.log(`\n🎯 Testing assignment access for course: ${testCourse.courseId}`);
      
      const assignmentsResult = await docClient.send(new ScanCommand({
        TableName: ASSIGNMENTS_TABLE,
        FilterExpression: 'courseId = :courseId',
        ExpressionAttributeValues: {
          ':courseId': testCourse.courseId
        }
      }));
      
      const assignments = assignmentsResult.Items || [];
      console.log(`Found ${assignments.length} assignments for this course`);
      
      assignments.forEach((assignment, index) => {
        const dueDate = new Date(assignment.dueDate);
        console.log(`   ${index + 1}. ${assignment.title}`);
        console.log(`      Due: ${dueDate.toLocaleDateString()}`);
        console.log(`      Type: ${assignment.assignmentType}`);
        console.log(`      Points: ${assignment.maxScore}`);
      });
      
      // Test if demo user would have access
      if (testCourse.enrollment && testCourse.enrollment.students) {
        const demoUserEnrolled = testCourse.enrollment.students.includes('demo@email.com');
        console.log(`\n   Demo user enrolled: ${demoUserEnrolled}`);
        
        if (!demoUserEnrolled) {
          console.log('   ⚠️  Demo user not enrolled - this explains why no assignments are returned');
          
          // Try to find a user who is enrolled
          const enrolledUsers = testCourse.enrollment.students.slice(0, 3);
          console.log(`   Testing with enrolled users: ${enrolledUsers.join(', ')}`);
          
          for (const userId of enrolledUsers) {
            console.log(`\n   👤 Testing assignments for enrolled user: ${userId}`);
            
            try {
              const response = await fetch(`http://localhost:3000/api/student/assignments?userId=${userId}`);
              if (response.ok) {
                const data = await response.json();
                console.log(`      📊 Assignments found: ${data.assignments?.length || 0}`);
                
                if (data.assignments && data.assignments.length > 0) {
                  // Check upcoming assignments
                  const now = new Date();
                  const twoWeeksFromNow = new Date();
                  twoWeeksFromNow.setDate(now.getDate() + 14);
                  
                  const upcoming = data.assignments.filter(assignment => {
                    const dueDate = new Date(assignment.dueDate);
                    return dueDate >= now && dueDate <= twoWeeksFromNow && !assignment.isSubmitted;
                  });
                  
                  console.log(`      🎯 Upcoming assignments: ${upcoming.length}`);
                  
                  if (upcoming.length > 0) {
                    upcoming.slice(0, 2).forEach(assignment => {
                      console.log(`         • ${assignment.title} (Due: ${new Date(assignment.dueDate).toLocaleDateString()})`);
                    });
                  }
                }
              } else {
                console.log(`      ❌ API failed: ${response.status}`);
              }
            } catch (error) {
              console.log(`      ❌ Error: ${error.message}`);
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

// Run the debug
debugEnrollment().catch(console.error);