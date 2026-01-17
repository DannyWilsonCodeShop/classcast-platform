#!/usr/bin/env node

/**
 * Check all submissions for Kidist
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USERS_TABLE = 'classcast-users';
const SUBMISSIONS_TABLE = 'classcast-submissions';

async function checkKidistSubmissions() {
  try {
    console.log('\n🔍 Checking Kidist\'s Submissions\n');
    
    // Find Kidist
    console.log('👤 Finding Kidist...');
    const usersResult = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: 'contains(#firstName, :name) OR contains(#lastName, :name) OR contains(#email, :name)',
      ExpressionAttributeNames: {
        '#firstName': 'firstName',
        '#lastName': 'lastName',
        '#email': 'email'
      },
      ExpressionAttributeValues: {
        ':name': 'kidist'
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
    
    // Get all submissions for Kidist
    console.log('\n📝 Fetching all submissions...');
    const submissionsResult = await docClient.send(new ScanCommand({
      TableName: SUBMISSIONS_TABLE,
      FilterExpression: 'studentId = :studentId',
      ExpressionAttributeValues: {
        ':studentId': kidist.userId
      }
    }));
    
    if (!submissionsResult.Items || submissionsResult.Items.length === 0) {
      console.log('❌ No submissions found for Kidist');
      return;
    }
    
    console.log(`\n✓ Found ${submissionsResult.Items.length} submission(s)\n`);
    
    submissionsResult.Items.forEach((submission, index) => {
      console.log(`\n📹 Submission ${index + 1}:`);
      console.log(`   Submission ID: ${submission.submissionId}`);
      console.log(`   Assignment ID: ${submission.assignmentId}`);
      console.log(`   Video URL: ${submission.videoUrl}`);
      console.log(`   Video Title: ${submission.videoTitle || 'N/A'}`);
      console.log(`   Status: ${submission.status}`);
      console.log(`   Grade: ${submission.grade !== undefined ? submission.grade : 'Not graded'}`);
      console.log(`   Submitted At: ${submission.submittedAt || submission.createdAt}`);
      console.log(`   Hidden: ${submission.hidden || false}`);
      console.log(`   Deleted: ${submission.status === 'deleted' ? 'YES' : 'NO'}`);
      
      // Check if it's a manual submission
      if (submission.videoUrl && !submission.videoUrl.includes('youtube') && !submission.videoUrl.includes('drive.google')) {
        console.log(`   📁 Type: Manual/Local Upload`);
      } else if (submission.videoUrl && submission.videoUrl.includes('youtube')) {
        console.log(`   🎬 Type: YouTube`);
      } else if (submission.videoUrl && submission.videoUrl.includes('drive.google')) {
        console.log(`   📁 Type: Google Drive`);
      }
      
      console.log('\n   Full submission data:');
      console.log(JSON.stringify(submission, null, 2));
    });
    
    console.log('\n✅ Done!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error('Details:', error.message);
  }
}

checkKidistSubmissions();
