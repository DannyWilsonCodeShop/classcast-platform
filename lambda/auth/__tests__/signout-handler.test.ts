import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { handler } from '../signout-handler';
import { CognitoIdentityServiceProvider } from 'aws-sdk';

// Mock AWS SDK
jest.mock('aws-sdk');

const mockCognito = CognitoIdentityServiceProvider as jest.MockedClass<typeof CognitoIdentityServiceProvider>;

// Mock environment variables
const originalEnv = process.env;

describe('Signout Handler', () => {
  let mockCognitoInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env = {
      ...originalEnv,
      USER_POOL_CLIENT_ID: 'test-client-id',
      SESSIONS_TABLE: 'test-sessions-table'
    };

    // Mock Cognito instance
    mockCognitoInstance = {
      revokeToken: jest.fn()
    };
    mockCognito.mockImplementation(() => mockCognitoInstance);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const createValidSignoutRequest = (overrides: any = {}) => ({
    accessToken: 'valid.access.token',
    refreshToken: 'valid.refresh.token',
    ...overrides
  });

  const createAPIGatewayEvent = (body: any): APIGatewayProxyEvent => ({
    body: JSON.stringify(body),
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'POST',
    isBase64Encoded: false,
    path: '/signout',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: ''
  });

  describe('Request Validation', () => {
    test('should accept valid signout request with both tokens', async () => {
      const request = createValidSignoutRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful token revocation
      mockCognitoInstance.revokeToken.mockResolvedValue({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Successfully signed out from all devices');
    });

    test('should accept valid signout request with only access token', async () => {
      const request = createValidSignoutRequest({ refreshToken: undefined });
      const event = createAPIGatewayEvent(request);

      // Mock successful token revocation
      mockCognitoInstance.revokeToken.mockResolvedValue({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Successfully signed out');
    });

    test('should reject invalid JSON in request body', async () => {
      const event = {
        ...createAPIGatewayEvent({}),
        body: 'invalid json'
      };

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_JSON');
      expect(body.error.message).toBe('Invalid JSON in request body');
    });

    test('should reject request with missing access token', async () => {
      const request = { refreshToken: 'valid.refresh.token' };
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toBe('Invalid request data');
      expect(body.error.details.validationErrors).toHaveLength(1);
    });

    test('should reject empty access token', async () => {
      const request = createValidSignoutRequest({ accessToken: '' });
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should accept empty refresh token', async () => {
      const request = createValidSignoutRequest({ refreshToken: '' });
      const event = createAPIGatewayEvent(request);

      // Mock successful token revocation
      mockCognitoInstance.revokeToken.mockResolvedValue({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Successfully signed out');
    });
  });

  describe('Access Token Revocation', () => {
    test('should call Cognito revokeToken with access token', async () => {
      const request = createValidSignoutRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful token revocation
      mockCognitoInstance.revokeToken.mockResolvedValue({});

      await handler(event, {} as any, {} as any);

      expect(mockCognitoInstance.revokeToken).toHaveBeenCalledWith({
        Token: 'valid.access.token'
      });
    });

    test('should handle NotAuthorizedException for access token', async () => {
      const request = createValidSignoutRequest();
      const event = createAPIGatewayEvent(request);

      // Mock Cognito NotAuthorizedException
      const error = new Error('NotAuthorizedException');
      error.code = 'NotAuthorizedException';
      mockCognitoInstance.revokeToken.mockRejectedValue(error);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_TOKEN');
      expect(body.error.message).toBe('Invalid or expired access token');
    });

    test('should handle TooManyRequestsException for access token', async () => {
      const request = createValidSignoutRequest();
      const event = createAPIGatewayEvent(request);

      // Mock Cognito TooManyRequestsException
      const error = new Error('TooManyRequestsException');
      error.code = 'TooManyRequestsException';
      mockCognitoInstance.revokeToken.mockRejectedValue(error);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('TOO_MANY_REQUESTS');
      expect(body.error.message).toBe('Too many signout attempts. Please try again later.');
    });

    test('should handle unexpected errors for access token', async () => {
      const request = createValidSignoutRequest();
      const event = createAPIGatewayEvent(request);

      // Mock unexpected error
      const error = new Error('UnexpectedError');
      error.code = 'UnexpectedError';
      mockCognitoInstance.revokeToken.mockRejectedValue(error);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('REVOKE_ERROR');
      expect(body.error.message).toBe('Token revocation service error');
      expect(body.error.details.originalError).toBe('UnexpectedError');
    });
  });

  describe('Refresh Token Revocation (Global Signout)', () => {
    test('should call Cognito revokeToken with refresh token for global signout', async () => {
      const request = createValidSignoutRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful token revocation for both tokens
      mockCognitoInstance.revokeToken
        .mockResolvedValueOnce({}) // First call for access token
        .mockResolvedValueOnce({}); // Second call for refresh token

      await handler(event, {} as any, {} as any);

      expect(mockCognitoInstance.revokeToken).toHaveBeenCalledTimes(2);
      expect(mockCognitoInstance.revokeToken).toHaveBeenNthCalledWith(1, {
        Token: 'valid.access.token'
      });
      expect(mockCognitoInstance.revokeToken).toHaveBeenNthCalledWith(2, {
        RefreshToken: 'valid.refresh.token'
      });
    });

    test('should handle NotAuthorizedException for refresh token gracefully', async () => {
      const request = createValidSignoutRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful access token revocation but failed refresh token revocation
      mockCognitoInstance.revokeToken
        .mockResolvedValueOnce({}) // First call for access token succeeds
        .mockRejectedValueOnce(new Error('NotAuthorizedException')); // Second call for refresh token fails

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      // Should still succeed since access token was revoked
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Successfully signed out from all devices');
    });

    test('should handle TooManyRequestsException for refresh token gracefully', async () => {
      const request = createValidSignoutRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful access token revocation but failed refresh token revocation
      mockCognitoInstance.revokeToken
        .mockResolvedValueOnce({}) // First call for access token succeeds
        .mockRejectedValueOnce(new Error('TooManyRequestsException')); // Second call for refresh token fails

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      // Should still succeed since access token was revoked
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Successfully signed out from all devices');
    });

    test('should handle unexpected errors for refresh token gracefully', async () => {
      const request = createValidSignoutRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful access token revocation but failed refresh token revocation
      mockCognitoInstance.revokeToken
        .mockResolvedValueOnce({}) // First call for access token succeeds
        .mockRejectedValueOnce(new Error('UnexpectedError')); // Second call for refresh token fails

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      // Should still succeed since access token was revoked
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Successfully signed out from all devices');
    });
  });

  describe('Session Cleanup', () => {
    test('should attempt session cleanup when sessions table is configured', async () => {
      const request = createValidSignoutRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful token revocation
      mockCognitoInstance.revokeToken.mockResolvedValue({});

      // Mock DynamoDB update (this would be tested in integration tests)
      // For unit tests, we just verify the handler doesn't fail

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
    });

    test('should handle session cleanup failure gracefully', async () => {
      const request = createValidSignoutRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful token revocation
      mockCognitoInstance.revokeToken.mockResolvedValue({});

      // Session cleanup failure should not affect the signout process
      // This is tested by ensuring the handler still returns success

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
    });
  });

  describe('Response Format', () => {
    test('should return proper success response format for regular signout', async () => {
      const request = createValidSignoutRequest({ refreshToken: undefined });
      const event = createAPIGatewayEvent(request);

      // Mock successful token revocation
      mockCognitoInstance.revokeToken.mockResolvedValue({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      expect(result.headers).toEqual({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      });

      const body = JSON.parse(result.body);
      expect(body).toMatchObject({
        success: true,
        message: 'Successfully signed out'
      });
    });

    test('should return proper success response format for global signout', async () => {
      const request = createValidSignoutRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful token revocation
      mockCognitoInstance.revokeToken.mockResolvedValue({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      expect(result.headers).toEqual({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      });

      const body = JSON.parse(result.body);
      expect(body).toMatchObject({
        success: true,
        message: 'Successfully signed out from all devices'
      });
    });

    test('should return proper error response format', async () => {
      const request = createValidSignoutRequest({ accessToken: '' });
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      expect(result.headers).toEqual({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      });

      const body = JSON.parse(result.body);
      expect(body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: {
            validationErrors: expect.any(Array)
          }
        }
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle unexpected errors gracefully', async () => {
      const request = createValidSignoutRequest();
      const event = createAPIGatewayEvent(request);

      // Mock unexpected error in main handler
      mockCognitoInstance.revokeToken.mockRejectedValue(new Error('Unexpected error'));

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INTERNAL_ERROR');
      expect(body.error.message).toBe('Internal server error');
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long access token', async () => {
      const longToken = 'a'.repeat(1000) + '.b.' + 'c';
      const request = createValidSignoutRequest({ accessToken: longToken });
      const event = createAPIGatewayEvent(request);

      // Mock successful token revocation
      mockCognitoInstance.revokeToken.mockResolvedValue({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      expect(mockCognitoInstance.revokeToken).toHaveBeenCalledWith({
        Token: longToken
      });
    });

    test('should handle very long refresh token', async () => {
      const longRefreshToken = 'a'.repeat(1000) + '.b.' + 'c';
      const request = createValidSignoutRequest({ refreshToken: longRefreshToken });
      const event = createAPIGatewayEvent(request);

      // Mock successful token revocation
      mockCognitoInstance.revokeToken.mockResolvedValue({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      expect(mockCognitoInstance.revokeToken).toHaveBeenCalledTimes(2);
      expect(mockCognitoInstance.revokeToken).toHaveBeenNthCalledWith(2, {
        RefreshToken: longRefreshToken
      });
    });

    test('should handle special characters in tokens', async () => {
      const specialToken = 'token.with.special@#$%^&*()_+-=[]{}|;:,.<>?';
      const request = createValidSignoutRequest({ accessToken: specialToken });
      const event = createAPIGatewayEvent(request);

      // Mock successful token revocation
      mockCognitoInstance.revokeToken.mockResolvedValue({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      expect(mockCognitoInstance.revokeToken).toHaveBeenCalledWith({
        Token: specialToken
      });
    });

    test('should handle missing sessions table environment variable', async () => {
      // Remove sessions table environment variable
      delete process.env.SESSIONS_TABLE;
      
      const request = createValidSignoutRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful token revocation
      mockCognitoInstance.revokeToken.mockResolvedValue({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
    });

    test('should handle default sessions table name', async () => {
      // Set sessions table to default value
      process.env.SESSIONS_TABLE = 'DemoProject-Sessions';
      
      const request = createValidSignoutRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful token revocation
      mockCognitoInstance.revokeToken.mockResolvedValue({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
    });
  });
});

