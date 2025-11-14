import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { CognitoIdentityServiceProvider, DynamoDB } from 'aws-sdk';
import { handler } from '../signin-handler';

// Mock AWS SDK
jest.mock('aws-sdk');

const mockCognito = CognitoIdentityServiceProvider as jest.MockedClass<typeof CognitoIdentityServiceProvider>;
const mockDynamoDB = DynamoDB as jest.MockedClass<typeof DynamoDB>;

describe('Signin Handler', () => {
  let mockEvent: APIGatewayProxyEvent;
  let mockContext: Context;
  let mockCognitoInstance: jest.Mocked<CognitoIdentityServiceProvider>;
  let mockDynamoInstance: jest.Mocked<DynamoDB.DocumentClient>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock instances
    mockCognitoInstance = {
      initiateAuth: jest.fn(),
      adminUpdateUserAttributes: jest.fn()
    } as any;
    
    mockDynamoInstance = {
      get: jest.fn(),
      update: jest.fn()
    } as any;

    // Mock constructor calls
    mockCognito.mockImplementation(() => mockCognitoInstance);
    mockDynamoDB.DocumentClient.mockImplementation(() => mockDynamoInstance);

    // Setup environment variables
    process.env.USER_POOL_ID = 'test-user-pool-id';
    process.env.USER_POOL_CLIENT_ID = 'test-client-id';
    process.env.USERS_TABLE = 'test-users-table';

    // Setup mock event
    mockEvent = {
      body: JSON.stringify({
        username: 'testuser@example.com',
        password: 'TestPass123!',
        rememberMe: false
      }),
      headers: {},
      multiValueHeaders: {},
      httpMethod: 'POST',
      isBase64Encoded: false,
      path: '/signin',
      pathParameters: null,
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {} as any,
      resource: ''
    };

    mockContext = {} as Context;
  });

  afterEach(() => {
    delete process.env.USER_POOL_ID;
    delete process.env.USER_POOL_CLIENT_ID;
    delete process.env.USERS_TABLE;
  });

  describe('Request Validation', () => {
    test('should return 400 for invalid JSON', async () => {
      mockEvent.body = 'invalid json';

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_JSON');
    });

    test('should return 400 for missing username', async () => {
      mockEvent.body = JSON.stringify({
        password: 'TestPass123!'
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should return 400 for missing password', async () => {
      mockEvent.body = JSON.stringify({
        username: 'testuser@example.com'
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should return 400 for empty username', async () => {
      mockEvent.body = JSON.stringify({
        username: '',
        password: 'TestPass123!'
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should return 400 for empty password', async () => {
      mockEvent.body = JSON.stringify({
        username: 'testuser@example.com',
        password: ''
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should accept valid request with rememberMe', async () => {
      mockEvent.body = JSON.stringify({
        username: 'testuser@example.com',
        password: 'TestPass123!',
        rememberMe: true
      });

      // Mock successful authentication
      mockCognitoInstance.initiateAuth.mockResolvedValue({
        AuthenticationResult: {
          AccessToken: 'access-token',
          IdToken: 'id-token',
          RefreshToken: 'refresh-token',
          ExpiresIn: 3600,
          TokenType: 'Bearer'
        }
      } as any);

      // Mock user profile
      mockDynamoInstance.get.mockResolvedValue({
        Item: {
          userId: 'test-user-id',
          username: 'testuser@example.com',
          email: 'testuser@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'student',
          status: 'active'
        }
      } as any);

      // Mock last login update
      mockDynamoInstance.update.mockResolvedValue({} as any);
      mockCognitoInstance.adminUpdateUserAttributes.mockResolvedValue({} as any);

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
    });
  });

  describe('Cognito Authentication', () => {
    test('should return 400 for invalid credentials', async () => {
      mockCognitoInstance.initiateAuth.mockRejectedValue({
        code: 'NotAuthorizedException',
        message: 'Incorrect username or password.'
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_CREDENTIALS');
    });

    test('should return 400 for unconfirmed user', async () => {
      mockCognitoInstance.initiateAuth.mockRejectedValue({
        code: 'UserNotConfirmedException',
        message: 'User is not confirmed.'
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('USER_NOT_CONFIRMED');
    });

    test('should return 400 for user not found', async () => {
      mockCognitoInstance.initiateAuth.mockRejectedValue({
        code: 'UserNotFoundException',
        message: 'User does not exist.'
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('USER_NOT_FOUND');
    });

    test('should return 400 for password reset required', async () => {
      mockCognitoInstance.initiateAuth.mockRejectedValue({
        code: 'PasswordResetRequiredException',
        message: 'Password reset required.'
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('PASSWORD_RESET_REQUIRED');
    });

    test('should return 400 for too many requests', async () => {
      mockCognitoInstance.initiateAuth.mockRejectedValue({
        code: 'TooManyRequestsException',
        message: 'Too many requests.'
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('TOO_MANY_REQUESTS');
    });

    test('should return 400 for new password required', async () => {
      mockCognitoInstance.initiateAuth.mockResolvedValue({
        ChallengeName: 'NEW_PASSWORD_REQUIRED',
        Session: 'test-session'
      } as any);

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NEW_PASSWORD_REQUIRED');
    });

    test('should return 400 for MFA setup required', async () => {
      mockCognitoInstance.initiateAuth.mockResolvedValue({
        ChallengeName: 'MFA_SETUP',
        Session: 'test-session'
      } as any);

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('MFA_SETUP_REQUIRED');
    });
  });

  describe('User Profile Retrieval', () => {
    beforeEach(() => {
      // Mock successful authentication
      mockCognitoInstance.initiateAuth.mockResolvedValue({
        AuthenticationResult: {
          AccessToken: 'access-token',
          IdToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6InRlc3R1c2VyQGV4YW1wbGUuY29tIiwiaWF0IjoxNjE2MjM5MDIyfQ.signature',
          RefreshToken: 'refresh-token',
          ExpiresIn: 3600,
          TokenType: 'Bearer'
        }
      } as any);
    });

    test('should return 400 when user profile not found', async () => {
      mockDynamoInstance.get.mockResolvedValue({
        Item: undefined
      } as any);

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('USER_PROFILE_NOT_FOUND');
    });

    test('should handle DynamoDB errors gracefully', async () => {
      mockDynamoInstance.get.mockRejectedValue(new Error('DynamoDB error'));

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('USER_PROFILE_NOT_FOUND');
    });
  });

  describe('Successful Signin', () => {
    beforeEach(() => {
      // Mock successful authentication
      mockCognitoInstance.initiateAuth.mockResolvedValue({
        AuthenticationResult: {
          AccessToken: 'access-token',
          IdToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6InRlc3R1c2VyQGV4YW1wbGUuY29tIiwiaWF0IjoxNjE2MjM5MDIyfQ.signature',
          RefreshToken: 'refresh-token',
          ExpiresIn: 3600,
          TokenType: 'Bearer'
        }
      } as any);

      // Mock user profile
      mockDynamoInstance.get.mockResolvedValue({
        Item: {
          userId: 'test-user-id',
          username: 'testuser@example.com',
          email: 'testuser@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'student',
          status: 'active',
          lastLogin: '2023-01-01T00:00:00Z',
          preferences: { theme: 'dark' }
        }
      } as any);

      // Mock last login update
      mockDynamoInstance.update.mockResolvedValue({} as any);
      mockCognitoInstance.adminUpdateUserAttributes.mockResolvedValue({} as any);
    });

    test('should return 200 with user data and tokens', async () => {
      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.data.accessToken).toBe('access-token');
      expect(body.data.idToken).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6InRlc3R1c2VyQGV4YW1wbGUuY29tIiwiaWF0IjoxNjE2MjM5MDIyfQ.signature');
      expect(body.data.refreshToken).toBe('refresh-token');
      expect(body.data.expiresIn).toBe(3600);
      expect(body.data.tokenType).toBe('Bearer');
      expect(body.data.user.userId).toBe('test-user-id');
      expect(body.data.user.username).toBe('testuser@example.com');
      expect(body.data.user.email).toBe('testuser@example.com');
      expect(body.data.user.firstName).toBe('Test');
      expect(body.data.user.lastName).toBe('User');
      expect(body.data.user.role).toBe('student');
      expect(body.data.user.status).toBe('active');
      expect(body.data.user.lastLogin).toBe('2023-01-01T00:00:00Z');
      expect(body.data.user.preferences).toEqual({ theme: 'dark' });
    });

    test('should update last login timestamp', async () => {
      await handler(mockEvent, mockContext);

      expect(mockDynamoInstance.update).toHaveBeenCalledWith({
        TableName: 'test-users-table',
        Key: { userId: 'test-user-id' },
        UpdateExpression: 'SET lastLogin = :lastLogin',
        ExpressionAttributeValues: {
          ':lastLogin': expect.any(String)
        }
      });

      expect(mockCognitoInstance.adminUpdateUserAttributes).toHaveBeenCalledWith({
        UserPoolId: 'test-user-pool-id',
        Username: 'test-user-id',
        UserAttributes: [
          {
            Name: 'custom:lastLogin',
            Value: expect.any(String)
          }
        ]
      });
    });

    test('should handle last login update failures gracefully', async () => {
      mockDynamoInstance.update.mockRejectedValue(new Error('Update failed'));
      mockCognitoInstance.adminUpdateUserAttributes.mockRejectedValue(new Error('Cognito update failed'));

      const result = await handler(mockEvent, mockContext);

      // Should still succeed even if last login update fails
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should return 400 for general authentication errors', async () => {
      mockCognitoInstance.initiateAuth.mockRejectedValue({
        code: 'UnknownError',
        message: 'Unknown error occurred.'
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    test('should return 400 for internal errors', async () => {
      mockCognitoInstance.initiateAuth.mockRejectedValue(new Error('Unexpected error'));

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('CORS Headers', () => {
    test('should include CORS headers in success response', async () => {
      // Mock successful authentication
      mockCognitoInstance.initiateAuth.mockResolvedValue({
        AuthenticationResult: {
          AccessToken: 'access-token',
          IdToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6InRlc3R1c2VyQGV4YW1wbGUuY29tIiwiaWF0IjoxNjE2MjM5MDIyfQ.signature',
          RefreshToken: 'refresh-token',
          ExpiresIn: 3600,
          TokenType: 'Bearer'
        }
      } as any);

      mockDynamoInstance.get.mockResolvedValue({
        Item: {
          userId: 'test-user-id',
          username: 'testuser@example.com',
          email: 'testuser@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'student',
          status: 'active'
        }
      } as any);

      mockDynamoInstance.update.mockResolvedValue({} as any);
      mockCognitoInstance.adminUpdateUserAttributes.mockResolvedValue({} as any);

      const result = await handler(mockEvent, mockContext);

      expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(result.headers['Access-Control-Allow-Headers']).toBe('Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token');
      expect(result.headers['Access-Control-Allow-Methods']).toBe('POST,OPTIONS');
    });

    test('should include CORS headers in error response', async () => {
      mockCognitoInstance.initiateAuth.mockRejectedValue({
        code: 'NotAuthorizedException',
        message: 'Incorrect username or password.'
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(result.headers['Access-Control-Allow-Headers']).toBe('Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token');
      expect(result.headers['Access-Control-Allow-Methods']).toBe('POST,OPTIONS');
    });
  });
});
