const { CognitoIdentityProviderClient, UpdateUserPoolCommand, DescribeUserPoolCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { SESClient, VerifyEmailIdentityCommand, GetIdentityVerificationAttributesCommand } = require('@aws-sdk/client-ses');

const cognito = new CognitoIdentityProviderClient({ region: 'us-east-1' });
const ses = new SESClient({ region: 'us-east-1' });

const USER_POOL_ID = 'us-east-1_uK50qBrap'; // Actual user pool from aws-config.ts
const FROM_EMAIL = 'noreply@myclasscast.com'; // Already verified in SES
const REPLY_TO_EMAIL = 'support@myclasscast.com';

async function fixCognitoEmail() {
  try {
    console.log('🔧 Fixing Cognito Email Configuration...\n');
    
    // Step 1: Verify the FROM email is verified in SES
    console.log('1️⃣  Checking SES email verification...');
    const verificationResponse = await ses.send(new GetIdentityVerificationAttributesCommand({
      Identities: [FROM_EMAIL, 'myclasscast.com']
    }));
    
    const emailStatus = verificationResponse.VerificationAttributes[FROM_EMAIL];
    const domainStatus = verificationResponse.VerificationAttributes['myclasscast.com'];
    
    if (emailStatus?.VerificationStatus === 'Success' || domainStatus?.VerificationStatus === 'Success') {
      console.log('   ✅ Email/Domain verified in SES');
    } else {
      console.log('   ⚠️  Email not verified. Status:', emailStatus?.VerificationStatus || 'Not found');
      console.log('   Attempting to verify...');
      
      try {
        await ses.send(new VerifyEmailIdentityCommand({
          EmailAddress: FROM_EMAIL
        }));
        console.log('   📧 Verification email sent to', FROM_EMAIL);
        console.log('   ⚠️  Check your inbox and click the verification link!');
        console.log('   Then run this script again.');
        return;
      } catch (error) {
        console.log('   ⚠️  Could not send verification:', error.message);
      }
    }
    
    // Step 2: Get current User Pool configuration
    console.log('\n2️⃣  Getting current User Pool configuration...');
    const poolResponse = await cognito.send(new DescribeUserPoolCommand({
      UserPoolId: USER_POOL_ID
    }));
    
    const currentPool = poolResponse.UserPool;
    console.log('   Current email config:', currentPool.EmailConfiguration.EmailSendingAccount);
    
    // Step 3: Update User Pool to use SES
    console.log('\n3️⃣  Updating User Pool to use SES...');
    
    // Build the SES configuration
    const sesConfig = {
      EmailSendingAccount: 'DEVELOPER',
      SourceArn: `arn:aws:ses:us-east-1:463470937777:identity/${FROM_EMAIL}`,
      From: `ClassCast <${FROM_EMAIL}>`,
      ReplyToEmailAddress: REPLY_TO_EMAIL
    };
    
    console.log('   New configuration:');
    console.log('   - Email Sending Account: DEVELOPER (SES)');
    console.log('   - From:', sesConfig.From);
    console.log('   - Reply-To:', sesConfig.ReplyToEmailAddress);
    console.log('   - Source ARN:', sesConfig.SourceArn);
    
    // Update the user pool
    const updateParams = {
      UserPoolId: USER_POOL_ID,
      EmailConfiguration: sesConfig,
      // Preserve other settings
      Policies: currentPool.Policies,
      AutoVerifiedAttributes: currentPool.AutoVerifiedAttributes,
      MfaConfiguration: currentPool.MfaConfiguration,
      UserAttributeUpdateSettings: currentPool.UserAttributeUpdateSettings,
      EmailVerificationMessage: currentPool.EmailVerificationMessage,
      EmailVerificationSubject: currentPool.EmailVerificationSubject,
      VerificationMessageTemplate: currentPool.VerificationMessageTemplate,
      SmsAuthenticationMessage: currentPool.SmsAuthenticationMessage,
      UserPoolTags: currentPool.UserPoolTags,
      AdminCreateUserConfig: currentPool.AdminCreateUserConfig,
      DeviceConfiguration: currentPool.DeviceConfiguration,
      AccountRecoverySetting: currentPool.AccountRecoverySetting
    };
    
    await cognito.send(new UpdateUserPoolCommand(updateParams));
    
    console.log('\n✅ User Pool updated successfully!');
    
    // Step 4: Verify the update
    console.log('\n4️⃣  Verifying the update...');
    const verifyResponse = await cognito.send(new DescribeUserPoolCommand({
      UserPoolId: USER_POOL_ID
    }));
    
    const updatedConfig = verifyResponse.UserPool.EmailConfiguration;
    console.log('   Email Sending Account:', updatedConfig.EmailSendingAccount);
    console.log('   From:', updatedConfig.From);
    console.log('   Source ARN:', updatedConfig.SourceArn);
    
    if (updatedConfig.EmailSendingAccount === 'DEVELOPER') {
      console.log('\n🎉 SUCCESS! Cognito is now using SES for emails.');
      console.log('\n📧 Password reset emails will now:');
      console.log('   ✅ Come from:', FROM_EMAIL);
      console.log('   ✅ Have higher delivery rates');
      console.log('   ✅ Be less likely to go to spam');
      console.log('   ✅ Support higher volume (up to 50,000/day with SES)');
      
      console.log('\n🧪 Test it:');
      console.log('   1. Go to your login page');
      console.log('   2. Click "Forgot Password"');
      console.log('   3. Enter a test email');
      console.log('   4. Check inbox (and spam folder)');
      
      console.log('\n💡 Next Steps:');
      console.log('   - Check if SES is in sandbox mode (limits to verified emails only)');
      console.log('   - Request production access if needed (AWS Console → SES)');
      console.log('   - Monitor email delivery in CloudWatch');
    } else {
      console.log('\n⚠️  Update may not have applied correctly.');
      console.log('   Current setting:', updatedConfig.EmailSendingAccount);
    }
    
  } catch (error) {
    console.error('\n❌ Error fixing Cognito email:', error);
    
    if (error.name === 'InvalidParameterException') {
      console.log('\n⚠️  Invalid parameter. Possible issues:');
      console.log('   - Source ARN might be incorrect');
      console.log('   - Email not verified in SES');
      console.log('   - Missing IAM permissions');
    } else if (error.name === 'InvalidEmailRoleAccessPolicyException') {
      console.log('\n⚠️  IAM role issue. Cognito needs permission to use SES.');
      console.log('   The IAM role needs the "ses:SendEmail" permission.');
    }
  }
}

fixCognitoEmail();
