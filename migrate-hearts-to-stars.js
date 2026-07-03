const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

/**
 * Migrate hearts to star ratings.
 * For each submission that has likedBy users, create a 5-star rating interaction for each liker.
 */
async function main() {
  console.log('Scanning submissions with likes...');
  
  const result = await docClient.send(new ScanCommand({
    TableName: 'classcast-submissions',
    FilterExpression: 'attribute_exists(likedBy) AND size(likedBy) > :zero',
    ExpressionAttributeValues: { ':zero': 0 }
  }));

  const submissions = result.Items || [];
  console.log(`Found ${submissions.length} submissions with likes`);

  let created = 0;
  for (const sub of submissions) {
    const likedBy = sub.likedBy || [];
    for (const userId of likedBy) {
      // Check if a rating already exists for this user+video
      const interactionId = `rating_migrated_${sub.submissionId}_${userId}`;
      
      try {
        await docClient.send(new PutCommand({
          TableName: 'classcast-video-interactions',
          Item: {
            id: interactionId,
            videoId: sub.submissionId,
            userId: userId,
            userName: 'Migrated from like',
            type: 'rating',
            rating: 5,
            createdAt: sub.updatedAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          ConditionExpression: 'attribute_not_exists(id)',
        }));
        created++;
      } catch (e) {
        // Already exists, skip
      }
    }
  }

  console.log(`✅ Created ${created} star rating interactions from heart likes`);
}

main().catch(console.error);
