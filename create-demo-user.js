#!/usr/bin/env node

/**
 * Script to create a demo user in DynamoDB that can view dwilson1919@gmail.com's data
 * Usage: node create-demo-user.js
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize DynamoDB client
const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = 'classcast-users';

async function createDemoUser() {
  console.log('🎭 Creating demo user...');

  const demoUser = {
    userId: 'demo@email.com',
    email: 'demo@email.com',
    firstName: 'Demo',
    lastName: 'User',
    role: 'student',
    avatar: '/api/placeholder/40/40',
    bio: 'Demo account - Read-only access to view platform features',
    careerGoals: 'Exploring the ClassCast platform',
    classOf: '2024',
    funFact: 'I am a demo user showcasing the platform!',
    favoriteSubject: 'All subjects',
    hobbies: 'Exploring educational technology',
    schoolName: 'Demo University',
    emailVerified: true,
    isDemoUser: true,
    demoViewingUserId: 'dwilson1919@gmail.com',
    status: 'active',
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // Additional demo-specific fields
    isReadOnly: true,
    demoDescription: 'This is a demonstration account that provides read-only access to view another user\'s data and platform features.',
    demoTargetUserEmail: 'dwilson1919@gmail.com'
  };

  try {
    // Check if demo user already exists
    const existingUser = await docClient.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId: demoUser.userId }
    }));

    if (existingUser.Item) {
      console.log('⚠️  Demo user already exists. Updating...');
    } else {
      console.log('✨ Creating new demo user...');
    }

    // Create or update the demo user
    await docClient.send(new PutCommand({
      TableName: USERS_TABLE,
      Item: demoUser
    }));

    console.log('✅ Demo user created successfully!');
    console.log('');
    console.log('📋 Demo User Details:');
    console.log('   Email: demo@email.com');
    console.log('   Password: Demo1234!');
    console.log('   Target User: dwilson1919@gmail.com');
    console.log('   Access: Read-only');
    console.log('');
    console.log('🎯 The demo user can now:');
    console.log('   • View all of dwilson1919@gmail.com\'s data');
    console.log('   • Browse assignments, submissions, and feed');
    console.log('   • Navigate all pages in read-only mode');
    console.log('   • Cannot create, edit, or delete anything');
    console.log('');
    console.log('🚀 Ready to demo!');

  } catch (error) {
    console.error('❌ Error creating demo user:', error);
    
    if (error.name === 'ResourceNotFoundException') {
      console.log('');
      console.log('💡 The users table doesn\'t exist yet. This is normal if:');
      console.log('   • The database hasn\'t been set up');
      console.log('   • You\'re running in development mode');
      console.log('');
      console.log('The demo user credentials are already configured in the login system.');
      console.log('You can still log in with: demo@email.com / Demo1234!');
    }
    
    process.exit(1);
  }
}

async function verifyTargetUser() {
  console.log('🔍 Checking if target user exists...');
  
  try {
    const targetUser = await docClient.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId: 'dwilson1919@gmail.com' }
    }));

    if (targetUser.Item) {
      console.log('✅ Target user found:', targetUser.Item.firstName, targetUser.Item.lastName);
      console.log('   Role:', targetUser.Item.role);
      console.log('   Email:', targetUser.Item.email);
    } else {
      console.log('⚠️  Target user (dwilson1919@gmail.com) not found in database');
      console.log('   The demo will still work, but may show limited data');
    }
    console.log('');
  } catch (error) {
    console.log('⚠️  Could not verify target user:', error.message);
    console.log('');
  }
}

// Main execution
async function main() {
  console.log('🎭 ClassCast Demo User Setup');
  console.log('============================');
  console.log('');

  await verifyTargetUser();
  await createDemoUser();
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { createDemoUser, verifyTargetUser };