#!/usr/bin/env node

const fs = require('fs');

// Cognito configuration from AWS
const cognitoConfig = {
  userPoolId: 'us-east-1_uK50qBrap',
  clientId: '7tbaq74itv3gdda1bt25iqafvh',
  identityPoolId: 'us-east-1:463470937777'
};

console.log('🔧 Updating Cognito Configuration...');

// Update the cognitoAuth.ts file
const cognitoAuthPath = 'src/lib/cognitoAuth.ts';
let cognitoAuthContent = fs.readFileSync(cognitoAuthPath, 'utf8');

// Replace the placeholder values
cognitoAuthContent = cognitoAuthContent.replace(
  "const USER_POOL_ID = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || 'us-east-1_XXXXXXXXX';",
  `const USER_POOL_ID = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '${cognitoConfig.userPoolId}';`
);

cognitoAuthContent = cognitoAuthContent.replace(
  "const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || 'your-client-id';",
  `const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '${cognitoConfig.clientId}';`
);

cognitoAuthContent = cognitoAuthContent.replace(
  "const IDENTITY_POOL_ID = process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID || 'your-identity-pool-id';",
  `const IDENTITY_POOL_ID = process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID || '${cognitoConfig.identityPoolId}';`
);

fs.writeFileSync(cognitoAuthPath, cognitoAuthContent);
console.log('✅ Updated cognitoAuth.ts with real Cognito configuration');

// Create a comprehensive configuration file
const config = {
  aws: {
    region: 'us-east-1',
    cognito: {
      userPoolId: cognitoConfig.userPoolId,
      clientId: cognitoConfig.clientId,
      identityPoolId: cognitoConfig.identityPoolId,
      region: 'us-east-1'
    },
    ses: {
      fromEmail: 'noreply@myclasscast.com',
      replyToEmail: 'support@myclasscast.com',
      verified: true
    },
    cloudwatch: {
      namespace: 'ClassCast/Platform',
      logGroup: '/classcast/platform',
      enabled: true
    },
    apiGateway: {
      url: 'https://785t4qadp8.execute-api.us-east-1.amazonaws.com/prod'
    }
  },
  environment: {
    NEXT_PUBLIC_COGNITO_USER_POOL_ID: cognitoConfig.userPoolId,
    NEXT_PUBLIC_COGNITO_CLIENT_ID: cognitoConfig.clientId,
    NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID: cognitoConfig.identityPoolId,
    NEXT_PUBLIC_API_GATEWAY_URL: 'https://785t4qadp8.execute-api.us-east-1.amazonaws.com/prod',
    API_GATEWAY_URL: 'https://785t4qadp8.execute-api.us-east-1.amazonaws.com/prod',
    FROM_EMAIL: 'noreply@myclasscast.com',
    REPLY_TO_EMAIL: 'support@myclasscast.com',
    AWS_REGION: 'us-east-1',
    NEXT_PUBLIC_APP_URL: 'https://myclasscast.com',
    NODE_ENV: 'production'
  },
  timestamp: new Date().toISOString()
};

fs.writeFileSync('cognito-config.json', JSON.stringify(config, null, 2));
console.log('✅ Created cognito-config.json with complete configuration');

// Generate environment variables for deployment
const envVars = Object.entries(config.environment)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');

fs.writeFileSync('env-vars.txt', envVars);
console.log('✅ Created env-vars.txt for deployment');

console.log('\n🎉 Cognito configuration updated successfully!');
console.log('\n📋 Configuration Summary:');
console.log(`   User Pool ID: ${cognitoConfig.userPoolId}`);
console.log(`   Client ID: ${cognitoConfig.clientId}`);
console.log(`   Identity Pool ID: ${cognitoConfig.identityPoolId}`);
console.log(`   API Gateway: https://785t4qadp8.execute-api.us-east-1.amazonaws.com/prod`);
console.log(`   SES Email: noreply@myclasscast.com`);
console.log(`   CloudWatch: ClassCast/Platform namespace`);
