// One-time cleanup: null out googleDriveUrl/googleDriveOriginalUrl on submissions where
// the S3 URL was wrongly copied into the Google-Drive fields (bug in POST /api/video-submissions).
// Only touches records whose googleDriveUrl points at amazonaws.com AND that are NOT real
// Google Drive submissions. Idempotent and safe to re-run.
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const doc = DynamoDBDocumentClient.from(client);
const TABLE = 'classcast-submissions';
const DRY_RUN = process.argv.includes('--dry-run');

function isPoisoned(s) {
  const gd = s.googleDriveUrl || '';
  const vid = s.videoUrl || '';
  // bogus if the Drive field holds an S3 URL and the video itself isn't a real Drive link
  return gd.includes('amazonaws.com') && !vid.includes('drive.google.com');
}

let scanned = 0, fixed = 0, lastKey;
do {
  const res = await doc.send(new ScanCommand({ TableName: TABLE, ExclusiveStartKey: lastKey }));
  for (const s of (res.Items || [])) {
    scanned++;
    if (!isPoisoned(s)) continue;
    if (DRY_RUN) { fixed++; continue; }
    await doc.send(new UpdateCommand({
      TableName: TABLE,
      Key: { submissionId: s.submissionId },
      UpdateExpression: 'SET googleDriveUrl = :n, googleDriveOriginalUrl = :n, googleDriveFileId = :n, isGoogleDrive = :f',
      ExpressionAttributeValues: { ':n': null, ':f': false },
    }));
    fixed++;
  }
  lastKey = res.LastEvaluatedKey;
} while (lastKey);

console.log(`${DRY_RUN ? '[DRY RUN] would fix' : 'fixed'} ${fixed} of ${scanned} scanned submissions`);
