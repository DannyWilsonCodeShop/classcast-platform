const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({ region: 'us-east-1' });
const apigateway = new AWS.APIGateway();
const lambda = new AWS.Lambda();

const API_ID = '785t4qadp8';
const LAMBDA_FUNCTION_NAME = 'classcast-content-moderation';

async function fixModerationEndpoints() {
  try {
    console.log('🔧 Fixing Content Moderation API Gateway endpoints...');

    // Get Lambda function ARN
    const lambdaFunction = await lambda.getFunction({ FunctionName: LAMBDA_FUNCTION_NAME }).promise();
    const lambdaArn = lambdaFunction.Configuration.FunctionArn;
    console.log('🔗 Lambda ARN:', lambdaArn);

    // Get existing resources
    const resources = await apigateway.getResources({ restApiId: API_ID }).promise();
    const moderationResource = resources.items.find(item => item.pathPart === 'moderation');
    const textResource = resources.items.find(item => item.pathPart === 'text' && item.parentId === moderationResource.id);
    const videoResource = resources.items.find(item => item.pathPart === 'video' && item.parentId === moderationResource.id);
    const submissionResource = resources.items.find(item => item.pathPart === 'submission' && item.parentId === moderationResource.id);

    console.log('📋 Found resources:');
    console.log('  Moderation:', moderationResource?.id);
    console.log('  Text:', textResource?.id);
    console.log('  Video:', videoResource?.id);
    console.log('  Submission:', submissionResource?.id);

    // Helper function to create method and integration
    async function createMethodAndIntegration(resourceId, resourceName) {
      console.log(`🔧 Setting up ${resourceName}...`);

      // Create POST method
      await apigateway.putMethod({
        restApiId: API_ID,
        resourceId: resourceId,
        httpMethod: 'POST',
        authorizationType: 'NONE'
      }).promise();

      // Create integration
      await apigateway.putIntegration({
        restApiId: API_ID,
        resourceId: resourceId,
        httpMethod: 'POST',
        type: 'AWS_PROXY',
        integrationHttpMethod: 'POST',
        uri: `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${lambdaArn}/invocations`
      }).promise();

      // Create OPTIONS method for CORS
      await apigateway.putMethod({
        restApiId: API_ID,
        resourceId: resourceId,
        httpMethod: 'OPTIONS',
        authorizationType: 'NONE'
      }).promise();

      // Create OPTIONS integration
      await apigateway.putIntegration({
        restApiId: API_ID,
        resourceId: resourceId,
        httpMethod: 'OPTIONS',
        type: 'MOCK',
        requestTemplates: {
          'application/json': '{"statusCode": 200}'
        }
      }).promise();

      // Create OPTIONS method response
      await apigateway.putMethodResponse({
        restApiId: API_ID,
        resourceId: resourceId,
        httpMethod: 'OPTIONS',
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Origin': true,
          'method.response.header.Access-Control-Allow-Methods': true
        }
      }).promise();

      // Create OPTIONS integration response
      await apigateway.putIntegrationResponse({
        restApiId: API_ID,
        resourceId: resourceId,
        httpMethod: 'OPTIONS',
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
          'method.response.header.Access-Control-Allow-Origin': "'*'",
          'method.response.header.Access-Control-Allow-Methods': "'POST,OPTIONS'"
        }
      }).promise();

      console.log(`✅ ${resourceName} setup complete`);
    }

    // Set up each resource
    if (textResource) {
      await createMethodAndIntegration(textResource.id, 'Text Moderation');
    }

    if (videoResource) {
      await createMethodAndIntegration(videoResource.id, 'Video Moderation');
    }

    if (submissionResource) {
      await createMethodAndIntegration(submissionResource.id, 'Submission Moderation');
    }

    // Deploy the API
    console.log('🚀 Deploying API...');
    const deployment = await apigateway.createDeployment({
      restApiId: API_ID,
      stageName: 'prod',
      description: 'Content moderation endpoints deployment v3'
    }).promise();

    console.log('✅ Content Moderation API Gateway setup complete!');
    console.log('📋 Deployment ID:', deployment.id);
    console.log('🔗 Base URL:', `https://${API_ID}.execute-api.us-east-1.amazonaws.com/prod`);

  } catch (error) {
    console.error('❌ Error fixing API Gateway:', error);
  }
}

// Run the fix
fixModerationEndpoints();
