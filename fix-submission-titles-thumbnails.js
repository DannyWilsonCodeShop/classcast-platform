const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function main() {
  // Load all assignments for title lookup
  const assignmentsResult = await docClient.send(new ScanCommand({
    TableName: 'classcast-assignments',
    ProjectionExpression: 'assignmentId, title',
  }));
  const assignmentMap = new Map();
  for (const a of (assignmentsResult.Items || [])) {
    assignmentMap.set(a.assignmentId, a.title);
  }
  console.log(`Loaded ${assignmentMap.size} assignments`);

  // Load all submissions
  const result = await docClient.send(new ScanCommand({
    TableName: 'classcast-submissions',
  }));
  const submissions = result.Items || [];
  console.log(`Found ${submissions.length} submissions`);

  let updated = 0;
  for (const sub of submissions) {
    const updates = {};
    
    // Fix title: use assignment title instead of file name
    const assignmentTitle = assignmentMap.get(sub.assignmentId);
    if (assignmentTitle && sub.videoTitle !== assignmentTitle) {
      // Check if current title looks like a file name (has extension or random chars)
      const currentTitle = sub.videoTitle || '';
      const looksLikeFileName = currentTitle.includes('.') || 
        currentTitle.startsWith('recording-') || 
        currentTitle === 'Video Submission' ||
        currentTitle.match(/^[a-f0-9-]+$/);
      if (looksLikeFileName || !currentTitle) {
        updates.videoTitle = assignmentTitle;
      }
    }

    // Fix thumbnail: remove placeholder URLs that don't resolve
    const thumb = sub.thumbnailUrl || '';
    if (thumb.includes('/api/placeholder') || thumb.includes('placeholder')) {
      updates.thumbnailUrl = null;
    }

    if (Object.keys(updates).length > 0) {
      const expParts = [];
      const expValues = {};
      const expNames = {};
      
      for (const [key, value] of Object.entries(updates)) {
        expParts.push(`#${key} = :${key}`);
        expNames[`#${key}`] = key;
        expValues[`:${key}`] = value;
      }

      await docClient.send(new UpdateCommand({
        TableName: 'classcast-submissions',
        Key: { submissionId: sub.submissionId },
        UpdateExpression: `SET ${expParts.join(', ')}`,
        ExpressionAttributeNames: expNames,
        ExpressionAttributeValues: expValues,
      }));

      console.log(`  Updated ${sub.submissionId}: ${JSON.stringify(updates)}`);
      updated++;
    }
  }

  console.log(`\n✅ Done! Updated ${updated} submissions.`);
}

main().catch(console.error);
