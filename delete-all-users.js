const { CognitoIdentityProviderClient, ListUsersCommand, AdminDeleteUserCommand } = require('@aws-sdk/client-cognito-identity-provider');

const cognitoClient = new CognitoIdentityProviderClient({ region: 'us-east-1' });
const USER_POOL_ID = 'us-east-1_uK50qBrap';

async function deleteAllUsers() {
  try {
    console.log('🔍 Listing all users in the user pool...');
    
    // List all users
    const listUsersCommand = new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Limit: 60 // Get all users
    });
    
    const response = await cognitoClient.send(listUsersCommand);
    const users = response.Users || [];
    
    console.log(`Found ${users.length} users to delete`);
    
    if (users.length === 0) {
      console.log('✅ No users found to delete');
      return;
    }
    
    // Delete each user
    for (const user of users) {
      try {
        const deleteCommand = new AdminDeleteUserCommand({
          UserPoolId: USER_POOL_ID,
          Username: user.Username
        });
        
        await cognitoClient.send(deleteCommand);
        console.log(`✅ Deleted user: ${user.Username} (${user.Attributes?.find(attr => attr.Name === 'email')?.Value || 'No email'})`);
      } catch (error) {
        console.error(`❌ Failed to delete user ${user.Username}:`, error.message);
      }
    }
    
    console.log('\n🎉 User deletion process completed!');
    
  } catch (error) {
    console.error('❌ Error deleting users:', error);
    throw error;
  }
}

deleteAllUsers();
