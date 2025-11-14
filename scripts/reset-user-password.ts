import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcryptjs';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = 'classcast-users';

async function resetPassword(email: string, newPassword: string) {
  try {
    console.log(`🔍 Looking for user with email: ${email}`);
    
    // Find user by email
    const scanResult = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email
      }
    }));

    if (!scanResult.Items || scanResult.Items.length === 0) {
      console.error('❌ User not found with email:', email);
      return;
    }

    const user = scanResult.Items[0];
    console.log(`✅ Found user: ${user.firstName} ${user.lastName} (${user.userId})`);

    // Hash the new password
    console.log('🔐 Hashing new password...');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

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

    console.log('✅ Password reset successfully!');
    console.log(`📧 User: ${email}`);
    console.log(`🔑 New password: ${newPassword}`);
    console.log('\n⚠️  Please inform the user to change their password after logging in.');

  } catch (error) {
    console.error('❌ Error resetting password:', error);
    throw error;
  }
}

// Run the script
const email = 'aatiku28@cristoreyatlanta.org';
const newPassword = 'Test1234!';

resetPassword(email, newPassword)
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
