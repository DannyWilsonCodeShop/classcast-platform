import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { CognitoIdentityServiceProvider, DynamoDB } from 'aws-sdk';
import { handler } from '../session-management';

jest.mock('aws-sdk');

const mockCognito = CognitoIdentityServiceProvider as jest.MockedClass<typeof CognitoIdentityServiceProvider>;
const mockDynamoDB = DynamoDB as jest.MockedClass<typeof DynamoDB>;

describe('Session Management Handler', () => {
  let mockEvent: APIGatewayProxyEvent;
  let mockContext: Context;
  let mockCognitoInstance: jest.Mocked<CognitoIdentityServiceProvider>;
  let mockDynamoInstance: jest.Mocked<DynamoDB.DocumentClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockCognitoInstance = {
      initiateAuth: jest.fn()
    } as any;
    
    mockDynamoInstance = {
      get: jest.fn(),
      update: jest.fn(),
      query: jest.fn(),
      put: jest.fn()
    } as any;

    mockCognito.mockImplementation(() => mockCognitoInstance);
    mockDynamoDB.DocumentClient.mockImplementation(() => mockDynamoInstance);

    process.env.USER_POOL_ID = 'test-user-pool-id';
    process.env.USER_POOL_CLIENT_ID = 'test-client-id';
    process.env.SESSIONS_TABLE = 'test-sessions-table';

    mockContext = {} as Context;
  });

  afterEach(() => {
    delete process.env.USER_POOL_ID;
    delete process.env.USER_POOL_CLIENT_ID;
    delete process.env.SESSIONS_TABLE;
  });

  describe('Session Validation', () => {
    beforeEach(() => {
      mockEvent = {
        httpMethod: 'POST',
        path: '/validate',
        body: JSON.stringify({
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJleHAiOjk5OTk5OTk5OTl9.signature',
          refreshToken: 'refresh-token'
        }),
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };
    });

    test('should validate valid session successfully', async () => {
      mockDynamoInstance.get.mockResolvedValue({
        Item: {
          sessionId: 'test-session',
          userId: 'test-user',
          status: 'active'
        }
      } as any);

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.data.isValid).toBe(true);
      expect(body.data.requiresRefresh).toBe(false);
    });

    test('should detect expired session', async () => {
      mockEvent.body = JSON.stringify({
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJleHAiOjF9.signature'
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.data.isValid).toBe(false);
    });

    test('should detect session requiring refresh', async () => {
      mockEvent.body = JSON.stringify({
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJleHAiOjE2NzI1MDAwMDB9.signature'
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.data.requiresRefresh).toBe(true);
    });

    test('should handle invalid JSON', async () => {
      mockEvent.body = 'invalid json';

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_JSON');
    });

    test('should handle validation errors', async () => {
      mockEvent.body = JSON.stringify({});

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Session Listing', () => {
    beforeEach(() => {
      mockEvent = {
        httpMethod: 'GET',
        path: '/list',
        queryStringParameters: {
          userId: 'test-user',
          includeExpired: 'false',
          limit: '10'
        },
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        body: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };
    });

    test('should list user sessions successfully', async () => {
      mockDynamoInstance.query.mockResolvedValue({
        Items: [
          {
            sessionId: 'session-1',
            userId: 'test-user',
            status: 'active',
            createdAt: '2024-01-01T00:00:00Z'
          }
        ],
        Count: 1
      } as any);

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.data.sessions).toHaveLength(1);
      expect(body.data.totalCount).toBe(1);
    });

    test('should handle pagination', async () => {
      mockEvent.queryStringParameters.nextToken = 'next-token';
      
      mockDynamoInstance.query.mockResolvedValue({
        Items: [],
        Count: 0,
        LastEvaluatedKey: { sessionId: 'next-page' }
      } as any);

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.data.nextToken).toBe('next-page');
    });

    test('should handle missing sessions table gracefully', async () => {
      process.env.SESSIONS_TABLE = 'DemoProject-Sessions';

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.data.sessions).toHaveLength(0);
      expect(body.data.totalCount).toBe(0);
    });

    test('should validate query parameters', async () => {
      mockEvent.queryStringParameters.userId = '';

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Session Revocation', () => {
    beforeEach(() => {
      mockEvent = {
        httpMethod: 'DELETE',
        path: '/revoke',
        body: JSON.stringify({
          sessionId: 'test-session',
          reason: 'Security concern'
        }),
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };
    });

    test('should revoke session successfully', async () => {
      mockDynamoInstance.update.mockResolvedValue({} as any);

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Session revoked successfully');
    });

    test('should handle missing sessions table gracefully', async () => {
      process.env.SESSIONS_TABLE = 'DemoProject-Sessions';

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
    });

    test('should validate revocation request', async () => {
      mockEvent.body = JSON.stringify({});

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Session Extension', () => {
    beforeEach(() => {
      mockEvent = {
        httpMethod: 'POST',
        path: '/extend',
        body: JSON.stringify({
          accessToken: 'access-token',
          refreshToken: 'refresh-token'
        }),
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };
    });

    test('should extend session successfully', async () => {
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
      expect(body.message).toBe('Session extended successfully');
      expect(body.data.accessToken).toBe('new-access-token');
    });

    test('should handle missing tokens', async () => {
      mockEvent.body = JSON.stringify({ accessToken: 'access-token' });

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('MISSING_TOKENS');
    });

    test('should handle refresh token failure', async () => {
      mockCognitoInstance.initiateAuth.mockRejectedValue({
        code: 'NotAuthorizedException',
        message: 'Invalid refresh token'
      });

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_REFRESH_TOKEN');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid endpoint', async () => {
      mockEvent = {
        httpMethod: 'POST',
        path: '/invalid',
        body: null,
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_ENDPOINT');
    });

    test('should handle internal errors gracefully', async () => {
      mockEvent = {
        httpMethod: 'POST',
        path: '/validate',
        body: JSON.stringify({ accessToken: 'invalid-token' }),
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('CORS Headers', () => {
    test('should include CORS headers in all responses', async () => {
      mockEvent = {
        httpMethod: 'POST',
        path: '/validate',
        body: JSON.stringify({
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJleHAiOjk5OTk5OTk5OTl9.signature'
        }),
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };

      const result = await handler(mockEvent, mockContext);

      expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(result.headers['Access-Control-Allow-Headers']).toBe('Content-Type,Authorization');
      expect(result.headers['Access-Control-Allow-Methods']).toBe('POST,GET,DELETE,OPTIONS');
    });
  });
});
