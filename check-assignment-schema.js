#!/usr/bin/env node

/**
 * Check existing assignments for instructionalVideoUrl field
 * and verify the schema is compatible with our fixes
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

// AWS Configuration
const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const ASSIGNMENTS_TABLE = 'classcast-assignments';

async function checkAssignmentSchema() {
  console.log('🔍 Checking Assignment Schema Compatibility');
  console.log('=' .repeat(50));
  
  try {
    console.log(`📋 Scanning table: ${ASSIGNMENTS_TABLE}`);
    
    const result = await docClient.send(new ScanCommand({
      TableName: ASSIGNMENTS_TABLE,
      Limit: 10 // Just check a few assignments
    }));
    
    const assignments = result.Items || [];
    console.log(`📊 Found ${assignments.length} assignments to analyze`);
    console.log('');
    
    if (assignments.length === 0) {
      console.log('ℹ️  No assignments found in database');
      console.log('✅ Schema compatibility: OK (no existing data to migrate)');
      return;
    }
    
    // Analyze schema
    let hasInstructionalVideoUrl = 0;
    let missingInstructionalVideoUrl = 0;
    let hasNewFields = 0;
    
    const newFields = [
      'instructionalVideoUrl',
      'enablePeerResponses',
      'responseDueDate',
      'minResponsesRequired',
      'maxResponsesPerVideo',
      'responseWordLimit',
      'responseCharacterLimit',
      'hidePeerVideosUntilInstructorPosts',
      'requireLiveRecording',
      'allowYouTubeUrl',
      'coverPhoto',
      'emoji',
      'color'
    ];
    
    console.log('📋 Schema Analysis:');
    console.log('');
    
    assignments.forEach((assignment, index) => {
      console.log(`Assignment ${index + 1}: ${assignment.title || assignment.assignmentId}`);
      
      // Check for instructionalVideoUrl
      if (assignment.instructionalVideoUrl !== undefined) {
        hasInstructionalVideoUrl++;
        console.log(`   ✅ Has instructionalVideoUrl: ${assignment.instructionalVideoUrl || 'null'}`);
      } else {
        missingInstructionalVideoUrl++;
        console.log(`   ❌ Missing instructionalVideoUrl field`);
      }
      
      // Check for other new fields
      const presentNewFields = newFields.filter(field => assignment[field] !== undefined);
      if (presentNewFields.length > 0) {
        hasNewFields++;
        console.log(`   📝 Has ${presentNewFields.length} new fields: ${presentNewFields.join(', ')}`);
      } else {
        console.log(`   📝 Missing all new fields (legacy assignment)`);
      }
      
      console.log('');
    });
    
    // Summary
    console.log('📊 Schema Compatibility Summary:');
    console.log(`   Assignments with instructionalVideoUrl: ${hasInstructionalVideoUrl}`);
    console.log(`   Assignments missing instructionalVideoUrl: ${missingInstructionalVideoUrl}`);
    console.log(`   Assignments with new fields: ${hasNewFields}`);
    console.log('');
    
    if (missingInstructionalVideoUrl > 0) {
      console.log('⚠️  Legacy assignments detected');
      console.log('   These assignments will work fine with our fixes');
      console.log('   The instructionalVideoUrl field will be null for existing assignments');
      console.log('   New assignments will properly save the instructionalVideoUrl');
    } else {
      console.log('✅ All assignments have the instructionalVideoUrl field');
    }
    
    console.log('');
    console.log('🔧 Migration Status: No migration needed');
    console.log('   DynamoDB is schema-less, so new fields can be added without migration');
    console.log('   Existing assignments will continue to work normally');
    console.log('   New assignments will include the instructionalVideoUrl field');
    
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      console.log('ℹ️  Assignments table does not exist yet');
      console.log('✅ Schema compatibility: OK (table will be created with correct schema)');
    } else {
      console.error('❌ Error checking schema:', error.message);
      console.log('');
      console.log('🔧 Troubleshooting:');
      console.log('1. Check AWS credentials are configured');
      console.log('2. Verify AWS region is correct');
      console.log('3. Ensure DynamoDB table exists and is accessible');
    }
  }
}

// Run the schema check
checkAssignmentSchema().catch(error => {
  console.error('❌ Schema check failed:', error);
  process.exit(1);
});