#!/usr/bin/env node

/**
 * Reset Ayman Ando's password to Test1234!
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const bcrypt = require('bcryptjs');

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USERS_TABLE = 'classcast-users';
const NEW_PASSWORD = 'Test1234!';

async function resetPassword() {
  try {
    console.log('\n🔐 Resetting Ayman Ando\'s Password\n');
    
    // Find Ayman Ando
    console.log('🔍 Searching for Ayman Ando...');
    const result = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: 'contains(#firstName, :firstName) AND contains(#lastName, :lastName)',
      ExpressionAttributeNames: {
        '#firstName': 'firstName',
        '#lastName': 'lastName'
      },
      ExpressionAttributeValues: {
        ':firstName': 'Ayman',
        ':lastName': 'Ando'
      }
    }));
    
    if (!result.Items || result.Items.length === 0) {
      console.error('❌ User not found: Ayman Ando');
      console.log('\n🔍 Searching with different variations...');
      
      // Try searching by email pattern
      const emailResult = await docClient.send(new ScanCommand({
        TableName: USERS_TABLE,
        FilterExpression: 'contains(#email, :pattern)',
        ExpressionAttributeNames: {
          '#email': 'email'
        },
        ExpressionAttributeValues: {
          ':pattern': 'aando'
        }
      }));
      
      if (emailResult.Items && emailResult.Items.length > 0) {
        console.log('\n📧 Found users with "aando" in email:');
        emailResult.Items.forEach(user => {
          console.log(`   - ${user.firstName} ${user.lastName} (${user.email})`);
        });
        
        // Use the first match
        const user = emailResult.Items[0];
        await updatePassword(user);
      } else {
        console.log('\n❌ No users found matching "Ayman Ando" or "aando"');
        
        // List all users for reference
        console.log('\n📋 Listing all users to help find the correct one:');
        const allUsers = await docClient.send(new ScanCommand({
          TableName: USERS_TABLE
        }));
        
        if (allUsers.Items) {
          allUsers.Items.forEach(user => {
            console.log(`   - ${user.firstName} ${user.lastName} (${user.email}) - ${user.role}`);
          });
        }
      }
      return;
    }
    
    const user = result.Items[0];
    await updatePassword(user);
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error('Details:', error.message);
  }
}

async function updatePassword(user) {
  console.log(`\n✓ Found user: ${user.firstName} ${user.lastName}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   User ID: ${user.userId}`);
  console.log(`   Role: ${user.role}`);
  
  // Hash the new password
  console.log('\n🔒 Hashing new password...');
  const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);
  
  // Update the user's password
  console.log('💾 Updating password in database...');
  await docClient.send(new UpdateCommand({
    TableName: USERS_TABLE,
    Key: { userId: user.userId },
    UpdateExpression: 'SET password = :password, updatedAt = :updatedAt',
    ExpressionAttributeValues: {
      ':password': hashedPassword,
      ':updatedAt': new Date().toISOString()
    }
  }));
  
  console.log('\n✅ Password reset successfully!');
  console.log('\n📋 Login Credentials:');
  console.log(`   Email: ${user.email}`);
  console.log(`   Password: ${NEW_PASSWORD}`);
  console.log('\n✅ Done!\n');
}

resetPassword();
