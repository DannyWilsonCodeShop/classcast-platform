#!/usr/bin/env node

/**
 * Fix Video Upload Size Limit Issue
 * 
 * Problem: Students can't upload videos under 1GB because assignments 
 * are created with a 100MB maxFileSize limit, but the upload system 
 * supports up to 2GB.
 * 
 * Solution: Update assignment maxFileSize limits to 2GB (2147483648 bytes)
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({
  region: process.env.REGION || process.env.AWS_REGION || 'us-east-1',
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const NEW_MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB in bytes
const OLD_MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB in bytes

async function fixVideoUploadSizeLimit() {
  console.log('🔧 Starting video upload size limit fix...');
  console.log(`📊 Will update assignments from ${OLD_MAX_FILE_SIZE / (1024 * 1024)}MB to ${NEW_MAX_FILE_SIZE / (1024 * 1024 * 1024)}GB`);

  try {
    // 1. Scan all assignments to find those with small maxFileSize limits
    console.log('📋 Scanning assignments table...');
    
    const scanCommand = new ScanCommand({
      TableName: 'classcast-assignments',
      FilterExpression: 'attribute_exists(maxFileSize) AND maxFileSize <= :oldLimit',
      ExpressionAttributeValues: {
        ':oldLimit': OLD_MAX_FILE_SIZE
      }
    });

    const result = await docClient.send(scanCommand);
    const assignments = result.Items || [];
    
    console.log(`📊 Found ${assignments.length} assignments with small file size limits`);

    if (assignments.length === 0) {
      console.log('✅ No assignments need updating');
      return;
    }

    // 2. Update each assignment's maxFileSize
    let updated = 0;
    let errors = 0;

    for (const assignment of assignments) {
      try {
        const currentSize = assignment.maxFileSize || 0;
        const currentSizeMB = (currentSize / (1024 * 1024)).toFixed(1);
        
        console.log(`📝 Updating assignment "${assignment.title}" (${assignment.assignmentId})`);
        console.log(`   Current limit: ${currentSizeMB}MB → New limit: 2GB`);

        const updateCommand = new UpdateCommand({
          TableName: 'classcast-assignments',
          Key: { assignmentId: assignment.assignmentId },
          UpdateExpression: 'SET maxFileSize = :newSize, updatedAt = :updatedAt',
          ExpressionAttributeValues: {
            ':newSize': NEW_MAX_FILE_SIZE,
            ':updatedAt': new Date().toISOString()
          }
        });

        await docClient.send(updateCommand);
        updated++;
        console.log(`   ✅ Updated successfully`);

      } catch (error) {
        console.error(`   ❌ Failed to update assignment ${assignment.assignmentId}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Update Summary:');
    console.log(`✅ Successfully updated: ${updated} assignments`);
    console.log(`❌ Failed to update: ${errors} assignments`);
    console.log(`📈 New file size limit: ${NEW_MAX_FILE_SIZE / (1024 * 1024 * 1024)}GB`);

    // 3. Also update the Lambda function's validation schema
    console.log('\n🔧 Next steps to complete the fix:');
    console.log('1. Update the assignment creation Lambda function to allow larger file sizes');
    console.log('2. Update the frontend validation to match the new limits');
    console.log('3. Test video uploads with files between 100MB and 2GB');

  } catch (error) {
    console.error('❌ Error fixing video upload size limit:', error);
    throw error;
  }
}

// Also create a function to check current assignment limits
async function checkCurrentLimits() {
  console.log('🔍 Checking current assignment file size limits...');
  
  try {
    const scanCommand = new ScanCommand({
      TableName: 'classcast-assignments',
      ProjectionExpression: 'assignmentId, title, maxFileSize, createdAt'
    });

    const result = await docClient.send(scanCommand);
    const assignments = result.Items || [];
    
    console.log(`📊 Found ${assignments.length} total assignments`);
    
    // Group by file size limits
    const sizeGroups = {};
    assignments.forEach(assignment => {
      const size = assignment.maxFileSize || 0;
      const sizeMB = Math.round(size / (1024 * 1024));
      const key = sizeMB === 0 ? 'No limit set' : `${sizeMB}MB`;
      
      if (!sizeGroups[key]) {
        sizeGroups[key] = [];
      }
      sizeGroups[key].push(assignment);
    });

    console.log('\n📊 File size limit distribution:');
    Object.entries(sizeGroups).forEach(([limit, assignments]) => {
      console.log(`${limit}: ${assignments.length} assignments`);
      
      // Show a few examples
      if (assignments.length > 0) {
        const examples = assignments.slice(0, 3).map(a => `"${a.title}"`).join(', ');
        console.log(`   Examples: ${examples}${assignments.length > 3 ? ` (+${assignments.length - 3} more)` : ''}`);
      }
    });

  } catch (error) {
    console.error('❌ Error checking current limits:', error);
  }
}

// Main execution
async function main() {
  const command = process.argv[2];
  
  if (command === 'check') {
    await checkCurrentLimits();
  } else if (command === 'fix') {
    await fixVideoUploadSizeLimit();
  } else {
    console.log('📋 Video Upload Size Limit Fixer');
    console.log('');
    console.log('Usage:');
    console.log('  node fix-video-upload-size-limit.js check  # Check current limits');
    console.log('  node fix-video-upload-size-limit.js fix    # Fix the limits');
    console.log('');
    console.log('Problem: Students can\'t upload videos because assignments have 100MB limits');
    console.log('Solution: Update assignment maxFileSize to 2GB to match upload system capability');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { fixVideoUploadSizeLimit, checkCurrentLimits };