// Mock AWS SDK before importing the handler
const mockUpdate = jest.fn().mockReturnValue({
  promise: jest.fn().mockResolvedValue({})
});

const mockHeadObject = jest.fn().mockReturnValue({
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
});

jest.mock('aws-sdk', () => ({
  DynamoDB: {
    DocumentClient: jest.fn().mockImplementation(() => ({
      update: mockUpdate
    }))
  },
  S3: jest.fn().mockImplementation(() => ({
    headObject: mockHeadObject
  }))
}));

import { handler } from '../process-video-submission';

// Helper function to create mock S3 event - simplified to match working structure
const createMockS3Event = (eventName: string, bucketName: string, objectKey: string) => ({
  Records: [
    {
      eventName,
      s3: {
        bucket: {
          name: bucketName
        },
        object: {
          key: objectKey
        }
      }
    }
  ]
});

describe('Video Submission Processing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Restore mock implementations after clearing
    mockHeadObject.mockReturnValue({
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
    });
    
    mockUpdate.mockReturnValue({
      promise: jest.fn().mockResolvedValue({})
    });
  });

  describe('S3 Event Handling', () => {
    it('should process valid S3 upload events', async () => {
      const mockEvent = createMockS3Event(
        'ObjectCreated:Put',
        'demo-project-videos',
        'CS101/assignment123/user123/1704067200000_test-video.mp4'
      );

      await handler(mockEvent as any, {} as any, () => {});

      // Verify S3 headObject was called
      expect(mockHeadObject).toHaveBeenCalledWith({
        Bucket: 'demo-project-videos',
        Key: 'CS101/assignment123/user123/1704067200000_test-video.mp4'
      });

      // Verify DynamoDB update was called for status updates
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should skip non-upload events', async () => {
      const mockEvent = createMockS3Event(
        'ObjectRemoved:Delete',
        'demo-project-videos',
        'CS101/assignment123/user123/1704067200000_test-video.mp4'
      );

      await handler(mockEvent as any, {} as any, () => {});

      // Verify S3 headObject was NOT called
      expect(mockHeadObject).not.toHaveBeenCalled();
    });

    it('should skip non-video bucket events', async () => {
      const mockEvent = createMockS3Event(
        'ObjectCreated:Put',
        'other-bucket',
        'CS101/assignment123/user123/1704067200000_test-video.mp4'
      );

      await handler(mockEvent as any, {} as any, () => {});

      // Verify S3 headObject was NOT called
      expect(mockHeadObject).not.toHaveBeenCalled();
    });

    it('should handle multiple S3 records', async () => {
      const mockEvent = {
        Records: [
          {
            eventName: 'ObjectCreated:Put',
            s3: {
              bucket: { name: 'demo-project-videos' },
              object: { key: 'CS101/assignment1/user1/1704067200000_video1.mp4' }
            }
          },
          {
            eventName: 'ObjectCreated:Put',
            s3: {
              bucket: { name: 'demo-project-videos' },
              object: { key: 'CS101/assignment2/user2/1704067200000_video2.mp4' }
            }
          }
        ]
      };

      await handler(mockEvent as any, {} as any, () => {});

      // Verify S3 headObject was called for both records
      expect(mockHeadObject).toHaveBeenCalledTimes(2);
    });
  });

  describe('S3 Key Parsing', () => {
    it('should parse valid S3 keys correctly', async () => {
      const mockEvent = createMockS3Event(
        'ObjectCreated:Put',
        'demo-project-videos',
        'CS101/assignment123/user123/1704067200000_test-video.mp4'
      );

      await handler(mockEvent as any, {} as any, () => {});

      // The handler should successfully process this key
      expect(mockHeadObject).toHaveBeenCalled();
    });

    it('should handle invalid S3 key format', async () => {
      const mockEvent = createMockS3Event(
        'ObjectCreated:Put',
        'demo-project-videos',
        'invalid-key-format'
      );

      await handler(mockEvent as any, {} as any, () => {});

      // The handler should skip invalid keys
      expect(mockHeadObject).not.toHaveBeenCalled();
    });

    it('should handle S3 keys with special characters', async () => {
      const mockEvent = createMockS3Event(
        'ObjectCreated:Put',
        'demo-project-videos',
        'CS-101/assignment_123/user_123/1704067200000_test-video_with-dashes.mp4'
      );

      await handler(mockEvent as any, {} as any, () => {});

      // The handler should process keys with special characters
      expect(mockHeadObject).toHaveBeenCalled();
    });
  });

  describe('Video Validation', () => {
    it('should validate video file size', async () => {
      // Mock S3 to return a large file
      mockHeadObject.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          ContentLength: 600 * 1024 * 1024, // 600MB (exceeds 500MB limit)
          ContentType: 'video/mp4',
          Metadata: {
            'assignment-id': 'assignment123',
            'course-id': 'CS101',
            'upload-type': 'assignment',
            'user-id': 'user123'
          },
          LastModified: new Date('2024-01-01T00:00:00Z')
        })
      });

      const mockEvent = createMockS3Event(
        'ObjectCreated:Put',
        'demo-project-videos',
        'CS101/assignment123/user123/1704067200000_large-video.mp4'
      );

      await handler(mockEvent as any, {} as any, () => {});

      // Should update status to failed due to file size
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          ExpressionAttributeValues: expect.objectContaining({
            ':status': 'failed'
          })
        })
      );
    });

    it('should validate video content type', async () => {
      // Mock S3 to return unsupported content type
      mockHeadObject.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          ContentLength: 10485760,
          ContentType: 'text/plain', // Unsupported type
          Metadata: {
            'assignment-id': 'assignment123',
            'course-id': 'CS101',
            'upload-type': 'assignment',
            'user-id': 'user123'
          },
          LastModified: new Date('2024-01-01T00:00:00Z')
        })
      });

      const mockEvent = createMockS3Event(
        'ObjectCreated:Put',
        'demo-project-videos',
        'CS101/assignment123/user123/1704067200000_text-file.txt'
      );

      await handler(mockEvent as any, {} as any, () => {});

      // Should update status to failed due to content type
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          ExpressionAttributeValues: expect.objectContaining({
            ':status': 'failed'
          })
        })
      );
    });

    it('should validate required metadata', async () => {
      // Mock S3 to return missing metadata
      mockHeadObject.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          ContentLength: 10485760,
          ContentType: 'video/mp4',
          Metadata: {
            'assignment-id': 'assignment123'
            // Missing course-id, upload-type, user-id
          },
          LastModified: new Date('2024-01-01T00:00:00Z')
        })
      });

      const mockEvent = createMockS3Event(
        'ObjectCreated:Put',
        'demo-project-videos',
        'CS101/assignment123/user123/1704067200000_missing-metadata.mp4'
      );

      await handler(mockEvent as any, {} as any, () => {});

      // Should update status to failed due to missing metadata
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          ExpressionAttributeValues: expect.objectContaining({
            ':status': 'failed'
          })
        })
      );
    });
  });

  describe('Video Processing', () => {
    it('should process valid videos successfully', async () => {
      const mockEvent = createMockS3Event(
        'ObjectCreated:Put',
        'demo-project-videos',
        'CS101/assignment123/user123/1704067200000_valid-video.mp4'
      );

      await handler(mockEvent as any, {} as any, () => {});

      // Should update status to processing, then completed
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          ExpressionAttributeValues: expect.objectContaining({
            ':status': 'processing'
          })
        })
      );

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          ExpressionAttributeValues: expect.objectContaining({
            ':status': 'completed'
          })
        })
      );
    });

    it('should generate thumbnails for processed videos', async () => {
      const mockEvent = createMockS3Event(
        'ObjectCreated:Put',
        'demo-project-videos',
        'CS101/assignment123/user123/1704067200000_video-for-thumbnails.mp4'
      );

      await handler(mockEvent as any, {} as any, () => {});

      // Should update submission with thumbnail URLs
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          UpdateExpression: expect.stringContaining('thumbnailUrls')
        })
      );
    });

    it('should handle processing errors gracefully', async () => {
      // Mock S3 to throw an error during headObject
      mockHeadObject.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('S3 service unavailable'))
      });

      const mockEvent = createMockS3Event(
        'ObjectCreated:Put',
        'demo-project-videos',
        'CS101/assignment123/user123/1704067200000_error-video.mp4'
      );

      await handler(mockEvent as any, {} as any, () => {});

      // Should update status to failed
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          ExpressionAttributeValues: expect.objectContaining({
            ':status': 'failed'
          })
        })
      );
    });
  });

  describe('Database Operations', () => {
    it('should update submission status correctly', async () => {
      const mockEvent = createMockS3Event(
        'ObjectCreated:Put',
        'demo-project-videos',
        'CS101/assignment123/user123/1704067200000_db-test-video.mp4'
      );

      await handler(mockEvent as any, {} as any, () => {});

      // Verify the correct table name is used
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: 'submissions'
        })
      );
    });

    it('should update submission with processing results', async () => {
      const mockEvent = createMockS3Event(
        'ObjectCreated:Put',
        'demo-project-videos',
        'CS101/assignment123/user123/1704067200000_results-test-video.mp4'
      );

      await handler(mockEvent as any, {} as any, () => {});

      // Should update with processing results
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          UpdateExpression: expect.stringContaining('processingDuration')
        })
      );
    });

    it('should increment retry count on failures', async () => {
      // Mock S3 to throw an error
      mockHeadObject.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('Processing failed'))
      });

      const mockEvent = createMockS3Event(
        'ObjectCreated:Put',
        'demo-project-videos',
        'CS101/assignment123/user123/1704067200000_retry-test-video.mp4'
      );

      await handler(mockEvent as any, {} as any, () => {});

      // Should update status to failed
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          UpdateExpression: expect.stringContaining('retryCount')
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid S3 event format', async () => {
      const invalidEvent = {
        Records: [
          {
            // Missing required fields
            eventName: 'ObjectCreated:Put'
          }
        ]
      };

      await expect(handler(invalidEvent as any, {} as any, () => {}))
        .rejects
        .toThrow('Invalid S3 event format');
    });

    it('should continue processing other records if one fails', async () => {
      const mockEvent = {
        Records: [
          {
            eventName: 'ObjectCreated:Put',
            s3: {
              bucket: { name: 'demo-project-videos' },
              object: { key: 'CS101/assignment1/user1/1704067200000_video1.mp4' }
            }
          },
          {
            eventName: 'ObjectCreated:Put',
            s3: {
              bucket: { name: 'demo-project-videos' },
              object: { key: 'CS101/assignment2/user2/1704067200000_video2.mp4' }
            }
          }
        ]
      };

      // Mock first record to fail, second to succeed
      mockHeadObject
        .mockReturnValueOnce({
          promise: jest.fn().mockRejectedValue(new Error('First record failed'))
        })
        .mockReturnValueOnce({
          promise: jest.fn().mockResolvedValue({
            ContentLength: 10485760,
            ContentType: 'video/mp4',
            Metadata: {
              'assignment-id': 'assignment2',
              'course-id': 'CS101',
              'upload-type': 'assignment',
              'user-id': 'user2'
            },
            LastModified: new Date('2024-01-01T00:00:00Z')
          })
        });

      await handler(mockEvent as any, {} as any, () => {});

      // Both records should be processed (one fails, one succeeds)
      expect(mockHeadObject).toHaveBeenCalledTimes(2);
    });

    it('should handle DynamoDB update errors gracefully', async () => {
      // Mock DynamoDB to throw an error
      mockUpdate.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('DynamoDB unavailable'))
      });

      const mockEvent = createMockS3Event(
        'ObjectCreated:Put',
        'demo-project-videos',
        'CS101/assignment123/user123/1704067200000_dynamodb-error.mp4'
      );

      // Should not throw - errors are logged but don't fail the handler
      await expect(handler(mockEvent as any, {} as any, () => {})).resolves.not.toThrow();
    });
  });

  describe('Configuration and Environment', () => {
    it('should use correct table names from environment', async () => {
      const mockEvent = createMockS3Event(
        'ObjectCreated:Put',
        'demo-project-videos',
        'CS101/assignment123/user123/1704067200000_config-test.mp4'
      );

      await handler(mockEvent as any, {} as any, () => {});

      // Should use the default table name if environment variable is not set
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: 'submissions'
        })
      );
    });

    it('should use correct bucket names from environment', async () => {
      const mockEvent = createMockS3Event(
        'ObjectCreated:Put', // Event name should be first parameter
        'demo-project-videos', // Bucket name
        'CS101/assignment123/user123/1704067200000_bucket-test.mp4'
      );

      await handler(mockEvent as any, {} as any, () => {});

      // Should process videos from the correct bucket
      expect(mockHeadObject).toHaveBeenCalled();
    });
  });
});
