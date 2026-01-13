#!/usr/bin/env node

/**
 * Test Moderation Email Notification
 * 
 * This script sends a test email notification to verify that the moderation
 * alert system is working properly and that you receive notifications
 * when content moderation issues occur.
 */

console.log('📧 Testing Moderation Email Notification System');
console.log('=' .repeat(50));

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  testEmail: process.env.TEST_EMAIL || 'your-email@example.com', // Replace with your email
};

console.log('📋 Test Configuration:');
console.log(`   Base URL: ${TEST_CONFIG.baseUrl}`);
console.log(`   Test Email: ${TEST_CONFIG.testEmail}`);
console.log('');

async function testModerationEmailNotification() {
  console.log('🚀 Starting Moderation Email Notification Test...');
  console.log('');
  
  let passedTests = 0;
  let totalTests = 0;
  
  try {
    // Test 1: Send High Severity Alert
    totalTests++;
    console.log('🔍 Test 1: Sending High Severity Moderation Alert');
    
    try {
      const highSeverityAlert = {
        flagId: `test_flag_${Date.now()}_high`,
        severity: 'high',
        contentType: 'peer-response',
        content: 'This is a test high-severity content flag. This content contains inappropriate language and harassment that requires immediate instructor attention. The AI moderation system has detected multiple policy violations including hate speech and threatening behavior.',
        authorName: 'Test Student (High Risk)',
        categories: ['inappropriate-language', 'harassment', 'hate-speech', 'threatening-behavior'],
        courseId: 'test_course_123'
      };
      
      console.log('   📤 Sending high severity alert email...');
      console.log(`   🎯 Severity: ${highSeverityAlert.severity.toUpperCase()}`);
      console.log(`   📝 Content Type: ${highSeverityAlert.contentType}`);
      console.log(`   👤 Author: ${highSeverityAlert.authorName}`);
      console.log(`   🏷️  Categories: ${highSeverityAlert.categories.join(', ')}`);
      
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/notifications/send-moderation-alert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(highSeverityAlert)
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('   ✅ High severity alert sent successfully');
          console.log(`   📊 Details: ${result.message}`);
          if (result.details) {
            console.log(`   📈 Total: ${result.details.total}, Successful: ${result.details.successful}, Failed: ${result.details.failed}`);
          }
          passedTests++;
        } else {
          throw new Error(`API returned success: false - ${result.error}`);
        }
      } else {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Test 1 FAILED: ${error.message}`);
    }
    
    console.log('');
    
    // Test 2: Send Medium Severity Alert
    totalTests++;
    console.log('🔍 Test 2: Sending Medium Severity Moderation Alert');
    
    try {
      const mediumSeverityAlert = {
        flagId: `test_flag_${Date.now()}_medium`,
        severity: 'medium',
        contentType: 'community-post',
        content: 'This is a test medium-severity content flag. The content contains questionable material that may violate community guidelines. While not immediately dangerous, it requires instructor review to determine appropriate action.',
        authorName: 'Test Student (Moderate Risk)',
        categories: ['questionable-content', 'community-guidelines', 'needs-review'],
        courseId: 'test_course_123'
      };
      
      console.log('   📤 Sending medium severity alert email...');
      console.log(`   🎯 Severity: ${mediumSeverityAlert.severity.toUpperCase()}`);
      console.log(`   📝 Content Type: ${mediumSeverityAlert.contentType}`);
      console.log(`   👤 Author: ${mediumSeverityAlert.authorName}`);
      console.log(`   🏷️  Categories: ${mediumSeverityAlert.categories.join(', ')}`);
      
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/notifications/send-moderation-alert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mediumSeverityAlert)
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('   ✅ Medium severity alert sent successfully');
          console.log(`   📊 Details: ${result.message}`);
          passedTests++;
        } else {
          throw new Error(`API returned success: false - ${result.error}`);
        }
      } else {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Test 2 FAILED: ${error.message}`);
    }
    
    console.log('');
    
    // Test 3: Send Low Severity Alert (for completeness)
    totalTests++;
    console.log('🔍 Test 3: Sending Low Severity Moderation Alert');
    
    try {
      const lowSeverityAlert = {
        flagId: `test_flag_${Date.now()}_low`,
        severity: 'low',
        contentType: 'submission',
        content: 'This is a test low-severity content flag. The content has minor issues that should be reviewed when convenient. This is not urgent but should be addressed during regular moderation activities.',
        authorName: 'Test Student (Low Risk)',
        categories: ['minor-concern', 'routine-review'],
        courseId: 'test_course_123'
      };
      
      console.log('   📤 Sending low severity alert email...');
      console.log(`   🎯 Severity: ${lowSeverityAlert.severity.toUpperCase()}`);
      console.log(`   📝 Content Type: ${lowSeverityAlert.contentType}`);
      console.log(`   👤 Author: ${lowSeverityAlert.authorName}`);
      console.log(`   🏷️  Categories: ${lowSeverityAlert.categories.join(', ')}`);
      
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/notifications/send-moderation-alert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lowSeverityAlert)
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('   ✅ Low severity alert sent successfully');
          console.log(`   📊 Details: ${result.message}`);
          passedTests++;
        } else {
          throw new Error(`API returned success: false - ${result.error}`);
        }
      } else {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Test 3 FAILED: ${error.message}`);
    }
    
    console.log('');
    
    // Summary
    console.log('📊 Moderation Email Notification Test Summary');
    console.log('=' .repeat(50));
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests}`);
    console.log(`   Failed: ${totalTests - passedTests}`);
    console.log(`   Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    if (passedTests === totalTests) {
      console.log('');
      console.log('🎉 All Email Notification Tests PASSED!');
      console.log('✅ High severity alerts sent');
      console.log('✅ Medium severity alerts sent');
      console.log('✅ Low severity alerts sent');
      console.log('✅ Email notification system is working');
      console.log('');
      console.log('📧 Check Your Email Inbox!');
      console.log('You should receive 3 test emails with different severity levels:');
      console.log('• 🚨 HIGH SEVERITY - Red header, urgent styling');
      console.log('• ⚠️  MEDIUM SEVERITY - Orange header, warning styling');
      console.log('• 📋 LOW SEVERITY - Yellow header, info styling');
      console.log('');
      console.log('📋 Email Features to Verify:');
      console.log('• Professional HTML formatting');
      console.log('• Severity-based color coding');
      console.log('• Content preview with categories');
      console.log('• Direct link to moderation dashboard');
      console.log('• Clear call-to-action button');
      console.log('');
      console.log('⚙️  Email Configuration:');
      console.log('• Check your spam/junk folder if emails don\'t appear');
      console.log('• Verify AWS SES is configured and verified');
      console.log('• Ensure INSTRUCTOR_ALERT_EMAIL env var is set to your email');
      console.log('• Check that SES_SENDER_EMAIL is verified in AWS');
    } else {
      console.log('');
      console.log('⚠️  Some email notification tests failed');
      console.log('🔍 Check the failed test cases above for specific issues');
      console.log('');
      console.log('🔧 Possible Issues:');
      console.log('• AWS SES not configured or sender email not verified');
      console.log('• INSTRUCTOR_ALERT_EMAIL environment variable not set');
      console.log('• Network connectivity issues');
      console.log('• Email service rate limits or quotas exceeded');
      console.log('• Invalid email addresses in configuration');
    }
    
  } catch (error) {
    console.error('');
    console.error('❌ Email Notification Test Suite FAILED!');
    console.error('=' .repeat(50));
    console.error(`Error: ${error.message}`);
    
    throw error;
  }
}

// Additional setup information
console.log('🔧 Email Notification System Setup:');
console.log('');
console.log('Environment Variables Required:');
console.log('• INSTRUCTOR_ALERT_EMAIL - Your email address for receiving alerts');
console.log('• SES_SENDER_EMAIL - Verified sender email in AWS SES');
console.log('• AWS_REGION - AWS region for SES service');
console.log('• NEXT_PUBLIC_BASE_URL - Base URL for dashboard links');
console.log('');

console.log('AWS SES Requirements:');
console.log('• Sender email must be verified in AWS SES');
console.log('• If in SES sandbox, recipient email must also be verified');
console.log('• Ensure SES sending limits are not exceeded');
console.log('• Check SES reputation and bounce rates');
console.log('');

console.log('Email Content Features:');
console.log('• Severity-based styling (red/orange/yellow headers)');
console.log('• Content preview with category tags');
console.log('• Direct link to moderation dashboard');
console.log('• Professional HTML and plain text versions');
console.log('• Mobile-responsive design');
console.log('');

// Run the test
testModerationEmailNotification().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});