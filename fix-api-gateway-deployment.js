const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({ region: 'us-east-1' });
const apigateway = new AWS.APIGateway();
const lambda = new AWS.Lambda();

const API_ID = '785t4qadp8';
const LAMBDA_FUNCTION_NAME = 'classcast-content-moderation';

async function fixApiGatewayDeployment() {
  try {
    console.log('🔧 Fixing API Gateway deployment issue...');

    // Get Lambda function ARN
    const lambdaFunction = await lambda.getFunction({ FunctionName: LAMBDA_FUNCTION_NAME }).promise();
    const lambdaArn = lambdaFunction.Configuration.FunctionArn;

    // Get existing resources
    const resources = await apigateway.getResources({ restApiId: API_ID }).promise();
    const moderationResource = resources.items.find(item => item.pathPart === 'moderation');
    const textResource = resources.items.find(item => item.pathPart === 'text' && item.parentId === moderationResource.id);
    const videoResource = resources.items.find(item => item.pathPart === 'video' && item.parentId === moderationResource.id);
    const submissionResource = resources.items.find(item => item.pathPart === 'submission' && item.parentId === moderationResource.id);

    console.log('📋 Found resources:');
    console.log('  Moderation:', moderationResource?.id, moderationResource?.resourceMethods ? 'HAS METHODS' : 'NO METHODS');
    console.log('  Text:', textResource?.id, textResource?.resourceMethods ? 'HAS METHODS' : 'NO METHODS');
    console.log('  Video:', videoResource?.id, videoResource?.resourceMethods ? 'HAS METHODS' : 'NO METHODS');
    console.log('  Submission:', submissionResource?.id, submissionResource?.resourceMethods ? 'HAS METHODS' : 'NO METHODS');

    // The issue is that the parent /moderation resource has no methods but has child resources
    // This causes deployment to fail. Let's add a simple GET method to the parent resource
    console.log('🔧 Adding GET method to parent /moderation resource...');
    
    try {
      // Add GET method to parent resource
      await apigateway.putMethod({
        restApiId: API_ID,
        resourceId: moderationResource.id,
        httpMethod: 'GET',
        authorizationType: 'NONE'
      }).promise();
      console.log('  ✅ GET method added to /moderation');

      // Add integration for GET method (return simple info)
      await apigateway.putIntegration({
        restApiId: API_ID,
        resourceId: moderationResource.id,
        httpMethod: 'GET',
        type: 'MOCK',
        requestTemplates: {
          'application/json': '{"statusCode": 200}'
        }
      }).promise();
      console.log('  ✅ GET integration added to /moderation');

      // Add method response
      await apigateway.putMethodResponse({
        restApiId: API_ID,
        resourceId: moderationResource.id,
        httpMethod: 'GET',
        statusCode: '200',
        responseModels: {
          'application/json': 'Empty'
        }
      }).promise();
      console.log('  ✅ GET method response added to /moderation');

      // Add integration response
      await apigateway.putIntegrationResponse({
        restApiId: API_ID,
        resourceId: moderationResource.id,
        httpMethod: 'GET',
        statusCode: '200',
        responseTemplates: {
          'application/json': '{"message": "Content Moderation API", "endpoints": ["/moderation/text", "/moderation/video", "/moderation/submission"]}'
        }
      }).promise();
      console.log('  ✅ GET integration response added to /moderation');

    } catch (error) {
      if (error.code === 'ConflictException') {
        console.log('  ⚠️ GET method already exists for /moderation');
      } else {
        throw error;
      }
    }

    // Now let's verify all child resources have proper integrations
    console.log('🔍 Verifying child resource integrations...');

    const childResources = [textResource, videoResource, submissionResource];
    for (const resource of childResources) {
      if (resource && resource.resourceMethods) {
        console.log(`  Checking ${resource.pathPart}...`);
        
        // Check POST method integration
        try {
          const postMethod = await apigateway.getMethod({
            restApiId: API_ID,
            resourceId: resource.id,
            httpMethod: 'POST'
          }).promise();
          
          if (postMethod.methodIntegration && postMethod.methodIntegration.uri) {
            console.log(`    ✅ POST method has integration for ${resource.pathPart}`);
          } else {
            console.log(`    ❌ POST method missing integration for ${resource.pathPart}`);
          }
        } catch (error) {
          console.log(`    ❌ Error checking POST method for ${resource.pathPart}:`, error.message);
        }
      }
    }

    // Try to deploy the API
    console.log('🚀 Attempting to deploy API...');
    try {
      const deployment = await apigateway.createDeployment({
        restApiId: API_ID,
        stageName: 'prod',
        description: 'Content moderation deployment - fixed parent resource'
      }).promise();
      
      console.log('✅ API deployment successful!');
      console.log('📋 Deployment ID:', deployment.id);
      console.log('🔗 Base URL:', `https://${API_ID}.execute-api.us-east-1.amazonaws.com/prod`);
      
    } catch (deployError) {
      console.log('❌ Deployment failed:', deployError.message);
      
      // If deployment still fails, let's try to identify the specific issue
      console.log('🔍 Investigating deployment issue...');
      
      // Check if there are any resources without methods that have child resources
      const allResources = await apigateway.getResources({ restApiId: API_ID }).promise();
      const problematicResources = allResources.items.filter(item => 
        !item.resourceMethods && 
        allResources.items.some(child => child.parentId === item.id)
      );
      
      if (problematicResources.length > 0) {
        console.log('⚠️ Found resources with children but no methods:');
        problematicResources.forEach(resource => {
          console.log(`  - ${resource.path} (${resource.id})`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error fixing API Gateway:', error);
  }
}

// Run the fix
fixApiGatewayDeployment();
