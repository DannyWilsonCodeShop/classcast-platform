#!/usr/bin/env node

/**
 * Script to configure AWS Amplify environment variables via AWS CLI
 * This will add the required environment variables to your Amplify app
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔧 AWS Amplify Environment Variables Configuration\n');

// Environment variables to add
const envVars = {
  'REGION': 'us-east-1',
  'USERS_TABLE_NAME': 'classcast-users',
  'S3_ASSETS_BUCKET': 'cdk-hnb659fds-assets-463470937777-us-east-1',
  'S3_VIDEOS_BUCKET': 'classcast-videos-463470937777-us-east-1',
  'ASSIGNMENTS_TABLE_NAME': 'classcast-assignments',
  'SUBMISSIONS_TABLE_NAME': 'classcast-submissions',
  'COURSES_TABLE_NAME': 'classcast-courses',
  'CONTENT_MODERATION_TABLE_NAME': 'classcast-content-moderation',
  'FROM_EMAIL': 'noreply@myclasscast.com',
  'REPLY_TO_EMAIL': 'support@myclasscast.com',
  'NODE_ENV': 'production'
};

async function configureAmplifyEnvVars() {
  try {
    console.log('📋 Environment variables to configure:');
    Object.entries(envVars).forEach(([key, value]) => {
      console.log(`   ${key} = ${value}`);
    });
    console.log('');

    // First, let's get the app ID
    console.log('🔍 Finding your Amplify app...');
    const listAppsCmd = 'aws amplify list-apps --query "apps[?name==\'classcast-platform\'].appId" --output text';
    const appId = execSync(listAppsCmd, { encoding: 'utf8' }).trim();
    
    if (!appId) {
      console.error('❌ Could not find Amplify app "classcast-platform"');
      console.log('Available apps:');
      execSync('aws amplify list-apps --query "apps[].name" --output table', { stdio: 'inherit' });
      return;
    }
    
    console.log(`✅ Found app ID: ${appId}\n`);

    // Get the branch name
    console.log('🔍 Finding your branch...');
    const listBranchesCmd = `aws amplify list-branches --app-id ${appId} --query "branches[?branchName=='development/testing-branch'].branchName" --output text`;
    const branchName = execSync(listBranchesCmd, { encoding: 'utf8' }).trim();
    
    if (!branchName) {
      console.error('❌ Could not find branch "development/testing-branch"');
      console.log('Available branches:');
      execSync(`aws amplify list-branches --app-id ${appId} --query "branches[].branchName" --output table`, { stdio: 'inherit' });
      return;
    }
    
    console.log(`✅ Found branch: ${branchName}\n`);

    // Configure environment variables
    console.log('⚙️  Configuring environment variables...');
    
    for (const [key, value] of Object.entries(envVars)) {
      try {
        console.log(`   Adding ${key}...`);
        
        // Use AWS CLI to update the app's environment variables
        const updateCmd = `aws amplify update-app --app-id ${appId} --environment-variables ${key}=${value}`;
        execSync(updateCmd, { stdio: 'pipe' });
        
        console.log(`   ✅ ${key} added successfully`);
      } catch (error) {
        console.log(`   ⚠️  ${key} might already exist or there was an issue`);
      }
    }

    console.log('\n🎉 Environment variables configuration completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Wait 2-3 minutes for the changes to propagate');
    console.log('2. Test the API: curl https://development-testing-branch.d166bugwfgjggz.amplifyapp.com/api/debug/env');
    console.log('3. Try the profile save functionality again');

  } catch (error) {
    console.error('❌ Error configuring environment variables:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure AWS CLI is installed: aws --version');
    console.log('2. Make sure AWS CLI is configured: aws configure list');
    console.log('3. Make sure you have permissions to modify Amplify apps');
    console.log('4. Try running: aws sts get-caller-identity');
  }
}

// Check if AWS CLI is available
try {
  execSync('aws --version', { stdio: 'pipe' });
  configureAmplifyEnvVars();
} catch (error) {
  console.error('❌ AWS CLI is not installed or not in PATH');
  console.log('\n📦 Install AWS CLI:');
  console.log('   macOS: brew install awscli');
  console.log('   Windows: Download from https://aws.amazon.com/cli/');
  console.log('   Linux: sudo apt-get install awscli');
  console.log('\n🔧 After installation, configure it:');
  console.log('   aws configure');
}
