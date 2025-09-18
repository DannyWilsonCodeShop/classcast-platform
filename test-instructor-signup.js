const testInstructorSignup = async () => {
  const testInstructor = {
    email: `instructor-test-${Date.now()}@example.com`,
    firstName: 'Test',
    lastName: 'Instructor',
    password: 'TestPassword123!',
    role: 'instructor',
    department: 'Computer Science'
  };

  console.log('Testing instructor signup with:', testInstructor);

  try {
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testInstructor),
    });

    const result = await response.json();
    console.log('Instructor signup response status:', response.status);
    console.log('Instructor signup response:', result);

    if (response.ok) {
      console.log('✅ Instructor signup successful!');
      console.log('User data:', result.user);
      console.log('Requires email confirmation:', result.requiresEmailConfirmation);
    } else {
      console.log('❌ Instructor signup failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Instructor signup test error:', error);
  }
};

testInstructorSignup();
