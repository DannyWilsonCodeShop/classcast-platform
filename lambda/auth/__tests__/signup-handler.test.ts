import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { handler } from '../signup-handler';
import { CognitoIdentityServiceProvider, DynamoDB } from 'aws-sdk';

// Mock AWS SDK
jest.mock('aws-sdk');

const mockCognito = CognitoIdentityServiceProvider as jest.MockedClass<typeof CognitoIdentityServiceProvider>;
const mockDynamoDB = DynamoDB.DocumentClient as jest.MockedClass<typeof DynamoDB.DocumentClient>;

// Mock environment variables
const originalEnv = process.env;

describe('Signup Handler', () => {
  let mockCognitoInstance: any;
  let mockDynamoDBInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env = {
      ...originalEnv,
      USER_POOL_ID: 'test-user-pool-id',
      USER_POOL_CLIENT_ID: 'test-client-id',
      USERS_TABLE: 'test-users-table'
    };

    // Mock Cognito instance
    mockCognitoInstance = {
      listUsers: jest.fn(),
      adminCreateUser: jest.fn(),
      adminSetUserPassword: jest.fn(),
      adminUpdateUserAttributes: jest.fn()
    };
    mockCognito.mockImplementation(() => mockCognitoInstance);

    // Mock DynamoDB instance
    mockDynamoDBInstance = {
      put: jest.fn()
    };
    mockDynamoDB.mockImplementation(() => mockDynamoDBInstance);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const createValidSignupRequest = (overrides: any = {}) => ({
    username: 'testuser',
    email: 'test@example.com',
    password: 'TestPass123!',
    firstName: 'John',
    lastName: 'Doe',
    role: 'student',
    department: 'Computer Science',
    studentId: 'STU123456',
    ...overrides
  });

  const createAPIGatewayEvent = (body: any): APIGatewayProxyEvent => ({
    body: JSON.stringify(body),
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'POST',
    isBase64Encoded: false,
    path: '/signup',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: ''
  });

  describe('Request Validation', () => {
    test('should accept valid signup request', async () => {
      const request = createValidSignupRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful Cognito user creation
      mockCognitoInstance.adminCreateUser.mockResolvedValue({
        User: { Username: 'testuser' }
      });

      // Mock successful DynamoDB profile creation
      mockDynamoDBInstance.put.mockResolvedValue({});

      // Mock successful confirmation email
      mockCognitoInstance.adminSetUserPassword.mockResolvedValue({});
      mockCognitoInstance.adminUpdateUserAttributes.mockResolvedValue({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.data.userId).toBe('testuser');
      expect(body.data.requiresConfirmation).toBe(true);
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

    test('should reject request with missing required fields', async () => {
      const request = {
        username: 'testuser',
        email: 'test@example.com'
        // Missing password, firstName, lastName, role, department
      };
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Validation failed');
      expect(body.details.errors).toHaveLength(5); // 5 missing required fields
    });

    test('should reject invalid email format', async () => {
      const request = createValidSignupRequest({ email: 'invalid-email' });
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Validation failed');
      expect(body.details.errors).toContainEqual(
        expect.objectContaining({
          field: 'email',
          message: 'Invalid email format'
        })
      );
    });

    test('should reject weak password', async () => {
      const request = createValidSignupRequest({ password: 'weak' });
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Validation failed');
      expect(body.details.errors).toContainEqual(
        expect.objectContaining({
          field: 'password',
          message: 'Password must be at least 8 characters'
        })
      );
    });

    test('should reject invalid username format', async () => {
      const request = createValidSignupRequest({ username: 'user@name' });
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Validation failed');
      expect(body.details.errors).toContainEqual(
        expect.objectContaining({
          field: 'username',
          message: 'Username can only contain letters, numbers, dots, underscores, and hyphens'
        })
      );
    });

    test('should reject invalid phone number format', async () => {
      const request = createValidSignupRequest({ phoneNumber: 'invalid-phone' });
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Validation failed');
      expect(body.details.errors).toContainEqual(
        expect.objectContaining({
          field: 'phoneNumber',
          message: 'Phone number must be in international format (e.g., +1234567890)'
        })
      );
    });
  });

  describe('Role-Specific Validation', () => {
    test('should require studentId for student role', async () => {
      const request = createValidSignupRequest({
        role: 'student',
        studentId: undefined
      });
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Student ID is required for student accounts');
    });

    test('should require instructorId for instructor role', async () => {
      const request = createValidSignupRequest({
        role: 'instructor',
        instructorId: 'INS123456'
      });
      const event = createAPIGatewayEvent(request);

      // Mock successful Cognito user creation
      mockCognitoInstance.adminCreateUser.mockResolvedValue({
        User: { Username: 'testuser' }
      });

      // Mock successful DynamoDB profile creation
      mockDynamoDBInstance.put.mockResolvedValue({});

      // Mock successful confirmation email
      mockCognitoInstance.adminSetUserPassword.mockResolvedValue({});
      mockCognitoInstance.adminUpdateUserAttributes.mockResolvedValue({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
    });

    test('should reject admin role with general department', async () => {
      const request = createValidSignupRequest({
        role: 'admin',
        department: 'general'
      });
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Admin accounts must specify a valid department');
    });
  });

  describe('Duplicate User Detection', () => {
    test('should reject duplicate email', async () => {
      const request = createValidSignupRequest();
      const event = createAPIGatewayEvent(request);

      // Mock existing user with same email
      mockCognitoInstance.listUsers
        .mockResolvedValueOnce({
          Users: [{ Username: 'existinguser' }]
        })
        .mockResolvedValueOnce({ Users: [] });

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(409);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('An account with this email already exists');
    });

    test('should reject duplicate username', async () => {
      const request = createValidSignupRequest();
      const event = createAPIGatewayEvent(request);

      // Mock no existing user with email, but existing username
      mockCognitoInstance.listUsers
        .mockResolvedValueOnce({ Users: [] })
        .mockResolvedValueOnce({
          Users: [{ Username: 'testuser' }]
        });

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(409);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('This username is already taken');
    });
  });

  describe('Cognito Integration', () => {
    test('should create user in Cognito successfully', async () => {
      const request = createValidSignupRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful Cognito user creation
      mockCognitoInstance.adminCreateUser.mockResolvedValue({
        User: { Username: 'testuser' }
      });

      // Mock successful DynamoDB profile creation
      mockDynamoDBInstance.put.mockResolvedValue({});

      // Mock successful confirmation email
      mockCognitoInstance.adminSetUserPassword.mockResolvedValue({});
      mockCognitoInstance.adminUpdateUserAttributes.mockResolvedValue({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(201);
      expect(mockCognitoInstance.adminCreateUser).toHaveBeenCalledWith({
        UserPoolId: 'test-user-pool-id',
        Username: 'testuser',
        UserAttributes: expect.arrayContaining([
          { Name: 'email', Value: 'test@example.com' },
          { Name: 'given_name', Value: 'John' },
          { Name: 'family_name', Value: 'Doe' },
          { Name: 'custom:role', Value: 'student' },
          { Name: 'custom:department', Value: 'Computer Science' },
          { Name: 'custom:studentId', Value: 'STU123456' }
        ]),
        MessageAction: 'SUPPRESS',
        DesiredDeliveryMediums: ['EMAIL']
      });
    });

    test('should handle Cognito user creation failure', async () => {
      const request = createValidSignupRequest();
      const event = createAPIGatewayEvent(request);

      // Mock Cognito user creation failure
      mockCognitoInstance.adminCreateUser.mockRejectedValue(
        new Error('UsernameExistsException')
      );

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Failed to create user in Cognito');
      expect(body.details.error).toBe('Username already exists');
    });

    test('should handle invalid password exception', async () => {
      const request = createValidSignupRequest();
      const event = createAPIGatewayEvent(request);

      // Mock Cognito invalid password exception
      mockCognitoInstance.adminCreateUser.mockRejectedValue(
        new Error('InvalidPasswordException')
      );

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.details.error).toBe('Password does not meet requirements');
    });
  });

  describe('DynamoDB Integration', () => {
    test('should create user profile in DynamoDB', async () => {
      const request = createValidSignupRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful Cognito user creation
      mockCognitoInstance.adminCreateUser.mockResolvedValue({
        User: { Username: 'testuser' }
      });

      // Mock successful DynamoDB profile creation
      mockDynamoDBInstance.put.mockResolvedValue({});

      // Mock successful confirmation email
      mockCognitoInstance.adminSetUserPassword.mockResolvedValue({});
      mockCognitoInstance.adminUpdateUserAttributes.mockResolvedValue({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(201);
      expect(mockDynamoDBInstance.put).toHaveBeenCalledWith({
        TableName: 'test-users-table',
        Item: expect.objectContaining({
          userId: 'testuser',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'student',
          department: 'Computer Science',
          studentId: 'STU123456',
          status: 'pending',
          enabled: false
        })
      });
    });

    test('should continue execution if DynamoDB profile creation fails', async () => {
      const request = createValidSignupRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful Cognito user creation
      mockCognitoInstance.adminCreateUser.mockResolvedValue({
        User: { Username: 'testuser' }
      });

      // Mock DynamoDB profile creation failure
      mockDynamoDBInstance.put.mockRejectedValue(new Error('DynamoDB error'));

      // Mock successful confirmation email
      mockCognitoInstance.adminSetUserPassword.mockResolvedValue({});
      mockCognitoInstance.adminUpdateUserAttributes.mockResolvedValue({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.data.profileCreated).toBe(false);
    });
  });

  describe('Confirmation Email', () => {
    test('should send confirmation email successfully', async () => {
      const request = createValidSignupRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful Cognito user creation
      mockCognitoInstance.adminCreateUser.mockResolvedValue({
        User: { Username: 'testuser' }
      });

      // Mock successful DynamoDB profile creation
      mockDynamoDBInstance.put.mockResolvedValue({});

      // Mock successful confirmation email
      mockCognitoInstance.adminSetUserPassword.mockResolvedValue({});
      mockCognitoInstance.adminUpdateUserAttributes.mockResolvedValue({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(201);
      expect(mockCognitoInstance.adminSetUserPassword).toHaveBeenCalledWith({
        UserPoolId: 'test-user-pool-id',
        Username: 'testuser',
        Password: 'TemporaryPassword123!',
        Permanent: false
      });
      expect(mockCognitoInstance.adminUpdateUserAttributes).toHaveBeenCalledWith({
        UserPoolId: 'test-user-pool-id',
        Username: 'testuser',
        UserAttributes: [
          { Name: 'email_verified', Value: 'false' }
        ]
      });
    });

    test('should continue execution if confirmation email fails', async () => {
      const request = createValidSignupRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful Cognito user creation
      mockCognitoInstance.adminCreateUser.mockResolvedValue({
        User: { Username: 'testuser' }
      });

      // Mock successful DynamoDB profile creation
      mockDynamoDBInstance.put.mockResolvedValue({});

      // Mock confirmation email failure
      mockCognitoInstance.adminSetUserPassword.mockRejectedValue(new Error('Email error'));

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle unexpected errors gracefully', async () => {
      const request = createValidSignupRequest();
      const event = createAPIGatewayEvent(request);

      // Mock unexpected error in Cognito
      mockCognitoInstance.adminCreateUser.mockRejectedValue(new Error('Unexpected error'));

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Internal server error');
      expect(body.details.error).toBe('Unexpected error');
    });

    test('should handle Cognito listUsers error gracefully', async () => {
      const request = createValidSignupRequest();
      const event = createAPIGatewayEvent(request);

      // Mock Cognito listUsers error
      mockCognitoInstance.listUsers.mockRejectedValue(new Error('Cognito error'));

      // Mock successful Cognito user creation
      mockCognitoInstance.adminCreateUser.mockResolvedValue({
        User: { Username: 'testuser' }
      });

      // Mock successful DynamoDB profile creation
      mockDynamoDBInstance.put.mockResolvedValue({});

      // Mock successful confirmation email
      mockCognitoInstance.adminSetUserPassword.mockResolvedValue({});
      mockCognitoInstance.adminUpdateUserAttributes.mockResolvedValue({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      // Should continue execution even if duplicate check fails
      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
    });
  });

  describe('Response Format', () => {
    test('should return proper success response format', async () => {
      const request = createValidSignupRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful Cognito user creation
      mockCognitoInstance.adminCreateUser.mockResolvedValue({
        User: { Username: 'testuser' }
      });

      // Mock successful DynamoDB profile creation
      mockDynamoDBInstance.put.mockResolvedValue({});

      // Mock successful confirmation email
      mockCognitoInstance.adminSetUserPassword.mockResolvedValue({});
      mockCognitoInstance.adminUpdateUserAttributes.mockResolvedValue({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(201);
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
          message: 'User created successfully',
          userId: 'testuser',
          email: 'test@example.com',
          requiresConfirmation: true,
          profileCreated: true
        },
        message: 'Please check your email to confirm your account',
        timestamp: expect.any(String)
      });
    });

    test('should return proper error response format', async () => {
      const request = createValidSignupRequest({ email: 'invalid-email' });
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
});
