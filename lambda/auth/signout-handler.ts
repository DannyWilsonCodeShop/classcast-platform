import { APIGatewayProxyHandler } from 'aws-lambda';
import { CognitoIdentityServiceProvider, DynamoDB } from 'aws-sdk';
import { z } from 'zod';

const cognito = new CognitoIdentityServiceProvider();

const USER_POOL_CLIENT_ID = process.env['USER_POOL_CLIENT_ID'] || '';
const SESSIONS_TABLE = process.env['SESSIONS_TABLE'] || 'DemoProject-Sessions';

// Signout request schema
const signoutRequestSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().optional() // Optional for global signout
});

// Response schemas
const signoutSuccessSchema = z.object({
  success: z.literal(true),
  message: z.string()
});

const signoutErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.any()).optional()
  })
});

type SignoutRequest = z.infer<typeof signoutRequestSchema>;
type SignoutSuccessResponse = z.infer<typeof signoutSuccessSchema>;
type SignoutErrorResponse = z.infer<typeof signoutErrorSchema>;

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Parse and validate request
    let requestBody: SignoutRequest;
    
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (parseError) {
      return createErrorResponse('INVALID_JSON', 'Invalid JSON in request body');
    }

    const validationResult = signoutRequestSchema.safeParse(requestBody);
    if (!validationResult.success) {
      return createErrorResponse('VALIDATION_ERROR', 'Invalid request data', {
        validationErrors: validationResult.error.errors
      });
    }

    const { accessToken, refreshToken } = validationResult.data;

    // Revoke the access token
    const revokeResult = await revokeAccessToken(accessToken);
    if (!revokeResult.success) {
      return createErrorResponse(revokeResult.error!.code, revokeResult.error!.message, revokeResult.error!.details);
    }

    // If refresh token is provided, revoke it as well (global signout)
    if (refreshToken) {
      const globalSignoutResult = await performGlobalSignout(refreshToken);
      if (!globalSignoutResult.success) {
        console.warn('Global signout failed, but access token was revoked:', globalSignoutResult.error);
        // Don't fail the signout if global signout fails
      }
    }

    // Create success response
    const response: SignoutSuccessResponse = {
      success: true,
      message: refreshToken ? 
        'Successfully signed out from all devices' : 
        'Successfully signed out'
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
    console.error('Signout handler error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Internal server error');
  }
};

// Helper function to revoke access token and cleanup session
async function revokeAccessToken(accessToken: string): Promise<{
  success: boolean;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}> {
  try {
    const params = {
      Token: accessToken
    };

    await cognito.revokeToken({
      ...params,
      ClientId: USER_POOL_CLIENT_ID
    }).promise();
    
    // Clean up session record from DynamoDB
    const dynamodb = new DynamoDB.DocumentClient();
    
    try {
      const tokenPayload = JSON.parse(Buffer.from(accessToken.split('.')[1] || '', 'base64').toString());
      
      await dynamodb.delete({
        TableName: SESSIONS_TABLE,
        Key: {
          sessionId: tokenPayload.sub + '_' + tokenPayload.iat
        }
      }).promise();
      
      console.log('Session record cleaned up from DynamoDB');
    } catch (error) {
      console.error('Failed to clean up session record:', error);
      // Continue execution even if cleanup fails
    }
    
    return { success: true };

  } catch (error: any) {
    console.error('Cognito revoke token error:', error);
    
    if (error.code === 'NotAuthorizedException') {
      return {
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired access token'
        }
      };
    } else if (error.code === 'TooManyRequestsException') {
      return {
        success: false,
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many signout attempts. Please try again later.'
        }
      };
    } else {
      return {
        success: false,
        error: {
          code: 'REVOKE_ERROR',
          message: 'Token revocation service error',
          details: { originalError: error.message }
        }
      };
    }
  }
}

// Helper function to perform global signout (revoke refresh token)
async function performGlobalSignout(refreshToken: string): Promise<{
  success: boolean;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}> {
  try {
    await cognito.revokeToken({
      Token: refreshToken,
      ClientId: USER_POOL_CLIENT_ID
    }).promise();
    
    return { success: true };

  } catch (error: any) {
    console.error('Cognito global signout error:', error);
    
    if (error.code === 'NotAuthorizedException') {
      return {
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid or expired refresh token'
        }
      };
    } else if (error.code === 'TooManyRequestsException') {
      return {
        success: false,
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many signout attempts. Please try again later.'
        }
      };
    } else {
      return {
        success: false,
        error: {
          code: 'GLOBAL_SIGNOUT_ERROR',
          message: 'Global signout service error',
          details: { originalError: error.message }
        }
      };
    }
  }
}

// Helper function to create error response
function createErrorResponse(code: string, message: string, details?: any): any {
  const errorResponse: SignoutErrorResponse = {
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
