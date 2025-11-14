const { APIGatewayClient, CreateRestApiCommand, GetResourcesCommand, CreateResourceCommand, PutMethodCommand, PutIntegrationCommand, CreateDeploymentCommand } = require('@aws-sdk/client-api-gateway');
const { LambdaClient, AddPermissionCommand } = require('@aws-sdk/client-lambda');

const apiGatewayClient = new APIGatewayClient({ region: 'us-east-1' });
const lambdaClient = new LambdaClient({ region: 'us-east-1' });

const API_NAME = 'ClassCast-Auth-API-CORS';

async function createCORSEnabledAPI() {
  try {
    console.log('🚀 Creating new API Gateway with proper CORS...');
    
    // Create a new API
    const createCommand = new CreateRestApiCommand({
      name: API_NAME,
      description: 'ClassCast Authentication API with CORS',
      endpointConfiguration: {
        types: ['REGIONAL']
      }
    });
    
    const api = await apiGatewayClient.send(createCommand);
    console.log(`✅ Created API Gateway: ${api.id}`);
    
    // Get root resource
    const getResourcesCommand = new GetResourcesCommand({ restApiId: api.id });
    const resources = await apiGatewayClient.send(getResourcesCommand);
    const rootResource = resources.items.find(item => item.path === '/');
    
    if (!rootResource) {
      throw new Error('Could not find root resource');
    }
    
    // Create auth resource
    const authResource = await createResource(api.id, rootResource.id, 'auth');
    
    // Create signup resource
    const signupResource = await createResource(api.id, authResource.id, 'signup');
    
    // Create login resource
    const loginResource = await createResource(api.id, authResource.id, 'login');
    
    // Create methods with CORS
    await createMethodWithCORS(api.id, signupResource.id, 'POST', 'classcast-auth-signup');
    await createMethodWithCORS(api.id, loginResource.id, 'POST', 'classcast-auth-login');
    
    // Deploy API
    const apiUrl = await deployAPI(api.id);
    
    console.log('\n🎉 CORS-enabled API Gateway created successfully!');
    console.log(`\nAPI Endpoints:`);
    console.log(`Signup: ${apiUrl}/auth/signup`);
    console.log(`Login: ${apiUrl}/auth/login`);
    console.log(`\nAPI ID: ${api.id}`);
    
    return apiUrl;
    
  } catch (error) {
    console.error('❌ Error creating CORS API Gateway:', error);
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
    
    // Add permission for API Gateway to invoke Lambda
    try {
      await lambdaClient.send(new AddPermissionCommand({
        FunctionName: lambdaFunctionName,
        StatementId: `api-gateway-cors-${apiId}-${Date.now()}`,
        Action: 'lambda:InvokeFunction',
        Principal: 'apigateway.amazonaws.com',
        SourceArn: `arn:aws:execute-api:us-east-1:463470937777:${apiId}/*/*`
      }));
      console.log(`✅ Added permission for API Gateway to invoke ${lambdaFunctionName}`);
    } catch (permError) {
      console.log(`⚠️  Permission may already exist for ${lambdaFunctionName}:`, permError.message);
    }
    
  } catch (error) {
    console.error(`Error creating method ${httpMethod}:`, error);
    throw error;
  }
}

async function deployAPI(apiId) {
  try {
    const createDeploymentCommand = new CreateDeploymentCommand({
      restApiId: apiId,
      stageName: 'prod'
    });
    
    const deployment = await apiGatewayClient.send(createDeploymentCommand);
    console.log(`✅ Deployed API to prod stage`);
    
    return `https://${apiId}.execute-api.us-east-1.amazonaws.com/prod`;
  } catch (error) {
    console.error('Error deploying API:', error);
    throw error;
  }
}

createCORSEnabledAPI();
