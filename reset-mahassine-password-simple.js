#!/usr/bin/env node

/**
 * Simple password reset for Mahassine Adam using API endpoint
 */

const bcrypt = require('bcryptjs');

async function resetPasswordViaAPI() {
  console.log('🔐 Resetting Mahassine Adam\'s password via API...\n');

  try {
    // First, let's create a direct password hash for manual update
    const newPassword = 'Test1234!';
    console.log('🔒 Generating password hash...');
    
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    console.log('✅ Password hash generated successfully');
    console.log('\n📋 Manual Password Reset Instructions:');
    console.log('=====================================');
    console.log(`New Password: ${newPassword}`);
    console.log(`Password Hash: ${hashedPassword}`);
    
    console.log('\n🔧 To manually update in database:');
    console.log('1. Access your AWS DynamoDB console');
    console.log('2. Open the "classcast-users" table');
    console.log('3. Find the user "Mahassine Adam" (search by name or email)');
    console.log('4. Edit the user record');
    console.log('5. Update the "password" field with the hash above');
    console.log('6. Save the changes');
    
    console.log('\n📧 Alternative - Reset via API:');
    console.log('1. Go to your ClassCast app');
    console.log('2. Use the "Forgot Password" feature');
    console.log('3. Enter Mahassine\'s email address');
    console.log('4. Check if the reset email is sent');
    
    // Test the password hash
    console.log('\n🧪 Verifying password hash...');
    const isValid = await bcrypt.compare(newPassword, hashedPassword);
    
    if (isValid) {
      console.log('✅ Password hash verification successful!');
    } else {
      console.log('❌ Password hash verification failed!');
    }

    // Try to make API call to reset password
    console.log('\n🌐 Attempting API-based password reset...');
    
    const resetData = {
      email: 'mahassine.adam@example.com', // Update with actual email
      newPassword: newPassword
    };

    console.log('💡 If you know Mahassine\'s exact email, you can try:');
    console.log(`   POST /api/auth/reset-password`);
    console.log(`   Body: ${JSON.stringify(resetData, null, 2)}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Also create a function to find the user first
async function findMahassineUser() {
  console.log('\n🔍 Finding Mahassine Adam\'s User Information');
  console.log('===========================================\n');
  
  console.log('To find Mahassine Adam in your system:');
  console.log('1. Check your user management interface');
  console.log('2. Search for users with name containing "Mahassine"');
  console.log('3. Look for variations like:');
  console.log('   - Mahassine Adam');
  console.log('   - mahassine.adam@...');
  console.log('   - Mahassine A.');
  console.log('   - Any email with "mahassine"');
  
  console.log('\n📧 Common email patterns to check:');
  const emailPatterns = [
    'mahassine.adam@gmail.com',
    'mahassine.adam@student.edu',
    'mahassine@gmail.com',
    'adam.mahassine@gmail.com',
    'mahassineadam@gmail.com'
  ];
  
  emailPatterns.forEach((email, index) => {
    console.log(`   ${index + 1}. ${email}`);
  });
}

async function createPasswordResetEndpoint() {
  console.log('\n🔧 Creating Password Reset API Endpoint');
  console.log('======================================\n');

  const resetPasswordAPI = `
import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import AWS from 'aws-sdk';

// Configure AWS (if available)
const dynamodb = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, newPassword, adminReset = false } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required' });
  }

  try {
    console.log('🔍 Looking up user:', email);

    // Find user by email
    const userParams = {
      TableName: 'classcast-users',
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email.toLowerCase()
      }
    };

    const userResult = await dynamodb.scan(userParams).promise();

    if (!userResult.Items || userResult.Items.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.Items[0];
    console.log('✅ User found:', user.name);

    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user's password
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

    console.log('✅ Password updated successfully');

    return res.status(200).json({
      message: 'Password reset successfully',
      user: {
        name: user.name,
        email: user.email,
        userId: user.userId
      }
    });

  } catch (error) {
    console.error('❌ Password reset error:', error);
    
    return res.status(500).json({
      error: 'Failed to reset password',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
`;

  // Save the API endpoint
  const fs = require('fs');
  const path = require('path');
  
  const apiDir = 'src/pages/api/auth';
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(apiDir, 'admin-reset-password.ts'), resetPasswordAPI);
  console.log('✅ Created admin password reset API: src/pages/api/auth/admin-reset-password.ts');
  
  console.log('\n📋 To use this API:');
  console.log('POST /api/auth/admin-reset-password');
  console.log('Body: {');
  console.log('  "email": "mahassine.adam@example.com",');
  console.log('  "newPassword": "Test1234!",');
  console.log('  "adminReset": true');
  console.log('}');
}

// Main execution
async function main() {
  await resetPasswordViaAPI();
  await findMahassineUser();
  await createPasswordResetEndpoint();
  
  console.log('\n🎯 Summary:');
  console.log('1. ✅ Generated password hash for "Test1234!"');
  console.log('2. ✅ Created admin password reset API');
  console.log('3. 📋 Provided manual database update instructions');
  console.log('4. 🔍 Provided user search guidance');
  
  console.log('\n📞 Next Steps:');
  console.log('1. Find Mahassine Adam\'s exact email address');
  console.log('2. Use the admin API to reset the password');
  console.log('3. Or manually update the database with the provided hash');
  console.log('4. Test the login with the new password');
}

main();