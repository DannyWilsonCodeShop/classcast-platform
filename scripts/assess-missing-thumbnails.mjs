// Read-only assessment: how many active submissions are S3 videos missing a real thumbnail.
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }));
const TABLE = 'classcast-submissions';

const isRealThumb = (tu) =>
  tu && !tu.includes('placeholder') && !/\.(mp4|webm|mov)$/i.test(tu) && !tu.includes('/videos/');
const isS3 = (u) => u && (u.includes('amazonaws.com') || u.startsWith('s3://'));
const isYouTube = (i) => i.isYouTube || /youtube\.com|youtu\.be/.test(i.videoUrl || '');
const isDrive = (i) => i.isGoogleDrive || /drive\.google/.test(i.videoUrl || '');

let items = [], key;
do {
  const r = await doc.send(new ScanCommand({ TableName: TABLE, ExclusiveStartKey: key }));
  items.push(...(r.Items || []));
  key = r.LastEvaluatedKey;
} while (key);

const active = items.filter(i => i.status !== 'deleted' && i.status !== 'draft' && !i.hidden);
let hasThumb = 0, youtube = 0, drive = 0, noVideo = 0, other = 0;
const candidates = [];
for (const i of active) {
  if (isRealThumb(i.thumbnailUrl)) { hasThumb++; continue; }
  if (isYouTube(i)) { youtube++; continue; }
  if (isDrive(i)) { drive++; continue; }
  if (isS3(i.videoUrl)) { candidates.push(i); continue; }
  if (!i.videoUrl) { noVideo++; continue; }
  other++;
}
console.log('active submissions:', active.length);
console.log('already have a real thumbnail:', hasThumb);
console.log('youtube (skip):', youtube);
console.log('google drive (skip):', drive);
console.log('no videoUrl (skip):', noVideo);
console.log('other/non-s3 (skip):', other);
console.log('S3 videos MISSING a thumbnail -> backfill candidates:', candidates.length);
candidates.slice(0, 5).forEach(c => console.log('  e.g.', c.submissionId, (c.videoUrl || '').slice(0, 90)));
