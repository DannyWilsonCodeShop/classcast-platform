import { APIGatewayProxyHandler } from 'aws-lambda';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { z } from 'zod';

const cognito = new CognitoIdentityServiceProvider();

const USER_POOL_CLIENT_ID = process.env['USER_POOL_CLIENT_ID'] || '';

// Refresh token request schema
const refreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1),
  clientId: z.string().optional() // Optional override for client ID
});

// Response schemas
const refreshTokenSuccessSchema = z.object({
  success: z.literal(true),
  data: z.object({
    accessToken: z.string(),
    idToken: z.string(),
    expiresIn: z.number(),
    tokenType: z.string()
  })
});

const refreshTokenErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.any()).optional()
  })
});

type RefreshTokenRequest = z.infer<typeof refreshTokenRequestSchema>;
type RefreshTokenSuccessResponse = z.infer<typeof refreshTokenSuccessSchema>;
type RefreshTokenErrorResponse = z.infer<typeof refreshTokenErrorSchema>;

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Parse and validate request
    let requestBody: RefreshTokenRequest;
    
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (parseError) {
      return createErrorResponse('INVALID_JSON', 'Invalid JSON in request body');
    }

    const validationResult = refreshTokenRequestSchema.safeParse(requestBody);
    if (!validationResult.success) {
      return createErrorResponse('VALIDATION_ERROR', 'Invalid request data', {
        validationErrors: validationResult.error.errors
      });
    }

    const { refreshToken, clientId } = validationResult.data;
    const targetClientId = clientId || USER_POOL_CLIENT_ID;

    // Attempt to refresh tokens with Cognito
    const refreshResult = await refreshTokens(refreshToken, targetClientId);
    if (!refreshResult.success) {
      return createErrorResponse(refreshResult.error!.code, refreshResult.error!.message, refreshResult.error!.details);
    }

    // Create success response
    const response: RefreshTokenSuccessResponse = {
      success: true,
      data: {
        accessToken: refreshResult.tokens.AccessToken,
        idToken: refreshResult.tokens.IdToken,
        expiresIn: refreshResult.tokens.ExpiresIn || 3600,
        tokenType: refreshResult.tokens.TokenType || 'Bearer'
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
    console.error('Refresh token handler error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Internal server error');
  }
};

// Helper function to refresh tokens with Cognito
async function refreshTokens(refreshToken: string, clientId: string): Promise<{
  success: boolean;
  tokens?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}> {
  try {
    // Check refresh token rate limiting
    const rateLimitKey = `refresh_${refreshToken.substring(0, 8)}`;
    const currentTime = Date.now();
    
    // Simple in-memory rate limiting (in production, use Redis or DynamoDB)
    if (refreshAttempts.has(rateLimitKey)) {
      const attempts = refreshAttempts.get(rateLimitKey)!;
      if (attempts.count > 5 && (currentTime - attempts.lastAttempt) < 60000) {
        return {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many refresh attempts. Please wait before trying again.'
          }
        };
      }
    }

    const params = {
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: clientId,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken
      }
    };

    const result = await cognito.initiateAuth(params).promise();
    
    if (result.AuthenticationResult) {
      // Update rate limiting
      if (refreshAttempts.has(rateLimitKey)) {
        const attempts = refreshAttempts.get(rateLimitKey)!;
        attempts.count = 0;
        attempts.lastAttempt = currentTime;
      } else {
        refreshAttempts.set(rateLimitKey, { count: 0, lastAttempt: currentTime });
      }

      // Log successful refresh for analytics
      console.log(`Token refresh successful for client: ${clientId}`);
      
      return {
        success: true,
        tokens: result.AuthenticationResult
      };
    } else {
      // Increment failed attempts
      if (refreshAttempts.has(rateLimitKey)) {
        const attempts = refreshAttempts.get(rateLimitKey)!;
        attempts.count++;
        attempts.lastAttempt = currentTime;
      } else {
        refreshAttempts.set(rateLimitKey, { count: 1, lastAttempt: currentTime });
      }

      return {
        success: false,
        error: {
          code: 'REFRESH_FAILED',
          message: 'Token refresh failed'
        }
      };
    }

  } catch (error: any) {
    console.error('Cognito refresh token error:', error);
    
    // Increment failed attempts
    const rateLimitKey = `refresh_${refreshToken.substring(0, 8)}`;
    if (refreshAttempts.has(rateLimitKey)) {
      const attempts = refreshAttempts.get(rateLimitKey)!;
      attempts.count++;
      attempts.lastAttempt = Date.now();
    } else {
      refreshAttempts.set(rateLimitKey, { count: 1, lastAttempt: Date.now() });
    }
    
    if (error.code === 'NotAuthorizedException') {
      return {
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid or expired refresh token'
        }
      };
    } else if (error.code === 'TokenRefreshRequiredException') {
      return {
        success: false,
        error: {
          code: 'TOKEN_REFRESH_REQUIRED',
          message: 'Token refresh required. Please sign in again.'
        }
      };
    } else if (error.code === 'TooManyRequestsException') {
      return {
        success: false,
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many refresh attempts. Please try again later.'
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
    } else {
      return {
        success: false,
        error: {
          code: 'REFRESH_ERROR',
          message: 'Token refresh service error',
          details: { originalError: error.message }
        }
      };
    }
  }
}

// Rate limiting storage for refresh tokens
const refreshAttempts = new Map<string, { count: number; lastAttempt: number }>();

// Clean up old rate limiting entries periodically
setInterval(() => {
  const currentTime = Date.now();
  for (const [key, value] of refreshAttempts.entries()) {
    if (currentTime - value.lastAttempt > 300000) { // 5 minutes
      refreshAttempts.delete(key);
    }
  }
}, 60000); // Clean up every minute

// Helper function to create error response
function createErrorResponse(code: string, message: string, details?: any): any {
  const errorResponse: RefreshTokenErrorResponse = {
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
