const { APIGatewayClient, TestInvokeMethodCommand } = require('@aws-sdk/client-api-gateway');

const apiGatewayClient = new APIGatewayClient({ region: 'us-east-1' });

async function testAPIGateway() {
  try {
    console.log('Testing API Gateway integration...');
    
    // Get the resource ID for verify-email
    const resourceId = 'your-resource-id'; // We'll need to get this
    
    const command = new TestInvokeMethodCommand({
      restApiId: '51ry872ewf',
      resourceId: resourceId,
      httpMethod: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        code: '123456'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await apiGatewayClient.send(command);
    
    console.log('API Gateway Test Response:');
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    console.log('Body:', response.body);
    
  } catch (error) {
    console.error('Error testing API Gateway:', error);
  }
}

testAPIGateway();

