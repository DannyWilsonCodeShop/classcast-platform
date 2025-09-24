const { LambdaClient, UpdateFunctionConfigurationCommand } = require('@aws-sdk/client-lambda');

const lambdaClient = new LambdaClient({ region: 'us-east-1' });

const CORRECT_ROLE_ARN = 'arn:aws:iam::463470937777:role/classcast-lambda-role';

// List of all Lambda functions that need to be updated
const functionsToUpdate = [
  'classcast-create-assignment',
  'classcast-signup-confirmation',
  'classcast-jwt-verifier',
  'classcast-role-based-signup',
  'classcast-process-video-submission',
  'classcast-signup-handler',
  'classcast-generate-video-upload-url',
  'classcast-role-management',
  'classcast-content-moderation',
  'classcast-fetch-grades',
  'classcast-fetch-submissions',
  'classcast-refresh-token-handler',
  'classcast-custom-message',
  'classcast-signin-handler',
  'classcast-instructor-community-feed',
  'classcast-grade-submission',
  'classcast-signout-handler',
  'classcast-confirm-password-reset',
  'classcast-fetch-assignments',
  'classcast-resend-confirmation',
  'classcast-pre-token-generation',
  'classcast-post-confirmation',
  'classcast-session-management',
  'classcast-forgot-password-handler'
];

async function updateFunctionRole(functionName) {
  try {
    console.log(`Updating ${functionName}...`);
    
    const command = new UpdateFunctionConfigurationCommand({
      FunctionName: functionName,
      Role: CORRECT_ROLE_ARN
    });
    
    const result = await lambdaClient.send(command);
    console.log(`✅ ${functionName} updated successfully`);
    return { success: true, functionName };
  } catch (error) {
    console.error(`❌ Failed to update ${functionName}:`, error.message);
    return { success: false, functionName, error: error.message };
  }
}

async function updateAllLambdaRoles() {
  console.log('🔧 Updating all Lambda function roles...\n');
  
  const results = [];
  
  for (const functionName of functionsToUpdate) {
    const result = await updateFunctionRole(functionName);
    results.push(result);
    
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n📊 Summary:');
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successfully updated: ${successful.length} functions`);
  console.log(`❌ Failed to update: ${failed.length} functions`);
  
  if (failed.length > 0) {
    console.log('\n❌ Failed functions:');
    failed.forEach(f => console.log(`  - ${f.functionName}: ${f.error}`));
  }
  
  console.log('\n🎉 Lambda role update completed!');
}

updateAllLambdaRoles().catch(console.error);

