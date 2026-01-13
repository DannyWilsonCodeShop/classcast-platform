#!/usr/bin/env node

/**
 * Test assignments data and create sample upcoming assignments
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const ASSIGNMENTS_TABLE = 'classcast-assignments';
const COURSES_TABLE = 'classcast-courses';

const testAssignmentsData = async () => {
  console.log('🧪 Testing Assignments Data...');
  console.log('');
  
  try {
    // Check existing assignments
    console.log('📊 Checking existing assignments...');
    const assignmentsResult = await docClient.send(new ScanCommand({
      TableName: ASSIGNMENTS_TABLE
    }));
    
    const assignments = assignmentsResult.Items || [];
    console.log(`Found ${assignments.length} existing assignments`);
    
    if (assignments.length > 0) {
      console.log('');
      console.log('📋 Existing Assignments:');
      assignments.forEach((assignment, index) => {
        const dueDate = new Date(assignment.dueDate);
        console.log(`${index + 1}. ${assignment.title}`);
        console.log(`   Course: ${assignment.courseId}`);
        console.log(`   Due: ${dueDate.toLocaleDateString()}`);
        console.log(`   Created: ${assignment.createdAt}`);
        console.log('');
      });
    }
    
    // Check courses
    console.log('📚 Checking existing courses...');
    const coursesResult = await docClient.send(new ScanCommand({
      TableName: COURSES_TABLE
    }));
    
    const courses = coursesResult.Items || [];
    console.log(`Found ${courses.length} existing courses`);
    
    if (courses.length > 0) {
      console.log('');
      console.log('📖 Existing Courses:');
      courses.forEach((course, index) => {
        console.log(`${index + 1}. ${course.courseName || course.title}`);
        console.log(`   ID: ${course.courseId}`);
        console.log(`   Code: ${course.courseCode || course.code}`);
        console.log(`   Students: ${course.enrollment?.students?.length || 0}`);
        console.log('');
      });
      
      // Create sample upcoming assignments if we have courses
      if (courses.length > 0 && assignments.length < 5) {
        console.log('🎯 Creating sample upcoming assignments...');
        
        const sampleCourse = courses[0];
        const now = new Date();
        
        const sampleAssignments = [
          {
            assignmentId: `assignment_${Date.now()}_1`,
            courseId: sampleCourse.courseId,
            title: 'Math Quiz - Quadratic Equations',
            description: 'Complete the quiz on quadratic equations and graphing',
            assignmentType: 'quiz',
            dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
            maxScore: 100,
            createdAt: new Date().toISOString(),
            status: 'active'
          },
          {
            assignmentId: `assignment_${Date.now()}_2`,
            courseId: sampleCourse.courseId,
            title: 'Video Project - Historical Analysis',
            description: 'Create a 5-minute video analyzing a historical event',
            assignmentType: 'video_assignment',
            dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
            maxScore: 150,
            createdAt: new Date().toISOString(),
            status: 'active'
          },
          {
            assignmentId: `assignment_${Date.now()}_3`,
            courseId: sampleCourse.courseId,
            title: 'Essay - Literature Review',
            description: 'Write a 1000-word essay reviewing a classic novel',
            assignmentType: 'essay',
            dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
            maxScore: 200,
            createdAt: new Date().toISOString(),
            status: 'active'
          },
          {
            assignmentId: `assignment_${Date.now()}_4`,
            courseId: sampleCourse.courseId,
            title: 'Science Lab Report',
            description: 'Submit your chemistry lab experiment results and analysis',
            assignmentType: 'lab_report',
            dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
            maxScore: 120,
            createdAt: new Date().toISOString(),
            status: 'active'
          }
        ];
        
        for (const assignment of sampleAssignments) {
          try {
            await docClient.send(new PutCommand({
              TableName: ASSIGNMENTS_TABLE,
              Item: assignment
            }));
            console.log(`✅ Created assignment: ${assignment.title}`);
          } catch (error) {
            console.error(`❌ Failed to create assignment: ${assignment.title}`, error.message);
          }
        }
        
        console.log('');
        console.log('🎉 Sample assignments created successfully!');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

// Run the test
testAssignmentsData().catch(console.error);