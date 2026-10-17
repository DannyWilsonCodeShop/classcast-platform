// Backfill real thumbnails for S3-hosted submissions that are missing one.
// For each candidate: download the video from S3, extract a frame (~2s) with ffmpeg-static,
// upload the JPEG to S3 under thumbnails/<studentId>/<uuid>.jpg, and set thumbnailUrl on the
// submission. Idempotent (skips anything that already has a real thumbnail), resumable, and
// fault-tolerant (one bad video doesn't stop the run).
//
// Usage:
//   node scripts/backfill-thumbnails.mjs --dry-run      (list what it would do, no changes)
//   node scripts/backfill-thumbnails.mjs                (run it)
//   node scripts/backfill-thumbnails.mjs --limit=20     (only process the first N candidates)

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { readFile, unlink, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import ffmpegPath from 'ffmpeg-static';

const REGION = 'us-east-1';
const TABLE = 'classcast-submissions';
const BUCKET = process.env.VIDEO_BUCKET || 'classcast-videos-463470937777-us-east-1';
const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT = Number((process.argv.find(a => a.startsWith('--limit=')) || '').split('=')[1]) || Infinity;
const CONCURRENCY = 3;

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));
const s3 = new S3Client({ region: REGION });

const isRealThumb = (tu) =>
  tu && !tu.includes('placeholder') && !/\.(mp4|webm|mov)$/i.test(tu) && !tu.includes('/videos/');
const isS3 = (u) => u && (u.includes('amazonaws.com') || u.startsWith('s3://'));
const isExternal = (i) =>
  i.isYouTube || i.isGoogleDrive || /youtube\.com|youtu\.be|drive\.google/.test(i.videoUrl || '');

function s3KeyFromUrl(url) {
  if (url.startsWith('s3://')) return url.replace(/^s3:\/\/[^/]+\//, '');
  try {
    const u = new URL(url);
    let key = decodeURIComponent(u.pathname.slice(1));
    if (key.startsWith(`${BUCKET}/`)) key = key.slice(BUCKET.length + 1);
    return key;
  } catch { return null; }
}

// Pull the full list of candidates (active, S3 video, no real thumbnail).
async function getCandidates() {
  let items = [], key;
  do {
    const r = await doc.send(new ScanCommand({ TableName: TABLE, ExclusiveStartKey: key }));
    items.push(...(r.Items || []));
    key = r.LastEvaluatedKey;
  } while (key);
  return items.filter(i =>
    i.status !== 'deleted' && i.status !== 'draft' && !i.hidden &&
    !isRealThumb(i.thumbnailUrl) && !isExternal(i) && isS3(i.videoUrl)
  );
}

async function processOne(sub, idx, total) {
  const tag = `[${idx + 1}/${total}] ${sub.submissionId}`;
  const srcKey = s3KeyFromUrl(sub.videoUrl);
  if (!srcKey) { console.warn(`${tag} — could not parse S3 key, skipping`); return 'skip'; }
  if (DRY_RUN) { console.log(`${tag} — would generate thumbnail from ${srcKey}`); return 'dry'; }

  const dir = await mkdtemp(join(tmpdir(), 'thumb-'));
  const videoPath = join(dir, 'in');
  const thumbPath = join(dir, 'out.jpg');
  try {
    // 1. Download the video from S3 to a temp file.
    const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: srcKey }));
    await pipeline(obj.Body, createWriteStream(videoPath));

    // 2. Extract a frame at ~2s, scaled to 640px wide, as a single JPEG.
    await new Promise((resolve, reject) => {
      const args = ['-ss', '2', '-i', videoPath, '-frames:v', '1', '-vf', 'scale=640:-2', '-q:v', '4', '-y', thumbPath];
      const p = spawn(ffmpegPath, args, { stdio: 'ignore' });
      p.on('error', reject);
      p.on('close', (code) => code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`)));
    });

    // 3. Upload the JPEG to the same key pattern the app uses.
    const thumbKey = `thumbnails/${sub.studentId || 'backfill'}/${randomUUID()}.jpg`;
    const body = await readFile(thumbPath);
    if (!body.length) throw new Error('empty thumbnail');
    await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: thumbKey, Body: body, ContentType: 'image/jpeg' }));
    const thumbnailUrl = `https://${BUCKET}.s3.us-east-1.amazonaws.com/${thumbKey}`;

    // 4. Point the submission at the new thumbnail.
    await doc.send(new UpdateCommand({
      TableName: TABLE,
      Key: { submissionId: sub.submissionId },
      UpdateExpression: 'SET thumbnailUrl = :t',
      ExpressionAttributeValues: { ':t': thumbnailUrl },
    }));
    console.log(`${tag} — done`);
    return 'ok';
  } catch (err) {
    console.warn(`${tag} — FAILED: ${err?.message || err}`);
    return 'fail';
  } finally {
    await unlink(videoPath).catch(() => {});
    await unlink(thumbPath).catch(() => {});
  }
}

// Simple concurrency pool.
async function run() {
  if (!ffmpegPath) { console.error('ffmpeg-static not found'); process.exit(1); }
  const all = await getCandidates();
  const candidates = all.slice(0, LIMIT);
  console.log(`${DRY_RUN ? '[DRY RUN] ' : ''}candidates: ${candidates.length}${LIMIT < Infinity ? ` (of ${all.length}, limited)` : ''}`);

  const counts = { ok: 0, fail: 0, skip: 0, dry: 0 };
  let next = 0;
  async function worker() {
    while (next < candidates.length) {
      const i = next++;
      const r = await processOne(candidates[i], i, candidates.length);
      counts[r] = (counts[r] || 0) + 1;
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, candidates.length) }, worker));
  console.log('summary:', counts);
}

run().catch(e => { console.error(e); process.exit(1); });
