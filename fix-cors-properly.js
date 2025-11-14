const { APIGatewayClient, GetResourcesCommand, PutMethodCommand, PutIntegrationCommand, PutMethodResponseCommand, PutIntegrationResponseCommand, CreateDeploymentCommand } = require('@aws-sdk/client-api-gateway');

const apiGatewayClient = new APIGatewayClient({ region: 'us-east-1' });

const API_ID = '3y0dfqdjld';

async function fixCORSProperly() {
  try {
    console.log('🔧 Fixing CORS configuration properly...');
    
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
    
    // Fix CORS for both resources
    await fixResourceCORS(signupResource.id, 'signup');
    await fixResourceCORS(loginResource.id, 'login');
    
    // Deploy the API
    console.log('🚀 Deploying API with proper CORS...');
    await apiGatewayClient.send(new CreateDeploymentCommand({
      restApiId: API_ID,
      stageName: 'prod'
    }));
    
    console.log('✅ API deployed successfully with proper CORS!');
    
  } catch (error) {
    console.error('❌ Error fixing CORS:', error);
    throw error;
  }
}

async function fixResourceCORS(resourceId, resourceName) {
  try {
    console.log(`\n🔧 Fixing CORS for ${resourceName} resource...`);
    
    // Add OPTIONS method
    try {
      await apiGatewayClient.send(new PutMethodCommand({
        restApiId: API_ID,
        resourceId: resourceId,
        httpMethod: 'OPTIONS',
        authorizationType: 'NONE'
      }));
      console.log(`✅ Added OPTIONS method to ${resourceName}`);
    } catch (error) {
      if (error.name === 'ConflictException') {
        console.log(`⚠️  OPTIONS method already exists for ${resourceName}`);
      } else {
        throw error;
      }
    }
    
    // Add method response for OPTIONS
    try {
      await apiGatewayClient.send(new PutMethodResponseCommand({
        restApiId: API_ID,
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
      console.log(`✅ Added method response for ${resourceName} OPTIONS`);
    } catch (error) {
      console.log(`⚠️  Method response may already exist for ${resourceName}:`, error.message);
    }
    
    // Add integration for OPTIONS (MOCK integration)
    try {
      await apiGatewayClient.send(new PutIntegrationCommand({
        restApiId: API_ID,
        resourceId: resourceId,
        httpMethod: 'OPTIONS',
        type: 'MOCK',
        requestTemplates: {
          'application/json': '{"statusCode": 200}'
        }
      }));
      console.log(`✅ Added MOCK integration for ${resourceName} OPTIONS`);
    } catch (error) {
      console.log(`⚠️  Integration may already exist for ${resourceName}:`, error.message);
    }
    
    // Add integration response for OPTIONS
    try {
      await apiGatewayClient.send(new PutIntegrationResponseCommand({
        restApiId: API_ID,
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
      console.log(`✅ Added integration response for ${resourceName} OPTIONS`);
    } catch (error) {
      console.log(`⚠️  Integration response may already exist for ${resourceName}:`, error.message);
    }
    
  } catch (error) {
    console.error(`❌ Error fixing CORS for ${resourceName}:`, error);
    throw error;
  }
}

fixCORSProperly();
