// Test JWT generation
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

console.log('Testing JWT generation...');
console.log('JWT_SECRET:', JWT_SECRET ? 'Set' : 'Not set');

try {
  const payload = {
    userId: 'test-user-123',
    email: 'test@example.com',
    role: 'student',
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: '1h',
  });

  console.log('✅ JWT generation successful');
  console.log('Token length:', token.length);
  console.log('Token preview:', token.substring(0, 50) + '...');

  // Test verification
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('✅ JWT verification successful');
  console.log('Decoded payload:', decoded);

} catch (error) {
  console.error('❌ JWT generation failed:', error.message);
}
