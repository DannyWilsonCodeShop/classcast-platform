const fetch = require('node-fetch');

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function testPasswordResetFlow(email) {
  try {
    if (!email) {
      console.log('❌ Please provide an email address');
      console.log('Usage: node test-password-reset-flow.js <email>');
      console.log('Example: node test-password-reset-flow.js bmishamo28@cristoreyatlanta.org');
      return;
    }

    console.log('🧪 Testing Password Reset Flow...\n');
    console.log('Email:', email);
    console.log('API URL:', API_URL);
    console.log('='.repeat(60));

    // Step 1: Request password reset
    console.log('\n1️⃣  Requesting password reset...');
    
    const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();
    
    console.log('   Status:', response.status);
    console.log('   Response:', data.message);

    if (response.ok) {
      console.log('\n✅ Password reset email sent successfully!');
      console.log('\n📬 Next steps:');
      console.log('   1. Check the inbox for:', email);
      console.log('   2. Look for email from: ClassCast <noreply@myclasscast.com>');
      console.log('   3. Subject: "Reset Your ClassCast Password"');
      console.log('   4. Click the reset link in the email');
      console.log('   5. Enter a new password');
      
      console.log('\n⏰ Email should arrive within 1-2 minutes');
      console.log('   If not received:');
      console.log('   - Check spam/junk folder');
      console.log('   - Verify email is registered in the system');
      console.log('   - Check CloudWatch logs for SES errors');
      
      console.log('\n💡 The reset link will:');
      console.log('   - Expire in 1 hour');
      console.log('   - Can only be used once');
      console.log('   - Redirect to /reset-password page');
    } else {
      console.log('\n⚠️  Request failed');
      console.log('   Error:', data.message || data.error);
    }

  } catch (error) {
    console.error('\n❌ Error testing password reset:', error);
  }
}

const email = process.argv[2];
testPasswordResetFlow(email);
