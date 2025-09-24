const { APIGatewayClient, TestInvokeMethodCommand } = require('@aws-sdk/client-api-gateway');

const apiGatewayClient = new APIGatewayClient({ region: 'us-east-1' });

async function testAPIGatewayResponse() {
  try {
    console.log('Testing API Gateway response format...');
    
    // Get the resource ID for verify-email
    const restApiId = '51ry872ewf';
    
    // First, let's get the resource ID
    const { APIGatewayClient, GetResourcesCommand } = require('@aws-sdk/client-api-gateway');
    const getResourcesCommand = new GetResourcesCommand({
      restApiId: restApiId
    });
    
    const resources = await apiGatewayClient.send(getResourcesCommand);
    const verifyEmailResource = resources.items.find(item => 
      item.pathPart === 'verify-email' && item.path === '/auth/verify-email'
    );
    
    if (!verifyEmailResource) {
      console.error('Could not find verify-email resource');
      return;
    }
    
    console.log('Found verify-email resource:', verifyEmailResource.id);
    
    // Test the method
    const testCommand = new TestInvokeMethodCommand({
      restApiId: restApiId,
      resourceId: verifyEmailResource.id,
      httpMethod: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        code: '123456'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await apiGatewayClient.send(testCommand);
    
    console.log('API Gateway Test Response:');
    console.log('Status:', response.status);
    console.log('Headers:', JSON.stringify(response.headers, null, 2));
    console.log('Body:', response.body);
    
  } catch (error) {
    console.error('Error testing API Gateway:', error);
  }
}

testAPIGatewayResponse();

