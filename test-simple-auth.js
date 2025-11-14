// Test the simple auth service directly
const { simpleCognitoAuthService } = require('./src/lib/auth-simple.ts');

async function testSimpleAuth() {
  try {
    console.log('Testing simple auth service login...');
    
    const result = await simpleCognitoAuthService.login('test-login@cristoreyatlanta.org', 'Test1234!');
    
    console.log('Simple auth login successful:', {
      username: result.user.username,
      email: result.user.email,
      role: result.user.role,
      status: result.user.status,
      hasAccessToken: !!result.accessToken,
      hasRefreshToken: !!result.refreshToken
    });
  } catch (error) {
    console.error('Simple auth login failed:', error.message);
  }
}

testSimpleAuth();
