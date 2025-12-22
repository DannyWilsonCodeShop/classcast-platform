#!/usr/bin/env node

/**
 * Simple test script to verify demo user functionality
 * Usage: node test-demo-user.js
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testDemoLogin() {
  console.log('🧪 Testing demo user login...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'demo@email.com',
        password: 'Demo1234!'
      })
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Demo login successful!');
      console.log('   User ID:', data.user.id);
      console.log('   Email:', data.user.email);
      console.log('   Role:', data.user.role);
      console.log('   Is Demo User:', data.user.isDemoUser);
      console.log('   Target User:', data.user.demoViewingUserId);
      return data.tokens.accessToken;
    } else {
      console.log('❌ Demo login failed:', data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Login request failed:', error.message);
    return null;
  }
}

async function testDemoAPI(token) {
  console.log('\n🔍 Testing demo API access...');
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'X-Demo-Mode': 'true',
    'X-Demo-Target-User': 'dwilson1919@gmail.com'
  };

  // Test profile API
  try {
    const response = await fetch(`${BASE_URL}/api/profile?userId=demo-user-123`, {
      headers
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Profile API working');
      console.log('   Viewing profile for:', data.data.email);
    } else {
      console.log('⚠️  Profile API issue:', data.error);
    }
  } catch (error) {
    console.log('❌ Profile API failed:', error.message);
  }

  // Test feed API
  try {
    const response = await fetch(`${BASE_URL}/api/student/feed?userId=demo-user-123`, {
      headers
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Feed API working');
      console.log('   Feed items:', data.data?.length || 0);
    } else {
      console.log('⚠️  Feed API issue:', data.error);
    }
  } catch (error) {
    console.log('❌ Feed API failed:', error.message);
  }
}

async function main() {
  console.log('🎭 ClassCast Demo User Test');
  console.log('===========================');
  console.log('');
  console.log('Make sure your development server is running on http://localhost:3000');
  console.log('');

  const token = await testDemoLogin();
  
  if (token) {
    await testDemoAPI(token);
  }

  console.log('\n🎯 Test complete!');
  console.log('');
  console.log('To test manually:');
  console.log('1. Go to http://localhost:3000/auth/login');
  console.log('2. Login with: demo@email.com / Demo1234!');
  console.log('3. You should see a demo banner and dwilson1919@gmail.com\'s data');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testDemoLogin, testDemoAPI };