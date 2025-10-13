/**
 * Cleanup Orphaned Data Script
 * 
 * This script identifies and deletes orphaned data:
 * 1. Submissions without valid assignments
 * 2. Peer responses without valid submissions
 * 3. S3 videos without corresponding submissions
 * 4. Assignments without valid courses
 * 
 * Usage: node scripts/cleanup-orphaned-data.js [--dry-run] [--delete-s3]
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, DeleteCommand, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, ListObjectsV2Command, DeleteObjectsCommand } = require('@aws-sdk/client-s3');

// Initialize clients
const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({ region: 'us-east-1' });

// Configuration
const COURSES_TABLE = 'classcast-courses';
const ASSIGNMENTS_TABLE = 'classcast-assignments';
const SUBMISSIONS_TABLE = 'classcast-submissions';
const PEER_RESPONSES_TABLE = 'classcast-peer-responses';
const VIDEO_BUCKET = process.env.VIDEO_BUCKET || 'classcast-videos-463470937777-us-east-1';

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const DELETE_S3 = args.includes('--delete-s3');

// Report object
const report = {
  scanned: {
    courses: 0,
    assignments: 0,
    submissions: 0,
    peerResponses: 0,
    s3Objects: 0
  },
  orphaned: {
    assignments: [],
    submissions: [],
    peerResponses: [],
    s3Objects: []
  },
  deleted: {
    assignments: 0,
    submissions: 0,
    peerResponses: 0,
    s3Objects: 0
  },
  errors: []
};

/**
 * Extract S3 key from URL
 */
function extractS3KeyFromUrl(url) {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    let key = urlObj.pathname.substring(1);
    
    if (key.startsWith(`${VIDEO_BUCKET}/`)) {
      key = key.substring(VIDEO_BUCKET.length + 1);
    }
    
    return key || null;
  } catch (error) {
    const match = url.match(/([^\/]+\/[^\/]+\/[^\/]+\/[^\/]+\.\w+)$/);
    return match ? match[1] : null;
  }
}

/**
 * Scan all items from a DynamoDB table
 */
async function scanTable(tableName) {
  const items = [];
  let lastEvaluatedKey = undefined;

  do {
    const params = {
      TableName: tableName,
      ExclusiveStartKey: lastEvaluatedKey
    };

    const result = await docClient.send(new ScanCommand(params));
    items.push(...(result.Items || []));
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return items;
}

/**
 * List all objects in S3 bucket
 */
async function listS3Objects() {
  const objects = [];
  let continuationToken = undefined;

  do {
    const params = {
      Bucket: VIDEO_BUCKET,
      ContinuationToken: continuationToken
    };

    const result = await s3Client.send(new ListObjectsV2Command(params));
    
    if (result.Contents) {
      objects.push(...result.Contents.map(obj => obj.Key));
    }
    
    continuationToken = result.NextContinuationToken;
  } while (continuationToken);

  return objects;
}

/**
 * Delete items from DynamoDB in batches
 */
async function deleteItems(tableName, items, keyName) {
  if (items.length === 0) return 0;

  let deletedCount = 0;
  const BATCH_SIZE = 25; // DynamoDB batch limit

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    
    try {
      const deleteRequests = batch.map(item => ({
        DeleteRequest: {
          Key: { [keyName]: item[keyName] }
        }
      }));

      await docClient.send(new BatchWriteCommand({
        RequestItems: {
          [tableName]: deleteRequests
        }
      }));

      deletedCount += batch.length;
      console.log(`   Deleted ${deletedCount}/${items.length} items from ${tableName}`);
    } catch (error) {
      console.error(`   Error deleting batch from ${tableName}:`, error.message);
      report.errors.push(`Failed to delete batch from ${tableName}: ${error.message}`);
    }
  }

  return deletedCount;
}

/**
 * Delete objects from S3 in batches
 */
async function deleteS3Objects(keys) {
  if (keys.length === 0) return 0;

  let deletedCount = 0;
  const BATCH_SIZE = 1000; // S3 batch limit

  for (let i = 0; i < keys.length; i += BATCH_SIZE) {
    const batch = keys.slice(i, i + BATCH_SIZE);
    
    try {
      const result = await s3Client.send(new DeleteObjectsCommand({
        Bucket: VIDEO_BUCKET,
        Delete: {
          Objects: batch.map(key => ({ Key: key })),
          Quiet: false
        }
      }));

      deletedCount += (result.Deleted?.length || 0);
      
      if (result.Errors && result.Errors.length > 0) {
        console.error(`   S3 deletion errors:`, result.Errors);
        report.errors.push(`Failed to delete ${result.Errors.length} S3 objects`);
      }
      
      console.log(`   Deleted ${deletedCount}/${keys.length} objects from S3`);
    } catch (error) {
      console.error(`   Error deleting S3 batch:`, error.message);
      report.errors.push(`Failed to delete S3 batch: ${error.message}`);
    }
  }

  return deletedCount;
}

