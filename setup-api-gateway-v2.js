const AWS = require('aws-sdk');

const apigateway = new AWS.APIGateway({ region: 'us-east-1' });
const lambda = new AWS.Lambda({ region: 'us-east-1' });

async function createAPIGatewayV2() {
  try {
    console.log('🚀 Creating comprehensive API Gateway...');
    
    // Create REST API
    const api = await apigateway.createRestApi({
      name: 'ClassCast-API-V2',
      description: 'ClassCast Educational Platform API - Complete Integration',
      endpointConfiguration: {
        types: ['REGIONAL']
      }
    }).promise();
    
    console.log(`✅ API Gateway created: ${api.id}`);
    
    // Get root resource
    const rootResource = await apigateway.getResources({
      restApiId: api.id
    }).promise();
    
    const rootId = rootResource.items.find(item => item.path === '/').id;
    
    // Create main resource groups
    const resourceGroups = [
      { path: 'auth', description: 'Authentication endpoints' },
      { path: 'assignments', description: 'Assignment management' },
      { path: 'submissions', description: 'Submission handling' },
      { path: 'grades', description: 'Grade management' },
      { path: 'video', description: 'Video processing' },
      { path: 'users', description: 'User management' },
      { path: 'community', description: 'Community features' },
      { path: 'utils', description: 'Utility functions' }
    ];
    
    const resourceMap = {};
    
    // Create main resource groups
    for (const group of resourceGroups) {
      const resource = await apigateway.createResource({
        restApiId: api.id,
        parentId: rootId,
        pathPart: group.path
      }).promise();
      
      resourceMap[group.path] = resource.id;
      console.log(`✅ Created resource group: ${group.path}`);
    }
    
    // Define endpoints with proper resource hierarchy
    const endpoints = [
      // Authentication endpoints
      { resource: 'auth', method: 'POST', function: 'classcast-signin-handler', description: 'User sign in' },
      { resource: 'auth', method: 'PUT', function: 'classcast-signup-handler', description: 'User sign up' },
      { resource: 'auth', method: 'DELETE', function: 'classcast-signout-handler', description: 'User sign out' },
      
      // Assignment endpoints
      { resource: 'assignments', method: 'GET', function: 'classcast-fetch-assignments', description: 'Get assignments' },
      { resource: 'assignments', method: 'POST', function: 'classcast-create-assignment', description: 'Create assignment' },
      
      // Submission endpoints
      { resource: 'submissions', method: 'GET', function: 'classcast-fetch-submissions', description: 'Get submissions' },
      { resource: 'submissions', method: 'POST', function: 'classcast-grade-submission', description: 'Grade submission' },
      
      // Grade endpoints
      { resource: 'grades', method: 'GET', function: 'classcast-fetch-grades', description: 'Get grades' },
      
      // Video endpoints
      { resource: 'video', method: 'POST', function: 'classcast-generate-video-upload-url', description: 'Generate video upload URL' },
      { resource: 'video', method: 'PUT', function: 'classcast-process-video-submission', description: 'Process video submission' },
      
      // User management endpoints
      { resource: 'users', method: 'GET', function: 'classcast-role-management', description: 'Get user roles' },
      { resource: 'users', method: 'POST', function: 'classcast-role-based-signup', description: 'Role-based signup' },
      
      // Community endpoints
      { resource: 'community', method: 'GET', function: 'classcast-instructor-community-feed', description: 'Get community feed' },
      { resource: 'community', method: 'POST', function: 'classcast-instructor-community-feed', description: 'Post to community' },
      
      // Utility endpoints
      { resource: 'utils', method: 'POST', function: 'classcast-jwt-verifier', description: 'Verify JWT token' },
      { resource: 'utils', method: 'GET', function: 'classcast-session-management', description: 'Get session info' },
      { resource: 'utils', method: 'PUT', function: 'classcast-session-management', description: 'Update session' },
      { resource: 'utils', method: 'DELETE', function: 'classcast-session-management', description: 'End session' }
    ];
    
    // Create methods for each endpoint
    for (const endpoint of endpoints) {
      await createMethod(api.id, resourceMap[endpoint.resource], endpoint);
    }
    
    // Deploy API
    console.log('📦 Deploying API Gateway...');
    await apigateway.createDeployment({
      restApiId: api.id,
      stageName: 'prod',
      description: 'Production deployment - Complete integration'
    }).promise();
    
    console.log('✅ API Gateway deployed successfully!');
    console.log(`🌐 API URL: https://${api.id}.execute-api.us-east-1.amazonaws.com/prod`);
    
    return {
      apiId: api.id,
      apiUrl: `https://${api.id}.execute-api.us-east-1.amazonaws.com/prod`
    };
    
  } catch (error) {
    console.error('❌ Error creating API Gateway:', error);
    throw error;
  }
}

async function createMethod(apiId, resourceId, endpoint) {
  try {
    // Add method
    await apigateway.putMethod({
      restApiId: apiId,
      resourceId: resourceId,
      httpMethod: endpoint.method,
      authorizationType: 'NONE'
    }).promise();
    
    // Add Lambda integration
    await apigateway.putIntegration({
      restApiId: apiId,
      resourceId: resourceId,
      httpMethod: endpoint.method,
      type: 'AWS_PROXY',
      integrationHttpMethod: 'POST',
      uri: `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:463470937777:function:${endpoint.function}/invocations`
    }).promise();
    
    // Add CORS
    await apigateway.putMethodResponse({
      restApiId: apiId,
      resourceId: resourceId,
      httpMethod: endpoint.method,
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Origin': true,
        'method.response.header.Access-Control-Allow-Headers': true,
        'method.response.header.Access-Control-Allow-Methods': true
      }
    }).promise();
    
    await apigateway.putIntegrationResponse({
      restApiId: apiId,
      resourceId: resourceId,
      httpMethod: endpoint.method,
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Origin': "'*'",
        'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
        'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'"
      }
    }).promise();
    
    console.log(`✅ Created method: ${endpoint.resource} ${endpoint.method} -> ${endpoint.function}`);
    
  } catch (error) {
    console.error(`❌ Error creating method ${endpoint.resource} ${endpoint.method}:`, error.message);
  }
}

// Run the setup
createAPIGatewayV2()
  .then(result => {
    console.log('\n🎉 API Gateway V2 setup complete!');
    console.log(`API ID: ${result.apiId}`);
    console.log(`API URL: ${result.apiUrl}`);
    console.log('\n📋 Available Endpoints:');
    console.log('POST /auth - Sign in');
    console.log('PUT /auth - Sign up');
    console.log('DELETE /auth - Sign out');
    console.log('GET /assignments - Get assignments');
    console.log('POST /assignments - Create assignment');
    console.log('GET /submissions - Get submissions');
    console.log('POST /submissions - Grade submission');
    console.log('GET /grades - Get grades');
    console.log('POST /video - Generate video upload URL');
    console.log('PUT /video - Process video submission');
    console.log('GET /users - Get user roles');
    console.log('POST /users - Role-based signup');
    console.log('GET /community - Get community feed');
    console.log('POST /community - Post to community');
    console.log('POST /utils - Verify JWT token');
    console.log('GET /utils - Get session info');
    console.log('PUT /utils - Update session');
    console.log('DELETE /utils - End session');
  })
  .catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
