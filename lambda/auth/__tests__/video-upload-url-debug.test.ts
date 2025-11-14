// Mock AWS SDK before importing the handler
jest.mock('aws-sdk', () => ({
  S3: jest.fn().mockImplementation(() => ({
    getSignedUrlPromise: jest.fn().mockResolvedValue('https://mock-presigned-url.com/upload')
  }))
}));

// Mock JWT verifier before importing the handler
jest.mock('../jwt-verifier', () => ({
  verifyJwtToken: jest.fn()
}));

import { handler } from '../generate-video-upload-url';

// Simple test to debug the issue
describe('Video Upload URL Debug', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup JWT mock
    const { verifyJwtToken } = require('../jwt-verifier');
    verifyJwtToken.mockResolvedValue({
      success: true,
      user: {
        sub: 'user123',
        isInstructor: false,
        isAdmin: false
      }
    });
    

  });

  it('should handle basic request', async () => {
    const mockEvent = {
      body: JSON.stringify({
        fileName: 'test-video.mp4',
        fileType: 'video/mp4',
        fileSize: 10485760,
        assignmentId: 'assignment123',
        courseId: 'CS101'
      }),
      headers: {
        Authorization: 'Bearer mock-token'
      },
      queryStringParameters: null,
      multiValueHeaders: {},
      httpMethod: 'POST',
      isBase64Encoded: false,
      path: '/video-upload-url',
      pathParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {} as any,
      resource: ''
    };

    try {
      const response = await handler(mockEvent, {} as any, () => {});
      console.log('Response status:', response?.statusCode);
      console.log('Response body:', response?.body);
      if (response?.body) {
        try {
          const body = JSON.parse(response.body);
          console.log('Parsed body:', JSON.stringify(body, null, 2));
        } catch (e) {
          console.log('Could not parse body:', e);
        }
      }
      if (response?.statusCode !== 200) {
        let errorMessage = `Expected status 200, got ${response?.statusCode}`;
        if (response?.body) {
          try {
            const errorBody = JSON.parse(response.body);
            errorMessage += ` - ${JSON.stringify(errorBody)}`;
          } catch (e) {
            errorMessage += ` - Could not parse body: ${response.body}`;
          }
        }
        throw new Error(errorMessage);
      }
      expect(response?.statusCode).toBe(200);
    } catch (error) {
      console.error('Handler error:', error);
      throw error;
    }
  });
});
