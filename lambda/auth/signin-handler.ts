import { APIGatewayProxyHandler } from 'aws-lambda';
import { CognitoIdentityServiceProvider, DynamoDB } from 'aws-sdk';
import { z } from 'zod';

const cognito = new CognitoIdentityServiceProvider();
const dynamodb = new DynamoDB.DocumentClient();

const USER_POOL_ID = process.env['USER_POOL_ID'] || '';
const USER_POOL_CLIENT_ID = process.env['USER_POOL_CLIENT_ID'] || '';
const USERS_TABLE = process.env['USERS_TABLE'] || 'DemoProject-Users';

// Signin request schema
const signinRequestSchema = z.object({
  username: z.string().min(1).max(254), // Can be username or email
  password: z.string().min(1).max(128),
  rememberMe: z.boolean().optional().default(false)
});

// Response schemas
const signinSuccessSchema = z.object({
  success: z.literal(true),
  data: z.object({
    accessToken: z.string(),
    idToken: z.string(),
    refreshToken: z.string(),
    expiresIn: z.number(),
    tokenType: z.string(),
    user: z.object({
      userId: z.string(),
      username: z.string(),
      email: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      role: z.string(),
      status: z.string(),
      lastLogin: z.string().optional(),
      preferences: z.record(z.any()).optional()
    })
  })
});

const signinErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.any()).optional()
  })
});

type SigninRequest = z.infer<typeof signinRequestSchema>;
type SigninSuccessResponse = z.infer<typeof signinSuccessSchema>;
type SigninErrorResponse = z.infer<typeof signinErrorSchema>;

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Parse and validate request
    let requestBody: SigninRequest;
    
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (parseError) {
      return createErrorResponse('INVALID_JSON', 'Invalid JSON in request body');
    }

    const validationResult = signinRequestSchema.safeParse(requestBody);
    if (!validationResult.success) {
      return createErrorResponse('VALIDATION_ERROR', 'Invalid request data', {
        validationErrors: validationResult.error.errors
      });
    }

    const { username, password } = validationResult.data;

    // Attempt to authenticate with Cognito
    const authResult = await authenticateUser(username, password);
    if (!authResult.success) {
      return createErrorResponse(authResult.error!.code, authResult.error!.message, authResult.error!.details);
    }

    // Get user profile from DynamoDB
    const userProfile = await getUserProfile(authResult.userId!);
    if (!userProfile) {
      return createErrorResponse('USER_PROFILE_NOT_FOUND', 'User profile not found');
    }

    // Update last login timestamp and create session
    await updateLastLogin(authResult.userId!, authResult.tokens, event);

    // Create success response
    const response: SigninSuccessResponse = {
      success: true,
      data: {
        accessToken: authResult.tokens.AccessToken,
        idToken: authResult.tokens.IdToken,
        refreshToken: authResult.tokens.RefreshToken,
        expiresIn: authResult.tokens.ExpiresIn || 3600,
        tokenType: authResult.tokens.TokenType || 'Bearer',
        user: {
          userId: userProfile.userId,
          username: userProfile.username,
          email: userProfile.email,
          firstName: userProfile.firstName,
          lastName: userProfile.lastName,
          role: userProfile.role,
          status: userProfile.status,
          lastLogin: userProfile.lastLogin,
          preferences: userProfile.preferences
        }
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
    console.error('Signin handler error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Internal server error');
  }
};

// Helper function to authenticate user with Cognito
async function authenticateUser(username: string, password: string): Promise<{
  success: true;
  userId?: string;
  tokens?: any;
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
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: USER_POOL_CLIENT_ID,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password
      }
    };

    const result = await cognito.initiateAuth(params).promise();
    
    if (result.AuthenticationResult) {
      const userId = result.AuthenticationResult?.IdToken ? 
        extractUserIdFromToken(result.AuthenticationResult.IdToken) : undefined;
      
      return {
        success: true,
        ...(userId && { userId }),
        tokens: result.AuthenticationResult
      };
    } else if (result.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
      return {
        success: false,
        error: {
          code: 'NEW_PASSWORD_REQUIRED',
          message: 'New password required. Please complete password reset.',
          details: {
            challengeName: result.ChallengeName,
            session: result.Session
          }
        }
      };
    } else if (result.ChallengeName === 'MFA_SETUP') {
      return {
        success: false,
        error: {
          code: 'MFA_SETUP_REQUIRED',
          message: 'MFA setup required. Please complete MFA configuration.',
          details: {
            challengeName: result.ChallengeName,
            session: result.Session
          }
        }
      };
    } else {
      return {
        success: false,
        error: {
          code: 'AUTHENTICATION_FAILED',
          message: 'Authentication failed'
        }
      };
    }

  } catch (error: any) {
    console.error('Cognito authentication error:', error);
    
    if (error.code === 'NotAuthorizedException') {
      return {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid username or password'
        }
      };
    } else if (error.code === 'UserNotConfirmedException') {
      return {
        success: false,
        error: {
          code: 'USER_NOT_CONFIRMED',
          message: 'User account not confirmed. Please check your email for confirmation link.'
        }
      };
    } else if (error.code === 'UserNotFoundException') {
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      };
    } else if (error.code === 'PasswordResetRequiredException') {
      return {
        success: false,
        error: {
          code: 'PASSWORD_RESET_REQUIRED',
          message: 'Password reset required. Please reset your password.'
        }
      };
    } else if (error.code === 'TooManyRequestsException') {
      return {
        success: false,
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many signin attempts. Please try again later.'
        }
      };
    } else {
      return {
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Authentication service error',
          details: { originalError: error.message }
        }
      };
    }
  }
}

