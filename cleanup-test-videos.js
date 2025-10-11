/**
 * Script to remove test peer video submissions
 * Run with: node cleanup-test-videos.js
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const SUBMISSIONS_TABLE = 'classcast-submissions';

async function cleanupTestVideos() {
  try {
    console.log('🔍 Scanning for test video submissions...');
    
    const scanResult = await docClient.send(new ScanCommand({
      TableName: SUBMISSIONS_TABLE,
      Limit: 100
    }));
    
    const allSubmissions = scanResult.Items || [];
    console.log(`Found ${allSubmissions.length} total submissions`);
    
    // Find test submissions (created by our scripts)
    const testSubmissions = allSubmissions.filter(sub => 
      sub.studentId?.includes('test') || 
      sub.studentId?.includes('alice') || 
      sub.studentId?.includes('bob') || 
      sub.studentId?.includes('carol') ||
      sub.courseId === 'test_course_delete'
    );
    
    console.log(`\n📊 Found ${testSubmissions.length} test submission(s) to remove:`);
    testSubmissions.forEach(sub => {
      console.log(`  - ${sub.submissionId}: ${sub.studentId} (${sub.courseId})`);
    });
    
    if (testSubmissions.length === 0) {
      console.log('\n✅ No test submissions found. Database is clean!');
      return;
    }
    
    console.log('\n🗑️  Deleting test submissions...');
    
    let deletedCount = 0;
    for (const submission of testSubmissions) {
      try {
        await docClient.send(new DeleteCommand({
          TableName: SUBMISSIONS_TABLE,
          Key: {
            submissionId: submission.submissionId
          }
        }));
        deletedCount++;
        console.log(`  ✓ Deleted: ${submission.submissionId}`);
      } catch (error) {
        console.error(`  ✗ Failed to delete ${submission.submissionId}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Successfully deleted ${deletedCount} of ${testSubmissions.length} test submissions!`);
    
    const remainingReal = allSubmissions.length - testSubmissions.length;
    console.log(`\n📈 Database now contains ${remainingReal} real video submission(s)`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

cleanupTestVideos()
  .then(() => {
    console.log('\n✨ Cleanup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Cleanup failed:', error.message);
    process.exit(1);
  });

