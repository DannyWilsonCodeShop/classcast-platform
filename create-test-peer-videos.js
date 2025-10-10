/**
 * Script to create test peer video submissions
 * Run with: node create-test-peer-videos.js
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const SUBMISSIONS_TABLE = 'classcast-submissions';

async function createTestPeerVideos() {
  try {
    console.log('🔍 Checking existing submissions...');
    
    // Get existing submissions to see what's there
    const scanResult = await docClient.send(new ScanCommand({
      TableName: SUBMISSIONS_TABLE,
      Limit: 10
    }));
    
    const existingSubmissions = scanResult.Items || [];
    console.log(`Found ${existingSubmissions.length} existing submission(s)`);
    
    if (existingSubmissions.length > 0) {
      console.log('\n📋 Existing submissions:');
      existingSubmissions.forEach((sub, i) => {
        console.log(`  ${i + 1}. Student: ${sub.studentId}, Course: ${sub.courseId}, Assignment: ${sub.assignmentId}`);
      });
      
      // Get the course and assignment from the first submission
      const firstSubmission = existingSubmissions[0];
      const courseId = firstSubmission.courseId;
      const assignmentId = firstSubmission.assignmentId;
      
      console.log(`\n✨ Creating test peer videos for course: ${courseId}, assignment: ${assignmentId}`);
      
      // Create 3 test peer submissions with different students
      const testStudents = [
        { id: 'student_alice_123', name: 'Alice Johnson' },
        { id: 'student_bob_456', name: 'Bob Smith' },
        { id: 'student_carol_789', name: 'Carol Williams' }
      ];
      
      for (const student of testStudents) {
        const submissionId = `submission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();
        
        const submission = {
          submissionId,
          assignmentId,
          studentId: student.id,
          courseId,
          videoUrl: `https://classcast-videos-463470937777-us-east-1.s3.amazonaws.com/test-${student.id}.webm`,
          videoId: null,
          videoTitle: `${student.name}'s Video Submission`,
          videoDescription: `Test video submission from ${student.name}`,
          duration: Math.floor(Math.random() * 300) + 60, // 1-6 minutes
          fileName: `${student.id}-video.webm`,
          fileSize: Math.floor(Math.random() * 5000000) + 1000000, // 1-6 MB
          fileType: 'video/webm',
          thumbnailUrl: `/api/placeholder/300/200`,
          isRecorded: true,
          isUploaded: false,
          isLocalStorage: false,
          status: 'submitted',
          grade: null,
          instructorFeedback: null,
          submittedAt: now,
          createdAt: now,
          updatedAt: now,
          gradedAt: null
        };
        
        console.log(`\n📹 Creating submission for ${student.name}...`);
        
        await docClient.send(new PutCommand({
          TableName: SUBMISSIONS_TABLE,
          Item: submission
        }));
        
        console.log(`✅ Created submission: ${submissionId}`);
      }
      
      console.log('\n🎉 Successfully created 3 test peer video submissions!');
      console.log('\n💡 Now you can:');
      console.log('   1. Visit https://class-cast.com/student/peer-reviews');
      console.log('   2. You should see 3 videos from other students to review');
      console.log('   3. The dashboard should show "3" in the Videos to Review card');
      
    } else {
      console.log('\n⚠️  No existing submissions found.');
      console.log('Please submit a video first, then run this script again.');
      console.log('The script will use your course and assignment IDs to create peer videos.');
    }
    
  } catch (error) {
    console.error('❌ Error creating test peer videos:', error);
    throw error;
  }
}

// Run the script
createTestPeerVideos()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error.message);
    process.exit(1);
  });

