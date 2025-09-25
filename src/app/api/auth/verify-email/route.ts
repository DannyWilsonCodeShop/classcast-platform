import { NextRequest, NextResponse } from 'next/server';
import { CognitoIdentityProviderClient, ConfirmSignUpCommand, ResendConfirmationCodeCommand } from '@aws-sdk/client-cognito-identity-provider';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.REGION || 'us-east-1',
});

const USER_POOL_CLIENT_ID = process.env.COGNITO_USER_POOL_CLIENT_ID || process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '';

export async function POST(request: NextRequest) {
  try {
    const { username, confirmationCode } = await request.json();

    if (!username || !confirmationCode) {
      return NextResponse.json(
        { success: false, error: 'Username and confirmation code are required' },
        { status: 400 }
      );
    }

    // Confirm the user's email with the verification code
    const confirmCommand = new ConfirmSignUpCommand({
      ClientId: USER_POOL_CLIENT_ID,
      Username: username,
      ConfirmationCode: confirmationCode,
    });

    await cognitoClient.send(confirmCommand);

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Error verifying email:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid verification code')) {
        return NextResponse.json(
          { success: false, error: 'Invalid verification code. Please check your email and try again.' },
          { status: 400 }
        );
      }
      if (error.message.includes('Expired')) {
        return NextResponse.json(
          { success: false, error: 'Verification code has expired. Please request a new one.' },
          { status: 400 }
        );
      }
      if (error.message.includes('already confirmed')) {
        return NextResponse.json(
          { success: false, error: 'Email is already verified.' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to verify email. Please try again.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Username is required' },
        { status: 400 }
      );
    }

    // Resend confirmation code
    const resendCommand = new ResendConfirmationCodeCommand({
      ClientId: USER_POOL_CLIENT_ID,
      Username: username,
    });

    const result = await cognitoClient.send(resendCommand);

    return NextResponse.json({
      success: true,
      message: 'Verification code resent successfully',
      deliveryDetails: {
        destination: result.CodeDeliveryDetails?.Destination,
        deliveryMedium: result.CodeDeliveryDetails?.DeliveryMedium
      }
    });

  } catch (error) {
    console.error('Error resending verification code:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to resend verification code. Please try again.' },
      { status: 500 }
    );
  }
}