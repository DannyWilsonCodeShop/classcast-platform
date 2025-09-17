const AWS = require('aws-sdk');

const apigateway = new AWS.APIGateway({ region: 'us-east-1' });
const lambda = new AWS.Lambda({ region: 'us-east-1' });

async function createAPIGateway() {
  try {
    console.log('🚀 Creating API Gateway...');
    
    // Create REST API
    const api = await apigateway.createRestApi({
      name: 'ClassCast-API',
      description: 'ClassCast Educational Platform API',
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
    
    // Create API resources and methods
    const endpoints = [
      // Authentication endpoints
      { path: 'auth', methods: ['POST'], function: 'classcast-signin-handler' },
      { path: 'auth/signup', methods: ['POST'], function: 'classcast-signup-handler' },
      { path: 'auth/signout', methods: ['POST'], function: 'classcast-signout-handler' },
      { path: 'auth/forgot-password', methods: ['POST'], function: 'classcast-forgot-password-handler' },
      { path: 'auth/confirm-password-reset', methods: ['POST'], function: 'classcast-confirm-password-reset' },
      { path: 'auth/refresh-token', methods: ['POST'], function: 'classcast-refresh-token-handler' },
      { path: 'auth/resend-confirmation', methods: ['POST'], function: 'classcast-resend-confirmation' },
      { path: 'auth/confirm-signup', methods: ['POST'], function: 'classcast-signup-confirmation' },
      
      // Assignment endpoints
      { path: 'assignments', methods: ['GET', 'POST'], function: 'classcast-fetch-assignments' },
      { path: 'assignments/create', methods: ['POST'], function: 'classcast-create-assignment' },
      { path: 'assignments/{id}', methods: ['GET', 'PUT', 'DELETE'], function: 'classcast-fetch-assignments' },
      
      // Submission endpoints
      { path: 'submissions', methods: ['GET', 'POST'], function: 'classcast-fetch-submissions' },
      { path: 'submissions/grade', methods: ['POST'], function: 'classcast-grade-submission' },
      
      // Grade endpoints
      { path: 'grades', methods: ['GET'], function: 'classcast-fetch-grades' },
      
      // Video endpoints
      { path: 'video/upload-url', methods: ['POST'], function: 'classcast-generate-video-upload-url' },
      { path: 'video/process', methods: ['POST'], function: 'classcast-process-video-submission' },
      
      // User management endpoints
      { path: 'users/roles', methods: ['GET', 'POST', 'PUT'], function: 'classcast-role-management' },
      { path: 'users/signup-role', methods: ['POST'], function: 'classcast-role-based-signup' },
      
      // Community endpoints
      { path: 'community/instructor', methods: ['GET', 'POST'], function: 'classcast-instructor-community-feed' },
      
      // Utility endpoints
      { path: 'verify-token', methods: ['POST'], function: 'classcast-jwt-verifier' },
      { path: 'session', methods: ['GET', 'POST', 'DELETE'], function: 'classcast-session-management' }
    ];
    
    // Create resources and methods
    for (const endpoint of endpoints) {
      await createResourceAndMethods(api.id, rootId, endpoint);
    }
    
    // Deploy API
    console.log('📦 Deploying API Gateway...');
    await apigateway.createDeployment({
      restApiId: api.id,
      stageName: 'prod',
      description: 'Production deployment'
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

async function createResourceAndMethods(apiId, parentId, endpoint) {
  try {
    // Create resource
    const resource = await apigateway.createResource({
      restApiId: apiId,
      parentId: parentId,
      pathPart: endpoint.path
    }).promise();
    
    // Add methods
    for (const method of endpoint.methods) {
      await apigateway.putMethod({
        restApiId: apiId,
        resourceId: resource.id,
        httpMethod: method,
        authorizationType: 'NONE'
      }).promise();
      
      // Add Lambda integration
      await apigateway.putIntegration({
        restApiId: apiId,
        resourceId: resource.id,
        httpMethod: method,
        type: 'AWS_PROXY',
        integrationHttpMethod: 'POST',
        uri: `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:${process.env.AWS_ACCOUNT_ID || '463470937777'}:function:${endpoint.function}/invocations`
      }).promise();
      
      // Add CORS
      await apigateway.putMethodResponse({
        restApiId: apiId,
        resourceId: resource.id,
        httpMethod: method,
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': true,
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Methods': true
        }
      }).promise();
      
      await apigateway.putIntegrationResponse({
        restApiId: apiId,
        resourceId: resource.id,
        httpMethod: method,
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': "'*'",
          'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
          'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'"
        }
      }).promise();
    }
    
    console.log(`✅ Created endpoint: ${endpoint.path} [${endpoint.methods.join(', ')}]`);
    
  } catch (error) {
    console.error(`❌ Error creating endpoint ${endpoint.path}:`, error.message);
  }
}

// Run the setup
createAPIGateway()
  .then(result => {
    console.log('\n🎉 API Gateway setup complete!');
    console.log(`API ID: ${result.apiId}`);
    console.log(`API URL: ${result.apiUrl}`);
  })
  .catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
