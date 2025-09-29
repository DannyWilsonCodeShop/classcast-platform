import { NextRequest, NextResponse } from 'next/server';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const lambdaClient = new LambdaClient({ 
  region: 'us-east-1'
  // Uses default credential provider chain (IAM role)
});

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// POST /api/profile/save - Save user profile
export async function POST(request: NextRequest) {
  try {
    console.log('=== LAMBDA PROFILE SAVE API CALLED ===');
    
    const body = await request.json();
    console.log('Request body received:', body);
    
    // Validate required fields
    if (!body.userId) {
      console.log('Missing userId in request body');
      return NextResponse.json(
        {
          success: false,
          error: 'User ID is required',
        },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }

    console.log('Calling Lambda function for profile save:', body.userId);

    // Call Lambda function for profile save
    const lambdaCommand = new InvokeCommand({
      FunctionName: 'classcast-profile-save',
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
      status: responseBody.statusCode || 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });

  } catch (error) {
    console.error('Error saving profile:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  }
}
