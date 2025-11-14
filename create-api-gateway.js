const { APIGatewayClient, CreateRestApiCommand, GetResourcesCommand, CreateResourceCommand, PutMethodCommand, PutIntegrationCommand, CreateDeploymentCommand } = require('@aws-sdk/client-api-gateway');
const { LambdaClient, AddPermissionCommand } = require('@aws-sdk/client-lambda');

const apiGatewayClient = new APIGatewayClient({ region: 'us-east-1' });
const lambdaClient = new LambdaClient({ region: 'us-east-1' });

const API_NAME = 'ClassCast-Auth-API';
const LAMBDA_ROLE_ARN = 'arn:aws:iam::463470937777:role/ClassCastLambdaExecutionRole';

async function createOrGetAPI() {
  try {
    console.log('Creating API Gateway...');
    
    // Create a new API
    const createCommand = new CreateRestApiCommand({
      name: API_NAME,
      description: 'ClassCast Authentication API',
      endpointConfiguration: {
        types: ['REGIONAL']
      }
    });
    
    const api = await apiGatewayClient.send(createCommand);
    console.log(`✅ Created API Gateway: ${api.id}`);
    
    return api;
  } catch (error) {
    console.error('Error creating API Gateway:', error);
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

async function createMethod(apiId, resourceId, httpMethod, lambdaFunctionName) {
  try {
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
        StatementId: `api-gateway-${apiId}-${Date.now()}`,
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

async function main() {
  try {
    console.log('🚀 Creating API Gateway for Lambda functions...\n');
    
    // Create API Gateway
    const api = await createOrGetAPI();
    const apiId = api.id;
    
    // Get root resource
    const getResourcesCommand = new GetResourcesCommand({ restApiId: apiId });
    const resources = await apiGatewayClient.send(getResourcesCommand);
    const rootResource = resources.items.find(item => item.path === '/');
    
    if (!rootResource) {
      throw new Error('Could not find root resource');
    }
    
    // Create auth resource
    const authResource = await createResource(apiId, rootResource.id, 'auth');
    
    // Create signup resource
    const signupResource = await createResource(apiId, authResource.id, 'signup');
    
    // Create login resource
    const loginResource = await createResource(apiId, authResource.id, 'login');
    
    // Create methods
    await createMethod(apiId, signupResource.id, 'POST', 'classcast-auth-signup');
    await createMethod(apiId, loginResource.id, 'POST', 'classcast-auth-login');
    
    // Deploy API
    const apiUrl = await deployAPI(apiId);
    
    console.log('\n🎉 API Gateway created successfully!');
    console.log(`\nAPI Endpoints:`);
    console.log(`Signup: ${apiUrl}/auth/signup`);
    console.log(`Login: ${apiUrl}/auth/login`);
    console.log(`\nAPI ID: ${apiId}`);
    
    // Test the endpoints
    console.log('\n🧪 Testing endpoints...');
    
    const testSignup = await fetch(`${apiUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testuser14@example.com',
        firstName: 'Test',
        lastName: 'User14',
        password: 'TestPass123!',
        role: 'student'
      })
    });
    
    const signupResult = await testSignup.json();
    console.log('Signup test result:', signupResult.message);
    
    const testLogin = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testuser14@example.com',
        password: 'TestPass123!'
      })
    });
    
    const loginResult = await testLogin.json();
    console.log('Login test result:', loginResult.message);
    
  } catch (error) {
    console.error('❌ Error creating API Gateway:', error);
    process.exit(1);
  }
}

main();
