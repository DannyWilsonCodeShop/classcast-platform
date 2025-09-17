const AWS = require('aws-sdk');

const apigateway = new AWS.APIGateway({ region: 'us-east-1' });
const lambda = new AWS.Lambda({ region: 'us-east-1' });

async function createSimpleAPI() {
  try {
    console.log('🚀 Creating simple working API Gateway...');
    
    // Create REST API
    const api = await apigateway.createRestApi({
      name: 'ClassCast-Simple-API',
      description: 'Simple working API for ClassCast',
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
    
    // Create a simple test endpoint
    const testResource = await apigateway.createResource({
      restApiId: api.id,
      parentId: rootId,
      pathPart: 'test'
    }).promise();
    
    // Add GET method
    await apigateway.putMethod({
      restApiId: api.id,
      resourceId: testResource.id,
      httpMethod: 'GET',
      authorizationType: 'NONE'
    }).promise();
    
    // Add Lambda integration
    await apigateway.putIntegration({
      restApiId: api.id,
      resourceId: testResource.id,
      httpMethod: 'GET',
      type: 'AWS_PROXY',
      integrationHttpMethod: 'POST',
      uri: `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:463470937777:function:classcast-fetch-assignments/invocations`
    }).promise();
    
    // Add CORS
    await apigateway.putMethodResponse({
      restApiId: api.id,
      resourceId: testResource.id,
      httpMethod: 'GET',
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Origin': true,
        'method.response.header.Access-Control-Allow-Headers': true,
        'method.response.header.Access-Control-Allow-Methods': true
      }
    }).promise();
    
    await apigateway.putIntegrationResponse({
      restApiId: api.id,
      resourceId: testResource.id,
      httpMethod: 'GET',
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Origin': "'*'",
        'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
        'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'"
      }
    }).promise();
    
    // Deploy API
    console.log('📦 Deploying API Gateway...');
    await apigateway.createDeployment({
      restApiId: api.id,
      stageName: 'prod',
      description: 'Simple working deployment'
    }).promise();
    
    console.log('✅ API Gateway deployed successfully!');
    console.log(`🌐 Test URL: https://${api.id}.execute-api.us-east-1.amazonaws.com/prod/test`);
    
    // Test the endpoint
    console.log('\n🧪 Testing the endpoint...');
    const testUrl = `https://${api.id}.execute-api.us-east-1.amazonaws.com/prod/test`;
    
    try {
      const response = await fetch(testUrl);
      const data = await response.json();
      console.log(`✅ Test successful: ${response.status} - ${JSON.stringify(data)}`);
    } catch (error) {
      console.log(`❌ Test failed: ${error.message}`);
    }
    
    return {
      apiId: api.id,
      testUrl: testUrl
    };
    
  } catch (error) {
    console.error('❌ Error creating simple API:', error);
    throw error;
  }
}

// Run the setup
createSimpleAPI()
  .then(result => {
    console.log('\n🎉 Simple API setup complete!');
    console.log(`API ID: ${result.apiId}`);
    console.log(`Test URL: ${result.testUrl}`);
  })
  .catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
