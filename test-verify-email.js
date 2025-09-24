const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambdaClient = new LambdaClient({ region: 'us-east-1' });

async function testVerifyEmail() {
  try {
    const event = {
      httpMethod: 'POST',
      path: '/prod/auth/verify-email',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        code: '123456'
      })
    };

    console.log('Testing verify-email function directly...');
    
    const command = new InvokeCommand({
      FunctionName: 'classcast-auth-verify-email',
      Payload: JSON.stringify(event)
    });

    const response = await lambdaClient.send(command);
    
    console.log('Response Status:', response.StatusCode);
    console.log('Response Payload (raw):', response.Payload);
    
    try {
      const payload = JSON.parse(response.Payload);
      console.log('Response Payload (parsed):', payload);
    } catch (parseError) {
      console.log('Response Payload (as string):', response.Payload.toString());
    }
    
  } catch (error) {
    console.error('Error testing Lambda function:', error);
  }
}

testVerifyEmail();
