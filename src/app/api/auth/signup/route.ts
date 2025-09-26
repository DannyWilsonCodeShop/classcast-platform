import { NextRequest, NextResponse } from 'next/server';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const lambdaClient = new LambdaClient({ 
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID || '',
    secretAccessKey: process.env.SECRET_ACCESS_KEY || '',
  }
});

export async function POST(request: NextRequest) {
  try {
    console.log('=== LAMBDA SIGNUP API CALLED ===');
    
    const body = await request.json();
    const { email, firstName, lastName, password, role, studentId, department } = body;

    console.log('Signup request:', { email, firstName, lastName, role });

    // Basic validation
    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: { message: 'Missing required fields' } },
        { status: 400 }
      );
    }

    if (role !== 'student' && role !== 'instructor' && role !== 'admin') {
      return NextResponse.json(
        { error: { message: 'Invalid role specified' } },
        { status: 400 }
      );
    }

    if (role === 'instructor' && !department) {
      return NextResponse.json(
        { error: { message: 'Department is required for instructor role' } },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: { message: 'Password must be at least 8 characters long' } },
        { status: 400 }
      );
    }

    try {
      console.log('Calling Lambda function for signup:', email);

      // Call Lambda function for signup
      const lambdaCommand = new InvokeCommand({
        FunctionName: 'classcast-signup',
        Payload: JSON.stringify({
          body: JSON.stringify(body)
        })
      });

      console.log('Lambda command created, invoking...');
      const lambdaResponse = await lambdaClient.send(lambdaCommand);
      console.log('Lambda response received:', lambdaResponse);
      
      if (!lambdaResponse.Payload) {
        console.error('No payload in Lambda response');
        throw new Error('No response from Lambda function');
      }

      const responseBody = JSON.parse(new TextDecoder().decode(lambdaResponse.Payload));
      console.log('Lambda response body:', responseBody);

      // Check if Lambda function returned an error
      if (lambdaResponse.FunctionError) {
        console.error('Lambda function error:', lambdaResponse.FunctionError);
        throw new Error('Lambda function execution failed');
      }

      // Return the Lambda response directly
      return NextResponse.json(responseBody, { 
        status: responseBody.statusCode || 200 
      });
    } catch (lambdaError) {
      console.error('Lambda signup error:', lambdaError);
      console.error('Error details:', {
        name: lambdaError.name,
        message: lambdaError.message,
        stack: lambdaError.stack
      });
      
      return NextResponse.json(
        { error: { message: 'Failed to create account. Please try again later' } },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Signup request error:', error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: { message: 'Invalid request format' } },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: { message: 'Internal server error. Please try again later' } },
      { status: 500 }
    );
  }
}
