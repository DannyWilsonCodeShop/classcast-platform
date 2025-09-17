const fetch = require('node-fetch');

async function testSignupAPI() {
  try {
    console.log('🔍 Testing signup API endpoint...\n');

    const testUser = {
      email: `test-${Date.now()}@example.com`,
      firstName: 'Test',
      lastName: 'User',
      password: 'TestPassword123!',
      role: 'student',
      studentId: 'TEST001'
    };

    console.log('📝 Test user data:', testUser);

    // Test the signup API
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Signup API successful!');
      console.log('📋 Response:', {
        message: result.message,
        user: result.user,
        nextStep: result.nextStep
      });
    } else {
      console.log('❌ Signup API failed:');
      console.log('Status:', response.status);
      console.log('Error:', result);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSignupAPI();