/**
 * Main cleanup function
 */
async function cleanupOrphanedData() {
  console.log('🧹 Starting orphaned data cleanup...');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no deletions)' : 'DELETION MODE'}`);
  console.log(`S3 Cleanup: ${DELETE_S3 ? 'ENABLED' : 'DISABLED'}`);
  console.log('');

  try {
    // STEP 1: Load all data
    console.log('📊 Step 1: Loading data from DynamoDB...');
    
    const [courses, assignments, submissions, peerResponses] = await Promise.all([
      scanTable(COURSES_TABLE),
      scanTable(ASSIGNMENTS_TABLE),
      scanTable(SUBMISSIONS_TABLE),
      scanTable(PEER_RESPONSES_TABLE)
    ]);

    report.scanned.courses = courses.length;
    report.scanned.assignments = assignments.length;
    report.scanned.submissions = submissions.length;
    report.scanned.peerResponses = peerResponses.length;

    console.log(`   ✅ Courses: ${courses.length}`);
    console.log(`   ✅ Assignments: ${assignments.length}`);
    console.log(`   ✅ Submissions: ${submissions.length}`);
    console.log(`   ✅ Peer Responses: ${peerResponses.length}`);
    console.log('');

    // Create lookup sets for fast checking
    const courseIds = new Set(courses.map(c => c.courseId));
    const assignmentIds = new Set(assignments.map(a => a.assignmentId));
    const submissionIds = new Set(submissions.map(s => s.submissionId));

    // STEP 2: Find orphaned assignments (assignments without valid courses)
    console.log('🔍 Step 2: Finding orphaned assignments...');
    report.orphaned.assignments = assignments.filter(a => !courseIds.has(a.courseId));
    console.log(`   Found ${report.orphaned.assignments.length} orphaned assignments`);
    
    if (report.orphaned.assignments.length > 0) {
      console.log(`   Examples:`);
      report.orphaned.assignments.slice(0, 5).forEach(a => {
        console.log(`      - ${a.assignmentId} (course: ${a.courseId} - MISSING)`);
      });
    }
    console.log('');

    // STEP 3: Find orphaned submissions (submissions without valid assignments)
    console.log('🔍 Step 3: Finding orphaned submissions...');
    report.orphaned.submissions = submissions.filter(s => !assignmentIds.has(s.assignmentId));
    console.log(`   Found ${report.orphaned.submissions.length} orphaned submissions`);
    
    if (report.orphaned.submissions.length > 0) {
      console.log(`   Examples:`);
      report.orphaned.submissions.slice(0, 5).forEach(s => {
        console.log(`      - ${s.submissionId} (assignment: ${s.assignmentId} - MISSING)`);
      });
    }
    console.log('');

    // STEP 4: Find orphaned peer responses (responses without valid submissions)
    console.log('🔍 Step 4: Finding orphaned peer responses...');
    report.orphaned.peerResponses = peerResponses.filter(pr => !submissionIds.has(pr.videoId));
    console.log(`   Found ${report.orphaned.peerResponses.length} orphaned peer responses`);
    
    if (report.orphaned.peerResponses.length > 0) {
      console.log(`   Examples:`);
      report.orphaned.peerResponses.slice(0, 5).forEach(pr => {
        console.log(`      - ${pr.responseId} (video: ${pr.videoId} - MISSING)`);
      });
    }
    console.log('');

    // STEP 5: Find orphaned S3 objects (if enabled)
    if (DELETE_S3) {
      console.log('🔍 Step 5: Finding orphaned S3 objects...');
      const s3Objects = await listS3Objects();
      report.scanned.s3Objects = s3Objects.length;
      console.log(`   Total S3 objects: ${s3Objects.length}`);

      // Build set of valid S3 keys from submissions
      const validS3Keys = new Set();
      submissions.forEach(s => {
        if (s.videoUrl) {
          const key = extractS3KeyFromUrl(s.videoUrl);
          if (key) validS3Keys.add(key);
        }
        if (s.thumbnailUrl) {
          const key = extractS3KeyFromUrl(s.thumbnailUrl);
          if (key) validS3Keys.add(key);
        }
      });

      console.log(`   Valid S3 keys from submissions: ${validS3Keys.size}`);

      // Find orphaned S3 objects (exclude profile pictures and system files)
      const systemPrefixes = ['profile-pictures/', 'thumbnails/', 'system/'];
      report.orphaned.s3Objects = s3Objects.filter(key => {
        // Don't delete system files or profile pictures
        if (systemPrefixes.some(prefix => key.startsWith(prefix))) {
          return false;
        }
        // Only delete if not in valid submissions
        return !validS3Keys.has(key);
      });
      console.log(`   Found ${report.orphaned.s3Objects.length} orphaned S3 objects (excluding profile pictures)`);
      
      if (report.orphaned.s3Objects.length > 0) {
        console.log(`   Examples:`);
        report.orphaned.s3Objects.slice(0, 5).forEach(key => {
          console.log(`      - ${key}`);
        });
      }
      console.log('');
    } else {
      console.log('⏭️  Step 5: Skipping S3 cleanup (use --delete-s3 to enable)');
      console.log('');
    }

    // STEP 6: Delete orphaned data (if not dry run)
    if (!DRY_RUN) {
      console.log('🗑️  Step 6: Deleting orphaned data...');

      // Delete orphaned peer responses
      if (report.orphaned.peerResponses.length > 0) {
        console.log(`   Deleting ${report.orphaned.peerResponses.length} orphaned peer responses...`);
        // Peer responses might use 'id' or 'responseId' as primary key
        const keyName = report.orphaned.peerResponses[0].id ? 'id' : 'responseId';
        report.deleted.peerResponses = await deleteItems(
          PEER_RESPONSES_TABLE,
          report.orphaned.peerResponses,
          keyName
        );
      }

      // Delete orphaned submissions
      if (report.orphaned.submissions.length > 0) {
        console.log(`   Deleting ${report.orphaned.submissions.length} orphaned submissions...`);
        report.deleted.submissions = await deleteItems(
          SUBMISSIONS_TABLE,
          report.orphaned.submissions,
          'submissionId'
        );
      }

      // Delete orphaned assignments
      if (report.orphaned.assignments.length > 0) {
        console.log(`   Deleting ${report.orphaned.assignments.length} orphaned assignments...`);
        report.deleted.assignments = await deleteItems(
          ASSIGNMENTS_TABLE,
          report.orphaned.assignments,
          'assignmentId'
        );
      }

      // Delete orphaned S3 objects
      if (DELETE_S3 && report.orphaned.s3Objects.length > 0) {
        console.log(`   Deleting ${report.orphaned.s3Objects.length} orphaned S3 objects...`);
        report.deleted.s3Objects = await deleteS3Objects(report.orphaned.s3Objects);
      }

      console.log('');
    } else {
      console.log('⏭️  Step 6: Skipping deletion (dry run mode)');
      console.log('');
    }

    // STEP 7: Print summary report
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 CLEANUP REPORT');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('Scanned:');
    console.log(`   • Courses: ${report.scanned.courses}`);
    console.log(`   • Assignments: ${report.scanned.assignments}`);
    console.log(`   • Submissions: ${report.scanned.submissions}`);
    console.log(`   • Peer Responses: ${report.scanned.peerResponses}`);
    if (DELETE_S3) {
      console.log(`   • S3 Objects: ${report.scanned.s3Objects}`);
    }
    console.log('');
    console.log('Orphaned Data Found:');
    console.log(`   • Assignments: ${report.orphaned.assignments.length}`);
    console.log(`   • Submissions: ${report.orphaned.submissions.length}`);
    console.log(`   • Peer Responses: ${report.orphaned.peerResponses.length}`);
    if (DELETE_S3) {
      console.log(`   • S3 Objects: ${report.orphaned.s3Objects.length}`);
    }
    console.log('');
    
    if (!DRY_RUN) {
      console.log('Deleted:');
      console.log(`   • Assignments: ${report.deleted.assignments}`);
      console.log(`   • Submissions: ${report.deleted.submissions}`);
      console.log(`   • Peer Responses: ${report.deleted.peerResponses}`);
      if (DELETE_S3) {
        console.log(`   • S3 Objects: ${report.deleted.s3Objects}`);
      }
      console.log('');
    }

    if (report.errors.length > 0) {
      console.log('⚠️  Errors:');
      report.errors.forEach(err => console.log(`   • ${err}`));
      console.log('');
    }

    if (DRY_RUN) {
      console.log('ℹ️  This was a DRY RUN - no data was deleted.');
      console.log('   Run without --dry-run to actually delete orphaned data.');
      console.log('');
    } else {
      console.log('✅ Cleanup completed!');
      console.log('');
    }

    // Calculate storage savings
    if (DELETE_S3 && report.orphaned.s3Objects.length > 0) {
      console.log('💰 Estimated Storage Savings:');
      console.log(`   • ~${Math.round(report.orphaned.s3Objects.length * 10)} MB saved`);
      console.log(`   • ~$${(report.orphaned.s3Objects.length * 10 * 0.023 / 1000).toFixed(2)}/month S3 cost reduction`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Fatal error during cleanup:', error);
    report.errors.push(error.message);
    process.exit(1);
  }
}

// Run the cleanup
cleanupOrphanedData()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

