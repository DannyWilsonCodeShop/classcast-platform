# Orphaned Data Cleanup Script

This script identifies and removes orphaned data from your ClassCast platform database and S3 bucket.

## What Gets Cleaned Up

The script finds and deletes:

1. **Orphaned Assignments** - Assignments pointing to deleted courses
2. **Orphaned Submissions** - Submissions pointing to deleted assignments
3. **Orphaned Peer Responses** - Peer responses pointing to deleted submissions
4. **Orphaned S3 Objects** - Video files in S3 that have no corresponding submission records

## Prerequisites

Make sure you have:
- AWS credentials configured (same as your development environment)
- Node.js installed
- Access to the DynamoDB tables and S3 bucket

## Usage

### 1. **Dry Run (Recommended First)**

This shows what would be deleted WITHOUT actually deleting anything:

```bash
node scripts/cleanup-orphaned-data.js --dry-run
```

### 2. **Delete Database Orphans Only**

This deletes orphaned database records but leaves S3 files alone:

```bash
node scripts/cleanup-orphaned-data.js
```

### 3. **Delete Everything (Database + S3)**

This deletes ALL orphaned data including S3 video files:

```bash
node scripts/cleanup-orphaned-data.js --delete-s3
```

### 4. **Dry Run with S3 Preview**

Preview what would be deleted including S3 files:

```bash
node scripts/cleanup-orphaned-data.js --dry-run --delete-s3
```

## Safety Features

- **Dry Run Mode** - Always preview changes before executing
- **Batch Processing** - Deletes in batches to avoid API limits
- **Error Handling** - Continues even if some deletions fail
- **Detailed Reporting** - Shows exactly what was scanned, found, and deleted
- **Orphan Detection Logic** - Only deletes data that genuinely has no parent records

## Output Example

```
🧹 Starting orphaned data cleanup...
Mode: DRY RUN (no deletions)
S3 Cleanup: ENABLED

📊 Step 1: Loading data from DynamoDB...
   ✅ Courses: 15
   ✅ Assignments: 89
   ✅ Submissions: 342
   ✅ Peer Responses: 1,234

🔍 Step 2: Finding orphaned assignments...
   Found 3 orphaned assignments
   Examples:
      - assignment_123 (course: course_999 - MISSING)

🔍 Step 3: Finding orphaned submissions...
   Found 47 orphaned submissions
   Examples:
      - submission_456 (assignment: assignment_888 - MISSING)

🔍 Step 4: Finding orphaned peer responses...
   Found 152 orphaned peer responses

🔍 Step 5: Finding orphaned S3 objects...
   Total S3 objects: 350
   Valid S3 keys from submissions: 295
   Found 55 orphaned S3 objects

═══════════════════════════════════════════════════════
📊 CLEANUP REPORT
═══════════════════════════════════════════════════════

Scanned:
   • Courses: 15
   • Assignments: 89
   • Submissions: 342
   • Peer Responses: 1,234
   • S3 Objects: 350

Orphaned Data Found:
   • Assignments: 3
   • Submissions: 47
   • Peer Responses: 152
   • S3 Objects: 55

💰 Estimated Storage Savings:
   • ~550 MB saved
   • ~$0.01/month S3 cost reduction

ℹ️  This was a DRY RUN - no data was deleted.
   Run without --dry-run to actually delete orphaned data.
```

## When to Run This Script

Run this script:
- After deleting courses manually (before the cascading delete fix)
- Periodically as maintenance (monthly or quarterly)
- After data migrations or bulk imports
- If you notice unexpectedly high S3 storage costs

## Performance

- **Database Scans**: ~30-60 seconds for 10,000 records
- **S3 Listing**: ~1-2 minutes for 1,000 objects
- **Deletion**: ~1-5 minutes depending on orphan count
- **Batch Sizes**:
  - DynamoDB: 25 items per batch
  - S3: 1,000 objects per batch

## Warning ⚠️

**Without `--dry-run`, this script will permanently delete data!**

Always run with `--dry-run` first to verify what will be deleted.

## Troubleshooting

### "Access Denied" Errors
- Ensure your AWS credentials have permission to:
  - Scan DynamoDB tables
  - Delete items from DynamoDB
  - List S3 bucket contents
  - Delete S3 objects

### "Rate Limit Exceeded"
- The script uses batching to avoid rate limits
- If you still hit limits, run the script again - it will continue from where it stopped

### Script Reports Errors
- Check the error messages in the output
- The script continues even if some items fail
- Re-run the script to catch any missed items

## Integration with Course Deletion

**Going forward**, the course deletion endpoint (as of commit `90e1fbf`) automatically handles cascading deletion, so you shouldn't accumulate new orphaned data.

This script is primarily for cleaning up **historical orphaned data** from before the cascading delete was implemented.

## Backup Recommendation

Before running the script for the first time, consider:
1. Taking a DynamoDB backup/snapshot
2. Enabling S3 versioning (if not already enabled)
3. Running in `--dry-run` mode multiple times to verify

## Questions?

If you're unsure about running the script:
- Start with `--dry-run` to see what would happen
- Run without `--delete-s3` first to clean database only
- Add `--delete-s3` only after verifying database cleanup worked

---

**Last Updated**: After implementing cascading deletion (commit `90e1fbf`)

