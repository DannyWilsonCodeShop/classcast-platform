import { NextRequest, NextResponse } from 'next/server';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const lambdaClient = new LambdaClient({ region: 'us-east-1' });

export async function POST(request: NextRequest) {
  try {
    console.log('=== LAMBDA LOGIN API CALLED ===');
    
    const body = await request.json();
    const { email, password } = body;
    
    console.log('Login request:', { email, password: password ? '***' : 'undefined' });

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: { message: 'Email and password are required' } },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: { message: 'Please enter a valid email address' } },
        { status: 400 }
      );
    }

    // Password length validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: { message: 'Password must be at least 8 characters long' } },
        { status: 400 }
      );
    }

    try {
      console.log('Calling Lambda function for login:', email);
      
      // Call Lambda function for authentication
      const lambdaCommand = new InvokeCommand({
        FunctionName: 'classcast-login',
        Payload: JSON.stringify({
          body: JSON.stringify({ email, password })
        })
      });

      const lambdaResponse = await lambdaClient.send(lambdaCommand);
      
      if (!lambdaResponse.Payload) {
        throw new Error('No response from Lambda function');
      }

      const responseBody = JSON.parse(new TextDecoder().decode(lambdaResponse.Payload));
      
      console.log('Lambda response:', responseBody);

      // Return the Lambda response directly
      return NextResponse.json(responseBody, { 
        status: responseBody.statusCode || 200 
      });
    } catch (authError) {
      console.error('Lambda authentication error:', authError);
      
      return NextResponse.json(
        { error: { message: 'Authentication failed. Please check your credentials and try again' } },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Login request error:', error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: 'Invalid request format' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: 'Internal server error. Please try again later' },
      { status: 500 }
    );
  }
}
