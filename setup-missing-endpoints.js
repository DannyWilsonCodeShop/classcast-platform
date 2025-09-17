const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({ region: 'us-east-1' });
const apigateway = new AWS.APIGateway();
const lambda = new AWS.Lambda();

const API_ID = '785t4qadp8';
const LAMBDA_FUNCTION_NAME = 'classcast-content-moderation';

async function setupMissingEndpoints() {
  try {
    console.log('🔧 Setting up missing Content Moderation endpoints...');

    // Get Lambda function ARN
    const lambdaFunction = await lambda.getFunction({ FunctionName: LAMBDA_FUNCTION_NAME }).promise();
    const lambdaArn = lambdaFunction.Configuration.FunctionArn;

    // Get existing resources
    const resources = await apigateway.getResources({ restApiId: API_ID }).promise();
    const moderationResource = resources.items.find(item => item.pathPart === 'moderation');
    const videoResource = resources.items.find(item => item.pathPart === 'video' && item.parentId === moderationResource.id);
    const submissionResource = resources.items.find(item => item.pathPart === 'submission' && item.parentId === moderationResource.id);

    console.log('📋 Setting up missing resources:');
    console.log('  Video:', videoResource?.id);
    console.log('  Submission:', submissionResource?.id);

    // Helper function to create method and integration
    async function createMethodAndIntegration(resourceId, resourceName) {
      console.log(`🔧 Setting up ${resourceName}...`);

      try {
        // Create POST method
        await apigateway.putMethod({
          restApiId: API_ID,
          resourceId: resourceId,
          httpMethod: 'POST',
          authorizationType: 'NONE'
        }).promise();
        console.log(`  ✅ POST method created for ${resourceName}`);

        // Create integration
        await apigateway.putIntegration({
          restApiId: API_ID,
          resourceId: resourceId,
          httpMethod: 'POST',
          type: 'AWS_PROXY',
          integrationHttpMethod: 'POST',
          uri: `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${lambdaArn}/invocations`
        }).promise();
        console.log(`  ✅ Integration created for ${resourceName}`);

        // Create OPTIONS method for CORS
        await apigateway.putMethod({
          restApiId: API_ID,
          resourceId: resourceId,
          httpMethod: 'OPTIONS',
          authorizationType: 'NONE'
        }).promise();
        console.log(`  ✅ OPTIONS method created for ${resourceName}`);

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
        console.log(`  ✅ OPTIONS integration created for ${resourceName}`);

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
        console.log(`  ✅ OPTIONS method response created for ${resourceName}`);

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
        console.log(`  ✅ OPTIONS integration response created for ${resourceName}`);

        console.log(`✅ ${resourceName} setup complete`);
      } catch (error) {
        if (error.code === 'ConflictException') {
          console.log(`  ⚠️ ${resourceName} already exists, skipping...`);
        } else {
          throw error;
        }
      }
    }

    // Set up missing resources
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
      description: 'Content moderation endpoints deployment v4'
    }).promise();

    console.log('✅ Content Moderation API Gateway setup complete!');
    console.log('📋 Deployment ID:', deployment.id);
    console.log('🔗 Base URL:', `https://${API_ID}.execute-api.us-east-1.amazonaws.com/prod`);
    console.log('📝 Endpoints:');
    console.log('   POST /moderation/text');
    console.log('   POST /moderation/video');
    console.log('   POST /moderation/submission');

  } catch (error) {
    console.error('❌ Error setting up API Gateway:', error);
  }
}

// Run the setup
setupMissingEndpoints();
