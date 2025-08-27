import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { handler } from '../signup-confirmation';
import { CognitoIdentityServiceProvider } from 'aws-sdk';

// Mock AWS SDK
jest.mock('aws-sdk');

const mockCognito = CognitoIdentityServiceProvider as jest.MockedClass<typeof CognitoIdentityServiceProvider>;

// Mock environment variables
const originalEnv = process.env;

describe('Signup Confirmation Handler', () => {
  let mockCognitoInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env = {
      ...originalEnv,
      USER_POOL_ID: 'test-user-pool-id',
      USER_POOL_CLIENT_ID: 'test-client-id'
    };

    // Mock Cognito instance
    mockCognitoInstance = {
      confirmSignUp: jest.fn(),
      adminGetUser: jest.fn(),
      adminUpdateUserAttributes: jest.fn()
    };
    mockCognito.mockImplementation(() => mockCognitoInstance);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const createValidConfirmationRequest = (overrides: any = {}) => ({
    username: 'testuser',
    confirmationCode: '123456',
    ...overrides
  });

  const createAPIGatewayEvent = (body: any): APIGatewayProxyEvent => ({
    body: JSON.stringify(body),
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'POST',
    isBase64Encoded: false,
    path: '/confirm-signup',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: ''
  });

  describe('Request Validation', () => {
    test('should accept valid confirmation request', async () => {
      const request = createValidConfirmationRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful Cognito confirmation
      mockCognitoInstance.confirmSignUp.mockResolvedValue({});

      // Mock successful user attributes update
      mockCognitoInstance.adminUpdateUserAttributes.mockResolvedValue({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Account confirmed successfully');
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
      expect(body.error).toBe('Invalid JSON in request body');
    });

    test('should reject request with missing username', async () => {
      const request = {
        confirmationCode: '123456'
        // Missing username
      };
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Validation failed');
      expect(body.details.errors).toContainEqual(
        expect.objectContaining({
          field: 'username',
          message: 'Username is required'
        })
      );
    });

    test('should reject request with missing confirmation code', async () => {
      const request = {
        username: 'testuser'
        // Missing confirmationCode
      };
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Validation failed');
      expect(body.details.errors).toContainEqual(
        expect.objectContaining({
          field: 'confirmationCode',
          message: 'Confirmation code is required'
        })
      );
    });

    test('should reject invalid username format', async () => {
      const request = createValidConfirmationRequest({ username: 'a' });
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Validation failed');
      expect(body.details.errors).toContainEqual(
        expect.objectContaining({
          field: 'username',
          message: 'Username must be at least 3 characters'
        })
      );
    });

    test('should reject invalid confirmation code format', async () => {
      const request = createValidConfirmationRequest({ confirmationCode: 'abc' });
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Validation failed');
      expect(body.details.errors).toContainEqual(
        expect.objectContaining({
          field: 'confirmationCode',
          message: 'Confirmation code must be 6 digits'
        })
      );
    });
  });

  describe('Cognito Integration', () => {
    test('should confirm user signup successfully', async () => {
      const request = createValidConfirmationRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful Cognito confirmation
      mockCognitoInstance.confirmSignUp.mockResolvedValue({});

      // Mock successful user attributes update
      mockCognitoInstance.adminUpdateUserAttributes.mockResolvedValue({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      expect(mockCognitoInstance.confirmSignUp).toHaveBeenCalledWith({
        ClientId: 'test-client-id',
        Username: 'testuser',
        ConfirmationCode: '123456'
      });
    });

    test('should handle confirmation code mismatch', async () => {
      const request = createValidConfirmationRequest();
      const event = createAPIGatewayEvent(request);

      // Mock Cognito confirmation code mismatch error
      mockCognitoInstance.confirmSignUp.mockRejectedValue(
        new Error('CodeMismatchException')
      );

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Invalid confirmation code');
      expect(body.details.error).toBe('CodeMismatchException');
    });

    test('should handle expired confirmation code', async () => {
      const request = createValidConfirmationRequest();
      const event = createAPIGatewayEvent(request);

      // Mock Cognito expired code error
      mockCognitoInstance.confirmSignUp.mockRejectedValue(
        new Error('ExpiredCodeException')
      );

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Confirmation code has expired');
      expect(body.details.error).toBe('ExpiredCodeException');
    });

    test('should handle user not found', async () => {
      const request = createValidConfirmationRequest();
      const event = createAPIGatewayEvent(request);

      // Mock Cognito user not found error
      mockCognitoInstance.confirmSignUp.mockRejectedValue(
        new Error('UserNotFoundException')
      );

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('User not found');
      expect(body.details.error).toBe('UserNotFoundException');
    });

    test('should handle already confirmed user', async () => {
      const request = createValidConfirmationRequest();
      const event = createAPIGatewayEvent(request);

      // Mock Cognito already confirmed error
      mockCognitoInstance.confirmSignUp.mockRejectedValue(
        new Error('NotAuthorizedException')
      );

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('User is already confirmed');
      expect(body.details.error).toBe('NotAuthorizedException');
    });

    test('should handle unexpected Cognito errors', async () => {
      const request = createValidConfirmationRequest();
      const event = createAPIGatewayEvent(request);

      // Mock unexpected Cognito error
      mockCognitoInstance.confirmSignUp.mockRejectedValue(
        new Error('UnexpectedCognitoError')
      );

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Failed to confirm user signup');
      expect(body.details.error).toBe('UnexpectedCognitoError');
    });
  });

  describe('User Attributes Update', () => {
    test('should update user attributes after successful confirmation', async () => {
      const request = createValidConfirmationRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful Cognito confirmation
      mockCognitoInstance.confirmSignUp.mockResolvedValue({});

      // Mock successful user attributes update
      mockCognitoInstance.adminUpdateUserAttributes.mockResolvedValue({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      expect(mockCognitoInstance.adminUpdateUserAttributes).toHaveBeenCalledWith({
        UserPoolId: 'test-user-pool-id',
        Username: 'testuser',
        UserAttributes: [
          {
            Name: 'email_verified',
            Value: 'true'
          },
          {
            Name: 'custom:status',
            Value: 'active'
          }
        ]
      });
    });

    test('should continue execution if attributes update fails', async () => {
      const request = createValidConfirmationRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful Cognito confirmation
      mockCognitoInstance.confirmSignUp.mockResolvedValue({});

      // Mock user attributes update failure
      mockCognitoInstance.adminUpdateUserAttributes.mockRejectedValue(
        new Error('AttributesUpdateError')
      );

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      // Should still succeed even if attributes update fails
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Account confirmed successfully');
    });
  });

  describe('Error Handling', () => {
    test('should handle unexpected errors gracefully', async () => {
      const request = createValidConfirmationRequest();
      const event = createAPIGatewayEvent(request);

      // Mock unexpected error in Cognito
      mockCognitoInstance.confirmSignUp.mockRejectedValue(new Error('Unexpected error'));

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Internal server error');
      expect(body.details.error).toBe('Unexpected error');
    });

    test('should handle validation errors with detailed messages', async () => {
      const request = createValidConfirmationRequest({ 
        username: 'a', // Too short
        confirmationCode: 'abc' // Invalid format
      });
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Validation failed');
      expect(body.details.errors).toHaveLength(2);
      expect(body.details.errors).toContainEqual(
        expect.objectContaining({
          field: 'username',
          message: 'Username must be at least 3 characters'
        })
      );
      expect(body.details.errors).toContainEqual(
        expect.objectContaining({
          field: 'confirmationCode',
          message: 'Confirmation code must be 6 digits'
        })
      );
    });
  });

  describe('Response Format', () => {
    test('should return proper success response format', async () => {
      const request = createValidConfirmationRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful Cognito confirmation
      mockCognitoInstance.confirmSignUp.mockResolvedValue({});

      // Mock successful user attributes update
      mockCognitoInstance.adminUpdateUserAttributes.mockResolvedValue({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      expect(result.headers).toEqual({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      });

      const body = JSON.parse(result.body);
      expect(body).toMatchObject({
        success: true,
        message: 'Account confirmed successfully',
        data: {
          username: 'testuser',
          confirmed: true,
          timestamp: expect.any(String)
        },
        timestamp: expect.any(String)
      });
    });

    test('should return proper error response format', async () => {
      const request = createValidConfirmationRequest({ username: 'a' });
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      expect(result.headers).toEqual({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      });

      const body = JSON.parse(result.body);
      expect(body).toMatchObject({
        success: false,
        error: 'Validation failed',
        details: {
          errors: expect.any(Array),
          message: 'Please check your input and try again'
        },
        timestamp: expect.any(String)
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty request body', async () => {
      const event = createAPIGatewayEvent({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Validation failed');
      expect(body.details.errors).toHaveLength(2); // username and confirmationCode missing
    });

    test('should handle null request body', async () => {
      const event = {
        ...createAPIGatewayEvent({}),
        body: null
      };

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Invalid JSON in request body');
    });

    test('should handle very long username', async () => {
      const longUsername = 'a'.repeat(51); // 51 characters (exceeds 50 limit)
      const request = createValidConfirmationRequest({ username: longUsername });
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Validation failed');
      expect(body.details.errors).toContainEqual(
        expect.objectContaining({
          field: 'username',
          message: 'Username must be less than 50 characters'
        })
      );
    });

    test('should handle confirmation code with spaces', async () => {
      const request = createValidConfirmationRequest({ confirmationCode: ' 123456 ' });
      const event = createAPIGatewayEvent(request);

      // Mock successful Cognito confirmation
      mockCognitoInstance.confirmSignUp.mockResolvedValue({});

      // Mock successful user attributes update
      mockCognitoInstance.adminUpdateUserAttributes.mockResolvedValue({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      // Should trim spaces and succeed
      expect(result.statusCode).toBe(200);
      expect(mockCognitoInstance.confirmSignUp).toHaveBeenCalledWith({
        ClientId: 'test-client-id',
        Username: 'testuser',
        ConfirmationCode: '123456'
      });
    });
  });
});
