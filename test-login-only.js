const https = require('https');

// Test user login
const testLogin = () => {
  const loginData = {
    email: 'test-login@cristoreyatlanta.org',
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

  console.log('Testing login for confirmed user...');

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
testLogin();
