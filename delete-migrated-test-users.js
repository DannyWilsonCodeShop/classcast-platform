#!/usr/bin/env node

/**
 * Delete Migrated Test Users
 * 
 * This script deletes the 11 test users that were migrated from Cognito.
 * These are all @example.com test accounts.
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USERS_TABLE = 'classcast-users';

// The 11 test users to delete
const testUsersToDelete = [
  'testuser9@example.com',
  'testuser7@example.com',
  'testuser3@example.com',
  'testuser10@example.com',
  'testuser14@example.com',
  'test2@example.com',
  'testuser8@example.com',
  'newuser@example.com',
  'testuser4@example.com',
  'testuser5@example.com',
  'test@example.com'
];

async function deleteTestUsers() {
  try {
    console.log('\n🗑️  Deleting Migrated Test Users\n');
    console.log('='.repeat(60));
    
    // First, find all migrated users
    console.log('\n📥 Finding migrated test users in DynamoDB...');
    const scanResult = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: 'attribute_exists(migratedFromCognito) AND migratedFromCognito = :true',
      ExpressionAttributeValues: {
        ':true': true
      }
    }));
    
    const migratedUsers = scanResult.Items || [];
    console.log(`✅ Found ${migratedUsers.length} migrated users\n`);
    
    // Filter to only test users
    const testUsers = migratedUsers.filter(user => 
      testUsersToDelete.includes(user.email?.toLowerCase())
    );
    
    console.log(`🎯 Found ${testUsers.length} test users to delete:\n`);
    testUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.userId})`);
    });
    
    if (testUsers.length === 0) {
      console.log('\n✅ No test users found to delete.');
      return;
    }
    
    console.log('\n⚠️  WARNING: This will permanently delete these users!');
    console.log('⚠️  This action cannot be undone.\n');
    
    // Ask for confirmation
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('Type "DELETE" to confirm deletion: ', async (answer) => {
      if (answer === 'DELETE') {
        console.log('\n🗑️  Deleting users...\n');
        
        let deleted = 0;
        let errors = 0;
        
        for (const user of testUsers) {
          try {
            await docClient.send(new DeleteCommand({
              TableName: USERS_TABLE,
              Key: {
                userId: user.userId
              }
            }));
            
            console.log(`✅ Deleted: ${user.email}`);
            deleted++;
            
            // Small delay to avoid throttling
            await new Promise(resolve => setTimeout(resolve, 100));
            
          } catch (error) {
            console.error(`❌ Failed to delete ${user.email}:`, error.message);
            errors++;
          }
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 DELETION SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Successfully deleted: ${deleted}`);
        console.log(`❌ Errors: ${errors}`);
        console.log('='.repeat(60));
        
        if (deleted > 0) {
          console.log('\n✅ Test users deleted successfully!');
          console.log('\n📝 Next steps:');
          console.log('   1. Run: node check-migration-status.js');
          console.log('   2. Verify migrated user count is now 0');
        }
        
      } else {
        console.log('\n❌ Deletion cancelled. No users were deleted.');
      }
      
      readline.close();
    });
    
  } catch (error) {
    console.error('\n❌ Error deleting test users:', error);
    console.error('Error details:', error.message);
  }
}

deleteTestUsers();
