/**
 * Update all existing submissions to have visibility: 'course'
 * This ensures no student videos are globally visible.
 * 
 * Visibility options:
 * - 'section' = only students in the same section
 * - 'course' = only students enrolled in the same course
 * - 'global' = all app users can see it
 * 
 * Run: node update-submission-visibility.js
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const SUBMISSIONS_TABLE = 'classcast-submissions';

async function updateAllSubmissions() {
  console.log('Scanning all submissions...');
  
  const result = await docClient.send(new ScanCommand({
    TableName: SUBMISSIONS_TABLE,
  }));

  const submissions = result.Items || [];
  console.log(`Found ${submissions.length} submissions`);

  let updated = 0;
  let skipped = 0;

  for (const sub of submissions) {
    // Skip if already has visibility set to 'course' or 'section'
    if (sub.visibility === 'course' || sub.visibility === 'section') {
      skipped++;
      continue;
    }

    const key = sub.id ? { id: sub.id } : { submissionId: sub.submissionId };
    
    try {
      await docClient.send(new UpdateCommand({
        TableName: SUBMISSIONS_TABLE,
        Key: key,
        UpdateExpression: 'SET visibility = :vis',
        ExpressionAttributeValues: {
          ':vis': 'course',
        },
      }));
      updated++;
    } catch (err) {
      // Try alternate key
      try {
        const altKey = sub.submissionId ? { submissionId: sub.submissionId } : { id: sub.id };
        await docClient.send(new UpdateCommand({
          TableName: SUBMISSIONS_TABLE,
          Key: altKey,
          UpdateExpression: 'SET visibility = :vis',
          ExpressionAttributeValues: {
            ':vis': 'course',
          },
        }));
        updated++;
      } catch (altErr) {
        console.warn(`Could not update submission ${sub.id || sub.submissionId}:`, altErr.message);
      }
    }
  }

  console.log(`Done! Updated: ${updated}, Skipped (already set): ${skipped}`);
}

updateAllSubmissions().catch(console.error);
