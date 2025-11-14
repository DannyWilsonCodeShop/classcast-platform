// Debug login for wilson.danny@me.com
const API_BASE_URL = 'https://class-cast.com/api';

async function debugLogin() {
  console.log('🔍 Debugging login for wilson.danny@me.com...\n');

  try {
    // Test 1: Try to login
    console.log('1️⃣ Attempting login...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'wilson.danny@me.com',
        password: 'TestPassword123!'
      })
    });

    console.log('Login Response Status:', loginResponse.status);
    console.log('Login Response Headers:', Object.fromEntries(loginResponse.headers.entries()));

    const loginData = await loginResponse.text();
    console.log('Login Response Body:', loginData);

    if (loginResponse.ok) {
      console.log('✅ Login successful');
    } else {
      console.log('❌ Login failed');
    }

    // Test 2: Check if user exists in database
    console.log('\n2️⃣ Checking if user exists in database...');
    const userResponse = await fetch(`${API_BASE_URL}/debug/user-id?email=wilson.danny@me.com`);
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('User lookup result:', userData);
    } else {
      console.log('User lookup failed:', userResponse.status);
    }

    // Test 3: Try with test credentials
    console.log('\n3️⃣ Testing with known test credentials...');
    const testResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'teststudent@classcast.com',
        password: 'TestPassword123!'
      })
    });

    console.log('Test Login Status:', testResponse.status);
    const testData = await testResponse.text();
    console.log('Test Login Response:', testData);

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }

  console.log('\n🏁 Debug completed');
}

// Run the debug
debugLogin();