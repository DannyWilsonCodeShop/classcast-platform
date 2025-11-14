import { APIGatewayProxyHandler } from 'aws-lambda';
import { CognitoIdentityServiceProvider, DynamoDB } from 'aws-sdk';
import { z } from 'zod';

const cognito = new CognitoIdentityServiceProvider();
const dynamodb = new DynamoDB.DocumentClient();

const USER_POOL_CLIENT_ID = process.env['USER_POOL_CLIENT_ID'] || '';
const SESSIONS_TABLE = process.env['SESSIONS_TABLE'] || 'DemoProject-Sessions';

// Session management request schemas
const sessionValidationSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1).optional()
});

const sessionListSchema = z.object({
  userId: z.string().min(1),
  includeExpired: z.boolean().optional().default(false),
  limit: z.number().min(1).max(100).optional().default(20),
  nextToken: z.string().optional()
});

const sessionRevokeSchema = z.object({
  sessionId: z.string().min(1),
  reason: z.string().min(1).max(200).optional()
});

// Response schemas
const sessionInfoSchema = z.object({
  sessionId: z.string(),
  userId: z.string(),
  deviceInfo: z.object({
    userAgent: z.string().optional(),
    ipAddress: z.string().optional(),
    deviceType: z.string().optional(),
    lastSeen: z.string()
  }),
  status: z.enum(['active', 'expired', 'revoked']),
  createdAt: z.string(),
  expiresAt: z.string(),
  lastActivity: z.string(),
  refreshCount: z.number(),
  metadata: z.record(z.any()).optional()
});

const sessionValidationResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    isValid: z.boolean(),
    session: sessionInfoSchema.optional(),
    remainingTime: z.number().optional(),
    requiresRefresh: z.boolean()
  })
});

const sessionListResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    sessions: z.array(sessionInfoSchema),
    totalCount: z.number(),
    nextToken: z.string().optional()
  })
});

type SessionValidationRequest = z.infer<typeof sessionValidationSchema>;
type SessionRevokeRequest = z.infer<typeof sessionRevokeSchema>;

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const { httpMethod, path } = event;
    
    // Route to appropriate handler based on HTTP method and path
    if (httpMethod === 'POST' && path.includes('/validate')) {
      return await handleSessionValidation(event);
    } else if (httpMethod === 'GET' && path.includes('/list')) {
      return await handleSessionList(event);
    } else if (httpMethod === 'DELETE' && path.includes('/revoke')) {
      return await handleSessionRevoke(event);
    } else if (httpMethod === 'POST' && path.includes('/extend')) {
      return await handleSessionExtend(event);
    } else {
      return createErrorResponse('INVALID_ENDPOINT', 'Invalid session management endpoint');
    }
  } catch (error) {
    console.error('Session management handler error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Internal server error');
  }
};

// Session validation handler
async function handleSessionValidation(event: any) {
  try {
    let requestBody: SessionValidationRequest;
    
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (parseError) {
      return createErrorResponse('INVALID_JSON', 'Invalid JSON in request body');
    }

    const validationResult = sessionValidationSchema.safeParse(requestBody);
    if (!validationResult.success) {
      return createErrorResponse('VALIDATION_ERROR', 'Invalid request data', {
        validationErrors: validationResult.error.errors
      });
    }

    const { accessToken, refreshToken } = validationResult.data;

    // Validate session and get session info
    const sessionResult = await validateSession(accessToken, refreshToken);
    
    const response: z.infer<typeof sessionValidationResponseSchema> = {
      success: true,
      data: {
        isValid: sessionResult.isValid,
        session: sessionResult.session,
        remainingTime: sessionResult.remainingTime,
        requiresRefresh: sessionResult.requiresRefresh
      }
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,GET,DELETE,OPTIONS'
      },
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Session validation error:', error);
    return createErrorResponse('VALIDATION_ERROR', 'Session validation failed');
  }
}

