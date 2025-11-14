import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { handler } from '../refresh-token-handler';

jest.mock('aws-sdk');

const mockCognito = CognitoIdentityServiceProvider as jest.MockedClass<typeof CognitoIdentityServiceProvider>;

describe('Refresh Token Handler', () => {
  let mockEvent: APIGatewayProxyEvent;
  let mockContext: Context;
  let mockCognitoInstance: jest.Mocked<CognitoIdentityServiceProvider>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockCognitoInstance = {
      initiateAuth: jest.fn()
    } as any;

    mockCognito.mockImplementation(() => mockCognitoInstance);

    process.env.USER_POOL_CLIENT_ID = 'test-client-id';

    mockContext = {} as Context;
  });

  afterEach(() => {
    delete process.env.USER_POOL_CLIENT_ID;
  });

  describe('Request Validation', () => {
    beforeEach(() => {
      mockEvent = {
        body: JSON.stringify({
          refreshToken: 'test-refresh-token'
        }),
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: '',
        httpMethod: 'POST',
        path: '/refresh'
      };
    });

    test('should validate valid refresh token request', async () => {
      mockCognitoInstance.initiateAuth.mockResolvedValue({
        AuthenticationResult: {
          AccessToken: 'new-access-token',
          IdToken: 'new-id-token',
          ExpiresIn: 3600,
          TokenType: 'Bearer'
        }
      } as any);

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.data.accessToken).toBe('new-access-token');
      expect(body.data.idToken).toBe('new-id-token');
      expect(body.data.expiresIn).toBe(3600);
      expect(body.data.tokenType).toBe('Bearer');
    });

    test('should handle missing refresh token', async () => {
      mockEvent.body = JSON.stringify({});

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should handle empty refresh token', async () => {
      mockEvent.body = JSON.stringify({ refreshToken: '' });

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should handle invalid JSON', async () => {
      mockEvent.body = 'invalid json';

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_JSON');
    });

    test('should use custom client ID when provided', async () => {
      mockEvent.body = JSON.stringify({
        refreshToken: 'test-refresh-token',
        clientId: 'custom-client-id'
      });

      mockCognitoInstance.initiateAuth.mockResolvedValue({
        AuthenticationResult: {
          AccessToken: 'new-access-token',
          IdToken: 'new-id-token',
          ExpiresIn: 3600,
          TokenType: 'Bearer'
        }
      } as any);

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(200);
      expect(mockCognitoInstance.initiateAuth).toHaveBeenCalledWith({
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        ClientId: 'custom-client-id',
        AuthParameters: {
          REFRESH_TOKEN: 'test-refresh-token'
        }
      });
    });

    test('should fallback to environment client ID when not provided', async () => {
      mockEvent.body = JSON.stringify({
        refreshToken: 'test-refresh-token'
      });

      mockCognitoInstance.initiateAuth.mockResolvedValue({
        AuthenticationResult: {
          AccessToken: 'new-access-token',
          IdToken: 'new-id-token',
          ExpiresIn: 3600,
          TokenType: 'Bearer'
        }
      } as any);

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(200);
      expect(mockCognitoInstance.initiateAuth).toHaveBeenCalledWith({
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        ClientId: 'test-client-id',
        AuthParameters: {
          REFRESH_TOKEN: 'test-refresh-token'
        }
      });
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(() => {
      mockEvent = {
        body: JSON.stringify({
          refreshToken: 'test-refresh-token'
        }),
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: '',
        httpMethod: 'POST',
        path: '/refresh'
      };
    });

    test('should allow first 5 refresh attempts', async () => {
      // Make 5 successful attempts
      for (let i = 0; i < 5; i++) {
        mockCognitoInstance.initiateAuth.mockResolvedValue({
          AuthenticationResult: {
            AccessToken: `token-${i}`,
            IdToken: `id-${i}`,
            ExpiresIn: 3600,
            TokenType: 'Bearer'
          }
        } as any);

        const result = await handler(mockEvent, mockContext);
        expect(result.statusCode).toBe(200);
      }
    });

    test('should block refresh attempts after 5 failures within 1 minute', async () => {
      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        mockCognitoInstance.initiateAuth.mockRejectedValue({
          code: 'NotAuthorizedException',
          message: 'Invalid refresh token'
        });

        const result = await handler(mockEvent, mockContext);
        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).error.code).toBe('INVALID_REFRESH_TOKEN');
      }

      // 6th attempt should be rate limited
      mockCognitoInstance.initiateAuth.mockRejectedValue({
        code: 'NotAuthorizedException',
        message: 'Invalid refresh token'
      });

      const result = await handler(mockEvent, mockContext);
      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    test('should reset rate limiting after successful refresh', async () => {
      // Make 3 failed attempts
      for (let i = 0; i < 3; i++) {
        mockCognitoInstance.initiateAuth.mockRejectedValue({
          code: 'NotAuthorizedException',
          message: 'Invalid refresh token'
        });

        const result = await handler(mockEvent, mockContext);
        expect(result.statusCode).toBe(400);
      }

      // Make 1 successful attempt
      mockCognitoInstance.initiateAuth.mockResolvedValue({
        AuthenticationResult: {
          AccessToken: 'success-token',
          IdToken: 'success-id',
          ExpiresIn: 3600,
          TokenType: 'Bearer'
        }
      } as any);

      const successResult = await handler(mockEvent, mockContext);
      expect(successResult.statusCode).toBe(200);

      // Should be able to make more attempts after success
      mockCognitoInstance.initiateAuth.mockRejectedValue({
        code: 'NotAuthorizedException',
        message: 'Invalid refresh token'
      });

      const nextResult = await handler(mockEvent, mockContext);
      expect(nextResult.statusCode).toBe(400);
      expect(JSON.parse(nextResult.body).error.code).toBe('INVALID_REFRESH_TOKEN');
    });
  });

  describe('Cognito Integration', () => {
    beforeEach(() => {
      mockEvent = {
        body: JSON.stringify({
          refreshToken: 'test-refresh-token'
        }),
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: '',
        httpMethod: 'POST',
        path: '/refresh'
      };
    });

    test('should handle successful token refresh', async () => {
      mockCognitoInstance.initiateAuth.mockResolvedValue({
        AuthenticationResult: {
          AccessToken: 'new-access-token',
          IdToken: 'new-id-token',
          ExpiresIn: 7200,
          TokenType: 'Bearer'
        }
      } as any);

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.data.accessToken).toBe('new-access-token');
      expect(body.data.idToken).toBe('new-id-token');
      expect(body.data.expiresIn).toBe(7200);
      expect(body.data.tokenType).toBe('Bearer');
    });

    test('should handle missing AuthenticationResult', async () => {
      mockCognitoInstance.initiateAuth.mockResolvedValue({} as any);

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('REFRESH_FAILED');
    });

    test('should handle missing tokens in AuthenticationResult', async () => {
      mockCognitoInstance.initiateAuth.mockResolvedValue({
        AuthenticationResult: {
          ExpiresIn: 3600
        }
      } as any);

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('REFRESH_FAILED');
    });

    test('should use default values for missing token properties', async () => {
      mockCognitoInstance.initiateAuth.mockResolvedValue({
        AuthenticationResult: {
          AccessToken: 'new-access-token',
          IdToken: 'new-id-token'
        }
      } as any);

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.data.expiresIn).toBe(3600); // Default value
      expect(body.data.tokenType).toBe('Bearer'); // Default value
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockEvent = {
        body: JSON.stringify({
          refreshToken: 'test-refresh-token'
        }),
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: '',
        httpMethod: 'POST',
        path: '/refresh'
      };
    });

    test('should handle NotAuthorizedException', async () => {
      mockCognitoInstance.initiateAuth.mockRejectedValue({
        code: 'NotAuthorizedException',
        message: 'Invalid refresh token'
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_REFRESH_TOKEN');
      expect(body.error.message).toBe('Invalid or expired refresh token');
    });

    test('should handle TokenRefreshRequiredException', async () => {
      mockCognitoInstance.initiateAuth.mockRejectedValue({
        code: 'TokenRefreshRequiredException',
        message: 'Token refresh required'
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('TOKEN_REFRESH_REQUIRED');
      expect(body.error.message).toBe('Token refresh required. Please sign in again.');
    });

    test('should handle TooManyRequestsException', async () => {
      mockCognitoInstance.initiateAuth.mockRejectedValue({
        code: 'TooManyRequestsException',
        message: 'Too many requests'
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('TOO_MANY_REQUESTS');
      expect(body.error.message).toBe('Too many refresh attempts. Please try again later.');
    });

    test('should handle InvalidParameterException', async () => {
      mockCognitoInstance.initiateAuth.mockRejectedValue({
        code: 'InvalidParameterException',
        message: 'Invalid parameters'
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_PARAMETERS');
      expect(body.error.message).toBe('Invalid parameters provided');
    });

    test('should handle unknown Cognito errors', async () => {
      mockCognitoInstance.initiateAuth.mockRejectedValue({
        code: 'UnknownError',
        message: 'Something went wrong'
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('REFRESH_ERROR');
      expect(body.error.message).toBe('Token refresh service error');
      expect(body.error.details.originalError).toBe('Something went wrong');
    });

    test('should handle internal errors gracefully', async () => {
      mockCognitoInstance.initiateAuth.mockRejectedValue(new Error('Internal error'));

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('REFRESH_ERROR');
    });
  });

  describe('CORS Headers', () => {
    beforeEach(() => {
      mockEvent = {
        body: JSON.stringify({
          refreshToken: 'test-refresh-token'
        }),
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: '',
        httpMethod: 'POST',
        path: '/refresh'
      };
    });

    test('should include CORS headers in success response', async () => {
      mockCognitoInstance.initiateAuth.mockResolvedValue({
        AuthenticationResult: {
          AccessToken: 'new-access-token',
          IdToken: 'new-id-token',
          ExpiresIn: 3600,
          TokenType: 'Bearer'
        }
      } as any);

      const result = await handler(mockEvent, mockContext);

      expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(result.headers['Access-Control-Allow-Headers']).toBe('Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token');
      expect(result.headers['Access-Control-Allow-Methods']).toBe('POST,OPTIONS');
    });

    test('should include CORS headers in error response', async () => {
      mockCognitoInstance.initiateAuth.mockRejectedValue({
        code: 'NotAuthorizedException',
        message: 'Invalid refresh token'
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(result.headers['Access-Control-Allow-Headers']).toBe('Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token');
      expect(result.headers['Access-Control-Allow-Methods']).toBe('POST,OPTIONS');
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long refresh tokens', async () => {
      const longToken = 'a'.repeat(1000);
      mockEvent = {
        body: JSON.stringify({
          refreshToken: longToken
        }),
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: '',
        httpMethod: 'POST',
        path: '/refresh'
      };

      mockCognitoInstance.initiateAuth.mockResolvedValue({
        AuthenticationResult: {
          AccessToken: 'new-access-token',
          IdToken: 'new-id-token',
          ExpiresIn: 3600,
          TokenType: 'Bearer'
        }
      } as any);

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(200);
      expect(mockCognitoInstance.initiateAuth).toHaveBeenCalledWith({
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        ClientId: 'test-client-id',
        AuthParameters: {
          REFRESH_TOKEN: longToken
        }
      });
    });

    test('should handle special characters in refresh tokens', async () => {
      const specialToken = 'token-with-special-chars!@#$%^&*()_+-=[]{}|;:,.<>?';
      mockEvent = {
        body: JSON.stringify({
          refreshToken: specialToken
        }),
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: '',
        httpMethod: 'POST',
        path: '/refresh'
      };

      mockCognitoInstance.initiateAuth.mockResolvedValue({
        AuthenticationResult: {
          AccessToken: 'new-access-token',
          IdToken: 'new-id-token',
          ExpiresIn: 3600,
          TokenType: 'Bearer'
        }
      } as any);

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(200);
      expect(mockCognitoInstance.initiateAuth).toHaveBeenCalledWith({
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        ClientId: 'test-client-id',
        AuthParameters: {
          REFRESH_TOKEN: specialToken
        }
      });
    });
  });
});
