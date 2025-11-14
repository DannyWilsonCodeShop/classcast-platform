const https = require('https');

// Test API status
const testAPIStatus = () => {
  const options = {
    hostname: 'main.d166bugwfgjggz.amplifyapp.com',
    port: 443,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength('{"email":"test@test.com","password":"test123456"}')
    }
  };

  console.log('Testing API status...');

  const req = https.request(options, (res) => {
    console.log(`API Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('API Response:', data);
      
      if (res.statusCode === 400) {
        console.log('✅ API is working (validation error expected)');
      } else if (res.statusCode === 401) {
        console.log('✅ API is working (auth error expected)');
      } else {
        console.log('❌ API might have issues');
      }
    });
  });

  req.on('error', (e) => {
    console.error(`API Error: ${e.message}`);
  });

  req.write('{"email":"test@test.com","password":"test123456"}');
  req.end();
};

testAPIStatus();
