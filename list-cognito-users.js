const { CognitoIdentityProviderClient, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');

const cognito = new CognitoIdentityProviderClient({ region: 'us-east-1' });
const USER_POOL_ID = 'us-east-1_uK50qBrap'; // Actual user pool

async function listUsers() {
  try {
    console.log('👥 Listing Cognito Users...\n');
    
    const response = await cognito.send(new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Limit: 10
    }));
    
    if (!response.Users || response.Users.length === 0) {
      console.log('No users found in Cognito');
      return;
    }
    
    console.log(`Found ${response.Users.length} users:\n`);
    
    response.Users.forEach((user, index) => {
      const email = user.Attributes?.find(attr => attr.Name === 'email')?.Value;
      const name = user.Attributes?.find(attr => attr.Name === 'name')?.Value;
      const emailVerified = user.Attributes?.find(attr => attr.Name === 'email_verified')?.Value;
      
      console.log(`${index + 1}. ${user.Username}`);
      console.log(`   Email: ${email}`);
      console.log(`   Name: ${name || 'N/A'}`);
      console.log(`   Email Verified: ${emailVerified}`);
      console.log(`   Status: ${user.UserStatus}`);
      console.log(`   Created: ${user.UserCreateDate}`);
      console.log('');
    });
    
    console.log('💡 To test password reset with one of these users:');
    console.log(`   node test-password-reset-email.js ${response.Users[0].Attributes?.find(attr => attr.Name === 'email')?.Value}`);
    
  } catch (error) {
    console.error('❌ Error listing users:', error);
  }
}

listUsers();
