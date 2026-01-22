#!/usr/bin/env node

/**
 * Test Password Reset Functionality
 */

const fetch = require('node-fetch');

async function testPasswordReset() {
  console.log('🧪 Testing Password Reset Functionality');
  console.log('======================================\n');

  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  // Test 1: Forgot Password
  console.log('1. Testing forgot password endpoint...');
  
  try {
    const forgotResponse = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com'
      })
    });
    
    const forgotResult = await forgotResponse.json();
    console.log('✅ Forgot password response:', forgotResult);
    
  } catch (error) {
    console.log('❌ Forgot password test failed:', error.message);
  }
  
  // Test 2: Check SES Configuration
  console.log('\n2. Testing SES configuration...');
  
  try {
    const AWS = require('aws-sdk');
    const ses = new AWS.SES({ region: process.env.AWS_REGION || 'us-east-1' });
    
    const identities = await ses.listIdentities().promise();
    console.log('✅ SES identities:', identities.Identities);
    
    const quota = await ses.getSendQuota().promise();
    console.log('✅ SES quota:', quota);
    
  } catch (error) {
    console.log('❌ SES test failed:', error.message);
  }
  
  console.log('\n🎯 Test completed!');
}

testPasswordReset();