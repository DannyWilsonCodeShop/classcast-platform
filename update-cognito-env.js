const fs = require('fs');
const path = require('path');

// Update .env.local with correct Cognito configuration
const envPath = path.join(__dirname, '.env.local');

// Read current .env.local
let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

// Update Cognito configuration
envContent = envContent.replace(
  /NEXT_PUBLIC_COGNITO_USER_POOL_ID=.*/,
  'NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_uK50qBrap'
);

envContent = envContent.replace(
  /NEXT_PUBLIC_COGNITO_CLIENT_ID=.*/,
  'NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=7tbaq74itv3gdda1bt25iqafvh'
);

// Add the client ID with the old name for backward compatibility
if (!envContent.includes('NEXT_PUBLIC_COGNITO_CLIENT_ID=')) {
  envContent += '\nNEXT_PUBLIC_COGNITO_CLIENT_ID=7tbaq74itv3gdda1bt25iqafvh';
}

// Write updated .env.local
fs.writeFileSync(envPath, envContent);

console.log('✅ Updated .env.local with correct Cognito configuration:');
console.log('   User Pool ID: us-east-1_uK50qBrap');
console.log('   Client ID: 7tbaq74itv3gdda1bt25iqafvh');
console.log('');
console.log('Now test the forgot password functionality!');
