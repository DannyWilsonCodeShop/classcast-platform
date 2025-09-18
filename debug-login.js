const { CognitoIdentityProviderClient, InitiateAuthCommand } = require('@aws-sdk/client-cognito-identity-provider');

const client = new CognitoIdentityProviderClient({
  region: 'us-east-1',
});

const USER_POOL_CLIENT_ID = '7tbaq74itv3gdda1bt25iqafvh';

async function testDirectLogin() {
  try {
    console.log('Testing direct Cognito login...');
    
    const command = new InitiateAuthCommand({
      ClientId: USER_POOL_CLIENT_ID,
      AuthFlow: 'USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME: 'test-login@cristoreyatlanta.org',
        PASSWORD: 'Test1234!',
      },
    });

    const response = await client.send(command);
    console.log('Direct login successful:', {
      hasAccessToken: !!response.AuthenticationResult?.AccessToken,
      hasRefreshToken: !!response.AuthenticationResult?.RefreshToken,
      userSub: response.AuthenticationResult?.AccessToken ? 'Present' : 'Missing'
    });
  } catch (error) {
    console.error('Direct login failed:', error.message);
  }
}

testDirectLogin();
