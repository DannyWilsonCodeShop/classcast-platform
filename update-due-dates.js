/**
 * Update assignment due dates to every 2 weeks starting 4 weeks ago.
 * Run: node update-due-dates.js
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE = 'classcast-assignments';

async function main() {
  // Scan all assignments
  const result = await docClient.send(new ScanCommand({
    TableName: TABLE,
    ProjectionExpression: 'assignmentId, courseId, title, dueDate',
  }));

  const assignments = result.Items || [];
  console.log(`Found ${assignments.length} assignments`);

  if (assignments.length === 0) {
    console.log('No assignments to update.');
    return;
  }

  // Sort by existing dueDate (or title) to keep a consistent order
  assignments.sort((a, b) => {
    const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
    const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
    return dateA - dateB;
  });

  // Calculate new due dates: every 2 weeks starting 4 weeks ago from today
  const now = new Date();
  const fourWeeksAgo = new Date(now.getTime() - (4 * 7 * 24 * 60 * 60 * 1000));
  const twoWeeksMs = 2 * 7 * 24 * 60 * 60 * 1000;

  console.log(`\nAssigning due dates every 2 weeks starting from ${fourWeeksAgo.toISOString().split('T')[0]}:`);
  console.log('---');

  for (let i = 0; i < assignments.length; i++) {
    const assignment = assignments[i];
    const newDueDate = new Date(fourWeeksAgo.getTime() + (i * twoWeeksMs));
    // Set time to 11:59 PM
    newDueDate.setHours(23, 59, 0, 0);
    const newDueDateStr = newDueDate.toISOString();

    console.log(`${i + 1}. "${assignment.title}" → ${newDueDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}`);

    // Build the key - assignments table might use assignmentId as partition key
    // Some items might also need courseId as sort key
    const key = { assignmentId: assignment.assignmentId };
    if (assignment.courseId) {
      key.courseId = assignment.courseId;
    }

    try {
      await docClient.send(new UpdateCommand({
        TableName: TABLE,
        Key: key,
        UpdateExpression: 'SET dueDate = :dueDate, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':dueDate': newDueDateStr,
          ':updatedAt': new Date().toISOString(),
        },
      }));
    } catch (err) {
      // If courseId isn't part of the key, try without it
      if (err.name === 'ValidationException' && assignment.courseId) {
        try {
          await docClient.send(new UpdateCommand({
            TableName: TABLE,
            Key: { assignmentId: assignment.assignmentId },
            UpdateExpression: 'SET dueDate = :dueDate, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
              ':dueDate': newDueDateStr,
              ':updatedAt': new Date().toISOString(),
            },
          }));
        } catch (err2) {
          console.error(`  ⚠ Failed to update "${assignment.title}": ${err2.message}`);
        }
      } else {
        console.error(`  ⚠ Failed to update "${assignment.title}": ${err.message}`);
      }
    }
  }

  console.log('\n✅ Done! All due dates updated.');
}

main().catch(console.error);