// Helper function to get user profile from DynamoDB
async function getUserProfile(userId: string): Promise<any> {
  try {
    const params = {
      TableName: USERS_TABLE,
      Key: { userId }
    };

    const result = await dynamodb.get(params).promise();
    return result.Item;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

// Helper function to update last login timestamp and create session
async function updateLastLogin(userId: string, tokens: any, event: any): Promise<void> {
  try {
    const now = new Date().toISOString();
    
    // Update DynamoDB profile
    const dynamoParams = {
      TableName: USERS_TABLE,
      Key: { userId },
      UpdateExpression: 'SET lastLogin = :lastLogin',
      ExpressionAttributeValues: {
        ':lastLogin': now
      }
    };

    await dynamodb.update(dynamoParams).promise();

    // Update Cognito custom attribute
    const cognitoParams = {
      UserPoolId: USER_POOL_ID,
      Username: userId,
      UserAttributes: [
        {
          Name: 'custom:lastLogin',
          Value: now
        }
      ]
    };

    await cognito.adminUpdateUserAttributes(cognitoParams).promise();

    // Create session record if sessions table exists
    await createSessionRecord(userId, tokens, event, now);

  } catch (error) {
    console.error('Error updating last login:', error);
    // Don't fail the signin if this update fails
  }
}

// Helper function to create session record
async function createSessionRecord(userId: string, tokens: any, event: any, loginTime: string): Promise<void> {
  try {
    const SESSIONS_TABLE = process.env['SESSIONS_TABLE'];
    if (!SESSIONS_TABLE || SESSIONS_TABLE === 'DemoProject-Sessions') {
      // Sessions table not configured, skip session creation
      return;
    }

    // Extract device and location information from event
    const userAgent = event.headers['User-Agent'] || event.headers['user-agent'] || 'Unknown';
    const ipAddress = event.requestContext?.identity?.sourceIp || 'Unknown';
    const deviceType = getDeviceType(userAgent);
    
    // Generate session ID from access token
    const sessionId = tokens.AccessToken ? 
      Buffer.from(tokens.AccessToken.split('.')[1], 'base64').toString().substring(0, 16) : 
      `session_${Date.now()}`;

    const sessionRecord = {
      sessionId,
      userId,
      deviceInfo: {
        userAgent,
        ipAddress,
        deviceType,
        lastSeen: loginTime
      },
      status: 'active',
      createdAt: loginTime,
      expiresAt: new Date(Date.now() + (tokens.ExpiresIn || 3600) * 1000).toISOString(),
      lastActivity: loginTime,
      refreshCount: 0,
      metadata: {
        loginMethod: 'password',
        clientType: 'web',
        tokensIssued: {
          accessToken: !!tokens.AccessToken,
          idToken: !!tokens.IdToken,
          refreshToken: !!tokens.RefreshToken
        }
      }
    };

    await dynamodb.put({
      TableName: SESSIONS_TABLE,
      Item: sessionRecord
    }).promise();

    console.log(`Session record created for user ${userId}: ${sessionId}`);

  } catch (error) {
    console.error('Error creating session record:', error);
    // Don't fail signin if session creation fails
  }
}

// Helper function to determine device type from user agent
function getDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone') || ua.includes('ipad')) {
    return 'mobile';
  } else if (ua.includes('tablet')) {
    return 'tablet';
  } else if (ua.includes('bot') || ua.includes('crawler')) {
    return 'bot';
  } else {
    return 'desktop';
  }
}

// Helper function to extract user ID from JWT token
function extractUserIdFromToken(idToken: string): string | undefined {
  try {
    // Decode the JWT token (without verification for this use case)
    const payload = JSON.parse(Buffer.from(idToken.split('.')[1] || '', 'base64').toString());
    return payload.sub;
  } catch (error) {
    console.error('Error extracting user ID from token:', error);
    return undefined;
  }
}

// Helper function to create error response
function createErrorResponse(code: string, message: string, details?: any): any {
  const errorResponse: SigninErrorResponse = {
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
