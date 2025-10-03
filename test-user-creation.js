// Test creating a user with wilson.danny@me.com
const API_BASE_URL = 'https://class-cast.com/api';

async function testUserCreation() {
  console.log('🧪 Testing user creation for wilson.danny@me.com...\n');

  try {
    // Test 1: Try to create the user
    console.log('1️⃣ Attempting to create user...');
    const signupResponse = await fetch(`${API_BASE_URL}/auth/signup-simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'wilson.danny@me.com',
        firstName: 'Danny',
        lastName: 'Wilson',
        password: 'TestPassword123!',
        role: 'student',
        studentId: 'WILSON001'
      })
    });

    console.log('Signup Response Status:', signupResponse.status);
    const signupData = await signupResponse.json();
    console.log('Signup Response:', signupData);

    if (signupResponse.ok) {
      console.log('✅ User created successfully');
      
      // Test 2: Try to login with the newly created user
      console.log('\n2️⃣ Testing login with newly created user...');
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
      const loginData = await loginResponse.json();
      console.log('Login Response:', loginData);

      if (loginResponse.ok) {
        console.log('✅ Login successful with newly created user');
      } else {
        console.log('❌ Login failed with newly created user');
      }
    } else {
      console.log('❌ User creation failed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  console.log('\n🏁 User creation test completed');
}

// Run the test
testUserCreation();