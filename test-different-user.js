const https = require('https');

// Test with a different user
const testDifferentUser = () => {
  const signupData = {
    email: 'different-test@cristoreyatlanta.org',
    firstName: 'Different',
    lastName: 'Test',
    password: 'Test1234!',
    role: 'student'
  };

  const postData = JSON.stringify(signupData);

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

  console.log('Creating different test user...');

  const req = https.request(options, (res) => {
    console.log(`Signup Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('Signup Response:', data);
      
      if (res.statusCode === 201) {
        console.log('✅ User created successfully!');
        console.log('Now testing login...');
        
        // Test login after 2 seconds
        setTimeout(() => testLogin(), 2000);
      } else {
        console.log('❌ Signup failed');
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Signup error: ${e.message}`);
  });

  req.write(postData);
  req.end();
};

// Test user login
const testLogin = () => {
  const loginData = {
    email: 'different-test@cristoreyatlanta.org',
    password: 'Test1234!'
  };

  const postData = JSON.stringify(loginData);

  const options = {
    hostname: 'main.d166bugwfgjggz.amplifyapp.com',
    port: 443,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('Testing login for different user...');

  const req = https.request(options, (res) => {
    console.log(`Login Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('Login Response:', data);
      
      if (res.statusCode === 200) {
        console.log('✅ Login successful!');
      } else {
        console.log('❌ Login failed');
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Login error: ${e.message}`);
  });

  req.write(postData);
  req.end();
};

// Start the test
testDifferentUser();
