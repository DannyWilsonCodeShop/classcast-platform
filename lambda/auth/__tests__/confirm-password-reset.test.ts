import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { handler } from '../confirm-password-reset';
import { CognitoIdentityServiceProvider } from 'aws-sdk';

// Mock AWS SDK
jest.mock('aws-sdk');

const mockCognito = CognitoIdentityServiceProvider as jest.MockedClass<typeof CognitoIdentityServiceProvider>;

// Mock environment variables
const originalEnv = process.env;

describe('Confirm Password Reset Handler', () => {
  let mockCognitoInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env = {
      ...originalEnv,
      USER_POOL_CLIENT_ID: 'test-client-id'
    };

    // Mock Cognito instance
    mockCognitoInstance = {
      confirmForgotPassword: jest.fn()
    };
    mockCognito.mockImplementation(() => mockCognitoInstance);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const createValidConfirmPasswordResetRequest = (overrides: any = {}) => ({
    username: 'testuser',
    confirmationCode: '123456',
    newPassword: 'NewPass123!',
    ...overrides
  });

  const createAPIGatewayEvent = (body: any): APIGatewayProxyEvent => ({
    body: JSON.stringify(body),
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'POST',
    isBase64Encoded: false,
    path: '/confirm-password-reset',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: ''
  });

  describe('Request Validation', () => {
    test('should accept valid confirm password reset request', async () => {
      const request = createValidConfirmPasswordResetRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful Cognito confirm forgot password
      mockCognitoInstance.confirmForgotPassword.mockResolvedValue({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Password reset successful. You can now sign in with your new password.');
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

    test('should reject request with missing required fields', async () => {
      const request = {
        username: 'testuser'
        // Missing confirmationCode and newPassword
      };
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toBe('Invalid request data');
      expect(body.error.details.validationErrors).toHaveLength(2);
    });

    test('should reject empty username', async () => {
      const request = createValidConfirmPasswordResetRequest({ username: '' });
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should reject username that is too long', async () => {
      const longUsername = 'a'.repeat(255);
      const request = createValidConfirmPasswordResetRequest({ username: longUsername });
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should reject confirmation code that is too short', async () => {
      const request = createValidConfirmPasswordResetRequest({ confirmationCode: '12345' });
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should reject confirmation code that is too long', async () => {
      const request = createValidConfirmPasswordResetRequest({ confirmationCode: '1234567' });
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should reject weak password', async () => {
      const request = createValidConfirmPasswordResetRequest({ newPassword: 'weak' });
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should reject password without uppercase letter', async () => {
      const request = createValidConfirmPasswordResetRequest({ newPassword: 'newpass123!' });
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should reject password without lowercase letter', async () => {
      const request = createValidConfirmPasswordResetRequest({ newPassword: 'NEWPASS123!' });
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should reject password without number', async () => {
      const request = createValidConfirmPasswordResetRequest({ newPassword: 'NewPass!' });
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should reject password without special character', async () => {
      const request = createValidConfirmPasswordResetRequest({ newPassword: 'NewPass123' });
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should accept custom client ID override', async () => {
      const request = createValidConfirmPasswordResetRequest({ 
        clientId: 'custom-client-id'
      });
      const event = createAPIGatewayEvent(request);

      // Mock successful Cognito confirm forgot password
      mockCognitoInstance.confirmForgotPassword.mockResolvedValue({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      expect(mockCognitoInstance.confirmForgotPassword).toHaveBeenCalledWith({
        ClientId: 'custom-client-id',
        Username: 'testuser',
        ConfirmationCode: '123456',
        Password: 'NewPass123!'
      });
    });
  });

  describe('Cognito Integration', () => {
    test('should call Cognito confirmForgotPassword with correct parameters', async () => {
      const request = createValidConfirmPasswordResetRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful Cognito confirm forgot password
      mockCognitoInstance.confirmForgotPassword.mockResolvedValue({});

      await handler(event, {} as any, {} as any);

      expect(mockCognitoInstance.confirmForgotPassword).toHaveBeenCalledWith({
        ClientId: 'test-client-id',
        Username: 'testuser',
        ConfirmationCode: '123456',
        Password: 'NewPass123!'
      });
    });

    test('should handle CodeMismatchException', async () => {
      const request = createValidConfirmPasswordResetRequest();
      const event = createAPIGatewayEvent(request);

      // Mock Cognito CodeMismatchException
      const error = new Error('CodeMismatchException');
      error.code = 'CodeMismatchException';
      mockCognitoInstance.confirmForgotPassword.mockRejectedValue(error);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_CONFIRMATION_CODE');
      expect(body.error.message).toBe('Invalid confirmation code. Please check your email and try again.');
    });

    test('should handle ExpiredCodeException', async () => {
      const request = createValidConfirmPasswordResetRequest();
      const event = createAPIGatewayEvent(request);

      // Mock Cognito ExpiredCodeException
      const error = new Error('ExpiredCodeException');
      error.code = 'ExpiredCodeException';
      mockCognitoInstance.confirmForgotPassword.mockRejectedValue(error);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('EXPIRED_CONFIRMATION_CODE');
      expect(body.error.message).toBe('Confirmation code has expired. Please request a new password reset.');
    });

    test('should handle UserNotFoundException', async () => {
      const request = createValidConfirmPasswordResetRequest();
      const event = createAPIGatewayEvent(request);

      // Mock Cognito UserNotFoundException
      const error = new Error('UserNotFoundException');
      error.code = 'UserNotFoundException';
      mockCognitoInstance.confirmForgotPassword.mockRejectedValue(error);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('USER_NOT_FOUND');
      expect(body.error.message).toBe('User not found with the provided username or email');
    });

    test('should handle InvalidParameterException', async () => {
      const request = createValidConfirmPasswordResetRequest();
      const event = createAPIGatewayEvent(request);

      // Mock Cognito InvalidParameterException
      const error = new Error('InvalidParameterException');
      error.code = 'InvalidParameterException';
      mockCognitoInstance.confirmForgotPassword.mockRejectedValue(error);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_PARAMETERS');
      expect(body.error.message).toBe('Invalid parameters provided');
    });

    test('should handle InvalidPasswordException', async () => {
      const request = createValidConfirmPasswordResetRequest();
      const event = createAPIGatewayEvent(request);

      // Mock Cognito InvalidPasswordException
      const error = new Error('InvalidPasswordException');
      error.code = 'InvalidPasswordException';
      mockCognitoInstance.confirmForgotPassword.mockRejectedValue(error);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_PASSWORD');
      expect(body.error.message).toBe('New password does not meet requirements. Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.');
    });

    test('should handle TooManyRequestsException', async () => {
      const request = createValidConfirmPasswordResetRequest();
      const event = createAPIGatewayEvent(request);

      // Mock Cognito TooManyRequestsException
      const error = new Error('TooManyRequestsException');
      error.code = 'TooManyRequestsException';
      mockCognitoInstance.confirmForgotPassword.mockRejectedValue(error);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('TOO_MANY_REQUESTS');
      expect(body.error.message).toBe('Too many password reset attempts. Please try again later.');
    });

    test('should handle LimitExceededException', async () => {
      const request = createValidConfirmPasswordResetRequest();
      const event = createAPIGatewayEvent(request);

      // Mock Cognito LimitExceededException
      const error = new Error('LimitExceededException');
      error.code = 'LimitExceededException';
      mockCognitoInstance.confirmForgotPassword.mockRejectedValue(error);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('LIMIT_EXCEEDED');
      expect(body.error.message).toBe('Password reset limit exceeded. Please try again later.');
    });

    test('should handle NotAuthorizedException', async () => {
      const request = createValidConfirmPasswordResetRequest();
      const event = createAPIGatewayEvent(request);

      // Mock Cognito NotAuthorizedException
      const error = new Error('NotAuthorizedException');
      error.code = 'NotAuthorizedException';
      mockCognitoInstance.confirmForgotPassword.mockRejectedValue(error);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_AUTHORIZED');
      expect(body.error.message).toBe('User is not authorized to reset password');
    });

    test('should handle unexpected Cognito errors', async () => {
      const request = createValidConfirmPasswordResetRequest();
      const event = createAPIGatewayEvent(request);

      // Mock unexpected Cognito error
      const error = new Error('UnexpectedError');
      error.code = 'UnexpectedError';
      mockCognitoInstance.confirmForgotPassword.mockRejectedValue(error);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('CONFIRM_PASSWORD_RESET_ERROR');
      expect(body.error.message).toBe('Password reset confirmation service error');
      expect(body.error.details.originalError).toBe('UnexpectedError');
    });
  });

  describe('Response Format', () => {
    test('should return proper success response format', async () => {
      const request = createValidConfirmPasswordResetRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful Cognito confirm forgot password
      mockCognitoInstance.confirmForgotPassword.mockResolvedValue({});

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
        message: 'Password reset successful. You can now sign in with your new password.'
      });
    });

    test('should return proper error response format', async () => {
      const request = createValidConfirmPasswordResetRequest({ username: '' });
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
      const request = createValidConfirmPasswordResetRequest();
      const event = createAPIGatewayEvent(request);

      // Mock unexpected error
      mockCognitoInstance.confirmForgotPassword.mockRejectedValue(new Error('Unexpected error'));

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INTERNAL_ERROR');
      expect(body.error.message).toBe('Internal server error');
    });
  });

  describe('Edge Cases', () => {
    test('should handle username with special characters', async () => {
      const request = createValidConfirmPasswordResetRequest({ username: 'user@domain.com' });
      const event = createAPIGatewayEvent(request);

      // Mock successful Cognito confirm forgot password
      mockCognitoInstance.confirmForgotPassword.mockResolvedValue({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      expect(mockCognitoInstance.confirmForgotPassword).toHaveBeenCalledWith({
        ClientId: 'test-client-id',
        Username: 'user@domain.com',
        ConfirmationCode: '123456',
        Password: 'NewPass123!'
      });
    });

    test('should handle very long username', async () => {
      const longUsername = 'a'.repeat(254); // Maximum allowed length
      const request = createValidConfirmPasswordResetRequest({ username: longUsername });
      const event = createAPIGatewayEvent(request);

      // Mock successful Cognito confirm forgot password
      mockCognitoInstance.confirmForgotPassword.mockResolvedValue({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      expect(mockCognitoInstance.confirmForgotPassword).toHaveBeenCalledWith({
        ClientId: 'test-client-id',
        Username: longUsername,
        ConfirmationCode: '123456',
        Password: 'NewPass123!'
      });
    });

    test('should handle complex password with all requirements', async () => {
      const complexPassword = 'ComplexPass123!@#';
      const request = createValidConfirmPasswordResetRequest({ newPassword: complexPassword });
      const event = createAPIGatewayEvent(request);

      // Mock successful Cognito confirm forgot password
      mockCognitoInstance.confirmForgotPassword.mockResolvedValue({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      expect(mockCognitoInstance.confirmForgotPassword).toHaveBeenCalledWith({
        ClientId: 'test-client-id',
        Username: 'testuser',
        ConfirmationCode: '123456',
        Password: complexPassword
      });
    });
  });
});

