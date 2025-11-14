const { CognitoIdentityProviderClient, UpdateUserPoolCommand } = require('@aws-sdk/client-cognito-identity-provider');

const cognitoClient = new CognitoIdentityProviderClient({ region: 'us-east-1' });
const USER_POOL_ID = 'us-east-1_uK50qBrap';

async function configureEmailVerification() {
  try {
    console.log('🔧 Configuring Cognito for email verification...');
    
    const updateCommand = new UpdateUserPoolCommand({
      UserPoolId: USER_POOL_ID,
      EmailVerificationMessage: 'Welcome to ClassCast! Your verification code is: {####}',
      EmailVerificationSubject: 'Verify your ClassCast account',
      AutoVerifiedAttributes: [], // Disable auto-verification
      VerificationMessageTemplate: {
        DefaultEmailOption: 'CONFIRM_WITH_LINK', // Use email links instead of codes
        EmailMessageByLink: 'Welcome to ClassCast! Click the link below to verify your email: {##Verify Email##}',
        EmailSubjectByLink: 'Verify your ClassCast account'
      }
    });
    
    await cognitoClient.send(updateCommand);
    console.log('✅ Cognito user pool updated successfully!');
    console.log('📧 Email verification is now enabled with links');
    console.log('🚫 Auto-verification is disabled');
    
  } catch (error) {
    console.error('❌ Error configuring Cognito:', error);
    throw error;
  }
}

configureEmailVerification();
