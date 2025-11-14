import { APIGatewayProxyHandler } from 'aws-lambda';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { z } from 'zod';

const cognito = new CognitoIdentityServiceProvider();

const USER_POOL_CLIENT_ID = process.env['USER_POOL_CLIENT_ID'] || '';

// Forgot password request schema
const forgotPasswordRequestSchema = z.object({
  username: z.string().min(1).max(254), // Can be username or email
  clientId: z.string().optional() // Optional override for client ID
});

// Response schemas
const forgotPasswordSuccessSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.object({
    deliveryMedium: z.string().optional(),
    destination: z.string().optional(),
    attributeName: z.string().optional()
  })
});

const forgotPasswordErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.any()).optional()
  })
});

type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;
type ForgotPasswordSuccessResponse = z.infer<typeof forgotPasswordSuccessSchema>;
type ForgotPasswordErrorResponse = z.infer<typeof forgotPasswordErrorSchema>;

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Parse and validate request
    let requestBody: ForgotPasswordRequest;
    
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (parseError) {
      return createErrorResponse('INVALID_JSON', 'Invalid JSON in request body');
    }

    const validationResult = forgotPasswordRequestSchema.safeParse(requestBody);
    if (!validationResult.success) {
      return createErrorResponse('VALIDATION_ERROR', 'Invalid request data', {
        validationErrors: validationResult.error.errors
      });
    }

    const { username, clientId } = validationResult.data;
    const targetClientId = clientId || USER_POOL_CLIENT_ID;

    // Attempt to initiate forgot password flow with Cognito
    const forgotPasswordResult = await initiateForgotPassword(username, targetClientId);
    if (!forgotPasswordResult.success) {
      return createErrorResponse(forgotPasswordResult.error!.code, forgotPasswordResult.error!.message, forgotPasswordResult.error!.details);
    }

    // Create success response
    const response: ForgotPasswordSuccessResponse = {
      success: true,
      message: 'Password reset code sent successfully. Please check your email.',
      data: {
        deliveryMedium: forgotPasswordResult.deliveryMedium,
        destination: forgotPasswordResult.destination,
        attributeName: forgotPasswordResult.attributeName
      }
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
    console.error('Forgot password handler error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Internal server error');
  }
};

// Helper function to initiate forgot password flow
async function initiateForgotPassword(username: string, clientId: string): Promise<{
  success: true;
  deliveryMedium?: string;
  destination?: string;
  attributeName?: string;
} | {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}> {
  try {
    const params = {
      ClientId: clientId,
      Username: username
    };

    const result = await cognito.forgotPassword(params).promise();
    
    return {
      success: true,
      ...(result.CodeDeliveryDetails?.DeliveryMedium && { deliveryMedium: result.CodeDeliveryDetails.DeliveryMedium }),
      ...(result.CodeDeliveryDetails?.Destination && { destination: result.CodeDeliveryDetails.Destination }),
      ...(result.CodeDeliveryDetails?.AttributeName && { attributeName: result.CodeDeliveryDetails.AttributeName })
    };

  } catch (error: any) {
    console.error('Cognito forgot password error:', error);
    
    if (error.code === 'UserNotFoundException') {
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
          code: 'FORGOT_PASSWORD_ERROR',
          message: 'Password reset service error',
          details: { originalError: error.message }
        }
      };
    }
  }
}

// Helper function to create error response
function createErrorResponse(code: string, message: string, details?: any): any {
  const errorResponse: ForgotPasswordErrorResponse = {
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
