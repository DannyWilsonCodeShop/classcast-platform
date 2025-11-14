const { CognitoIdentityProviderClient, AdminSetUserPasswordCommand } = require('@aws-sdk/client-cognito-identity-provider');

const client = new CognitoIdentityProviderClient({ region: 'us-east-1' });

const USER_POOL_ID = 'us-east-1_uK50qBrap'; // ClassCast Production User Pool
const USERNAME = 'kromero28@cristoreyatlanta.org';
const NEW_PASSWORD = 'Test1234!';

async function resetPassword() {
  try {
    console.log(`🔐 Resetting password for: ${USERNAME}`);
    console.log(`📝 New password: ${NEW_PASSWORD}`);
    
    const command = new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: USERNAME,
      Password: NEW_PASSWORD,
      Permanent: true
    });

    const response = await client.send(command);
    
    console.log('✅ Password reset successful!');
    console.log('📧 User:', USERNAME);
    console.log('🔑 New password:', NEW_PASSWORD);
    console.log('\n⚠️ Please inform the user to change their password after first login.');
    
    return response;
  } catch (error) {
    console.error('❌ Error resetting password:');
    console.error('Error code:', error.name);
    console.error('Error message:', error.message);
    
    if (error.name === 'UserNotFoundException') {
      console.error('\n💡 User not found. Please verify the email address is correct.');
    } else if (error.name === 'InvalidPasswordException') {
      console.error('\n💡 Password does not meet requirements. Must be at least 8 characters with uppercase, lowercase, number, and special character.');
    }
    
    throw error;
  }
}

// Check if User Pool ID is set
if (USER_POOL_ID === 'us-east-1_example') {
  console.error('❌ Error: Please set the correct USER_POOL_ID in the script');
  console.log('\n💡 You can find your User Pool ID by running:');
  console.log('   aws cognito-idp list-user-pools --max-results 10');
  process.exit(1);
}

resetPassword()
  .then(() => {
    console.log('\n✅ Password reset completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Password reset failed');
    process.exit(1);
  });

