import { NextRequest, NextResponse } from 'next/server';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const lambdaClient = new LambdaClient({ 
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID || '',
    secretAccessKey: process.env.SECRET_ACCESS_KEY || '',
  }
});

// POST /api/profile/save - Save user profile
export async function POST(request: NextRequest) {
  try {
    console.log('=== LAMBDA PROFILE SAVE API CALLED ===');
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'User ID is required',
        },
        { status: 400 }
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

  } catch (error) {
    console.error('Error saving profile:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
