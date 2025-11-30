const { CognitoIdentityProviderClient, ForgotPasswordCommand } = require('@aws-sdk/client-cognito-identity-provider');

const cognito = new CognitoIdentityProviderClient({ region: 'us-east-1' });

const CLIENT_ID = '55ei187qtu2f4hv2b02efcsjvv'; // From amplify.yml

async function testPasswordReset(email) {
  try {
    if (!email) {
      console.log('❌ Please provide an email address');
      console.log('Usage: node test-password-reset-email.js <email>');
      console.log('Example: node test-password-reset-email.js dwilson1919@gmail.com');
      return;
    }
    
    console.log('🧪 Testing Password Reset Email...\n');
    console.log('Email:', email);
    console.log('Client ID:', CLIENT_ID);
    console.log('='.repeat(60));
    
    console.log('\n📧 Sending password reset email...');
    
    const response = await cognito.send(new ForgotPasswordCommand({
      ClientId: CLIENT_ID,
      Username: email
    }));
    
    console.log('\n✅ Password reset email sent successfully!');
    console.log('\n📬 Check the inbox for:', email);
    console.log('   - Subject: "Your verification code"');
    console.log('   - From: ClassCast <noreply@myclasscast.com>');
    console.log('   - Contains: 6-digit verification code');
    
    console.log('\n⏰ Email should arrive within 1-2 minutes');
    console.log('   If not received:');
    console.log('   1. Check spam/junk folder');
    console.log('   2. Verify email is registered in Cognito');
    console.log('   3. Check SES sending limits');
    console.log('   4. Check CloudWatch logs for errors');
    
    console.log('\n🔍 Delivery Info:');
    console.log('   Destination:', response.CodeDeliveryDetails?.Destination || 'Unknown');
    console.log('   Delivery Medium:', response.CodeDeliveryDetails?.DeliveryMedium || 'Unknown');
    console.log('   Attribute Name:', response.CodeDeliveryDetails?.AttributeName || 'Unknown');
    
    console.log('\n💡 To complete password reset:');
    console.log('   1. Get the 6-digit code from email');
    console.log('   2. Go to your app\'s reset password page');
    console.log('   3. Enter the code and new password');
    
  } catch (error) {
    console.error('\n❌ Error sending password reset email:', error);
    
    if (error.name === 'UserNotFoundException') {
      console.log('\n⚠️  User not found in Cognito');
      console.log('   Make sure the email is registered');
    } else if (error.name === 'LimitExceededException') {
      console.log('\n⚠️  Rate limit exceeded');
      console.log('   Wait a few minutes and try again');
    } else if (error.name === 'InvalidParameterException') {
      console.log('\n⚠️  Invalid parameter');
      console.log('   Check that the email format is correct');
    } else if (error.name === 'TooManyRequestsException') {
      console.log('\n⚠️  Too many requests');
      console.log('   Cognito has rate limits. Wait and try again.');
    }
  }
}

// Get email from command line argument
const email = process.argv[2];
testPasswordReset(email);
