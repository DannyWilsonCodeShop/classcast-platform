import { APIGatewayProxyHandler } from 'aws-lambda';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { z } from 'zod';

const cognito = new CognitoIdentityServiceProvider();

// Environment variables
const USER_POOL_ID = process.env['USER_POOL_ID'] || '';
const USER_POOL_CLIENT_ID = process.env['USER_POOL_CLIENT_ID'] || '';

// Resend confirmation request validation schema
const resendConfirmationSchema = z.object({
  username: z.string()
    .min(1, 'Username is required')
    .max(50, 'Username must be less than 50 characters'),
  
  email: z.string()
    .email('Invalid email format')
    .max(254, 'Email must be less than 254 characters')
});

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Parse and validate request body
    let requestBody: any;
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (error) {
      return createErrorResponse(400, 'Invalid JSON in request body');
    }

    // Validate request data
    const validationResult = resendConfirmationSchema.safeParse(requestBody);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      return createErrorResponse(400, 'Validation failed', {
        errors,
        message: 'Please check your input and try again'
      });
    }

    const requestData = validationResult.data;

    // Check if user exists and get their details
    const result = await cognito.adminGetUser({
      UserPoolId: USER_POOL_ID,
      Username: requestData.username
    }).promise();
    
    if (!result.UserAttributes) {
      return createErrorResponse(404, 'User not found');
    }
    
    // Extract user information
    const userEmail = result.UserAttributes?.find((attr: any) => attr.Name === 'email')?.Value;
    const emailVerified = result.UserAttributes?.find((attr: any) => attr.Name === 'email_verified')?.Value === 'true';
    const disabled = result.Enabled === false;

    // Verify user exists and is not confirmed
    if (userEmail !== requestData.email) {
      return createErrorResponse(404, 'User not found');
    }

    if (emailVerified) {
      return createErrorResponse(400, 'User account is already confirmed');
    }

    if (disabled) {
      return createErrorResponse(400, 'User account is disabled');
    }

    // Resend confirmation code
    const resendResult = await resendConfirmationCode(requestData.username);
    if (!resendResult.success) {
      return createErrorResponse(500, resendResult.error || 'Resend failed');
    }

    // Return success response
    return createSuccessResponse({
      message: 'Confirmation code resent successfully',
      username: requestData.username,
      email: requestData.email
    }, 'A new confirmation code has been sent to your email address.');

  } catch (error) {
    console.error('Resend confirmation handler error:', error);
    return createErrorResponse(500, 'Internal server error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Resend confirmation code
 */
async function resendConfirmationCode(username: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Resend confirmation code
    await cognito.resendConfirmationCode({
      ClientId: USER_POOL_CLIENT_ID,
      Username: username
    }).promise();

    console.log(`Confirmation code resent for user: ${username}`);
    return { success: true };

  } catch (error) {
    console.error('Error resending confirmation code:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('UserNotFoundException')) {
        return {
          success: false,
          error: 'User not found'
        };
      }
      if (error.message.includes('InvalidParameterException')) {
        return {
          success: false,
          error: 'Invalid username'
        };
      }
      if (error.message.includes('LimitExceededException')) {
        return {
          success: false,
          error: 'Too many attempts. Please wait before requesting another code.'
        };
      }
      if (error.message.includes('NotAuthorizedException')) {
        return {
          success: false,
          error: 'User is not authorized to perform this action.'
        };
      }
    }

    return {
      success: false,
      error: 'Failed to resend confirmation code'
    };
  }
}

/**
 * Create success response
 */
function createSuccessResponse(data: any, message?: string) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    }),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'POST,OPTIONS'
    }
  };
}

/**
 * Create error response
 */
function createErrorResponse(statusCode: number, message: string, details?: any) {
  return {
    statusCode,
    body: JSON.stringify({
      success: false,
      error: message,
      details,
      timestamp: new Date().toISOString()
    }),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'POST,OPTIONS'
    }
  };
}
