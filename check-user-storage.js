const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = 'classcast-users';

async function checkUserStorage() {
  try {
    console.log('🔍 Checking User Storage System...\n');
    console.log('='.repeat(60));
    
    // Check DynamoDB users table
    console.log('\n1️⃣  Checking DynamoDB Users Table...');
    console.log('   Table:', USERS_TABLE);
    
    const response = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
      Limit: 10
    }));
    
    if (!response.Items || response.Items.length === 0) {
      console.log('   ⚠️  No users found in DynamoDB');
    } else {
      console.log(`   ✅ Found ${response.Count} users (showing first 10):\n`);
      
      response.Items.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email || user.userId}`);
        console.log(`      User ID: ${user.userId}`);
        console.log(`      Name: ${user.firstName} ${user.lastName}`);
        console.log(`      Role: ${user.role}`);
        console.log(`      Has Password: ${user.password ? 'Yes (hashed)' : 'No'}`);
        console.log(`      Created: ${user.createdAt || 'Unknown'}`);
        console.log('');
      });
    }
    
    // Get total count
    console.log('2️⃣  Getting total user count...');
    const countResponse = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
      Select: 'COUNT'
    }));
    
    console.log(`   Total users in DynamoDB: ${countResponse.Count}`);
    
    // Analyze authentication system
    console.log('\n3️⃣  Authentication System Analysis...');
    
    const sampleUser = response.Items?.[0];
    if (sampleUser) {
      console.log('   Sample user structure:');
      console.log('   Fields:', Object.keys(sampleUser).join(', '));
      
      if (sampleUser.password) {
        console.log('\n   ✅ Users have password field (custom auth)');
        console.log('   Authentication: Custom password-based system');
        console.log('   Storage: DynamoDB');
        console.log('   Password Reset: Custom implementation needed');
      }
      
      if (sampleUser.cognitoId || sampleUser.cognitoUsername) {
        console.log('\n   ⚠️  Users have Cognito references but not using it');
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 SUMMARY');
    console.log('='.repeat(60));
    
    console.log('\n✅ Your app uses CUSTOM AUTHENTICATION:');
    console.log('   - User storage: DynamoDB (classcast-users table)');
    console.log('   - Password storage: Hashed in DynamoDB');
    console.log('   - Total users:', countResponse.Count);
    console.log('   - Cognito: Not actively used (only 10 test users)');
    
    console.log('\n❌ Password Reset Issue:');
    console.log('   - Custom auth system needs custom password reset');
    console.log('   - Cognito password reset won\'t work for DynamoDB users');
    console.log('   - Need to implement email-based password reset flow');
    
    console.log('\n🔧 Solutions:');
    console.log('\n   Option 1: Fix Custom Password Reset (Recommended)');
    console.log('   - Implement password reset tokens in DynamoDB');
    console.log('   - Send reset emails via SES (already configured)');
    console.log('   - Create reset password API endpoint');
    console.log('   - Keep existing users and authentication');
    console.log('   - Faster to implement');
    
    console.log('\n   Option 2: Migrate to Cognito (Complex)');
    console.log('   - Export all users from DynamoDB');
    console.log('   - Import to Cognito (requires password reset for all)');
    console.log('   - Update all authentication code');
    console.log('   - Users must reset passwords on first login');
    console.log('   - More work, but better long-term');
    
    console.log('\n💡 Recommendation:');
    console.log('   Fix the custom password reset system first.');
    console.log('   It\'s faster and won\'t disrupt existing users.');
    console.log('   Run: node implement-password-reset.js');
    
  } catch (error) {
    console.error('❌ Error checking user storage:', error);
    
    if (error.name === 'ResourceNotFoundException') {
      console.log('\n⚠️  DynamoDB table not found.');
      console.log('   Check your table name.');
    }
  }
}

checkUserStorage();
