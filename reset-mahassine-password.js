#!/usr/bin/env node

/**
 * Reset Mahassine Adam's password to "Test1234!"
 */

const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1'
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const bcrypt = require('bcryptjs');

async function resetMahassinePassword() {
  console.log('🔐 Resetting Mahassine Adam\'s password...\n');

  try {
    // First, find Mahassine Adam in the users table
    console.log('🔍 Searching for Mahassine Adam...');
    
    const searchParams = {
      TableName: 'classcast-users',
      FilterExpression: 'contains(#name, :firstName) AND contains(#name, :lastName)',
      ExpressionAttributeNames: {
        '#name': 'name'
      },
      ExpressionAttributeValues: {
        ':firstName': 'Mahassine',
        ':lastName': 'Adam'
      }
    };

    const searchResult = await dynamodb.scan(searchParams).promise();
    
    if (!searchResult.Items || searchResult.Items.length === 0) {
      console.log('❌ Mahassine Adam not found. Searching by email...');
      
      // Try searching by email patterns
      const emailSearchParams = {
        TableName: 'classcast-users',
        FilterExpression: 'contains(email, :mahassine)',
        ExpressionAttributeValues: {
          ':mahassine': 'mahassine'
        }
      };
      
      const emailResult = await dynamodb.scan(emailSearchParams).promise();
      
      if (!emailResult.Items || emailResult.Items.length === 0) {
        console.log('❌ No user found with name containing "Mahassine"');
        console.log('📋 Let me list all users to help find the correct one...\n');
        
        const allUsersParams = {
          TableName: 'classcast-users'
        };
        
        const allUsers = await dynamodb.scan(allUsersParams).promise();
        
        console.log('👥 All users in the system:');
        allUsers.Items.forEach((user, index) => {
          console.log(`${index + 1}. ${user.name} (${user.email}) - ID: ${user.userId}`);
        });
        
        return;
      }
      
      searchResult.Items = emailResult.Items;
    }

    if (searchResult.Items.length > 1) {
      console.log('⚠️ Multiple users found:');
      searchResult.Items.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - ID: ${user.userId}`);
      });
      console.log('Using the first match...');
    }

    const user = searchResult.Items[0];
    console.log(`✅ Found user: ${user.name} (${user.email})`);
    console.log(`   User ID: ${user.userId}`);

    // Hash the new password
    const newPassword = 'Test1234!';
    console.log('\n🔒 Hashing new password...');
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the user's password
    console.log('💾 Updating password in database...');
    
    const updateParams = {
      TableName: 'classcast-users',
      Key: {
        userId: user.userId
      },
      UpdateExpression: 'SET password = :password, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':password': hashedPassword,
        ':updatedAt': new Date().toISOString()
      }
    };

    await dynamodb.update(updateParams).promise();

    console.log('✅ Password reset successfully!');
    console.log('\n📋 Password Reset Summary:');
    console.log(`   User: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   New Password: ${newPassword}`);
    console.log(`   Reset Time: ${new Date().toISOString()}`);

    // Test the new password by attempting to hash and compare
    console.log('\n🧪 Verifying password reset...');
    const isValid = await bcrypt.compare(newPassword, hashedPassword);
    
    if (isValid) {
      console.log('✅ Password verification successful!');
    } else {
      console.log('❌ Password verification failed!');
    }

    console.log('\n📧 Note: The user can now log in with the new password.');
    console.log('💡 Recommend asking the user to change their password after logging in.');

  } catch (error) {
    console.error('❌ Error resetting password:', error);
    
    if (error.code === 'ResourceNotFoundException') {
      console.log('💡 The users table might not exist or have a different name.');
      console.log('   Try checking the table name in your AWS console.');
    } else if (error.code === 'ValidationException') {
      console.log('💡 There might be an issue with the table structure.');
      console.log('   Check if the userId field exists and is the primary key.');
    }
  }
}

// Run the password reset
resetMahassinePassword();