const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testAuthFlow() {
  console.log('🧪 Testing Authentication Flow...\n');

  // Test 1: Student Signup
  console.log('1️⃣ Testing Student Signup...');
  try {
    const signupResponse = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'teststudent@example.com',
        firstName: 'Test',
        lastName: 'Student',
        password: 'TestPassword123!',
        role: 'student',
        studentId: 'STU123456',
      }),
    });

    const signupData = await signupResponse.json();
    console.log('Signup Response Status:', signupResponse.status);
    console.log('Signup Response:', JSON.stringify(signupData, null, 2));
    
    if (signupResponse.ok) {
      console.log('✅ Student signup successful!');
    } else {
      console.log('❌ Student signup failed');
    }
  } catch (error) {
    console.log('❌ Student signup error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Instructor Signup
  console.log('2️⃣ Testing Instructor Signup...');
  try {
    const signupResponse = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'testinstructor@example.com',
        firstName: 'Test',
        lastName: 'Instructor',
        password: 'TestPassword123!',
        role: 'instructor',
        department: 'Computer Science',
      }),
    });

    const signupData = await signupResponse.json();
    console.log('Signup Response Status:', signupResponse.status);
    console.log('Signup Response:', JSON.stringify(signupData, null, 2));
    
    if (signupResponse.ok) {
      console.log('✅ Instructor signup successful!');
    } else {
      console.log('❌ Instructor signup failed');
    }
  } catch (error) {
    console.log('❌ Instructor signup error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Student Login
  console.log('3️⃣ Testing Student Login...');
  try {
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'teststudent@example.com',
        password: 'TestPassword123!',
      }),
    });

    const loginData = await loginResponse.json();
    console.log('Login Response Status:', loginResponse.status);
    console.log('Login Response:', JSON.stringify(loginData, null, 2));
    
    if (loginResponse.ok) {
      console.log('✅ Student login successful!');
    } else {
      console.log('❌ Student login failed');
    }
  } catch (error) {
    console.log('❌ Student login error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 4: Instructor Login
  console.log('4️⃣ Testing Instructor Login...');
  try {
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'testinstructor@example.com',
        password: 'TestPassword123!',
      }),
    });

    const loginData = await loginResponse.json();
    console.log('Login Response Status:', loginResponse.status);
    console.log('Login Response:', JSON.stringify(loginData, null, 2));
    
    if (loginResponse.ok) {
      console.log('✅ Instructor login successful!');
    } else {
      console.log('❌ Instructor login failed');
    }
  } catch (error) {
    console.log('❌ Instructor login error:', error.message);
  }

  console.log('\n🎉 Authentication flow test completed!');
}

// Run the test
testAuthFlow().catch(console.error);
