const https = require('https');

const testData = {
  email: 'no-verification-test@cristoreyatlanta.org',
  firstName: 'No',
  lastName: 'Verification',
  password: 'Test1234!',
  role: 'student'
};

const postData = JSON.stringify(testData);

const options = {
  hostname: 'main.d166bugwfgjggz.amplifyapp.com',
  port: 443,
  path: '/api/auth/signup',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Testing signup without email verification...');
console.log('Creating user:', testData.email);

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response:', data);
    try {
      const responseData = JSON.parse(data);
      if (res.statusCode === 201) {
        console.log('✅ User created successfully!');
        console.log('📧 No email verification required');
        console.log('User should be able to log in immediately');
        console.log('Email verified:', responseData.user.emailVerified);
        console.log('Requires confirmation:', responseData.requiresEmailConfirmation);
      } else {
        console.log('❌ Signup failed:', responseData.message);
      }
    } catch (e) {
      console.log('Response is not JSON:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();
