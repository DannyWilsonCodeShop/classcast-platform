const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({ region: 'us-east-1' });
const apigateway = new AWS.APIGateway();
const lambda = new AWS.Lambda();

const API_NAME = 'ClassCast-API-V2';
const LAMBDA_FUNCTION_NAME = 'classcast-content-moderation';

async function setupModerationEndpoints() {
  try {
    console.log('🚀 Setting up Content Moderation API Gateway endpoints...');

    // Get the existing API
    const apis = await apigateway.getRestApis().promise();
    const api = apis.items.find(item => item.name === API_NAME);
    
    if (!api) {
      console.error('❌ API not found:', API_NAME);
      return;
    }

    console.log('📋 Found API:', api.id);

    // Get Lambda function ARN
    const lambdaFunction = await lambda.getFunction({ FunctionName: LAMBDA_FUNCTION_NAME }).promise();
    const lambdaArn = lambdaFunction.Configuration.FunctionArn;
    console.log('🔗 Lambda ARN:', lambdaArn);

    // Create moderation resource
    console.log('📁 Creating /moderation resource...');
    const moderationResource = await apigateway.createResource({
      restApiId: api.id,
      parentId: api.rootResourceId,
      pathPart: 'moderation'
    }).promise();

    // Create text sub-resource
    console.log('📁 Creating /moderation/text resource...');
    const textResource = await apigateway.createResource({
      restApiId: api.id,
      parentId: moderationResource.id,
      pathPart: 'text'
    }).promise();

    // Create video sub-resource
    console.log('📁 Creating /moderation/video resource...');
    const videoResource = await apigateway.createResource({
      restApiId: api.id,
      parentId: moderationResource.id,
      pathPart: 'video'
    }).promise();

    // Create submission sub-resource
    console.log('📁 Creating /moderation/submission resource...');
    const submissionResource = await apigateway.createResource({
      restApiId: api.id,
      parentId: moderationResource.id,
      pathPart: 'submission'
    }).promise();

    // Helper function to create method and integration
    async function createMethodAndIntegration(resourceId, method) {
      console.log(`🔧 Creating ${method} method for resource ${resourceId}...`);
      
      // Create method
      await apigateway.putMethod({
        restApiId: api.id,
        resourceId: resourceId,
        httpMethod: method,
        authorizationType: 'NONE'
      }).promise();

      // Create integration
      await apigateway.putIntegration({
        restApiId: api.id,
        resourceId: resourceId,
        httpMethod: method,
        type: 'AWS_PROXY',
        integrationHttpMethod: 'POST',
        uri: `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${lambdaArn}/invocations`
      }).promise();

      // Add CORS method
      await apigateway.putMethod({
        restApiId: api.id,
        resourceId: resourceId,
        httpMethod: 'OPTIONS',
        authorizationType: 'NONE'
      }).promise();

      // Add CORS integration
      await apigateway.putIntegration({
        restApiId: api.id,
        resourceId: resourceId,
        httpMethod: 'OPTIONS',
        type: 'MOCK',
        requestTemplates: {
          'application/json': '{"statusCode": 200}'
        }
      }).promise();

      // Add CORS response
      await apigateway.putMethodResponse({
        restApiId: api.id,
        resourceId: resourceId,
        httpMethod: 'OPTIONS',
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Origin': true,
          'method.response.header.Access-Control-Allow-Methods': true
        }
      }).promise();
    }

    // Create methods for each resource
    await createMethodAndIntegration(textResource.id, 'POST');
    await createMethodAndIntegration(videoResource.id, 'POST');
    await createMethodAndIntegration(submissionResource.id, 'POST');

    // Deploy the API
    console.log('🚀 Deploying API...');
    const deployment = await apigateway.createDeployment({
      restApiId: api.id,
      stageName: 'prod',
      description: 'Content moderation endpoints deployment'
    }).promise();

    console.log('✅ Content Moderation API Gateway setup complete!');
    console.log('📋 API ID:', api.id);
    console.log('🔗 Base URL:', `https://${api.id}.execute-api.us-east-1.amazonaws.com/prod`);
    console.log('📝 Endpoints:');
    console.log('   POST /moderation/text');
    console.log('   POST /moderation/video');
    console.log('   POST /moderation/submission');

  } catch (error) {
    console.error('❌ Error setting up API Gateway:', error);
  }
}

// Run the setup
setupModerationEndpoints();
