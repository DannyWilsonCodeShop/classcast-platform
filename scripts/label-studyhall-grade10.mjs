// One-time: label the existing study-hall roster as grade 10.
// All 269 current roster rows have grade="" (never populated). This sets grade="10" on
// any row whose grade is missing/empty, so the new grade-aware study-hall UI treats the
// current students/teachers as 10th grade. Idempotent and safe to re-run.
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const doc = DynamoDBDocumentClient.from(client);
const TABLE = 'classcast-study-hall-roster';
const DRY_RUN = process.argv.includes('--dry-run');
const TARGET_GRADE = '10';

let scanned = 0, updated = 0, lastKey;
do {
  const res = await doc.send(new ScanCommand({ TableName: TABLE, ExclusiveStartKey: lastKey }));
  for (const row of (res.Items || [])) {
    scanned++;
    const g = (row.grade ?? '').toString().trim();
    if (g !== '') continue; // already has a grade — leave it
    if (DRY_RUN) { updated++; continue; }
    await doc.send(new UpdateCommand({
      TableName: TABLE,
      Key: { rosterId: row.rosterId },
      UpdateExpression: 'SET grade = :g',
      ExpressionAttributeValues: { ':g': TARGET_GRADE },
    }));
    updated++;
  }
  lastKey = res.LastEvaluatedKey;
} while (lastKey);

console.log(`${DRY_RUN ? '[DRY RUN] would set' : 'set'} grade=${TARGET_GRADE} on ${updated} of ${scanned} roster rows`);
