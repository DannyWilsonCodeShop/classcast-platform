// Test setup file for authentication Lambda functions

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log during tests unless explicitly needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock AWS SDK globally
jest.mock('aws-sdk', () => ({
  CognitoIdentityServiceProvider: jest.fn(),
  DynamoDB: {
    DocumentClient: jest.fn()
  },
  S3: jest.fn(),
  IAM: jest.fn(),
  CloudWatchLogs: jest.fn()
}));

// Mock environment variables for tests
process.env['NODE_ENV'] = 'test';

// Global test timeout
jest.setTimeout(10000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global test utilities
(global as any).createMockAPIGatewayEvent = (body: any, overrides: any = {}) => ({
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
});

(global as any).createMockContext = () => ({
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
});
