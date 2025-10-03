#!/usr/bin/env node

/**
 * Test Course Delete Functionality
 * Tests the course deletion API endpoint
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const COURSES_TABLE = 'classcast-courses';
const ASSIGNMENTS_TABLE = 'classcast-assignments';
const SUBMISSIONS_TABLE = 'classcast-submissions';

// Test course to delete
const testCourse = {
  courseId: 'test_course_delete',
  title: 'Test Course for Deletion',
  description: 'This course will be deleted to test the delete functionality.',
  code: 'TEST101',
  classCode: 'TEST101A',
  courseCode: 'TEST101',
  department: 'Computer Science',
  credits: 3,
  semester: 'Spring 2024',
  year: 2024,
  instructorId: 'instructor_001',
  instructorName: 'Dr. Test Instructor',
  instructorEmail: 'test@university.edu',
  status: 'published',
  maxStudents: 30,
  currentEnrollment: 0,
  enrollment: {
    students: [],
    waitlist: []
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Test assignment for the course
const testAssignment = {
  assignmentId: 'test_assignment_delete',
  courseId: 'test_course_delete',
  title: 'Test Assignment',
  description: 'This assignment will be deleted with the course.',
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
  maxScore: 100,
  status: 'published',
  assignmentType: 'video',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Test submission for the assignment
const testSubmission = {
  submissionId: 'test_submission_delete',
  assignmentId: 'test_assignment_delete',
  courseId: 'test_course_delete',
  studentId: 'test_student_001',
  videoUrl: 'https://example.com/test-video.mp4',
  videoTitle: 'Test Video Submission',
  videoDescription: 'This submission will be deleted with the course.',
  duration: 300,
  fileName: 'test-video.mp4',
  fileSize: 50000000,
  fileType: 'video/mp4',
  isRecorded: true,
  isUploaded: true,
  status: 'submitted',
  submittedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

async function createTestData() {
  console.log('🧪 Creating test data for course deletion...\n');
  
  try {
    // Create the test course
    console.log('📚 Creating test course...');
    await docClient.send(new PutCommand({
      TableName: COURSES_TABLE,
      Item: testCourse
    }));
    console.log('✅ Test course created');

    // Create the test assignment
    console.log('📝 Creating test assignment...');
    await docClient.send(new PutCommand({
      TableName: ASSIGNMENTS_TABLE,
      Item: testAssignment
    }));
    console.log('✅ Test assignment created');

    // Create the test submission
    console.log('📤 Creating test submission...');
    await docClient.send(new PutCommand({
      TableName: SUBMISSIONS_TABLE,
      Item: testSubmission
    }));
    console.log('✅ Test submission created');

    console.log('\n🎉 Test data created successfully!');
    console.log('\n📋 Test Data Summary:');
    console.log(`   Course: ${testCourse.title} (${testCourse.courseId})`);
    console.log(`   Assignment: ${testAssignment.title} (${testAssignment.assignmentId})`);
    console.log(`   Submission: ${testSubmission.videoTitle} (${testSubmission.submissionId})`);
    
    console.log('\n🔗 To test deletion, make a DELETE request to:');
    console.log(`   http://localhost:3000/api/instructor/courses/${testCourse.courseId}/delete`);
    
    console.log('\n📊 Expected Results:');
    console.log('   - Course should be deleted');
    console.log('   - Assignment should be deleted');
    console.log('   - Submission should be deleted');
    console.log('   - Response should show counts of deleted items');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
    process.exit(1);
  }
}

// Run the test
createTestData().catch(console.error);
