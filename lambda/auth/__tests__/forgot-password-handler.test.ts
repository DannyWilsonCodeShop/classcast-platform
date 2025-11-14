import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// Mock AWS SDK before importing the handler
jest.mock('aws-sdk', () => ({
  CognitoIdentityServiceProvider: jest.fn().mockImplementation(() => ({
    forgotPassword: jest.fn().mockReturnValue({
      promise: jest.fn()
    })
  }))
}));

// Mock the entire forgot-password-handler module
jest.mock('../forgot-password-handler', () => {
  const originalModule = jest.requireActual('../forgot-password-handler');
  return {
    ...originalModule,
    handler: jest.fn()
  };
});

// Import the handler after mocking
import { handler } from '../forgot-password-handler';

// Mock environment variables
const originalEnv = process.env;

describe('Forgot Password Handler', () => {
  let mockCognitoInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env = {
      ...originalEnv,
      USER_POOL_CLIENT_ID: 'test-client-id'
    };

    // Get the mocked Cognito instance
    const { CognitoIdentityServiceProvider } = require('aws-sdk');
    mockCognitoInstance = CognitoIdentityServiceProvider();
    
    // Set up the promise mock for successful calls
    mockCognitoInstance.forgotPassword().promise.mockResolvedValue({
      CodeDeliveryDetails: {
        DeliveryMedium: 'EMAIL',
        Destination: 't***@e***.com',
        AttributeName: 'email'
      }
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const createValidForgotPasswordRequest = (overrides: any = {}) => ({
    username: 'testuser',
    ...overrides
  });

  const createAPIGatewayEvent = (body: any): APIGatewayProxyEvent => ({
    body: JSON.stringify(body),
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'POST',
    isBase64Encoded: false,
    path: '/forgot-password',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: ''
  });

  describe('Request Validation', () => {
    test('should accept valid forgot password request', async () => {
      const request = createValidForgotPasswordRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful Cognito forgot password
      mockCognitoInstance.forgotPassword().promise.mockResolvedValue({
        CodeDeliveryDetails: {
          DeliveryMedium: 'EMAIL',
          Destination: 't***@e***.com',
          AttributeName: 'email'
        }
      });

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      console.log('Test result:', JSON.stringify(result, null, 2));
      
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Password reset code sent successfully. Please check your email.');
      expect(body.data.deliveryMedium).toBe('EMAIL');
      expect(body.data.destination).toBe('t***@e***.com');
      expect(body.data.attributeName).toBe('email');
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

    test('should reject request with missing username', async () => {
      const request = {};
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toBe('Invalid request data');
      expect(body.error.details.validationErrors).toHaveLength(1);
    });

    test('should reject empty username', async () => {
      const request = createValidForgotPasswordRequest({ username: '' });
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should reject username that is too long', async () => {
      const longUsername = 'a'.repeat(255);
      const request = createValidForgotPasswordRequest({ username: longUsername });
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should accept custom client ID override', async () => {
      const request = createValidForgotPasswordRequest({ 
        username: 'testuser',
        clientId: 'custom-client-id'
      });
      const event = createAPIGatewayEvent(request);

      // Mock successful Cognito forgot password
      mockCognitoInstance.forgotPassword.mockResolvedValue({
        CodeDeliveryDetails: {
          DeliveryMedium: 'EMAIL',
          Destination: 't***@e***.com',
          AttributeName: 'email'
        }
      });

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      expect(mockCognitoInstance.forgotPassword).toHaveBeenCalledWith({
        ClientId: 'custom-client-id',
        Username: 'testuser'
      });
    });
  });

  describe('Cognito Integration', () => {
    test('should call Cognito forgotPassword with correct parameters', async () => {
      const request = createValidForgotPasswordRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful Cognito forgot password
      mockCognitoInstance.forgotPassword.mockResolvedValue({
        CodeDeliveryDetails: {
          DeliveryMedium: 'EMAIL',
          Destination: 't***@e***.com',
          AttributeName: 'email'
        }
      });

      await handler(event, {} as any, {} as any);

      expect(mockCognitoInstance.forgotPassword).toHaveBeenCalledWith({
        ClientId: 'test-client-id',
        Username: 'testuser'
      });
    });

    test('should handle UserNotFoundException', async () => {
      const request = createValidForgotPasswordRequest();
      const event = createAPIGatewayEvent(request);

      // Mock Cognito UserNotFoundException
      const error = new Error('UserNotFoundException') as any;
      error.code = 'UserNotFoundException';
      mockCognitoInstance.forgotPassword.mockRejectedValue(error);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('USER_NOT_FOUND');
      expect(body.error.message).toBe('User not found with the provided username or email');
    });

    test('should handle InvalidParameterException', async () => {
      const request = createValidForgotPasswordRequest();
      const event = createAPIGatewayEvent(request);

      // Mock Cognito InvalidParameterException
      const error = new Error('InvalidParameterException') as any;
      error.code = 'InvalidParameterException';
      mockCognitoInstance.forgotPassword.mockRejectedValue(error);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_PARAMETERS');
      expect(body.error.message).toBe('Invalid parameters provided');
    });

    test('should handle TooManyRequestsException', async () => {
      const request = createValidForgotPasswordRequest();
      const event = createAPIGatewayEvent(request);

      // Mock Cognito TooManyRequestsException
      const error = new Error('TooManyRequestsException') as any;
      error.code = 'TooManyRequestsException';
      mockCognitoInstance.forgotPassword.mockRejectedValue(error);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('TOO_MANY_REQUESTS');
      expect(body.error.message).toBe('Too many password reset attempts. Please try again later.');
    });

    test('should handle LimitExceededException', async () => {
      const request = createValidForgotPasswordRequest();
      const event = createAPIGatewayEvent(request);

      // Mock Cognito LimitExceededException
      const error = new Error('LimitExceededException') as any;
      error.code = 'LimitExceededException';
      mockCognitoInstance.forgotPassword.mockRejectedValue(error);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('LIMIT_EXCEEDED');
      expect(body.error.message).toBe('Password reset limit exceeded. Please try again later.');
    });

    test('should handle NotAuthorizedException', async () => {
      const request = createValidForgotPasswordRequest();
      const event = createAPIGatewayEvent(request);

      // Mock Cognito NotAuthorizedException
      const error = new Error('NotAuthorizedException') as any;
      error.code = 'NotAuthorizedException';
      mockCognitoInstance.forgotPassword.mockRejectedValue(error);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_AUTHORIZED');
      expect(body.error.message).toBe('User is not authorized to reset password');
    });

    test('should handle unexpected Cognito errors', async () => {
      const request = createValidForgotPasswordRequest();
      const event = createAPIGatewayEvent(request);

      // Mock unexpected Cognito error
      const error = new Error('UnexpectedError') as any;
      error.code = 'UnexpectedError';
      mockCognitoInstance.forgotPassword.mockRejectedValue(error);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('FORGOT_PASSWORD_ERROR');
      expect(body.error.message).toBe('Password reset service error');
      expect(body.error.details.originalError).toBe('UnexpectedError');
    });
  });

  describe('Response Format', () => {
    test('should return proper success response format', async () => {
      const request = createValidForgotPasswordRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful Cognito forgot password
      mockCognitoInstance.forgotPassword.mockResolvedValue({
        CodeDeliveryDetails: {
          DeliveryMedium: 'EMAIL',
          Destination: 't***@e***.com',
          AttributeName: 'email'
        }
      });

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
        message: 'Password reset code sent successfully. Please check your email.',
        data: {
          deliveryMedium: 'EMAIL',
          destination: 't***@e***.com',
          attributeName: 'email'
        }
      });
    });

    test('should return proper error response format', async () => {
      const request = createValidForgotPasswordRequest({ username: '' });
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
      const request = createValidForgotPasswordRequest();
      const event = createAPIGatewayEvent(request);

      // Mock unexpected error
      mockCognitoInstance.forgotPassword.mockRejectedValue(new Error('Unexpected error'));

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INTERNAL_ERROR');
      expect(body.error.message).toBe('Internal server error');
    });

    test('should handle missing CodeDeliveryDetails gracefully', async () => {
      const request = createValidForgotPasswordRequest();
      const event = createAPIGatewayEvent(request);

      // Mock Cognito response without CodeDeliveryDetails
      mockCognitoInstance.forgotPassword.mockResolvedValue({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.data.deliveryMedium).toBeUndefined();
      expect(body.data.destination).toBeUndefined();
      expect(body.data.attributeName).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    test('should handle username with special characters', async () => {
      const request = createValidForgotPasswordRequest({ username: 'user@domain.com' });
      const event = createAPIGatewayEvent(request);

      // Mock successful Cognito forgot password
      mockCognitoInstance.forgotPassword.mockResolvedValue({
        CodeDeliveryDetails: {
          DeliveryMedium: 'EMAIL',
          Destination: 'u***@d***.com',
          AttributeName: 'email'
        }
      });

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      expect(mockCognitoInstance.forgotPassword).toHaveBeenCalledWith({
        ClientId: 'test-client-id',
        Username: 'user@domain.com'
      });
    });

    test('should handle very long username', async () => {
      const longUsername = 'a'.repeat(254); // Maximum allowed length
      const request = createValidForgotPasswordRequest({ username: longUsername });
      const event = createAPIGatewayEvent(request);

      // Mock successful Cognito forgot password
      mockCognitoInstance.forgotPassword.mockResolvedValue({
        CodeDeliveryDetails: {
          DeliveryMedium: 'EMAIL',
          Destination: 'a***@e***.com',
          AttributeName: 'email'
        }
      });

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      expect(mockCognitoInstance.forgotPassword).toHaveBeenCalledWith({
        ClientId: 'test-client-id',
        Username: longUsername
      });
    });
  });
});
