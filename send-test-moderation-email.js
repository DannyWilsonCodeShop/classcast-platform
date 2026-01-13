#!/usr/bin/env node

/**
 * Send Test Moderation Email
 * 
 * This script sends a test moderation email directly to verify the email system works.
 * Run this with your email address to test the notification system.
 * 
 * Usage: node send-test-moderation-email.js your-email@example.com
 */

const email = process.argv[2];

if (!email) {
  console.log('❌ Please provide your email address as an argument');
  console.log('Usage: node send-test-moderation-email.js your-email@example.com');
  process.exit(1);
}

if (!email.includes('@')) {
  console.log('❌ Invalid email address format');
  process.exit(1);
}

console.log('📧 Sending Test Moderation Email');
console.log('=' .repeat(50));
console.log(`📬 Recipient: ${email}`);
console.log('');

async function sendTestEmail() {
  try {
    // First, let's set the environment variable temporarily for this test
    process.env.INSTRUCTOR_ALERT_EMAIL = email;
    
    console.log('🔧 Configuration:');
    console.log(`   INSTRUCTOR_ALERT_EMAIL: ${email}`);
    console.log(`   SES_SENDER_EMAIL: ${process.env.SES_SENDER_EMAIL || 'Not set'}`);
    console.log(`   AWS_REGION: ${process.env.AWS_REGION || 'Not set'}`);
    console.log('');

    const testAlert = {
      flagId: `test_email_${Date.now()}`,
      severity: 'high',
      contentType: 'peer-response',
      content: `🧪 TEST EMAIL: This is a test moderation alert sent to verify that email notifications are working properly. 

This email was generated at ${new Date().toLocaleString()} to test the content moderation notification system.

If you receive this email, it means:
✅ AWS SES is configured correctly
✅ Email routing is working
✅ Moderation alerts will be delivered
✅ The notification system is operational

You can safely ignore this test message.`,
      authorName: 'System Test User',
      categories: ['test-notification', 'system-verification', 'email-test'],
      courseId: 'test_course_email_verification'
    };

    console.log('📤 Sending test moderation alert...');
    console.log(`   🎯 Severity: ${testAlert.severity.toUpperCase()}`);
    console.log(`   📝 Content Type: ${testAlert.contentType}`);
    console.log(`   👤 Author: ${testAlert.authorName}`);
    console.log(`   🏷️  Categories: ${testAlert.categories.join(', ')}`);
    console.log('');

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/notifications/send-moderation-alert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testAlert)
    });

    console.log(`📡 API Response Status: ${response.status}`);

    if (response.ok) {
      const result = await response.json();
      console.log('📊 API Response:', JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log('');
        console.log('🎉 Test Email Sent Successfully!');
        console.log('');
        console.log('📧 What to expect:');
        console.log(`   • Check your inbox at ${email}`);
        console.log('   • Look for subject: "🚨 Content Moderation Alert - HIGH Severity"');
        console.log('   • Email should have a red header (high severity)');
        console.log('   • Contains test content and categories');
        console.log('   • Includes link to moderation dashboard');
        console.log('');
        console.log('⏰ If you don\'t see the email:');
        console.log('   • Check your spam/junk folder');
        console.log('   • Verify AWS SES sender email is verified');
        console.log('   • Check AWS SES sending limits');
        console.log('   • Ensure recipient email is verified (if in SES sandbox)');
        console.log('');
        console.log('📋 Email Details:');
        if (result.details) {
          console.log(`   • Total recipients: ${result.details.total}`);
          console.log(`   • Successful sends: ${result.details.successful}`);
          console.log(`   • Failed sends: ${result.details.failed}`);
        }
        console.log(`   • Message: ${result.message}`);
      } else {
        console.log('❌ Email sending failed:');
        console.log(`   Error: ${result.error}`);
        console.log(`   Details: ${result.details || 'No additional details'}`);
      }
    } else {
      const errorText = await response.text();
      console.log('❌ API Request Failed:');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${errorText}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('');
    console.error('🔧 Troubleshooting:');
    console.error('1. Ensure your development server is running (npm run dev)');
    console.error('2. Check AWS credentials are configured');
    console.error('3. Verify SES_SENDER_EMAIL is set and verified in AWS SES');
    console.error('4. Ensure AWS_REGION is set correctly');
    console.error('5. Check network connectivity');
  }
}

// Additional information
console.log('ℹ️  About This Test:');
console.log('This script tests the complete email notification pipeline:');
console.log('• Creates a test moderation flag');
console.log('• Calls the notification API');
console.log('• Sends email via AWS SES');
console.log('• Verifies delivery status');
console.log('');

console.log('🔧 Required Setup:');
console.log('1. AWS SES Configuration:');
console.log('   • Sender email verified in AWS SES');
console.log('   • Recipient email verified (if in sandbox mode)');
console.log('   • Proper AWS credentials configured');
console.log('');
console.log('2. Environment Variables:');
console.log('   • SES_SENDER_EMAIL=noreply@yourdomain.com');
console.log('   • AWS_REGION=us-east-1 (or your preferred region)');
console.log('   • AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY');
console.log('');

// Run the test
sendTestEmail();