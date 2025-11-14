const { CognitoIdentityProviderClient, ForgotPasswordCommand } = require('@aws-sdk/client-cognito-identity-provider');

// Initialize Cognito client
const cognitoClient = new CognitoIdentityProviderClient({
  region: 'us-east-1',
});

const USER_POOL_CLIENT_ID = '7tbaq74itv3gdda1bt25iqafvh';

async function testForgotPassword(email) {
  try {
    console.log(`Testing forgot password for: ${email}`);
    
    const command = new ForgotPasswordCommand({
      ClientId: USER_POOL_CLIENT_ID,
      Username: email,
    });

    const result = await cognitoClient.send(command);
    console.log('✅ Forgot password request successful!');
    console.log('Result:', JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error('❌ Forgot password request failed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.$metadata?.httpStatusCode);
    
    if (error.name === 'UserNotFoundException') {
      console.log('💡 The user does not exist in the User Pool');
    } else if (error.name === 'InvalidParameterException') {
      console.log('💡 Invalid parameters - check ClientId and Username');
    } else if (error.name === 'LimitExceededException') {
      console.log('💡 Too many requests - try again later');
    } else if (error.name === 'NotAuthorizedException') {
      console.log('💡 User is not authorized to perform this action');
    }
    
    throw error;
  }
}

// Test with a sample email
const testEmail = process.argv[2] || 'test@example.com';
testForgotPassword(testEmail)
  .then(() => {
    console.log('\n🎉 Test completed successfully!');
    console.log('Check your email for the password reset link.');
  })
  .catch((error) => {
    console.log('\n💥 Test failed. Please check the error messages above.');
    process.exit(1);
  });