// Session listing handler
async function handleSessionList(event: any) {
  try {
    const queryParams = event.queryStringParameters || {};
    
    const validationResult = sessionListSchema.safeParse({
      userId: queryParams.userId,
      includeExpired: queryParams.includeExpired === 'true',
      limit: queryParams.limit ? parseInt(queryParams.limit) : 20,
      nextToken: queryParams.nextToken
    });

    if (!validationResult.success) {
      return createErrorResponse('VALIDATION_ERROR', 'Invalid query parameters', {
        validationErrors: validationResult.error.errors
      });
    }

    const { userId, includeExpired, limit, nextToken } = validationResult.data;

    // Get user sessions from DynamoDB
    const sessionsResult = await getUserSessions(userId, includeExpired, limit, nextToken);
    
    const response: z.infer<typeof sessionListResponseSchema> = {
      success: true,
      data: {
        sessions: sessionsResult.sessions,
        totalCount: sessionsResult.totalCount,
        nextToken: sessionsResult.nextToken
      }
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,GET,DELETE,OPTIONS'
      },
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Session listing error:', error);
    return createErrorResponse('LIST_ERROR', 'Failed to list sessions');
  }
}

// Session revocation handler
async function handleSessionRevoke(event: any) {
  try {
    let requestBody: SessionRevokeRequest;
    
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (parseError) {
      return createErrorResponse('INVALID_JSON', 'Invalid JSON in request body');
    }

    const validationResult = sessionRevokeSchema.safeParse(requestBody);
    if (!validationResult.success) {
      return createErrorResponse('VALIDATION_ERROR', 'Invalid request data', {
        validationErrors: validationResult.error.errors
      });
    }

    const { sessionId, reason } = validationResult.data;

    // Revoke the session
    const revokeResult = await revokeSession(sessionId, reason);
    
    if (!revokeResult.success) {
      return createErrorResponse(revokeResult.error!.code, revokeResult.error!.message);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,GET,DELETE,OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        message: 'Session revoked successfully',
        data: { sessionId, reason }
      })
    };

  } catch (error) {
    console.error('Session revocation error:', error);
    return createErrorResponse('REVOKE_ERROR', 'Failed to revoke session');
  }
}

// Session extension handler
async function handleSessionExtend(event: any) {
  try {
    let requestBody: { accessToken: string; refreshToken: string };
    
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (parseError) {
      return createErrorResponse('INVALID_JSON', 'Invalid JSON in request body');
    }

    const { accessToken, refreshToken } = requestBody;

    if (!accessToken || !refreshToken) {
      return createErrorResponse('MISSING_TOKENS', 'Access token and refresh token are required');
    }

    // Extend the session by refreshing tokens
    const extendResult = await extendSession(accessToken, refreshToken);
    
    if (!extendResult.success) {
      return createErrorResponse(extendResult.error!.code, extendResult.error!.message);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,GET,DELETE,OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        message: 'Session extended successfully',
        data: {
          accessToken: extendResult.tokens.AccessToken,
          idToken: extendResult.tokens.IdToken,
          expiresIn: extendResult.tokens.ExpiresIn,
          tokenType: extendResult.tokens.TokenType
        }
      })
    };

  } catch (error) {
    console.error('Session extension error:', error);
    return createErrorResponse('EXTEND_ERROR', 'Failed to extend session');
  }
}

// Helper function to validate session
async function validateSession(accessToken: string, _refreshToken?: string): Promise<{
  isValid: boolean;
  session?: any;
  remainingTime?: number;
  requiresRefresh: boolean;
}> {
  try {
    // Decode JWT to get expiration and user info
    const tokenPayload = JSON.parse(Buffer.from(accessToken.split('.')[1] || '', 'base64').toString());
    const currentTime = Math.floor(Date.now() / 1000);
    const tokenExp = tokenPayload.exp;
    
    if (!tokenExp) {
      return { isValid: false, requiresRefresh: false };
    }

    const remainingTime = tokenExp - currentTime;
    const isValid = remainingTime > 0;
    const requiresRefresh = remainingTime < 300; // Refresh if less than 5 minutes remaining

    // Get session info from DynamoDB if session table exists
    let session = null;
    try {
      if (SESSIONS_TABLE !== 'DemoProject-Sessions') {
        const sessionResult = await dynamodb.get({
          TableName: SESSIONS_TABLE,
          Key: { sessionId: tokenPayload.jti || 'unknown' }
        }).promise();
        session = sessionResult.Item;
      }
    } catch (error) {
      console.warn('Could not fetch session info:', error);
    }

    return {
      isValid,
      session,
      remainingTime: Math.max(0, remainingTime),
      requiresRefresh
    };

  } catch (error) {
    console.error('Session validation error:', error);
    return { isValid: false, requiresRefresh: false };
  }
}

