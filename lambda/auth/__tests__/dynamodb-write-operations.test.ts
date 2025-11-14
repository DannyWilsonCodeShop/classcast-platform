import { 
  performAssignmentWrite, 
  writeAssignmentWithRetry, 
  updateInstructorStats, 
  updateCourseAssignmentCount, 
  createAuditLog,
  batchWriteAssignments,
  retryUnprocessedItems
} from '../create-assignment';
import { DynamoDB } from 'aws-sdk';

// Mock AWS SDK
jest.mock('aws-sdk');
const mockDynamoDB = DynamoDB as jest.MockedClass<typeof DynamoDB>;

describe('DynamoDB Write Operations', () => {
  let mockDynamoClient: any;
  let mockPut: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockBatchWrite: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockPut = jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({}) });
    mockUpdate = jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({}) });
    mockBatchWrite = jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({}) });

    mockDynamoClient = {
      put: mockPut,
      update: mockUpdate,
      batchWrite: mockBatchWrite
    };

    mockDynamoDB.mockImplementation(() => mockDynamoClient as any);
  });

  const mockAssignment = {
    assignmentId: 'assignment_123',
    courseId: 'CS101',
    instructorId: 'inst123',
    title: 'Test Assignment',
    description: 'Test Description',
    type: 'essay',
    points: 100,
    weight: 10,
    status: 'draft',
    visibility: 'private',
    createdAt: '2024-01-15T10:00:00.000Z',
    createdBy: 'user123',
    department: 'Computer Science'
  };

  const requestId = 'req_123';

  describe('performAssignmentWrite', () => {
    it('should perform all write operations successfully', async () => {
      // Mock successful operations
      mockPut.mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      });
      mockUpdate.mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      });

      const result = await performAssignmentWrite(mockAssignment, requestId);
      
      expect(result.success).toBe(true);
      expect(mockPut).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledTimes(2); // instructor stats + course count
    });

    it('should continue execution if non-critical operations fail', async () => {
      // Mock primary write success
      mockPut.mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      });

      // Mock instructor stats failure
      mockUpdate.mockReturnValueOnce({
        promise: jest.fn().mockRejectedValue(new Error('Instructor not found'))
      });

      // Mock course update success
      mockUpdate.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({})
      });

      const result = await performAssignmentWrite(mockAssignment, requestId);
      
      expect(result.success).toBe(true);
      expect(mockPut).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledTimes(2);
    });

    it('should fail if primary write operation fails', async () => {
      // Mock primary write failure
      mockPut.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('Table not found'))
      });

      const result = await performAssignmentWrite(mockAssignment, requestId);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Table not found');
      expect(mockPut).toHaveBeenCalledTimes(1);
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe('writeAssignmentWithRetry', () => {
    it('should write assignment successfully on first attempt', async () => {
      mockPut.mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      });

      const result = await writeAssignmentWithRetry(mockAssignment, requestId);
      
      expect(result.success).toBe(true);
      expect(mockPut).toHaveBeenCalledTimes(1);
    });

    it('should retry on throttling errors', async () => {
      // Mock first attempt failure due to throttling
      mockPut.mockReturnValueOnce({
        promise: jest.fn().mockRejectedValue({ code: 'ThrottlingException' })
      });

      // Mock second attempt success
      mockPut.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({})
      });

      const result = await writeAssignmentWithRetry(mockAssignment, requestId);
      
      expect(result.success).toBe(true);
      expect(mockPut).toHaveBeenCalledTimes(2);
    });

    it('should handle conditional check failures by generating new ID', async () => {
      // Mock first attempt failure due to duplicate ID
      mockPut.mockReturnValueOnce({
        promise: jest.fn().mockRejectedValue({ code: 'ConditionalCheckFailedException' })
      });

      // Mock second attempt success
      mockPut.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({})
      });

      const result = await writeAssignmentWithRetry(mockAssignment, requestId);
      
      expect(result.success).toBe(true);
      expect(mockPut).toHaveBeenCalledTimes(2);
      expect(mockAssignment.assignmentId).not.toBe('assignment_123'); // Should have new ID
    });

    it('should fail after max retries', async () => {
      // Mock all attempts fail
      mockPut.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('Connection failed'))
      });

      const result = await writeAssignmentWithRetry(mockAssignment, requestId, 2);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to write assignment after 2 attempts');
      expect(mockPut).toHaveBeenCalledTimes(2);
    });

    it('should handle resource not found errors', async () => {
      mockPut.mockReturnValue({
        promise: jest.fn().mockRejectedValue({ code: 'ResourceNotFoundException' })
      });

      const result = await writeAssignmentWithRetry(mockAssignment, requestId);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('DynamoDB table');
      expect(mockPut).toHaveBeenCalledTimes(1);
    });

    it('should handle access denied errors', async () => {
      mockPut.mockReturnValue({
        promise: jest.fn().mockRejectedValue({ code: 'AccessDeniedException' })
      });

      const result = await writeAssignmentWithRetry(mockAssignment, requestId);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Access denied');
      expect(mockPut).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateInstructorStats', () => {
    it('should update instructor statistics successfully', async () => {
      mockUpdate.mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      });

      const result = await updateInstructorStats('inst123', requestId);
      
      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        TableName: expect.any(String),
        Key: { userId: 'inst123' },
        UpdateExpression: expect.stringContaining('totalAssignments')
      }));
    });

    it('should handle instructor not found gracefully', async () => {
      mockUpdate.mockReturnValue({
        promise: jest.fn().mockRejectedValue({ code: 'ConditionalCheckFailedException' })
      });

      const result = await updateInstructorStats('inst123', requestId);
      
      expect(result.success).toBe(true); // Should not fail the operation
    });

    it('should handle other errors', async () => {
      mockUpdate.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      const result = await updateInstructorStats('inst123', requestId);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Database error');
    });
  });

  describe('updateCourseAssignmentCount', () => {
    it('should update course assignment count successfully', async () => {
      mockUpdate.mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      });

      const result = await updateCourseAssignmentCount('CS101', requestId);
      
      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        TableName: expect.any(String),
        Key: { courseId: 'CS101' },
        UpdateExpression: expect.stringContaining('totalAssignments')
      }));
    });

    it('should handle course not found gracefully', async () => {
      mockUpdate.mockReturnValue({
        promise: jest.fn().mockRejectedValue({ code: 'ConditionalCheckFailedException' })
      });

      const result = await updateCourseAssignmentCount('CS101', requestId);
      
      expect(result.success).toBe(true); // Should not fail the operation
    });
  });

  describe('createAuditLog', () => {
    it('should create audit log entry successfully', async () => {
      mockPut.mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      });

      const result = await createAuditLog(mockAssignment, requestId);
      
      expect(result.success).toBe(true);
      expect(mockPut).toHaveBeenCalledWith(expect.objectContaining({
        TableName: expect.any(String),
        Item: expect.objectContaining({
          action: 'CREATE_ASSIGNMENT',
          resourceId: 'assignment_123'
        })
      }));
    });

    it('should handle audit log creation failures gracefully', async () => {
      mockPut.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('Audit table not found'))
      });

      const result = await createAuditLog(mockAssignment, requestId);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Audit table not found');
    });
  });

  describe('batchWriteAssignments', () => {
    const mockAssignments = Array(50).fill(null).map((_, i) => ({
      ...mockAssignment,
      assignmentId: `assignment_${i}`
    }));

    it('should process batch writes successfully', async () => {
      mockBatchWrite.mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      });

      const result = await batchWriteAssignments(mockAssignments, requestId);
      
      expect(result.success).toBe(true);
      expect(mockBatchWrite).toHaveBeenCalledTimes(2); // 50 items / 25 batch size = 2 batches
    });

    it('should handle unprocessed items with retry', async () => {
      // Mock first batch with unprocessed items
      mockBatchWrite.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          UnprocessedItems: {
            [process.env['ASSIGNMENTS_TABLE'] || 'DemoProject-Assignments']: [
              { PutRequest: { Item: mockAssignments[0] } }
            ]
          }
        })
      });

      // Mock retry success
      mockBatchWrite.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({})
      });

      // Mock second batch success
      mockBatchWrite.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({})
      });

      const result = await batchWriteAssignments(mockAssignments, requestId);
      
      expect(result.success).toBe(true);
      expect(mockBatchWrite).toHaveBeenCalledTimes(3);
    });

    it('should handle batch failures gracefully', async () => {
      // Mock first batch success
      mockBatchWrite.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({})
      });

      // Mock second batch failure
      mockBatchWrite.mockReturnValueOnce({
        promise: jest.fn().mockRejectedValue(new Error('Batch write failed'))
      });

      const result = await batchWriteAssignments(mockAssignments, requestId);
      
      expect(result.success).toBe(false);
      expect(result.failedItems).toHaveLength(25); // Second batch failed
    });

    it('should handle empty assignments array', async () => {
      const result = await batchWriteAssignments([], requestId);
      
      expect(result.success).toBe(true);
      expect(mockBatchWrite).not.toHaveBeenCalled();
    });
  });

  describe('retryUnprocessedItems', () => {
    const mockUnprocessedItems = {
      [process.env['ASSIGNMENTS_TABLE'] || 'DemoProject-Assignments']: [
        { PutRequest: { Item: mockAssignment } }
      ]
    };

    it('should retry unprocessed items successfully', async () => {
      // Mock first retry with more unprocessed items
      mockBatchWrite.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          UnprocessedItems: {
            [process.env['ASSIGNMENTS_TABLE'] || 'DemoProject-Assignments']: [
              { PutRequest: { Item: mockAssignment } }
            ]
          }
        })
      });

      // Mock second retry success
      mockBatchWrite.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({})
      });

      const result = await retryUnprocessedItems(mockUnprocessedItems, requestId, 2);
      
      expect(result.success).toBe(true);
      expect(mockBatchWrite).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      // Mock all retries fail
      mockBatchWrite.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('Retry failed'))
      });

      const result = await retryUnprocessedItems(mockUnprocessedItems, requestId, 2);
      
      expect(result.success).toBe(false);
      expect(result.failedItems).toHaveLength(1);
      expect(mockBatchWrite).toHaveBeenCalledTimes(2);
    });

    it('should handle empty unprocessed items', async () => {
      const result = await retryUnprocessedItems({}, requestId);
      
      expect(result.success).toBe(true);
      expect(mockBatchWrite).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle cascading failures gracefully', async () => {
      // Mock primary write failure
      mockPut.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('Primary write failed'))
      });

      const result = await performAssignmentWrite(mockAssignment, requestId);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Primary write failed');
      
      // Verify no other operations were attempted
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should handle mixed success/failure scenarios', async () => {
      // Mock primary write success
      mockPut.mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      });

      // Mock instructor stats success
      mockUpdate.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({})
      });

      // Mock course update failure
      mockUpdate.mockReturnValueOnce({
        promise: jest.fn().mockRejectedValue(new Error('Course update failed'))
      });

      // Mock audit log success
      mockPut.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({})
      });

      const result = await performAssignmentWrite(mockAssignment, requestId);
      
      expect(result.success).toBe(true); // Should succeed despite course update failure
      expect(mockPut).toHaveBeenCalledTimes(2); // Primary write + audit log
      expect(mockUpdate).toHaveBeenCalledTimes(2); // Both attempts
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large batch operations efficiently', async () => {
      const largeAssignments = Array(1000).fill(null).map((_, i) => ({
        ...mockAssignment,
        assignmentId: `assignment_${i}`
      }));

      mockBatchWrite.mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      });

      const startTime = Date.now();
      const result = await batchWriteAssignments(largeAssignments, requestId);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(mockBatchWrite).toHaveBeenCalledTimes(40); // 1000 / 25 = 40 batches
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should implement exponential backoff for retries', async () => {
      jest.useFakeTimers();

      // Mock throttling errors
      mockPut.mockReturnValue({
        promise: jest.fn().mockRejectedValue({ code: 'ThrottlingException' })
      });

      const retryPromise = writeAssignmentWithRetry(mockAssignment, requestId, 3);

      // Fast-forward through retries
      jest.advanceTimersByTime(1000); // First retry
      jest.advanceTimersByTime(2000); // Second retry
      jest.advanceTimersByTime(4000); // Third retry

      jest.useRealTimers();

      const result = await retryPromise;
      expect(result.success).toBe(false);
      expect(mockPut).toHaveBeenCalledTimes(3);
    });
  });
});

