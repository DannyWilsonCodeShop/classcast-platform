#!/usr/bin/env node

/**
 * Submit Google Drive video for Kidist - Graphing Piecewise Functions
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USERS_TABLE = 'classcast-users';
const ASSIGNMENTS_TABLE = 'classcast-assignments';
const SUBMISSIONS_TABLE = 'classcast-submissions';

const GOOGLE_DRIVE_URL = 'https://drive.google.com/file/d/1bbJqSy1N4j7cKkhqR3TRrl3S786xJFKh/view?usp=drivesdk';

async function submitGoogleDrive() {
  try {
    console.log('\n📁 Submitting Google Drive Video for Kidist\n');
    
    // Find Kidist
    console.log('👤 Finding Kidist...');
    const usersResult = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: 'contains(#email, :email)',
      ExpressionAttributeNames: {
        '#email': 'email'
      },
      ExpressionAttributeValues: {
        ':email': 'kshiwendo28'
      }
    }));
    
    if (!usersResult.Items || usersResult.Items.length === 0) {
      console.error('❌ Kidist not found');
      return;
    }
    
    const kidist = usersResult.Items[0];
    console.log(`✓ Found: ${kidist.firstName} ${kidist.lastName}`);
    console.log(`   Email: ${kidist.email}`);
    console.log(`   User ID: ${kidist.userId}`);
    
    // Find "Graphing Piecewise Functions" assignment
    console.log('\n📝 Finding "Graphing Piecewise Functions" assignment...');
    const assignmentsResult = await docClient.send(new ScanCommand({
      TableName: ASSIGNMENTS_TABLE,
      FilterExpression: 'contains(#title, :title)',
      ExpressionAttributeNames: {
        '#title': 'title'
      },
      ExpressionAttributeValues: {
        ':title': 'Piecewise'
      }
    }));
    
    if (!assignmentsResult.Items || assignmentsResult.Items.length === 0) {
      console.error('❌ Assignment not found');
      console.log('\n🔍 Searching for all assignments with "Graph" in title...');
      
      const graphResult = await docClient.send(new ScanCommand({
        TableName: ASSIGNMENTS_TABLE,
        FilterExpression: 'contains(#title, :title)',
        ExpressionAttributeNames: {
          '#title': 'title'
        },
        ExpressionAttributeValues: {
          ':title': 'Graph'
        }
      }));
      
      if (graphResult.Items && graphResult.Items.length > 0) {
        console.log('\nFound assignments with "Graph":');
        graphResult.Items.forEach(a => {
          console.log(`   - ${a.title} (${a.assignmentId})`);
        });
      }
      return;
    }
    
    const assignment = assignmentsResult.Items[0];
    console.log(`✓ Found assignment: ${assignment.title}`);
    console.log(`   Assignment ID: ${assignment.assignmentId}`);
    console.log(`   Course ID: ${assignment.courseId}`);
    console.log(`   Due Date: ${assignment.dueDate}`);
    
    // Check if submission already exists
    console.log('\n🔍 Checking for existing submission...');
    const existingResult = await docClient.send(new ScanCommand({
      TableName: SUBMISSIONS_TABLE,
      FilterExpression: 'studentId = :studentId AND assignmentId = :assignmentId',
      ExpressionAttributeValues: {
        ':studentId': kidist.userId,
        ':assignmentId': assignment.assignmentId
      }
    }));
    
    if (existingResult.Items && existingResult.Items.length > 0) {
      console.log('⚠️  Existing submission found:');
      existingResult.Items.forEach(sub => {
        console.log(`   - ${sub.submissionId} (Status: ${sub.status})`);
        console.log(`     Video URL: ${sub.videoUrl}`);
      });
      console.log('\n❓ Do you want to create a new submission anyway? (This will be a duplicate)');
    }
    
    // Create submission
    const submissionId = `submission_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const now = new Date().toISOString();
    
    const submission = {
      submissionId: submissionId,
      assignmentId: assignment.assignmentId,
      studentId: kidist.userId,
      courseId: assignment.courseId,
      videoUrl: GOOGLE_DRIVE_URL,
      googleDriveUrl: GOOGLE_DRIVE_URL,
      isGoogleDrive: true,
      isYouTube: false,
      isUploaded: false,
      videoTitle: assignment.title,
      videoDescription: 'Google Drive submission',
      status: 'submitted',
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
      submissionMethod: 'google_drive',
      thumbnailUrl: '/api/placeholder/400/300?text=Google+Drive+Video',
      duration: 0,
      fileSize: 0,
      likes: 0,
      likedBy: []
    };
    
    console.log('\n💾 Creating submission...');
    await docClient.send(new PutCommand({
      TableName: SUBMISSIONS_TABLE,
      Item: submission
    }));
    
    console.log('✅ Submission created successfully!');
    console.log('\n📋 Submission Details:');
    console.log(`   Submission ID: ${submissionId}`);
    console.log(`   Student: ${kidist.firstName} ${kidist.lastName}`);
    console.log(`   Assignment: ${assignment.title}`);
    console.log(`   Video URL: ${GOOGLE_DRIVE_URL}`);
    console.log(`   Status: submitted`);
    console.log(`   Submitted At: ${now}`);
    
    console.log('\n✅ Done!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error('Details:', error.message);
  }
}

submitGoogleDrive();
