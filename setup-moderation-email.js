#!/usr/bin/env node

/**
 * Setup Moderation Email Configuration
 * 
 * This script helps configure the email notification system for content moderation.
 * It will guide you through setting up the necessary environment variables.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

console.log('📧 Moderation Email Configuration Setup');
console.log('=' .repeat(50));

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupModerationEmail() {
  try {
    console.log('');
    console.log('This setup will configure email notifications for content moderation alerts.');
    console.log('You\'ll receive emails when high or medium severity content is flagged.');
    console.log('');

    // Get user's email
    const email = await question('Enter your email address for moderation alerts: ');
    
    if (!email || !email.includes('@')) {
      console.log('❌ Invalid email address. Please run the script again.');
      rl.close();
      return;
    }

    console.log('');
    console.log('📝 Email Configuration:');
    console.log(`   Alert Email: ${email}`);
    console.log('');

    // Check if .env.local exists
    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      console.log('✅ Found existing .env.local file');
    } else {
      console.log('📝 Creating new .env.local file');
    }

    // Update or add the environment variable
    const envVar = `INSTRUCTOR_ALERT_EMAIL=${email}`;
    
    if (envContent.includes('INSTRUCTOR_ALERT_EMAIL=')) {
      // Replace existing
      envContent = envContent.replace(/INSTRUCTOR_ALERT_EMAIL=.*$/m, envVar);
      console.log('🔄 Updated existing INSTRUCTOR_ALERT_EMAIL');
    } else {
      // Add new
      envContent += envContent.endsWith('\n') ? '' : '\n';
      envContent += `\n# Moderation Email Configuration\n${envVar}\n`;
      console.log('➕ Added new INSTRUCTOR_ALERT_EMAIL');
    }

    // Write the file
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Environment configuration saved');

    console.log('');
    console.log('🔧 Additional AWS SES Configuration Required:');
    console.log('');
    console.log('1. Verify Sender Email in AWS SES:');
    console.log('   • Go to AWS SES Console');
    console.log('   • Navigate to "Verified identities"');
    console.log('   • Add and verify a sender email (e.g., noreply@yourdomain.com)');
    console.log('   • Set SES_SENDER_EMAIL environment variable');
    console.log('');
    console.log('2. If in SES Sandbox (default):');
    console.log(`   • Also verify your recipient email: ${email}`);
    console.log('   • Or request production access to send to any email');
    console.log('');
    console.log('3. Required Environment Variables:');
    console.log(`   ✅ INSTRUCTOR_ALERT_EMAIL=${email}`);
    console.log('   ❓ SES_SENDER_EMAIL=noreply@yourdomain.com');
    console.log('   ❓ AWS_REGION=us-east-1');
    console.log('   ❓ AWS_ACCESS_KEY_ID=your_access_key');
    console.log('   ❓ AWS_SECRET_ACCESS_KEY=your_secret_key');
    console.log('');

    const testNow = await question('Would you like to run the email test now? (y/n): ');
    
    if (testNow.toLowerCase() === 'y' || testNow.toLowerCase() === 'yes') {
      console.log('');
      console.log('🚀 Running email notification test...');
      console.log('');
      
      // Run the test script
      const { spawn } = require('child_process');
      const testProcess = spawn('node', ['test-moderation-email-notification.js'], {
        stdio: 'inherit',
        env: { ...process.env, TEST_EMAIL: email }
      });
      
      testProcess.on('close', (code) => {
        console.log('');
        if (code === 0) {
          console.log('✅ Email test completed successfully!');
          console.log(`📧 Check your inbox at ${email} for test emails.`);
        } else {
          console.log('❌ Email test failed. Check AWS SES configuration.');
        }
        rl.close();
      });
    } else {
      console.log('');
      console.log('📋 Setup Complete!');
      console.log('');
      console.log('To test email notifications manually, run:');
      console.log('   node test-moderation-email-notification.js');
      console.log('');
      console.log('To trigger real moderation alerts:');
      console.log('1. Create content with inappropriate language');
      console.log('2. AI moderation will flag it automatically');
      console.log('3. You\'ll receive email notifications for medium/high severity flags');
      console.log('');
      rl.close();
    }

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    rl.close();
  }
}

// Run setup
setupModerationEmail();