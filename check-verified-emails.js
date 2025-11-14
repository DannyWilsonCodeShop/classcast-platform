const { SESClient, ListIdentitiesCommand } = require('@aws-sdk/client-ses');
const sesClient = new SESClient({ region: 'us-east-1' });

async function checkVerifiedEmails() {
  try {
    console.log('🔍 Checking verified email addresses...\n');
    
    const command = new ListIdentitiesCommand({ IdentityType: 'EmailAddress' });
    const result = await sesClient.send(command);
    
    if (result.Identities && result.Identities.length > 0) {
      console.log('✅ Verified Email Addresses:');
      result.Identities.forEach(email => {
        console.log(`   - ${email}`);
      });
    } else {
      console.log('⚠️  No verified email addresses found');
      console.log('\nTo verify an email address, go to:');
      console.log('   AWS Console → SES → Verified identities → Create identity');
    }
    
  } catch (error) {
    console.error('❌ Error checking verified emails:', error.message);
  }
}

checkVerifiedEmails();

