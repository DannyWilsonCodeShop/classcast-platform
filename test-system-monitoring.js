#!/usr/bin/env node

/**
 * Test System Monitoring and Email Notifications
 * This script tests the system health monitoring and email notification system
 */

require('dotenv').config({ path: '.env.local' });

const { systemMonitor } = require('./src/lib/systemMonitoring.ts');

async function testSystemMonitoring() {
  console.log('🔍 Testing System Monitoring and Email Notifications...\n');

  try {
    // Test health check
    console.log('1. Running system health check...');
    await systemMonitor.runHealthCheck();
    
    console.log('\n2. Testing manual health check API...');
    const response = await fetch('http://localhost:3000/api/system/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Health check API response:', result);
    } else {
      console.log('❌ Health check API failed:', response.status, response.statusText);
    }

    console.log('\n3. Testing forced notification...');
    const forceResponse = await fetch('http://localhost:3000/api/system/health', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ forceNotification: true }),
    });

    if (forceResponse.ok) {
      const result = await forceResponse.json();
      console.log('✅ Forced notification response:', result);
    } else {
      console.log('❌ Forced notification failed:', forceResponse.status, forceResponse.statusText);
    }

    console.log('\n✅ System monitoring test completed!');
    console.log('\n📧 Check your email at wilson.danny@me.com for any notifications.');
    console.log('\n📋 System monitoring features:');
    console.log('   - Automatic health checks every 5 minutes');
    console.log('   - Email notifications for critical issues');
    console.log('   - 15-minute cooldown between notifications');
    console.log('   - Monitors DynamoDB, Cognito, S3, and Lambda functions');
    console.log('   - CloudWatch metrics integration');

  } catch (error) {
    console.error('❌ System monitoring test failed:', error);
  }
}

// Run the test
testSystemMonitoring();
