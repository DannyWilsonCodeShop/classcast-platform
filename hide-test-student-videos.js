/**
 * Mark test student submissions as hidden/deleted
 * This will prevent them from showing on the dashboard
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Student user IDs to hide videos for
const STUDENT_IDS = [
  'user_1760397943147_epc5y6z99', // Shane Wilson
  'user_1759493077051_vp8wpn6j2', // Austin Wilson
  'user_1760122607792_al2161cme', // Olivia Wilson
  'user_1760601996117_bcpnlf8cl'  // EJ Wilson
];

async function hideStudentSubmissions() {
  console.log('🔍 Finding submissions for test students...\n');
  
  let totalHidden = 0;

  for (const studentId of STUDENT_IDS) {
    console.log(`Processing student: ${studentId}`);
    
    try {
      const result = await docClient.send(new ScanCommand({
        TableName: 'classcast-submissions',
        FilterExpression: 'studentId = :studentId',
        ExpressionAttributeValues: {
          ':studentId': studentId
        }
      }));

      const submissions = result.Items || [];
      console.log(`  Found ${submissions.length} submissions`);

      for (const submission of submissions) {
        try {
          await docClient.send(new UpdateCommand({
            TableName: 'classcast-submissions',
            Key: { submissionId: submission.submissionId },
            UpdateExpression: 'SET #status = :status, #hidden = :hidden, updatedAt = :updatedAt',
            ExpressionAttributeNames: {
              '#status': 'status',
              '#hidden': 'hidden'
            },
            ExpressionAttributeValues: {
              ':status': 'deleted',
              ':hidden': true,
              ':updatedAt': new Date().toISOString()
            }
          }));
          
          console.log(`    ✅ Hidden: ${submission.videoTitle || submission.submissionId}`);
          totalHidden++;
        } catch (error) {
          console.error(`    ❌ Error hiding submission:`, error.message);
        }
      }
    } catch (error) {
      console.error(`  ❌ Error processing student ${studentId}:`, error.message);
    }
  }

  console.log(`\n✅ Total submissions hidden: ${totalHidden}`);
  console.log('\nThese videos will no longer appear on the student dashboard.');
}

hideStudentSubmissions().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

