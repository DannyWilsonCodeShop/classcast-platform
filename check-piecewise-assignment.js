#!/usr/bin/env node

/**
 * Check Graphing Piecewise Functions assignment and all submissions
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const ASSIGNMENTS_TABLE = 'classcast-assignments';
const SUBMISSIONS_TABLE = 'classcast-submissions';
const USERS_TABLE = 'classcast-users';

const ASSIGNMENT_ID = 'assignment_1768361755173_ti155u2nf';

async function checkAssignment() {
  try {
    console.log('\n🔍 Checking Graphing Piecewise Functions Assignment\n');
    
    // Get assignment details
    console.log('📝 Fetching assignment details...');
    const assignmentResult = await docClient.send(new GetCommand({
      TableName: ASSIGNMENTS_TABLE,
      Key: { assignmentId: ASSIGNMENT_ID }
    }));
    
    if (!assignmentResult.Item) {
      console.error('❌ Assignment not found');
      return;
    }
    
    const assignment = assignmentResult.Item;
    console.log(`✓ Assignment: ${assignment.title}`);
    console.log(`   Assignment ID: ${assignment.assignmentId}`);
    console.log(`   Course ID: ${assignment.courseId}`);
    console.log(`   Max Score: ${assignment.maxScore || 'NOT SET'}`);
    console.log(`   Due Date: ${assignment.dueDate}`);
    console.log(`   Created: ${assignment.createdAt}`);
    
    // Get all submissions for this assignment
    console.log('\n📹 Fetching all submissions...');
    const submissionsResult = await docClient.send(new ScanCommand({
      TableName: SUBMISSIONS_TABLE,
      FilterExpression: 'assignmentId = :assignmentId',
      ExpressionAttributeValues: {
        ':assignmentId': ASSIGNMENT_ID
      }
    }));
    
    if (!submissionsResult.Items || submissionsResult.Items.length === 0) {
      console.log('❌ No submissions found for this assignment');
      return;
    }
    
    console.log(`✓ Found ${submissionsResult.Items.length} submission(s)\n`);
    
    // Get student details for each submission
    for (const submission of submissionsResult.Items) {
      // Get student info
      let studentName = 'Unknown';
      try {
        const userResult = await docClient.send(new GetCommand({
          TableName: USERS_TABLE,
          Key: { userId: submission.studentId }
        }));
        if (userResult.Item) {
          studentName = `${userResult.Item.firstName} ${userResult.Item.lastName}`;
        }
      } catch (error) {
        console.error(`Error fetching student ${submission.studentId}:`, error.message);
      }
      
      console.log(`\n👤 Student: ${studentName}`);
      console.log(`   Student ID: ${submission.studentId}`);
      console.log(`   Submission ID: ${submission.submissionId}`);
      console.log(`   Status: ${submission.status}`);
      console.log(`   Grade: ${submission.grade !== undefined ? submission.grade : 'Not graded'}`);
      console.log(`   Submitted At: ${submission.submittedAt || submission.createdAt}`);
      console.log(`   Hidden: ${submission.hidden || false}`);
      console.log(`   Video URL: ${submission.videoUrl}`);
      
      // Determine video type
      if (submission.videoUrl) {
        if (submission.videoUrl.includes('youtube')) {
          console.log(`   📺 Type: YouTube`);
        } else if (submission.videoUrl.includes('drive.google')) {
          console.log(`   📁 Type: Google Drive`);
        } else if (submission.videoUrl.includes('s3.amazonaws.com')) {
          console.log(`   ☁️ Type: S3 Upload (Manual)`);
        } else {
          console.log(`   ❓ Type: Unknown`);
        }
      }
    }
    
    console.log('\n\n📊 Summary:');
    console.log(`   Total Submissions: ${submissionsResult.Items.length}`);
    console.log(`   Graded: ${submissionsResult.Items.filter(s => s.grade !== undefined).length}`);
    console.log(`   Ungraded: ${submissionsResult.Items.filter(s => s.grade === undefined).length}`);
    console.log(`   Hidden: ${submissionsResult.Items.filter(s => s.hidden).length}`);
    
    console.log('\n✅ Done!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error('Details:', error.message);
  }
}

checkAssignment();
