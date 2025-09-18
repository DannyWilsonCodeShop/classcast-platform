const https = require('https');

// Test environment variables
const testEnv = () => {
  const options = {
    hostname: 'main.d166bugwfgjggz.amplifyapp.com',
    port: 443,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength('{"email":"test","password":"test"}')
    }
  };

  console.log('Testing environment variables...');

  const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('Response:', data);
    });
  });

  req.on('error', (e) => {
    console.error(`Error: ${e.message}`);
  });

  req.write('{"email":"test","password":"test"}');
  req.end();
};

testEnv();
