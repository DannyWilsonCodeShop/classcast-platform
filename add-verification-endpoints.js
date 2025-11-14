const { APIGatewayClient, GetResourcesCommand, CreateResourceCommand, PutMethodCommand, PutIntegrationCommand, CreateDeploymentCommand, PutMethodResponseCommand, PutIntegrationResponseCommand } = require('@aws-sdk/client-api-gateway');

const apiGatewayClient = new APIGatewayClient({ region: 'us-east-1' });

const API_ID = '51ry872ewf';

async function addVerificationEndpoints() {
  try {
    console.log('🔧 Adding verification endpoints to API Gateway...');
    
    // Get all resources
    const resourcesResponse = await apiGatewayClient.send(new GetResourcesCommand({
      restApiId: API_ID
    }));
    
    const resources = resourcesResponse.items || [];
    console.log(`Found ${resources.length} resources`);
    
    // Find the auth resource
    const authResource = resources.find(r => r.pathPart === 'auth');
    if (!authResource) {
      throw new Error('Auth resource not found');
    }
    
    console.log('Found auth resource:', authResource.id);
    
    // Create verify-email resource
    const verifyEmailResource = await createResource(API_ID, authResource.id, 'verify-email');
    
    // Create resend-verification resource
    const resendVerificationResource = await createResource(API_ID, authResource.id, 'resend-verification');
    
    // Create methods for verify-email
    await createMethodWithCORS(API_ID, verifyEmailResource.id, 'POST', 'classcast-auth-verify-email');
    
    // Create methods for resend-verification
    await createMethodWithCORS(API_ID, resendVerificationResource.id, 'POST', 'classcast-auth-resend-verification');
    
    // Deploy API
    console.log('🚀 Deploying API with verification endpoints...');
    await apiGatewayClient.send(new CreateDeploymentCommand({
      restApiId: API_ID,
      stageName: 'prod'
    }));
    
    console.log('\n🎉 Verification endpoints added successfully!');
    console.log(`\nNew Endpoints:`);
    console.log(`Verify Email: https://${API_ID}.execute-api.us-east-1.amazonaws.com/prod/auth/verify-email`);
    console.log(`Resend Verification: https://${API_ID}.execute-api.us-east-1.amazonaws.com/prod/auth/resend-verification`);
    
  } catch (error) {
    console.error('❌ Error adding verification endpoints:', error);
    throw error;
  }
}

async function createResource(apiId, parentId, pathPart) {
  try {
    const createResourceCommand = new CreateResourceCommand({
      restApiId: apiId,
      parentId: parentId,
      pathPart: pathPart
    });
    
    const resource = await apiGatewayClient.send(createResourceCommand);
    console.log(`✅ Created resource: ${pathPart}`);
    return resource;
  } catch (error) {
    console.error(`Error creating resource ${pathPart}:`, error);
    throw error;
  }
}

async function createMethodWithCORS(apiId, resourceId, httpMethod, lambdaFunctionName) {
  try {
    console.log(`Creating ${httpMethod} method with CORS for ${lambdaFunctionName}...`);
    
    // Create the method
    const putMethodCommand = new PutMethodCommand({
      restApiId: apiId,
      resourceId: resourceId,
      httpMethod: httpMethod,
      authorizationType: 'NONE'
    });
    
    await apiGatewayClient.send(putMethodCommand);
    console.log(`✅ Created ${httpMethod} method`);
    
    // Create the integration
    const putIntegrationCommand = new PutIntegrationCommand({
      restApiId: apiId,
      resourceId: resourceId,
      httpMethod: httpMethod,
      type: 'AWS_PROXY',
      integrationHttpMethod: 'POST',
      uri: `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:463470937777:function:${lambdaFunctionName}/invocations`
    });
    
    await apiGatewayClient.send(putIntegrationCommand);
    console.log(`✅ Created integration for ${lambdaFunctionName}`);
    
    // Add OPTIONS method for CORS
    await addOPTIONSMethod(apiId, resourceId, httpMethod);
    
  } catch (error) {
    console.error(`Error creating method ${httpMethod}:`, error);
    throw error;
  }
}

async function addOPTIONSMethod(apiId, resourceId, httpMethod) {
  try {
    console.log(`Adding OPTIONS method for CORS...`);
    
    // Add OPTIONS method
    await apiGatewayClient.send(new PutMethodCommand({
      restApiId: apiId,
      resourceId: resourceId,
      httpMethod: 'OPTIONS',
      authorizationType: 'NONE'
    }));
    
    // Add method response
    await apiGatewayClient.send(new PutMethodResponseCommand({
      restApiId: apiId,
      resourceId: resourceId,
      httpMethod: 'OPTIONS',
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': true,
        'method.response.header.Access-Control-Allow-Methods': true,
        'method.response.header.Access-Control-Allow-Origin': true,
        'method.response.header.Access-Control-Max-Age': true
      }
    }));
    
    // Add integration
    await apiGatewayClient.send(new PutIntegrationCommand({
      restApiId: apiId,
      resourceId: resourceId,
      httpMethod: 'OPTIONS',
      type: 'MOCK',
      requestTemplates: {
        'application/json': '{"statusCode": 200}'
      }
    }));
    
    // Add integration response
    await apiGatewayClient.send(new PutIntegrationResponseCommand({
      restApiId: apiId,
      resourceId: resourceId,
      httpMethod: 'OPTIONS',
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
        'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'",
        'method.response.header.Access-Control-Allow-Origin': "'*'",
        'method.response.header.Access-Control-Max-Age': "'86400'"
      }
    }));
    
    console.log(`✅ Added OPTIONS method with CORS`);
    
  } catch (error) {
    console.error(`Error adding OPTIONS method:`, error);
    throw error;
  }
}

addVerificationEndpoints();
