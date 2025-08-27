import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { handler } from '../resend-confirmation';
import { CognitoIdentityServiceProvider } from 'aws-sdk';

// Mock AWS SDK
jest.mock('aws-sdk');

const mockCognito = CognitoIdentityServiceProvider as jest.MockedClass<typeof CognitoIdentityServiceProvider>;

// Mock environment variables
const originalEnv = process.env;

describe('Resend Confirmation Handler', () => {
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
      adminGetUser: jest.fn(),
      resendConfirmationCode: jest.fn()
    };
    mockCognito.mockImplementation(() => mockCognitoInstance);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const createValidResendConfirmationRequest = (overrides: any = {}) => ({
    username: 'testuser',
    email: 'test@example.com',
    ...overrides
  });

  const createAPIGatewayEvent = (body: any): APIGatewayProxyEvent => ({
    body: JSON.stringify(body),
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'POST',
    isBase64Encoded: false,
    path: '/resend-confirmation',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: ''
  });

  const createMockCognitoUser = (attributes: Record<string, string> = {}, enabled: boolean = true) => ({
    Username: 'testuser',
    Enabled: enabled,
    Attributes: [
      { Name: 'email', Value: 'test@example.com' },
      { Name: 'email_verified', Value: 'false' },
      ...Object.entries(attributes).map(([key, value]) => ({ Name: key, Value: value }))
    ]
  });

  describe('Request Validation', () => {
    test('should accept valid resend confirmation request', async () => {
      const request = createValidResendConfirmationRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful user status check
      mockCognitoInstance.adminGetUser.mockResolvedValue({
        User: createMockCognitoUser()
      });

      // Mock successful confirmation code resend
      mockCognitoInstance.resendConfirmationCode.mockResolvedValue({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.data.message).toBe('Confirmation code resent successfully');
      expect(body.data.username).toBe('testuser');
      expect(body.data.email).toBe('test@example.com');
      expect(body.message).toBe('A new confirmation code has been sent to your email address.');
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
      const request = { email: 'test@example.com' };
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Validation failed');
      expect(body.details.errors).toHaveLength(1);
      expect(body.details.errors[0].field).toBe('username');
      expect(body.details.errors[0].message).toBe('Username is required');
    });

    test('should reject request with missing email', async () => {
      const request = { username: 'testuser' };
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Validation failed');
      expect(body.details.errors).toHaveLength(1);
      expect(body.details.errors[0].field).toBe('email');
      expect(body.details.errors[0].message).toBe('Invalid email format');
    });

    test('should reject empty username', async () => {
      const request = createValidResendConfirmationRequest({ username: '' });
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Validation failed');
      expect(body.details.errors).toHaveLength(1);
      expect(body.details.errors[0].field).toBe('username');
      expect(body.details.errors[0].message).toBe('Username is required');
    });

    test('should reject username that is too long', async () => {
      const longUsername = 'a'.repeat(51);
      const request = createValidResendConfirmationRequest({ username: longUsername });
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Validation failed');
      expect(body.details.errors).toHaveLength(1);
      expect(body.details.errors[0].field).toBe('username');
      expect(body.details.errors[0].message).toBe('Username must be less than 50 characters');
    });

    test('should reject invalid email format', async () => {
      const request = createValidResendConfirmationRequest({ email: 'invalid-email' });
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Validation failed');
      expect(body.details.errors).toHaveLength(1);
      expect(body.details.errors[0].field).toBe('email');
      expect(body.details.errors[0].message).toBe('Invalid email format');
    });

    test('should reject email that is too long', async () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const request = createValidResendConfirmationRequest({ email: longEmail });
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Validation failed');
      expect(body.details.errors).toHaveLength(1);
      expect(body.details.errors[0].field).toBe('email');
      expect(body.details.errors[0].message).toBe('Email must be less than 254 characters');
    });
  });

  describe('User Status Check', () => {
    test('should reject when user does not exist', async () => {
      const request = createValidResendConfirmationRequest();
      const event = createAPIGatewayEvent(request);

      // Mock user not found
      const error = new Error('UserNotFoundException');
      error.message = 'UserNotFoundException';
      mockCognitoInstance.adminGetUser.mockRejectedValue(error);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('User not found');
    });

    test('should reject when email does not match', async () => {
      const request = createValidResendConfirmationRequest({ email: 'different@example.com' });
      const event = createAPIGatewayEvent(request);

      // Mock user found but email doesn't match
      mockCognitoInstance.adminGetUser.mockResolvedValue({
        User: createMockCognitoUser()
      });

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('User not found');
    });

    test('should reject when user is already confirmed', async () => {
      const request = createValidResendConfirmationRequest();
      const event = createAPIGatewayEvent(request);

      // Mock user found but already confirmed
      mockCognitoInstance.adminGetUser.mockResolvedValue({
        User: createMockCognitoUser({ 'email_verified': 'true' })
      });

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('User account is already confirmed');
    });

    test('should reject when user account is disabled', async () => {
      const request = createValidResendConfirmationRequest();
      const event = createAPIGatewayEvent(request);

      // Mock user found but disabled
      mockCognitoInstance.adminGetUser.mockResolvedValue({
        User: createMockCognitoUser({}, false)
      });

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('User account is disabled');
    });

    test('should handle adminGetUser error gracefully', async () => {
      const request = createValidResendConfirmationRequest();
      const event = createAPIGatewayEvent(request);

      // Mock unexpected error in adminGetUser
      mockCognitoInstance.adminGetUser.mockRejectedValue(new Error('Unexpected error'));

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('User not found');
    });
  });

  describe('Confirmation Code Resend', () => {
    test('should call Cognito resendConfirmationCode with correct parameters', async () => {
      const request = createValidResendConfirmationRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful user status check
      mockCognitoInstance.adminGetUser.mockResolvedValue({
        User: createMockCognitoUser()
      });

      // Mock successful confirmation code resend
      mockCognitoInstance.resendConfirmationCode.mockResolvedValue({});

      await handler(event, {} as any, {} as any);

      expect(mockCognitoInstance.resendConfirmationCode).toHaveBeenCalledWith({
        ClientId: 'test-client-id',
        Username: 'testuser'
      });
    });

    test('should handle UserNotFoundException in resendConfirmationCode', async () => {
      const request = createValidResendConfirmationRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful user status check
      mockCognitoInstance.adminGetUser.mockResolvedValue({
        User: createMockCognitoUser()
      });

      // Mock user not found in resendConfirmationCode
      const error = new Error('UserNotFoundException');
      error.message = 'UserNotFoundException';
      mockCognitoInstance.resendConfirmationCode.mockRejectedValue(error);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('User not found');
    });

    test('should handle InvalidParameterException in resendConfirmationCode', async () => {
      const request = createValidResendConfirmationRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful user status check
      mockCognitoInstance.adminGetUser.mockResolvedValue({
        User: createMockCognitoUser()
      });

      // Mock invalid parameter exception
      const error = new Error('InvalidParameterException');
      error.message = 'InvalidParameterException';
      mockCognitoInstance.resendConfirmationCode.mockRejectedValue(error);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Invalid username');
    });

    test('should handle LimitExceededException in resendConfirmationCode', async () => {
      const request = createValidResendConfirmationRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful user status check
      mockCognitoInstance.adminGetUser.mockResolvedValue({
        User: createMockCognitoUser()
      });

      // Mock limit exceeded exception
      const error = new Error('LimitExceededException');
      error.message = 'LimitExceededException';
      mockCognitoInstance.resendConfirmationCode.mockRejectedValue(error);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Too many attempts. Please wait before requesting another code.');
    });

    test('should handle NotAuthorizedException in resendConfirmationCode', async () => {
      const request = createValidResendConfirmationRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful user status check
      mockCognitoInstance.adminGetUser.mockResolvedValue({
        User: createMockCognitoUser()
      });

      // Mock not authorized exception
      const error = new Error('NotAuthorizedException');
      error.message = 'NotAuthorizedException';
      mockCognitoInstance.resendConfirmationCode.mockRejectedValue(error);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('User is not authorized to perform this action.');
    });

    test('should handle unexpected errors in resendConfirmationCode', async () => {
      const request = createValidResendConfirmationRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful user status check
      mockCognitoInstance.adminGetUser.mockResolvedValue({
        User: createMockCognitoUser()
      });

      // Mock unexpected error
      mockCognitoInstance.resendConfirmationCode.mockRejectedValue(new Error('Unexpected error'));

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Failed to resend confirmation code');
    });
  });

  describe('Response Format', () => {
    test('should return proper success response format', async () => {
      const request = createValidResendConfirmationRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful user status check
      mockCognitoInstance.adminGetUser.mockResolvedValue({
        User: createMockCognitoUser()
      });

      // Mock successful confirmation code resend
      mockCognitoInstance.resendConfirmationCode.mockResolvedValue({});

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
        data: {
          message: 'Confirmation code resent successfully',
          username: 'testuser',
          email: 'test@example.com'
        },
        message: 'A new confirmation code has been sent to your email address.',
        timestamp: expect.any(String)
      });
    });

    test('should return proper error response format', async () => {
      const request = createValidResendConfirmationRequest({ username: '' });
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

  describe('Error Handling', () => {
    test('should handle unexpected errors gracefully', async () => {
      const request = createValidResendConfirmationRequest();
      const event = createAPIGatewayEvent(request);

      // Mock unexpected error in main handler
      mockCognitoInstance.adminGetUser.mockRejectedValue(new Error('Unexpected error'));

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Internal server error');
      expect(body.details.error).toBe('Unexpected error');
    });
  });

  describe('Edge Cases', () => {
    test('should handle username with special characters', async () => {
      const request = createValidResendConfirmationRequest({ username: 'user@domain.com' });
      const event = createAPIGatewayEvent(request);

      // Mock successful user status check
      mockCognitoInstance.adminGetUser.mockResolvedValue({
        User: createMockCognitoUser({ email: 'user@domain.com' })
      });

      // Mock successful confirmation code resend
      mockCognitoInstance.resendConfirmationCode.mockResolvedValue({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      expect(mockCognitoInstance.resendConfirmationCode).toHaveBeenCalledWith({
        ClientId: 'test-client-id',
        Username: 'user@domain.com'
      });
    });

    test('should handle very long username', async () => {
      const longUsername = 'a'.repeat(50); // Maximum allowed length
      const request = createValidResendConfirmationRequest({ username: longUsername });
      const event = createAPIGatewayEvent(request);

      // Mock successful user status check
      mockCognitoInstance.adminGetUser.mockResolvedValue({
        User: createMockCognitoUser()
      });

      // Mock successful confirmation code resend
      mockCognitoInstance.resendConfirmationCode.mockResolvedValue({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      expect(mockCognitoInstance.resendConfirmationCode).toHaveBeenCalledWith({
        ClientId: 'test-client-id',
        Username: longUsername
      });
    });

    test('should handle very long email', async () => {
      const longEmail = 'a'.repeat(250) + '@example.com'; // Maximum allowed length
      const request = createValidResendConfirmationRequest({ email: longEmail });
      const event = createAPIGatewayEvent(request);

      // Mock successful user status check
      mockCognitoInstance.adminGetUser.mockResolvedValue({
        User: createMockCognitoUser({ email: longEmail })
      });

      // Mock successful confirmation code resend
      mockCognitoInstance.resendConfirmationCode.mockResolvedValue({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      expect(mockCognitoInstance.resendConfirmationCode).toHaveBeenCalledWith({
        ClientId: 'test-client-id',
        Username: 'testuser'
      });
    });
  });
});

