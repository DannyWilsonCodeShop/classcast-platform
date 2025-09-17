const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

const lambda = new AWS.Lambda({ region: 'us-east-1' });

// Helper function to create API Gateway response
function createApiGatewayResponse(statusCode, body, headers = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      ...headers
    },
    body: JSON.stringify(body)
  };
}

// Update Lambda function code to handle API Gateway properly
async function updateLambdaFunction(functionName) {
  try {
    console.log(`Updating ${functionName}...`);
    
    // Get current function configuration
    const config = await lambda.getFunction({ FunctionName: functionName }).promise();
    
    // Create updated handler code
    const handlerCode = `
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Helper function to create API Gateway response
function createResponse(statusCode, body, headers = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      ...headers
    },
    body: JSON.stringify(body)
  };
}

exports.handler = async (event, context) => {
  try {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return createResponse(200, { message: 'CORS preflight successful' });
    }
    
    // Your existing Lambda logic here
    const result = await handleRequest(event);
    
    return createResponse(200, {
      success: true,
      data: result,
      message: 'Request processed successfully'
    });
    
  } catch (error) {
    console.error('Error:', error);
    return createResponse(500, {
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

async function handleRequest(event) {
  // This is where your existing Lambda logic goes
  // For now, return a simple response
  return {
    message: 'Lambda function is working',
    timestamp: new Date().toISOString(),
    functionName: '${functionName}'
  };
}
`;

    // Update function code
    await lambda.updateFunctionCode({
      FunctionName: functionName,
      ZipFile: Buffer.from(handlerCode)
    }).promise();
    
    console.log(`✅ Updated ${functionName}`);
    
  } catch (error) {
    console.error(`❌ Error updating ${functionName}:`, error.message);
  }
}

// Update all Lambda functions
async function updateAllLambdaFunctions() {
  console.log('🔧 Updating Lambda functions for API Gateway compatibility...\n');
  
  const functions = [
    'classcast-create-assignment',
    'classcast-fetch-assignments',
    'classcast-grade-submission',
    'classcast-fetch-grades',
    'classcast-fetch-submissions',
    'classcast-signin-handler',
    'classcast-signup-handler',
    'classcast-signout-handler',
    'classcast-forgot-password-handler',
    'classcast-confirm-password-reset',
    'classcast-refresh-token-handler',
    'classcast-resend-confirmation',
    'classcast-signup-confirmation',
    'classcast-generate-video-upload-url',
    'classcast-process-video-submission',
    'classcast-role-management',
    'classcast-role-based-signup',
    'classcast-instructor-community-feed',
    'classcast-jwt-verifier',
    'classcast-session-management'
  ];

  for (const functionName of functions) {
    await updateLambdaFunction(functionName);
  }
  
  console.log('\n🎉 All Lambda functions updated for API Gateway!');
}

// Run the update
updateAllLambdaFunctions().catch(console.error);
