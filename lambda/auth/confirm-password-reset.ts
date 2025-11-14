import { APIGatewayProxyHandler } from 'aws-lambda';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { z } from 'zod';

const cognito = new CognitoIdentityServiceProvider();

const USER_POOL_CLIENT_ID = process.env['USER_POOL_CLIENT_ID'] || '';

// Confirm password reset request schema
const confirmPasswordResetSchema = z.object({
  username: z.string().min(1).max(254), // Can be username or email
  confirmationCode: z.string().min(6).max(6), // 6-digit code
  newPassword: z.string().min(8).max(128).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  clientId: z.string().optional() // Optional override for client ID
});

// Response schemas
const confirmPasswordResetSuccessSchema = z.object({
  success: z.literal(true),
  message: z.string()
});

const confirmPasswordResetErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.any()).optional()
  })
});

type ConfirmPasswordResetRequest = z.infer<typeof confirmPasswordResetSchema>;
type ConfirmPasswordResetSuccessResponse = z.infer<typeof confirmPasswordResetSuccessSchema>;
type ConfirmPasswordResetErrorResponse = z.infer<typeof confirmPasswordResetErrorSchema>;

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Parse and validate request
    let requestBody: ConfirmPasswordResetRequest;
    
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (parseError) {
      return createErrorResponse('INVALID_JSON', 'Invalid JSON in request body');
    }

    const validationResult = confirmPasswordResetSchema.safeParse(requestBody);
    if (!validationResult.success) {
      return createErrorResponse('VALIDATION_ERROR', 'Invalid request data', {
        validationErrors: validationResult.error.errors
      });
    }

    const { username, confirmationCode, newPassword, clientId } = validationResult.data;
    const targetClientId = clientId || USER_POOL_CLIENT_ID;

    // Attempt to confirm password reset with Cognito
    const confirmResult = await confirmPasswordReset(username, confirmationCode, newPassword, targetClientId);
    if (!confirmResult.success) {
      return createErrorResponse(confirmResult.error!.code, confirmResult.error!.message, confirmResult.error!.details);
    }

    // Create success response
    const response: ConfirmPasswordResetSuccessResponse = {
      success: true,
      message: 'Password reset successful. You can now sign in with your new password.'
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      },
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Confirm password reset handler error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Internal server error');
  }
};

// Helper function to confirm password reset
async function confirmPasswordReset(
  username: string, 
  confirmationCode: string, 
  newPassword: string, 
  clientId: string
): Promise<{
  success: boolean;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}> {
  try {
    const params = {
      ClientId: clientId,
      Username: username,
      ConfirmationCode: confirmationCode,
      Password: newPassword
    };

    await cognito.confirmForgotPassword(params).promise();
    
    return { success: true };

  } catch (error: any) {
    console.error('Cognito confirm password reset error:', error);
    
    if (error.code === 'CodeMismatchException') {
      return {
        success: false,
        error: {
          code: 'INVALID_CONFIRMATION_CODE',
          message: 'Invalid confirmation code. Please check your email and try again.'
        }
      };
    } else if (error.code === 'ExpiredCodeException') {
      return {
        success: false,
        error: {
          code: 'EXPIRED_CONFIRMATION_CODE',
          message: 'Confirmation code has expired. Please request a new password reset.'
        }
      };
    } else if (error.code === 'UserNotFoundException') {
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found with the provided username or email'
        }
      };
    } else if (error.code === 'InvalidParameterException') {
      return {
        success: false,
        error: {
          code: 'INVALID_PARAMETERS',
          message: 'Invalid parameters provided'
        }
      };
    } else if (error.code === 'InvalidPasswordException') {
      return {
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: 'New password does not meet requirements. Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.'
        }
      };
    } else if (error.code === 'TooManyRequestsException') {
      return {
        success: false,
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many password reset attempts. Please try again later.'
        }
      };
    } else if (error.code === 'LimitExceededException') {
      return {
        success: false,
        error: {
          code: 'LIMIT_EXCEEDED',
          message: 'Password reset limit exceeded. Please try again later.'
        }
      };
    } else if (error.code === 'NotAuthorizedException') {
      return {
        success: false,
        error: {
          code: 'NOT_AUTHORIZED',
          message: 'User is not authorized to reset password'
        }
      };
    } else {
      return {
        success: false,
        error: {
          code: 'CONFIRM_PASSWORD_RESET_ERROR',
          message: 'Password reset confirmation service error',
          details: { originalError: error.message }
        }
      };
    }
  }
}

// Helper function to create error response
function createErrorResponse(code: string, message: string, details?: any): any {
  const errorResponse: ConfirmPasswordResetErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details })
    }
  };

  return {
    statusCode: 400,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'POST,OPTIONS'
    },
    body: JSON.stringify(errorResponse)
  };
}
