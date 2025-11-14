// Mock AWS SDK before importing the handler
jest.mock('aws-sdk', () => ({
  DynamoDB: {
    DocumentClient: jest.fn().mockImplementation(() => ({
      update: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      })
    }))
  },
  S3: jest.fn().mockImplementation(() => ({
    headObject: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        ContentLength: 10485760,
        ContentType: 'video/mp4',
        Metadata: {
          'assignment-id': 'assignment123',
          'course-id': 'CS101',
          'upload-type': 'assignment',
          'user-id': 'user123'
        },
        LastModified: new Date('2024-01-01T00:00:00Z')
      })
    })
  }))
}));

import { handler } from '../process-video-submission';

describe('Debug Video Submission Processing', () => {
  it('should process a simple S3 event', async () => {
    const mockEvent = {
      Records: [
        {
          eventName: 'ObjectCreated:Put',
          s3: {
            bucket: {
              name: 'demo-project-videos'
            },
            object: {
              key: 'CS101/assignment123/user123/1704067200000_test-video.mp4'
            }
          }
        }
      ]
    };

    console.log('Mock event:', JSON.stringify(mockEvent, null, 2));

    try {
      const result = await handler(mockEvent as any, {} as any, () => {});
      console.log('Handler result:', result);
    } catch (error) {
      console.error('Handler error:', error);
      throw error;
    }
  });
});