// Helper function to get user sessions
async function getUserSessions(userId: string, includeExpired: boolean, limit: number, nextToken?: string): Promise<{
  sessions: any[];
  totalCount: number;
  nextToken?: string;
}> {
  try {
    if (SESSIONS_TABLE === 'DemoProject-Sessions') {
      // Return mock data if sessions table doesn't exist
      return {
        sessions: [],
        totalCount: 0
      };
    }

    const params: any = {
      TableName: SESSIONS_TABLE,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId },
      Limit: limit
    };

    if (!includeExpired) {
      params.FilterExpression = '#status = :status';
      params.ExpressionAttributeNames = { '#status': 'status' };
      params.ExpressionAttributeValues[':status'] = 'active';
    }

    if (nextToken) {
      params.ExclusiveStartKey = { sessionId: nextToken };
    }

    const result = await dynamodb.query(params).promise();
    
    return {
      sessions: result.Items || [],
      totalCount: result.Count || 0,
      nextToken: result.LastEvaluatedKey?.['sessionId']
    };

  } catch (error) {
    console.error('Error fetching user sessions:', error);
    return { sessions: [], totalCount: 0 };
  }
}

// Helper function to revoke session
async function revokeSession(sessionId: string, reason?: string): Promise<{
  success: boolean;
  error?: { code: string; message: string };
}> {
  try {
    if (SESSIONS_TABLE === 'DemoProject-Sessions') {
      // Mock success if sessions table doesn't exist
      return { success: true };
    }

    // Update session status to revoked
    await dynamodb.update({
      TableName: SESSIONS_TABLE,
      Key: { sessionId },
      UpdateExpression: 'SET #status = :status, revokedAt = :revokedAt, revokeReason = :revokeReason',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': 'revoked',
        ':revokedAt': new Date().toISOString(),
        ':revokeReason': reason || 'Manually revoked'
      }
    }).promise();

    return { success: true };

  } catch (error) {
    console.error('Error revoking session:', error);
    return {
      success: false,
      error: { code: 'REVOKE_FAILED', message: 'Failed to revoke session' }
    };
  }
}

// Helper function to extend session
async function extendSession(_accessToken: string, refreshToken: string): Promise<{
  success: boolean;
  tokens?: any;
  error?: { code: string; message: string };
}> {
  try {
    // Use Cognito to refresh tokens
    const params = {
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: USER_POOL_CLIENT_ID,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken
      }
    };

    const result = await cognito.initiateAuth(params).promise();
    
    if (result.AuthenticationResult) {
      return {
        success: true,
        tokens: result.AuthenticationResult
      };
    } else {
      return {
        success: false,
        error: { code: 'REFRESH_FAILED', message: 'Token refresh failed' }
      };
    }

  } catch (error: any) {
    console.error('Session extension error:', error);
    
    if (error.code === 'NotAuthorizedException') {
      return {
        success: false,
        error: { code: 'INVALID_REFRESH_TOKEN', message: 'Invalid or expired refresh token' }
      };
    } else {
      return {
        success: false,
        error: { code: 'EXTENSION_ERROR', message: 'Session extension failed' }
      };
    }
  }
}

// Helper function to create error response
function createErrorResponse(code: string, message: string, details?: any): any {
  return {
    statusCode: 400,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'POST,GET,DELETE,OPTIONS'
    },
    body: JSON.stringify({
      success: false,
      error: {
        code,
        message,
        ...(details && { details })
      }
    })
  };
}
