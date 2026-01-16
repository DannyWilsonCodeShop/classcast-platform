#!/usr/bin/env node

/**
 * Check Cognito to JWT Migration Status
 * 
 * This script checks the progress of user migration from Cognito to JWT.
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { CognitoIdentityProviderClient, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const cognito = new CognitoIdentityProviderClient({ region: 'us-east-1' });

const USERS_TABLE = 'classcast-users';
const USER_POOL_ID = 'us-east-1_uK50qBrap';

async function checkMigrationStatus() {
  try {
    console.log('\n🔍 Checking Migration Status...\n');
    
    // Get all users from DynamoDB
    const dynamoResult = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE
    }));
    
    const allUsers = dynamoResult.Items || [];
    const migratedUsers = allUsers.filter(u => u.migratedFromCognito);
    const passwordMigratedUsers = migratedUsers.filter(u => u.passwordMigrated);
    const pendingPasswordUsers = migratedUsers.filter(u => !u.passwordMigrated);
    const nativeUsers = allUsers.filter(u => !u.migratedFromCognito);
    
    // Get Cognito user count
    let cognitoUserCount = 0;
    try {
      const cognitoResult = await cognito.send(new ListUsersCommand({
        UserPoolId: USER_POOL_ID,
        Limit: 1
      }));
      // Note: This is just an estimate. For exact count, would need to paginate through all users
      console.log('⚠️  Cognito user count is approximate (pagination not implemented)');
    } catch (error) {
      console.log('⚠️  Could not fetch Cognito user count:', error.message);
    }
    
    // Print summary
    console.log('=' .repeat(60));
    console.log('📊 MIGRATION STATUS SUMMARY');
    console.log('='.repeat(60));
    console.log('');
    
    console.log('DynamoDB Users:');
    console.log(`  Total users: ${allUsers.length}`);
    console.log(`  Native JWT users: ${nativeUsers.length}`);
    console.log(`  Migrated from Cognito: ${migratedUsers.length}`);
    console.log('');
    
    if (migratedUsers.length > 0) {
      console.log('Migration Progress:');
      console.log(`  ✅ Metadata migrated: ${migratedUsers.length}`);
      console.log(`  ✅ Passwords migrated: ${passwordMigratedUsers.length} (${(passwordMigratedUsers.length / migratedUsers.length * 100).toFixed(1)}%)`);
      console.log(`  ⏳ Pending password migration: ${pendingPasswordUsers.length} (${(pendingPasswordUsers.length / migratedUsers.length * 100).toFixed(1)}%)`);
      console.log('');
      
      // Migration strategy breakdown
      const strategies = {
        lazy: migratedUsers.filter(u => u.migrationStrategy === 'lazy').length,
        force_reset: migratedUsers.filter(u => u.migrationStrategy === 'force_reset').length,
        hybrid: migratedUsers.filter(u => u.migrationStrategy === 'hybrid').length,
      };
      
      console.log('Migration Strategies:');
      if (strategies.lazy > 0) console.log(`  Lazy: ${strategies.lazy} users`);
      if (strategies.force_reset > 0) console.log(`  Force Reset: ${strategies.force_reset} users`);
      if (strategies.hybrid > 0) console.log(`  Hybrid: ${strategies.hybrid} users`);
      console.log('');
      
      // Recent migrations
      const recentMigrations = passwordMigratedUsers
        .filter(u => u.passwordMigrationDate)
        .sort((a, b) => new Date(b.passwordMigrationDate) - new Date(a.passwordMigrationDate))
        .slice(0, 5);
      
      if (recentMigrations.length > 0) {
        console.log('Recent Password Migrations:');
        recentMigrations.forEach((user, index) => {
          const date = new Date(user.passwordMigrationDate);
          const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
          console.log(`  ${index + 1}. ${user.email} - ${daysAgo} day(s) ago`);
        });
        console.log('');
      }
      
      // Users pending migration
      if (pendingPasswordUsers.length > 0 && pendingPasswordUsers.length <= 10) {
        console.log('Users Pending Password Migration:');
        pendingPasswordUsers.forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.email} (${user.role})`);
        });
        console.log('');
      } else if (pendingPasswordUsers.length > 10) {
        console.log(`Users Pending Password Migration: ${pendingPasswordUsers.length} users`);
        console.log('(Too many to list - showing first 10)');
        pendingPasswordUsers.slice(0, 10).forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.email} (${user.role})`);
        });
        console.log('');
      }
    } else {
      console.log('⚠️  No migrated users found.');
      console.log('');
      console.log('To start migration, run:');
      console.log('  node migrate-cognito-to-jwt.js --strategy=lazy');
      console.log('');
    }
    
    console.log('='.repeat(60));
    
    // Recommendations
    if (migratedUsers.length > 0) {
      const migrationRate = passwordMigratedUsers.length / migratedUsers.length;
      
      console.log('\n💡 RECOMMENDATIONS:\n');
      
      if (migrationRate === 1) {
        console.log('✅ All users have been fully migrated!');
        console.log('   You can now safely disable Cognito authentication.');
      } else if (migrationRate > 0.8) {
        console.log('✅ Migration is nearly complete (>80%)');
        console.log('   Consider sending reminder emails to remaining users.');
      } else if (migrationRate > 0.5) {
        console.log('⏳ Migration is progressing well (>50%)');
        console.log('   Continue monitoring. Most active users have migrated.');
      } else if (migrationRate > 0.2) {
        console.log('⏳ Migration is in progress (>20%)');
        console.log('   Give it more time for users to log in naturally.');
      } else {
        console.log('⚠️  Migration has just started (<20%)');
        console.log('   This is normal for lazy migration. Be patient.');
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.error('\n❌ Error checking migration status:', error);
    console.error('Error details:', error.message);
  }
}

checkMigrationStatus();
