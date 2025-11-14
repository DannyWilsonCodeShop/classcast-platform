const { CognitoIdentityProviderClient, InitiateAuthCommand, GetUserCommand } = require('@aws-sdk/client-cognito-identity-provider');

const client = new CognitoIdentityProviderClient({
  region: 'us-east-1',
});

const USER_POOL_CLIENT_ID = '7tbaq74itv3gdda1bt25iqafvh';

async function testGetUser() {
  try {
    console.log('Testing login and GetUser...');
    
    // First, login to get access token
    const authCommand = new InitiateAuthCommand({
      ClientId: USER_POOL_CLIENT_ID,
      AuthFlow: 'USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME: 'test-login@cristoreyatlanta.org',
        PASSWORD: 'Test1234!',
      },
    });

    const authResponse = await client.send(authCommand);
    console.log('Login successful, access token length:', authResponse.AuthenticationResult?.AccessToken?.length);

    // Now try to get user details
    const getUserCommand = new GetUserCommand({
      AccessToken: authResponse.AuthenticationResult.AccessToken,
    });

    const userResponse = await client.send(getUserCommand);
    console.log('GetUser successful:', {
      username: userResponse.Username,
      attributesCount: userResponse.UserAttributes?.length || 0,
      attributes: userResponse.UserAttributes?.map(attr => ({ name: attr.Name, value: attr.Value }))
    });
  } catch (error) {
    console.error('GetUser failed:', error.message);
  }
}

testGetUser();
