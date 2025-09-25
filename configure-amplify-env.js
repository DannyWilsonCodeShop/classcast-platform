#!/usr/bin/env node

/**
 * Script to help configure AWS Amplify environment variables
 * Run this script to get the exact commands you need to run
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 AWS Amplify Environment Configuration Helper\n');

// Read environment variables from env-vars.txt
const envFile = path.join(__dirname, 'env-vars.txt');
if (!fs.existsSync(envFile)) {
  console.error('❌ env-vars.txt not found');
  process.exit(1);
}

const envContent = fs.readFileSync(envFile, 'utf8');
const envVars = envContent.split('\n')
  .filter(line => line.trim() && !line.startsWith('#'))
  .map(line => {
    const [key, value] = line.split('=');
    return { key: key.trim(), value: value.trim() };
  });

console.log('📋 Required Environment Variables for AWS Amplify:\n');

envVars.forEach(({ key, value }) => {
  console.log(`   ${key} = ${value}`);
});

console.log('\n⚠️  IMPORTANT: AWS Amplify doesn\'t allow environment variables starting with "AWS"');
console.log('   Use "REGION" instead of "AWS_REGION"');

console.log('\n🚀 How to Configure in AWS Amplify Console:\n');
console.log('1. Go to AWS Amplify Console');
console.log('2. Select your app: classcast-platform');
console.log('3. Go to Environment Variables in the left sidebar');
console.log('4. Add each variable above');
console.log('5. Save and redeploy your app\n');

console.log('🔑 Important Notes:');
console.log('- Make sure your Amplify app has the correct IAM role');
console.log('- The IAM role needs DynamoDB and S3 permissions');
console.log('- After adding variables, trigger a new deployment\n');

console.log('✅ Alternative: Test locally with `npm run dev`');
console.log('   Local environment has AWS credentials configured');
