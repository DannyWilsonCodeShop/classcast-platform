#!/usr/bin/env node

/**
 * DRY RUN - Preview Cognito to JWT Migration
 * 
 * This script shows what WOULD happen during migration without actually doing it.
 * Use this to verify everything looks correct before running the real migration.
 */

const { CognitoIdentityProviderClient, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const cognito = new CognitoIdentityProviderClient({ region: 'us-east-1' });
const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USER_POOL_ID = 'us-east-1_uK50qBrap';
const USERS_TABLE = 'classcast-users';

async function dryRun() {
  try {
    console.log('\n🔍 DRY RUN - Cognito to JWT Migration Preview\n');
    console.log('This will NOT make any changes. Just showing what would happen.\n');
    console.log('='.repeat(60));
    
    // Fetch Cognito users
    console.log('\n📥 Fetching users from Cognito...');
    const allUsers = [];
    let paginationToken = undefined;
    
    do {
      const response = await cognito.send(new ListUsersCommand({
        UserPoolId: USER_POOL_ID,
        Limit: 60,
        PaginationToken: paginationToken
      }));
      
      if (response.Users) {
        allUsers.push(...response.Users);
      }
      
      paginationToken = response.PaginationToken;
    } while (paginationToken);
    
    console.log(`✅ Found ${allUsers.length} users in Cognito\n`);
    
    if (allUsers.length === 0) {
      console.log('No users to migrate.');
      return;
    }
    
    // Check which users already exist in DynamoDB
    console.log('📥 Checking existing users in DynamoDB...');
    const dynamoResult = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE
    }));
    
    const existingEmails = new Set(
      (dynamoResult.Items || []).map(u => u.email?.toLowerCase())
    );
    
    console.log(`✅ Found ${existingEmails.size} existing users in DynamoDB\n`);
    
    // Analyze migration
    const toMigrate = [];
    const alreadyExists = [];
    
    for (const cognitoUser of allUsers) {
      const attributes = cognitoUser.Attributes || [];
      const email = attributes.find(attr => attr.Name === 'email')?.Value || '';
      const givenName = attributes.find(attr => attr.Name === 'given_name')?.Value || '';
      const familyName = attributes.find(attr => attr.Name === 'family_name')?.Value || '';
      const role = attributes.find(attr => attr.Name === 'custom:role')?.Value || 'student';
      
      if (existingEmails.has(email.toLowerCase())) {
        alreadyExists.push({ email, givenName, familyName, role });
      } else {
        toMigrate.push({ email, givenName, familyName, role });
      }
    }
    
    // Print summary
    console.log('='.repeat(60));
    console.log('📊 MIGRATION PREVIEW');
    console.log('='.repeat(60));
    console.log(`\nTotal Cognito users: ${allUsers.length}`);
    console.log(`Already in DynamoDB: ${alreadyExists.length}`);
    console.log(`Will be migrated: ${toMigrate.length}`);
    
    if (toMigrate.length > 0) {
      console.log('\n✅ Users that WILL BE MIGRATED:');
      toMigrate.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email}`);
        console.log(`      Name: ${user.givenName} ${user.familyName}`);
        console.log(`      Role: ${user.role}`);
        console.log(`      📧 Will receive password reset email`);
        console.log('');
      });
    }
    
    if (alreadyExists.length > 0) {
      console.log('\n⏭️  Users that ALREADY EXIST (will be skipped):');
      alreadyExists.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.role})`);
      });
      console.log('');
    }
    
    console.log('='.repeat(60));
    console.log('\n📝 WHAT WILL HAPPEN:\n');
    console.log(`1. Create ${toMigrate.length} new user records in DynamoDB`);
    console.log(`2. Send ${toMigrate.length} password reset emails`);
    console.log('3. Users must reset password to access their accounts');
    console.log('4. After migration, you can disable Cognito authentication');
    
    console.log('\n⚠️  IMPORTANT NOTES:\n');
    console.log('• Passwords CANNOT be migrated from Cognito (AWS security)');
    console.log('• Users MUST reset their passwords to log in');
    console.log('• Password reset emails will be sent from: noreply@myclasscast.com');
    console.log('• If email fails, users can use "Forgot Password" on login page');
    
    console.log('\n✅ TO RUN THE ACTUAL MIGRATION:\n');
    console.log('   node migrate-cognito-to-jwt.js --strategy=force_reset');
    console.log('\n');
    
  } catch (error) {
    console.error('\n❌ Dry run failed:', error);
    console.error('Error details:', error.message);
  }
}

dryRun();
