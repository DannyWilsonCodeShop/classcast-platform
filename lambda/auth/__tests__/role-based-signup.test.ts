import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { handler } from '../role-based-signup';
import { CognitoIdentityServiceProvider, DynamoDB } from 'aws-sdk';

// Mock AWS SDK
jest.mock('aws-sdk');

const mockCognito = CognitoIdentityServiceProvider as jest.MockedClass<typeof CognitoIdentityServiceProvider>;
const mockDynamoDB = DynamoDB.DocumentClient as jest.MockedClass<typeof DynamoDB.DocumentClient>;

// Mock environment variables
const originalEnv = process.env;

describe('Role-Based Signup Handler', () => {
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
      adminAddUserToGroup: jest.fn(),
      adminSetUserPassword: jest.fn(),
      adminUpdateUserAttributes: jest.fn()
    };
    mockCognito.mockImplementation(() => mockCognitoInstance);

    // Mock DynamoDB instance
    mockDynamoDBInstance = {
      put: jest.fn(),
      get: jest.fn(),
      query: jest.fn()
    };
    mockDynamoDB.mockImplementation(() => mockDynamoDBInstance);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const createValidStudentRequest = (overrides: any = {}) => ({
    username: 'student123',
    email: 'student@example.com',
    password: 'StudentPass123!',
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'student',
    department: 'Computer Science',
    studentId: 'STU123456',
    enrollmentYear: 2024,
    major: 'Computer Science',
    academicLevel: 'freshman',
    gpa: 3.8,
    ...overrides
  });

  const createValidInstructorRequest = (overrides: any = {}) => ({
    username: 'instructor123',
    email: 'instructor@example.com',
    password: 'InstructorPass123!',
    firstName: 'Dr. John',
    lastName: 'Doe',
    role: 'instructor',
    department: 'Computer Science',
    instructorId: 'INS123456',
    title: 'Assistant Professor',
    hireDate: '2020-09-01',
    qualifications: 'PhD in Computer Science',
    ...overrides
  });

  const createAPIGatewayEvent = (body: any): APIGatewayProxyEvent => ({
    body: JSON.stringify(body),
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'POST',
    isBase64Encoded: false,
    path: '/role-based-signup',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: ''
  });

  describe('Student Signup Validation', () => {
    test('should accept valid student signup request', async () => {
      const request = createValidStudentRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful Cognito user creation
      mockCognitoInstance.adminCreateUser.mockResolvedValue({
        User: { Username: 'student123' }
      });

      // Mock successful DynamoDB profile creation
      mockDynamoDBInstance.put.mockResolvedValue({});

      // Mock successful group assignment
      mockCognitoInstance.adminAddUserToGroup.mockResolvedValue({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.data.userId).toBe('student123');
      expect(body.data.role).toBe('student');
    });

    test('should reject student signup without studentId', async () => {
      const request = createValidStudentRequest({ studentId: undefined });
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Validation failed');
      expect(body.details.errors).toContainEqual(
        expect.objectContaining({
          field: 'studentId',
          message: 'Student ID is required'
        })
      );
    });

    test('should reject student signup with invalid studentId format', async () => {
      const request = createValidStudentRequest({ studentId: 'stu-123' });
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Validation failed');
      expect(body.details.errors).toContainEqual(
        expect.objectContaining({
          field: 'studentId',
          message: 'Student ID must contain only uppercase letters and numbers'
        })
      );
    });

    test('should reject student signup with invalid enrollment year', async () => {
      const request = createValidStudentRequest({ enrollmentYear: 1999 });
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Validation failed');
      expect(body.details.errors).toContainEqual(
        expect.objectContaining({
          field: 'enrollmentYear',
          message: 'Enrollment year must be 2000 or later'
        })
      );
    });

    test('should reject student signup with invalid GPA', async () => {
      const request = createValidStudentRequest({ gpa: 4.5 });
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Validation failed');
      expect(body.details.errors).toContainEqual(
        expect.objectContaining({
          field: 'gpa',
          message: 'GPA cannot exceed 4.0'
        })
      );
    });

    test('should reject student signup with invalid academic level', async () => {
      const request = createValidStudentRequest({ academicLevel: 'invalid-level' });
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Validation failed');
      expect(body.details.errors).toContainEqual(
        expect.objectContaining({
          field: 'academicLevel',
          message: expect.stringContaining('Invalid enum value')
        })
      );
    });
  });

  describe('Instructor Signup Validation', () => {
    test('should accept valid instructor signup request', async () => {
      const request = createValidInstructorRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful Cognito user creation
      mockCognitoInstance.adminCreateUser.mockResolvedValue({
        User: { Username: 'instructor123' }
      });

      // Mock successful DynamoDB profile creation
      mockDynamoDBInstance.put.mockResolvedValue({});

      // Mock successful group assignment
      mockCognitoInstance.adminAddUserToGroup.mockResolvedValue({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.data.userId).toBe('instructor123');
      expect(body.data.role).toBe('instructor');
    });

    test('should reject instructor signup without instructorId', async () => {
      const request = createValidInstructorRequest({ instructorId: undefined });
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Validation failed');
      expect(body.details.errors).toContainEqual(
        expect.objectContaining({
          field: 'instructorId',
          message: 'Instructor ID is required'
        })
      );
    });

    test('should reject instructor signup with invalid instructorId format', async () => {
      const request = createValidInstructorRequest({ instructorId: 'ins-123' });
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Validation failed');
      expect(body.details.errors).toContainEqual(
        expect.objectContaining({
          field: 'instructorId',
          message: 'Instructor ID must contain only uppercase letters and numbers'
        })
      );
    });

    test('should reject instructor signup with invalid hire date', async () => {
      const request = createValidInstructorRequest({ hireDate: 'invalid-date' });
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Validation failed');
      expect(body.details.errors).toContainEqual(
        expect.objectContaining({
          field: 'hireDate',
          message: expect.stringContaining('Invalid date')
        })
      );
    });

    test('should reject instructor signup with future hire date', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const request = createValidInstructorRequest({ 
        hireDate: futureDate.toISOString().split('T')[0] 
      });
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Business rule validation failed');
      expect(body.details.rule).toBe('hireDate');
      expect(body.details.details).toContain('Hire date cannot be in the future');
    });
  });

  describe('Business Rule Validation', () => {
    test('should reject duplicate student ID', async () => {
      const request = createValidStudentRequest();
      const event = createAPIGatewayEvent(request);

      // Mock existing student with same ID
      mockDynamoDBInstance.query.mockResolvedValue({
        Items: [{ userId: 'existing-student' }]
      });

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(409);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Business rule validation failed');
      expect(body.details.rule).toBe('studentId');
      expect(body.details.details).toContain('Student ID already exists');
    });

    test('should reject duplicate instructor ID', async () => {
      const request = createValidInstructorRequest();
      const event = createAPIGatewayEvent(request);

      // Mock existing instructor with same ID
      mockDynamoDBInstance.query.mockResolvedValue({
        Items: [{ userId: 'existing-instructor' }]
      });

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(409);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Business rule validation failed');
      expect(body.details.rule).toBe('instructorId');
      expect(body.details.details).toContain('Instructor ID already exists');
    });

    test('should reject student with invalid enrollment year range', async () => {
      const request = createValidStudentRequest({ enrollmentYear: 1995 });
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Validation failed');
      expect(body.details.errors).toContainEqual(
        expect.objectContaining({
          field: 'enrollmentYear',
          message: 'Enrollment year must be 2000 or later'
        })
      );
    });

    test('should reject instructor with invalid hire date format', async () => {
      const request = createValidInstructorRequest({ hireDate: '2020/09/01' });
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Validation failed');
      expect(body.details.errors).toContainEqual(
        expect.objectContaining({
          field: 'hireDate',
          message: expect.stringContaining('Invalid date')
        })
      );
    });
  });

  describe('Duplicate User Detection', () => {
    test('should reject duplicate email', async () => {
      const request = createValidStudentRequest();
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
      expect(body.error).toBe('User already exists');
      expect(body.details.field).toBe('email');
    });

    test('should reject duplicate username', async () => {
      const request = createValidStudentRequest();
      const event = createAPIGatewayEvent(request);

      // Mock no existing user with email, but existing username
      mockCognitoInstance.listUsers
        .mockResolvedValueOnce({ Users: [] })
        .mockResolvedValueOnce({
          Users: [{ Username: 'student123' }]
        });

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(409);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('User already exists');
      expect(body.details.field).toBe('username');
    });
  });

  describe('Cognito Integration', () => {
    test('should create student user in Cognito with correct attributes', async () => {
      const request = createValidStudentRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful Cognito user creation
      mockCognitoInstance.adminCreateUser.mockResolvedValue({
        User: { Username: 'student123' }
      });

      // Mock successful DynamoDB profile creation
      mockDynamoDBInstance.put.mockResolvedValue({});

      // Mock successful group assignment
      mockCognitoInstance.adminAddUserToGroup.mockResolvedValue({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(201);
      expect(mockCognitoInstance.adminCreateUser).toHaveBeenCalledWith({
        UserPoolId: 'test-user-pool-id',
        Username: 'student123',
        UserAttributes: expect.arrayContaining([
          { Name: 'email', Value: 'student@example.com' },
          { Name: 'given_name', Value: 'Jane' },
          { Name: 'family_name', Value: 'Smith' },
          { Name: 'custom:role', Value: 'student' },
          { Name: 'custom:department', Value: 'Computer Science' },
          { Name: 'custom:studentId', Value: 'STU123456' },
          { Name: 'custom:enrollmentYear', Value: '2024' },
          { Name: 'custom:major', Value: 'Computer Science' },
          { Name: 'custom:academicLevel', Value: 'freshman' },
          { Name: 'custom:gpa', Value: '3.8' }
        ]),
        MessageAction: 'SUPPRESS',
        DesiredDeliveryMediums: ['EMAIL']
      });
    });

    test('should create instructor user in Cognito with correct attributes', async () => {
      const request = createValidInstructorRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful Cognito user creation
      mockCognitoInstance.adminCreateUser.mockResolvedValue({
        User: { Username: 'instructor123' }
      });

      // Mock successful DynamoDB profile creation
      mockDynamoDBInstance.put.mockResolvedValue({});

      // Mock successful group assignment
      mockCognitoInstance.adminAddUserToGroup.mockResolvedValue({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(201);
      expect(mockCognitoInstance.adminCreateUser).toHaveBeenCalledWith({
        UserPoolId: 'test-user-pool-id',
        Username: 'instructor123',
        UserAttributes: expect.arrayContaining([
          { Name: 'email', Value: 'instructor@example.com' },
          { Name: 'given_name', Value: 'Dr. John' },
          { Name: 'family_name', Value: 'Doe' },
          { Name: 'custom:role', Value: 'instructor' },
          { Name: 'custom:department', Value: 'Computer Science' },
          { Name: 'custom:instructorId', Value: 'INS123456' },
          { Name: 'custom:title', Value: 'Assistant Professor' },
          { Name: 'custom:hireDate', Value: '2020-09-01' },
          { Name: 'custom:qualifications', Value: 'PhD in Computer Science' }
        ]),
        MessageAction: 'SUPPRESS',
        DesiredDeliveryMediums: ['EMAIL']
      });
    });

    test('should assign user to correct Cognito group', async () => {
      const request = createValidStudentRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful Cognito user creation
      mockCognitoInstance.adminCreateUser.mockResolvedValue({
        User: { Username: 'student123' }
      });

      // Mock successful DynamoDB profile creation
      mockDynamoDBInstance.put.mockResolvedValue({});

      // Mock successful group assignment
      mockCognitoInstance.adminAddUserToGroup.mockResolvedValue({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(201);
      expect(mockCognitoInstance.adminAddUserToGroup).toHaveBeenCalledWith({
        UserPoolId: 'test-user-pool-id',
        Username: 'student123',
        GroupName: 'students'
      });
    });

    test('should handle Cognito user creation failure', async () => {
      const request = createValidStudentRequest();
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
  });

  describe('DynamoDB Integration', () => {
    test('should create student profile in DynamoDB', async () => {
      const request = createValidStudentRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful Cognito user creation
      mockCognitoInstance.adminCreateUser.mockResolvedValue({
        User: { Username: 'student123' }
      });

      // Mock successful DynamoDB profile creation
      mockDynamoDBInstance.put.mockResolvedValue({});

      // Mock successful group assignment
      mockCognitoInstance.adminAddUserToGroup.mockResolvedValue({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(201);
      expect(mockDynamoDBInstance.put).toHaveBeenCalledWith({
        TableName: 'test-users-table',
        Item: expect.objectContaining({
          userId: 'student123',
          email: 'student@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'student',
          department: 'Computer Science',
          studentId: 'STU123456',
          enrollmentYear: 2024,
          major: 'Computer Science',
          academicLevel: 'freshman',
          gpa: 3.8,
          status: 'pending',
          enabled: false
        })
      });
    });

    test('should create instructor profile in DynamoDB', async () => {
      const request = createValidInstructorRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful Cognito user creation
      mockCognitoInstance.adminCreateUser.mockResolvedValue({
        User: { Username: 'instructor123' }
      });

      // Mock successful DynamoDB profile creation
      mockDynamoDBInstance.put.mockResolvedValue({});

      // Mock successful group assignment
      mockCognitoInstance.adminAddUserToGroup.mockResolvedValue({});

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(201);
      expect(mockDynamoDBInstance.put).toHaveBeenCalledWith({
        TableName: 'test-users-table',
        Item: expect.objectContaining({
          userId: 'instructor123',
          email: 'instructor@example.com',
          firstName: 'Dr. John',
          lastName: 'Doe',
          role: 'instructor',
          department: 'Computer Science',
          instructorId: 'INS123456',
          title: 'Assistant Professor',
          hireDate: '2020-09-01',
          qualifications: 'PhD in Computer Science',
          status: 'pending',
          enabled: false
        })
      });
    });

    test('should handle DynamoDB profile creation failure', async () => {
      const request = createValidStudentRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful Cognito user creation
      mockCognitoInstance.adminCreateUser.mockResolvedValue({
        User: { Username: 'student123' }
      });

      // Mock DynamoDB profile creation failure
      mockDynamoDBInstance.put.mockRejectedValue(new Error('DynamoDB error'));

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Failed to create user profile');
      expect(body.details.error).toBe('DynamoDB error');
    });
  });

  describe('Error Handling', () => {
    test('should handle unexpected errors gracefully', async () => {
      const request = createValidStudentRequest();
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

    test('should handle validation errors with detailed messages', async () => {
      const request = createValidStudentRequest({ 
        username: 'a', // Too short
        email: 'invalid-email',
        password: 'weak'
      });
      const event = createAPIGatewayEvent(request);

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Validation failed');
      expect(body.details.errors).toHaveLength(3);
      expect(body.details.errors).toContainEqual(
        expect.objectContaining({
          field: 'username',
          message: 'Username must be at least 3 characters'
        })
      );
    });
  });

  describe('Response Format', () => {
    test('should return proper success response format for student', async () => {
      const request = createValidStudentRequest();
      const event = createAPIGatewayEvent(request);

      // Mock successful Cognito user creation
      mockCognitoInstance.adminCreateUser.mockResolvedValue({
        User: { Username: 'student123' }
      });

      // Mock successful DynamoDB profile creation
      mockDynamoDBInstance.put.mockResolvedValue({});

      // Mock successful group assignment
      mockCognitoInstance.adminAddUserToGroup.mockResolvedValue({});

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
          userId: 'student123',
          email: 'student@example.com',
          role: 'student',
          requiresConfirmation: true,
          profileCreated: true
        },
        message: 'Please check your email to confirm your account',
        timestamp: expect.any(String)
      });
    });

    test('should return proper error response format', async () => {
      const request = createValidStudentRequest({ email: 'invalid-email' });
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
