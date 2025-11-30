const { CognitoIdentityProviderClient, DescribeUserPoolCommand, GetUserPoolMfaConfigCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { SESClient, GetIdentityVerificationAttributesCommand, ListIdentitiesCommand } = require('@aws-sdk/client-ses');

const cognito = new CognitoIdentityProviderClient({ region: 'us-east-1' });
const ses = new SESClient({ region: 'us-east-1' });

const USER_POOL_ID = 'us-east-1_zb9BqlWOm'; // From your amplify.yml

async function diagnoseCognitoEmail() {
  try {
    console.log('🔍 Diagnosing Cognito Email Configuration...\n');
    console.log('User Pool ID:', USER_POOL_ID);
    console.log('='.repeat(60));
    
    // Step 1: Get User Pool Configuration
    console.log('\n1️⃣  Checking User Pool Email Settings...');
    const poolResponse = await cognito.send(new DescribeUserPoolCommand({
      UserPoolId: USER_POOL_ID
    }));
    
    const pool = poolResponse.UserPool;
    const emailConfig = pool.EmailConfiguration;
    
    console.log('\n📧 Email Configuration:');
    console.log('   Email Sending Account:', emailConfig.EmailSendingAccount || 'COGNITO_DEFAULT');
    
    if (emailConfig.EmailSendingAccount === 'COGNITO_DEFAULT') {
      console.log('   ⚠️  Using Cognito\'s default email service');
      console.log('   ⚠️  This has strict limits and emails often go to spam!');
      console.log('\n   Limits with COGNITO_DEFAULT:');
      console.log('   - Max 50 emails per day');
      console.log('   - Often marked as spam');
      console.log('   - No custom "From" address');
      console.log('   - FROM: no-reply@verificationemail.com');
      console.log('\n   ❌ THIS IS LIKELY YOUR PROBLEM!');
    } else if (emailConfig.EmailSendingAccount === 'DEVELOPER') {
      console.log('   ✅ Using custom SES configuration');
      console.log('   Source ARN:', emailConfig.SourceArn);
      console.log('   From Email:', emailConfig.From || 'Not set');
      console.log('   Reply-To:', emailConfig.ReplyToEmailAddress || 'Not set');
    }
    
    // Step 2: Check verification settings
    console.log('\n2️⃣  Checking Verification Settings...');
    console.log('   Auto Verified Attributes:', pool.AutoVerifiedAttributes?.join(', ') || 'None');
    console.log('   Required Attributes:', pool.SchemaAttributes
      ?.filter(attr => attr.Required)
      .map(attr => attr.Name)
      .join(', ') || 'None');
    
    // Step 3: Check email message templates
    console.log('\n3️⃣  Email Message Templates...');
    if (pool.EmailVerificationMessage) {
      console.log('   Verification Message:', pool.EmailVerificationMessage.substring(0, 100) + '...');
    }
    if (pool.EmailVerificationSubject) {
      console.log('   Verification Subject:', pool.EmailVerificationSubject);
    }
    
    // Step 4: Check SES identities
    console.log('\n4️⃣  Checking SES Email Identities...');
    try {
      const identitiesResponse = await ses.send(new ListIdentitiesCommand({}));
      
      if (identitiesResponse.Identities && identitiesResponse.Identities.length > 0) {
        console.log('   Found', identitiesResponse.Identities.length, 'verified identities:');
        
        const verificationResponse = await ses.send(new GetIdentityVerificationAttributesCommand({
          Identities: identitiesResponse.Identities
        }));
        
        identitiesResponse.Identities.forEach(identity => {
          const status = verificationResponse.VerificationAttributes[identity];
          if (status) {
            console.log(`   - ${identity}: ${status.VerificationStatus}`);
          }
        });
      } else {
        console.log('   ⚠️  No verified email identities found in SES');
      }
    } catch (error) {
      console.log('   ⚠️  Could not check SES:', error.message);
    }
    
    // Step 5: Check account status
    console.log('\n5️⃣  User Pool Status...');
    console.log('   Status:', pool.Status);
    console.log('   Creation Date:', pool.CreationDate);
    console.log('   Last Modified:', pool.LastModifiedDate);
    
    // Summary and recommendations
    console.log('\n' + '='.repeat(60));
    console.log('📋 DIAGNOSIS SUMMARY');
    console.log('='.repeat(60));
    
    if (emailConfig.EmailSendingAccount === 'COGNITO_DEFAULT') {
      console.log('\n❌ PROBLEM IDENTIFIED: Using Cognito Default Email');
      console.log('\n🔧 SOLUTION: Configure Cognito to use SES');
      console.log('\nSteps to fix:');
      console.log('1. Verify your domain or email in SES');
      console.log('2. Update Cognito User Pool to use SES');
      console.log('3. Configure custom FROM email address');
      console.log('\nRun this command to fix:');
      console.log('   node fix-cognito-email.js');
    } else {
      console.log('\n✅ Cognito is configured to use SES');
      console.log('\nPossible issues:');
      console.log('- SES might be in sandbox mode (check AWS Console)');
      console.log('- Email might be going to spam folder');
      console.log('- FROM email might not be verified');
      console.log('- Rate limits might be exceeded');
    }
    
    console.log('\n💡 Additional Checks:');
    console.log('1. Check if SES is in sandbox mode:');
    console.log('   AWS Console → SES → Account Dashboard');
    console.log('2. Check CloudWatch logs for email failures:');
    console.log('   AWS Console → CloudWatch → Log Groups → /aws/cognito');
    console.log('3. Test password reset manually:');
    console.log('   node test-password-reset.js <email>');

  } catch (error) {
    console.error('❌ Error diagnosing Cognito:', error);
    
    if (error.name === 'ResourceNotFoundException') {
      console.log('\n⚠️  User Pool not found. Check your USER_POOL_ID.');
    }
  }
}

diagnoseCognitoEmail();
