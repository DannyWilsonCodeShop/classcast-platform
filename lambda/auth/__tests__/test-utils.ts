import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

/**
 * Test utilities for authentication Lambda functions
 */

export interface MockCognitoUser {
  Username: string;
  Attributes: Array<{
    Name: string;
    Value: string;
  }>;
  Enabled: boolean;
  UserStatus: string;
  UserCreateDate: Date;
  UserLastModifiedDate: Date;
}

export interface MockDynamoDBItem {
  [key: string]: any;
}

/**
 * Create a mock API Gateway event for testing
 */
export function createMockAPIGatewayEvent(
  body: any = {},
  overrides: Partial<APIGatewayProxyEvent> = {}
): APIGatewayProxyEvent {
  return {
    body: JSON.stringify(body),
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'POST',
    isBase64Encoded: false,
    path: '/test',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: '',
    ...overrides
  };
}

/**
 * Create a mock Lambda context for testing
 */
export function createMockLambdaContext() {
  return {
    callbackWaitsForEmptyEventLoop: true,
    functionName: 'test-function',
    functionVersion: '$LATEST',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
    memoryLimitInMB: '128',
    awsRequestId: 'test-request-id',
    logGroupName: '/aws/lambda/test-function',
    logStreamName: '2023/01/01/[$LATEST]test-stream',
    getRemainingTimeInMillis: () => 1000,
    done: jest.fn(),
    fail: jest.fn(),
    succeed: jest.fn()
  };
}

/**
 * Create a mock Cognito user for testing
 */
export function createMockCognitoUser(
  username: string,
  attributes: Record<string, string> = {}
): MockCognitoUser {
  const defaultAttributes = [
    { Name: 'sub', Value: `sub-${username}` },
    { Name: 'email', Value: `${username}@example.com` },
    { Name: 'email_verified', Value: 'false' },
    { Name: 'given_name', Value: 'Test' },
    { Name: 'family_name', Value: 'User' },
    { Name: 'custom:role', Value: 'student' },
    { Name: 'custom:department', Value: 'Computer Science' }
  ];

  const customAttributes = Object.entries(attributes).map(([key, value]) => ({
    Name: key,
    Value: value
  }));

  return {
    Username: username,
    Attributes: [...defaultAttributes, ...customAttributes],
    Enabled: false,
    UserStatus: 'UNCONFIRMED',
    UserCreateDate: new Date(),
    UserLastModifiedDate: new Date()
  };
}

/**
 * Create a mock DynamoDB item for testing
 */
export function createMockDynamoDBItem(
  userId: string,
  overrides: Record<string, any> = {}
): MockDynamoDBItem {
  const defaultItem = {
    userId,
    email: `${userId}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    role: 'student',
    department: 'Computer Science',
    status: 'pending',
    enabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return { ...defaultItem, ...overrides };
}

/**
 * Create a mock student signup request for testing
 */
export function createMockStudentSignupRequest(overrides: any = {}) {
  return {
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
  };
}

/**
 * Create a mock instructor signup request for testing
 */
export function createMockInstructorSignupRequest(overrides: any = {}) {
  return {
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
  };
}

/**
 * Create a mock signup confirmation request for testing
 */
export function createMockConfirmationRequest(overrides: any = {}) {
  return {
    username: 'testuser',
    confirmationCode: '123456',
    ...overrides
  };
}

/**
 * Assert that a response has the correct success format
 */
export function assertSuccessResponse(
  result: APIGatewayProxyResult,
  expectedStatusCode: number = 200
) {
  expect(result.statusCode).toBe(expectedStatusCode);
  expect(result.headers).toEqual({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
  });

  const body = JSON.parse(result.body);
  expect(body.success).toBe(true);
  expect(body.timestamp).toBeDefined();
  expect(new Date(body.timestamp)).toBeInstanceOf(Date);
  
  return body;
}

/**
 * Assert that a response has the correct error format
 */
export function assertErrorResponse(
  result: APIGatewayProxyResult,
  expectedStatusCode: number,
  expectedError: string
) {
  expect(result.statusCode).toBe(expectedStatusCode);
  expect(result.headers).toEqual({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
  });

  const body = JSON.parse(result.body);
  expect(body.success).toBe(false);
  expect(body.error).toBe(expectedError);
  expect(body.timestamp).toBeDefined();
  expect(new Date(body.timestamp)).toBeInstanceOf(Date);
  
  return body;
}

/**
 * Assert that a response has validation errors
 */
export function assertValidationErrors(
  result: APIGatewayProxyResult,
  expectedErrorCount: number
) {
  expect(result.statusCode).toBe(400);
  
  const body = JSON.parse(result.body);
  expect(body.success).toBe(false);
  expect(body.error).toBe('Validation failed');
  expect(body.details.errors).toHaveLength(expectedErrorCount);
  expect(body.details.message).toBe('Please check your input and try again');
  
  return body;
}

/**
 * Mock environment variables for testing
 */
export function mockEnvironmentVariables(vars: Record<string, string> = {}) {
  const originalEnv = process.env;
  
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      USER_POOL_ID: 'test-user-pool-id',
      USER_POOL_CLIENT_ID: 'test-client-id',
      USERS_TABLE: 'test-users-table',
      ...vars
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });
}

/**
 * Create a mock AWS SDK error
 */
export function createMockAWSError(
  errorType: string,
  message: string = 'Mock AWS error'
): Error {
  const error = new Error(message);
  error.name = errorType;
  return error;
}

/**
 * Common AWS error types for testing
 */
export const AWS_ERROR_TYPES = {
  USER_NOT_FOUND: 'UserNotFoundException',
  USER_ALREADY_EXISTS: 'UsernameExistsException',
  INVALID_PASSWORD: 'InvalidPasswordException',
  INVALID_PARAMETER: 'InvalidParameterException',
  CODE_MISMATCH: 'CodeMismatchException',
  EXPIRED_CODE: 'ExpiredCodeException',
  NOT_AUTHORIZED: 'NotAuthorizedException',
  LIMIT_EXCEEDED: 'LimitExceededException',
  TOO_MANY_REQUESTS: 'TooManyRequestsException'
} as const;

/**
 * Wait for a specified number of milliseconds (useful for async testing)
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a mock JWT token for testing
 */
export function createMockJWTToken(
  payload: Record<string, any> = {},
  secret: string = 'test-secret'
): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const defaultPayload = {
    sub: 'test-user-id',
    email: 'test@example.com',
    'custom:role': 'student',
    'custom:department': 'Computer Science',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...payload
  };

  // Simple base64 encoding for testing (not secure)
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64');
  const encodedPayload = Buffer.from(JSON.stringify(defaultPayload)).toString('base64');
  const signature = Buffer.from(secret).toString('base64');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}
