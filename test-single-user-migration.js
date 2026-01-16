#!/usr/bin/env node

/**
 * Test Migration for a Single User
 * 
 * This script tests the migration process with a single user before running
 * the full migration. Use this to verify everything works correctly.
 * 
 * Usage:
 *   node test-single-user-migration.js user@example.com
 */

const { CognitoIdentityProviderClient, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const cognito = new CognitoIdentityProviderClient({ region: 'us-east-1' });
const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USER_POOL_ID = 'us-east-1_uK50qBrap';
const USERS_TABLE = 'classcast-users';

// Get email from command line
const testEmail = process.argv[2];

if (!testEmail) {
  console.error('❌ Please provide an email address');
  console.error('Usage: node test-single-user-migration.js user@example.com');
  process.exit(1);
}

async function testMigration() {
  try {
    console.log(`\n🧪 Testing Migration for: ${testEmail}\n`);
    
    // Step 1: Find user in Cognito
    console.log('Step 1: Looking up user in Cognito...');
    const cognitoResponse = await cognito.send(new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Filter: `email = "${testEmail}"`
    }));
    
    if (!cognitoResponse.Users || cognitoResponse.Users.length === 0) {
      console.error(`❌ User not found in Cognito: ${testEmail}`);
      process.exit(1);
    }
    
    const cognitoUser = cognitoResponse.Users[0];
    console.log('✅ Found user in Cognito');
    
    // Extract attributes
    const attributes = cognitoUser.Attributes || [];
    const getAttribute = (name) => attributes.find(attr => attr.Name === name)?.Value || '';
    
    const userData = {
      sub: getAttribute('sub'),
      email: getAttribute('email'),
      emailVerified: getAttribute('email_verified') === 'true',
      givenName: getAttribute('given_name'),
      familyName: getAttribute('family_name'),
      role: getAttribute('custom:role') || 'student',
      studentId: getAttribute('custom:student_id'),
      instructorId: getAttribute('custom:instructor_id'),
      department: getAttribute('custom:department'),
    };
    
    console.log('\nUser Data from Cognito:');
    console.log(`  Email: ${userData.email}`);
    console.log(`  Name: ${userData.givenName} ${userData.familyName}`);
    console.log(`  Role: ${userData.role}`);
    console.log(`  Email Verified: ${userData.emailVerified}`);
    console.log(`  Cognito Sub: ${userData.sub}`);
    if (userData.studentId) console.log(`  Student ID: ${userData.studentId}`);
    if (userData.instructorId) console.log(`  Instructor ID: ${userData.instructorId}`);
    if (userData.department) console.log(`  Department: ${userData.department}`);
    
    // Step 2: Check if user already exists in DynamoDB
    console.log('\nStep 2: Checking if user exists in DynamoDB...');
    const existingUserResult = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': userData.email
      }
    }));
    
    if (existingUserResult.Items && existingUserResult.Items.length > 0) {
      console.log('⚠️  User already exists in DynamoDB');
      const existingUser = existingUserResult.Items[0];
      console.log(`  User ID: ${existingUser.userId}`);
      console.log(`  Password Migrated: ${existingUser.passwordMigrated || false}`);
      console.log(`  Migration Date: ${existingUser.migrationDate || 'N/A'}`);
      console.log('\n✅ Test complete - user already migrated');
      return;
    }
    
    console.log('✅ User does not exist in DynamoDB - ready to migrate');
    
    // Step 3: Create user in DynamoDB (test mode - ask for confirmation)
    console.log('\nStep 3: Ready to create user in DynamoDB');
    console.log('\n⚠️  This is a TEST. The user will be created in DynamoDB.');
    console.log('⚠️  The user will NOT have a password yet (lazy migration).');
    console.log('⚠️  Password will be migrated when user logs in.');
    
    // Generate user ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newUserData = {
      userId,
      email: userData.email,
      firstName: userData.givenName || '',
      lastName: userData.familyName || '',
      role: userData.role,
      emailVerified: userData.emailVerified,
      createdAt: cognitoUser.UserCreateDate?.toISOString() || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      
      // Migration metadata
      migratedFromCognito: true,
      cognitoSub: userData.sub,
      migrationDate: new Date().toISOString(),
      migrationStrategy: 'test',
      passwordMigrated: false,
      
      // Role-specific fields
      ...(userData.role === 'student' && userData.studentId && { studentId: userData.studentId }),
      ...(userData.role === 'instructor' && {
        department: userData.department || '',
        instructorCode: userData.instructorId || `INS-${Date.now()}`
      }),
    };
    
    console.log('\nUser data to be created:');
    console.log(JSON.stringify(newUserData, null, 2));
    
    // Ask for confirmation
    console.log('\n❓ Do you want to proceed with creating this user? (yes/no)');
    
    // Wait for user input
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('', async (answer) => {
      if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
        try {
          await docClient.send(new PutCommand({
            TableName: USERS_TABLE,
            Item: newUserData
          }));
          
          console.log('\n✅ User created successfully in DynamoDB!');
          console.log(`   User ID: ${userId}`);
          console.log('\n📝 Next Steps:');
          console.log('   1. Try logging in with this user');
          console.log('   2. The password will be migrated from Cognito automatically');
          console.log('   3. Check migration status: node check-migration-status.js');
          console.log('\n✅ Test migration complete!');
        } catch (error) {
          console.error('\n❌ Error creating user:', error.message);
        }
      } else {
        console.log('\n❌ Migration cancelled');
      }
      
      readline.close();
    });
    
  } catch (error) {
    console.error('\n❌ Test migration failed:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

testMigration();
