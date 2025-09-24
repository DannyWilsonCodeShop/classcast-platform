const { APIGatewayClient, GetResourcesCommand, PutMethodCommand, PutIntegrationCommand, CreateDeploymentCommand } = require('@aws-sdk/client-api-gateway');

const apiGatewayClient = new APIGatewayClient({ region: 'us-east-1' });

const API_ID = 'belixlmhba';

async function fixCORS() {
  try {
    console.log('🔧 Fixing CORS configuration for API Gateway...');
    
    // Get all resources
    const resourcesResponse = await apiGatewayClient.send(new GetResourcesCommand({
      restApiId: API_ID
    }));
    
    const resources = resourcesResponse.items || [];
    console.log(`Found ${resources.length} resources`);
    
    // Find the auth resources
    const authResource = resources.find(r => r.pathPart === 'auth');
    if (!authResource) {
      throw new Error('Auth resource not found');
    }
    
    const signupResource = resources.find(r => r.pathPart === 'signup' && r.parentId === authResource.id);
    const loginResource = resources.find(r => r.pathPart === 'login' && r.parentId === authResource.id);
    
    if (!signupResource || !loginResource) {
      throw new Error('Signup or login resource not found');
    }
    
    console.log('Found auth resources:', {
      auth: authResource.id,
      signup: signupResource.id,
      login: loginResource.id
    });
    
    // Add OPTIONS method for CORS preflight to signup
    try {
      await apiGatewayClient.send(new PutMethodCommand({
        restApiId: API_ID,
        resourceId: signupResource.id,
        httpMethod: 'OPTIONS',
        authorizationType: 'NONE'
      }));
      console.log('✅ Added OPTIONS method to signup resource');
    } catch (error) {
      if (error.name === 'ConflictException') {
        console.log('⚠️  OPTIONS method already exists for signup');
      } else {
        throw error;
      }
    }
    
    // Add OPTIONS method for CORS preflight to login
    try {
      await apiGatewayClient.send(new PutMethodCommand({
        restApiId: API_ID,
        resourceId: loginResource.id,
        httpMethod: 'OPTIONS',
        authorizationType: 'NONE'
      }));
      console.log('✅ Added OPTIONS method to login resource');
    } catch (error) {
      if (error.name === 'ConflictException') {
        console.log('⚠️  OPTIONS method already exists for login');
      } else {
        throw error;
      }
    }
    
    // Create CORS integration for signup OPTIONS
    try {
      await apiGatewayClient.send(new PutIntegrationCommand({
        restApiId: API_ID,
        resourceId: signupResource.id,
        httpMethod: 'OPTIONS',
        type: 'MOCK',
        integrationResponses: {
          '200': {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
              'method.response.header.Access-Control-Allow-Origin': "'*'",
              'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'"
            }
          }
        },
        requestTemplates: {
          'application/json': '{"statusCode": 200}'
        }
      }));
      console.log('✅ Added CORS integration for signup OPTIONS');
    } catch (error) {
      console.log('⚠️  CORS integration may already exist for signup:', error.message);
    }
    
    // Create CORS integration for login OPTIONS
    try {
      await apiGatewayClient.send(new PutIntegrationCommand({
        restApiId: API_ID,
        resourceId: loginResource.id,
        httpMethod: 'OPTIONS',
        type: 'MOCK',
        integrationResponses: {
          '200': {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
              'method.response.header.Access-Control-Allow-Origin': "'*'",
              'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'"
            }
          }
        },
        requestTemplates: {
          'application/json': '{"statusCode": 200}'
        }
      }));
      console.log('✅ Added CORS integration for login OPTIONS');
    } catch (error) {
      console.log('⚠️  CORS integration may already exist for login:', error.message);
    }
    
    // Deploy the API
    console.log('🚀 Deploying API with CORS fixes...');
    await apiGatewayClient.send(new CreateDeploymentCommand({
      restApiId: API_ID,
      stageName: 'prod'
    }));
    
    console.log('✅ API deployed successfully with CORS fixes!');
    console.log('\n🎉 CORS should now be working for:');
    console.log(`- Signup: https://${API_ID}.execute-api.us-east-1.amazonaws.com/prod/auth/signup`);
    console.log(`- Login: https://${API_ID}.execute-api.us-east-1.amazonaws.com/prod/auth/login`);
    
  } catch (error) {
    console.error('❌ Error fixing CORS:', error);
    throw error;
  }
}

fixCORS();
