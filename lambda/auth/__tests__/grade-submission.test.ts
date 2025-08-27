// Mock AWS SDK before importing the handler
const mockGet = jest.fn().mockReturnValue({
  promise: jest.fn().mockResolvedValue({
    Item: null
  })
});

const mockUpdate = jest.fn().mockReturnValue({
  promise: jest.fn().mockResolvedValue({})
});

jest.mock('aws-sdk', () => ({
  DynamoDB: {
    DocumentClient: jest.fn().mockImplementation(() => ({
      get: mockGet,
      update: mockUpdate
    }))
  }
}));

// Mock JWT verifier
jest.mock('../jwt-verifier', () => ({
  verifyJwtToken: jest.fn()
}));

import { verifyJwtToken } from '../jwt-verifier';
import { handler } from '../grade-submission';

// Mock user objects
const mockInstructorUser = {
  sub: 'instructor456',
  role: 'instructor',
  name: 'Dr. Smith'
};

const mockAdminUser = {
  sub: 'admin789',
  role: 'admin',
  name: 'Admin User'
};

const mockStudentUser = {
  sub: 'student123',
  role: 'student',
  name: 'John Student'
};

// Helper function to create mock events
const createMockEvent = (body: any, user: any = mockInstructorUser) => ({
  headers: {
    Authorization: `Bearer valid-token-${user.sub}`
  },
  body: JSON.stringify(body),
  httpMethod: 'POST',
  path: '/grade-submission',
  queryStringParameters: null,
  pathParameters: null,
  stageVariables: null,
  requestContext: {} as any,
  resource: '',
  multiValueHeaders: {},
  multiValueQueryStringParameters: {},
  isBase64Encoded: false
});

// Mock submission data
const mockSubmission = {
  assignmentId: 'assignment123',
  userId: 'student123',
  courseId: 'CS101',
  status: 'completed',
  submittedAt: '2024-01-01T00:00:00Z',
  processedAt: '2024-01-01T01:00:00Z',
  retryCount: 0,
  metadata: {}
};

// Mock assignment data
const mockAssignment = {
  assignmentId: 'assignment123',
  title: 'Introduction to Programming',
  courseId: 'CS101',
  instructorId: 'instructor456'
};

describe('Grade Submission Lambda Function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock implementations
    mockGet.mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Item: mockSubmission
      })
    });
    
    mockUpdate.mockReturnValue({
      promise: jest.fn().mockResolvedValue({})
    });
    
    // Mock JWT verification
    (verifyJwtToken as jest.Mock).mockResolvedValue({
      success: true,
      user: mockInstructorUser
    });
  });

  describe('Authentication and Authorization', () => {
    it('should reject requests without authorization header', async () => {
      const mockEvent = createMockEvent({}, mockInstructorUser);
      (mockEvent.headers as any).Authorization = undefined;

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(401);
      expect(JSON.parse(response?.body || '{}')).toMatchObject({
        success: false,
        error: { 
          message: 'Missing or invalid authorization header',
          code: 401
        }
      });
    });

    it('should reject requests with invalid token format', async () => {
      const mockEvent = createMockEvent({}, mockInstructorUser);
      mockEvent.headers.Authorization = 'InvalidToken';

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(401);
      expect(JSON.parse(response?.body || '{}')).toMatchObject({
        success: false,
        error: { 
          message: 'Missing or invalid authorization header',
          code: 401
        }
      });
    });

    it('should reject requests with expired tokens', async () => {
      const mockEvent = createMockEvent({}, mockInstructorUser);
      (verifyJwtToken as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Token expired',
        statusCode: 401
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(401);
      expect(JSON.parse(response?.body || '{}')).toMatchObject({
        success: false,
        error: { 
          message: 'Token expired',
          code: 401
        }
      });
    });

    it('should allow instructors to grade submissions', async () => {
      const mockEvent = createMockEvent({
        submissionId: 'submission123',
        assignmentId: 'assignment123',
        studentId: 'student123',
        grade: 85,
        feedback: 'Excellent work!'
      }, mockInstructorUser);

      // Mock assignment access check
      mockGet.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: mockAssignment
        })
      }).mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: mockSubmission
        })
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
      expect(body.data.grade).toBe(85);
    });

    it('should reject students from grading submissions', async () => {
      const mockEvent = createMockEvent({
        submissionId: 'submission123',
        assignmentId: 'assignment123',
        studentId: 'student123',
        grade: 85,
        feedback: 'Good work!'
      }, mockStudentUser);

      (verifyJwtToken as jest.Mock).mockResolvedValue({
        success: true,
        user: mockStudentUser
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(403);
      expect(JSON.parse(response?.body || '{}')).toMatchObject({
        success: false,
        error: { 
          message: 'Only instructors and admins can grade submissions',
          code: 403
        }
      });
    });

    it('should allow admins to grade submissions', async () => {
      const mockEvent = createMockEvent({
        submissionId: 'submission123',
        assignmentId: 'assignment123',
        studentId: 'student123',
        grade: 85,
        feedback: 'Good work!'
      }, mockAdminUser);

      (verifyJwtToken as jest.Mock).mockResolvedValue({
        success: true,
        user: mockAdminUser
      });

      // Mock assignment access check - admins don't need assignment access check
      mockGet.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: mockSubmission
        })
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
      expect(body.data.grade).toBe(85);
    });

    it('should validate instructor assignment access', async () => {
      const mockEvent = createMockEvent({
        submissionId: 'submission123',
        assignmentId: 'assignment123',
        studentId: 'student123',
        grade: 85,
        feedback: 'Good work!'
      }, mockInstructorUser);

      // Mock assignment access check to fail
      mockGet.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: null // Assignment not found
        })
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(403);
      expect(JSON.parse(response?.body || '{}')).toMatchObject({
        success: false,
        error: { 
          message: 'Instructor does not have access to this assignment',
          code: 403
        }
      });
    });
  });

  describe('Input Validation', () => {
    it('should reject missing required fields', async () => {
      const mockEvent = createMockEvent({
        submissionId: 'submission123',
        // Missing assignmentId, studentId, grade, feedback
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(400);
      expect(JSON.parse(response?.body || '{}')).toMatchObject({
        success: false,
        error: { 
          message: expect.stringContaining('Invalid parameters'),
          code: 400
        }
      });
    });

    it('should reject invalid grade values', async () => {
      const mockEvent = createMockEvent({
        submissionId: 'submission123',
        assignmentId: 'assignment123',
        studentId: 'student123',
        grade: 150, // Invalid grade > 100
        feedback: 'Good work!'
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(400);
      expect(JSON.parse(response?.body || '{}')).toMatchObject({
        success: false,
        error: { 
          message: expect.stringContaining('Invalid parameters'),
          code: 400
        }
      });
    });

    it('should reject negative grade values', async () => {
      const mockEvent = createMockEvent({
        submissionId: 'submission123',
        assignmentId: 'assignment123',
        studentId: 'student123',
        grade: -10, // Invalid negative grade
        feedback: 'Good work!'
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(400);
      expect(JSON.parse(response?.body || '{}')).toMatchObject({
        success: false,
        error: { 
          message: expect.stringContaining('Number must be greater than or equal to 0'),
          code: 400
        }
      });
    });

    it('should reject empty feedback', async () => {
      const mockEvent = createMockEvent({
        submissionId: 'submission123',
        assignmentId: 'assignment123',
        studentId: 'student123',
        grade: 85,
        feedback: '' // Empty feedback
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(400);
      expect(JSON.parse(response?.body || '{}')).toMatchObject({
        success: false,
        error: { 
          message: expect.stringContaining('Invalid parameters'),
          code: 400
        }
      });
    });

    it('should reject overly long feedback', async () => {
      const mockEvent = createMockEvent({
        submissionId: 'submission123',
        assignmentId: 'assignment123',
        studentId: 'student123',
        grade: 85,
        feedback: 'A'.repeat(2001) // Feedback too long
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(400);
      expect(JSON.parse(response?.body || '{}')).toMatchObject({
        success: false,
        error: { 
          message: expect.stringContaining('Invalid parameters'),
          code: 400
        }
      });
    });

    it('should validate rubric scores', async () => {
      const mockEvent = createMockEvent({
        submissionId: 'submission123',
        assignmentId: 'assignment123',
        studentId: 'student123',
        grade: 85,
        feedback: 'Good work!',
        rubricScores: [
          {
            criterion: 'Code Quality',
            score: 42,
            maxScore: 50,
            comments: 'Well-structured code'
          },
          {
            criterion: 'Functionality',
            score: 43,
            maxScore: 50,
            comments: 'All requirements met'
          }
        ]
      });

      // Mock assignment access check
      mockGet.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: mockAssignment
        })
      }).mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: mockSubmission
        })
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
      expect(body.data.totalRubricScore).toBe(85);
      expect(body.data.maxRubricScore).toBe(100);
    });

    it('should reject invalid rubric scores', async () => {
      const mockEvent = createMockEvent({
        submissionId: 'submission123',
        assignmentId: 'assignment123',
        studentId: 'student123',
        grade: 85,
        feedback: 'Good work!',
        rubricScores: [
          {
            criterion: 'Code Quality',
            score: 60, // Score exceeds maxScore
            maxScore: 50,
            comments: 'Well-structured code'
          }
        ]
      });

      // Mock assignment access check
      mockGet.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: mockAssignment
        })
      }).mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: mockSubmission
        })
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(400);
      expect(JSON.parse(response?.body || '{}')).toMatchObject({
        success: false,
        error: { 
          message: 'Rubric scores must align with overall grade (within 5 points)',
          code: 400
        }
      });
    });

    it('should validate resubmission deadline', async () => {
      const mockEvent = createMockEvent({
        submissionId: 'submission123',
        assignmentId: 'assignment123',
        studentId: 'student123',
        grade: 85,
        feedback: 'Good work!',
        allowResubmission: true,
        resubmissionDeadline: '2024-01-01T00:00:00Z' // Past date
      });

      // Mock assignment access check
      mockGet.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: mockAssignment
        })
      }).mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: mockSubmission
        })
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(400);
      expect(JSON.parse(response?.body || '{}')).toMatchObject({
        success: false,
        error: { 
          message: 'Resubmission deadline must be in the future',
          code: 400
        }
      });
    });
  });

  describe('Submission Validation', () => {
    it('should reject grading of non-existent submissions', async () => {
      const mockEvent = createMockEvent({
        submissionId: 'submission123',
        assignmentId: 'assignment123',
        studentId: 'student123',
        grade: 85,
        feedback: 'Good work!'
      });

      // Mock assignment access check
      mockGet.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: mockAssignment
        })
      }).mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: null // Submission not found
        })
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(400);
      expect(JSON.parse(response?.body || '{}')).toMatchObject({
        success: false,
        error: { message: 'Submission not found' }
      });
    });

    it('should reject grading of non-gradable submissions', async () => {
      const mockEvent = createMockEvent({
        submissionId: 'submission123',
        assignmentId: 'assignment123',
        studentId: 'student123',
        grade: 85,
        feedback: 'Good work!'
      });

      // Mock assignment access check
      mockGet.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: mockAssignment
        })
      }).mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: {
            ...mockSubmission,
            status: 'pending' // Non-gradable status
          }
        })
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(400);
      expect(JSON.parse(response?.body || '{}')).toMatchObject({
        success: false,
        error: { message: "Submission status 'pending' is not gradable. Only completed submissions can be graded." }
      });
    });

    it('should reject grading of already graded submissions', async () => {
      const mockEvent = createMockEvent({
        submissionId: 'submission123',
        assignmentId: 'assignment123',
        studentId: 'student123',
        grade: 85,
        feedback: 'Good work!'
      });

      // Mock assignment access check
      mockGet.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: mockAssignment
        })
      }).mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: {
            ...mockSubmission,
            grade: 90, // Already graded
            gradedBy: 'other-instructor'
          }
        })
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(400);
      expect(JSON.parse(response?.body || '{}')).toMatchObject({
        success: false,
        error: { message: 'Submission has already been graded' }
      });
    });
  });

  describe('Successful Grading', () => {
    it('should successfully grade a submission', async () => {
      const mockEvent = createMockEvent({
        submissionId: 'submission123',
        assignmentId: 'assignment123',
        studentId: 'student123',
        grade: 85,
        feedback: 'Good work!'
      });

      // Mock assignment access check
      mockGet.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: mockAssignment
        })
      }).mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: mockSubmission
        })
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        submissionId: 'submission123',
        assignmentId: 'assignment123',
        studentId: 'student123',
        grade: 85,
        feedback: 'Good work!',
        gradedBy: 'instructor456',
        allowResubmission: false
      });
    });

    it('should successfully grade with rubric scores', async () => {
      const mockEvent = createMockEvent({
        submissionId: 'submission123',
        assignmentId: 'assignment123',
        studentId: 'student123',
        grade: 85,
        feedback: 'Good work!',
        rubricScores: [
          {
            criterion: 'Code Quality',
            score: 42,
            maxScore: 50,
            comments: 'Well-structured code'
          },
          {
            criterion: 'Functionality',
            score: 43,
            maxScore: 50,
            comments: 'All requirements met'
          }
        ]
      });

      // Mock assignment access check
      mockGet.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: mockAssignment
        })
      }).mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: mockSubmission
        })
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
      expect(body.data.rubricScores).toHaveLength(2);
      expect(body.data.totalRubricScore).toBe(85);
      expect(body.data.maxRubricScore).toBe(100);
    });

    it('should handle optional fields correctly', async () => {
      const mockEvent = createMockEvent({
        submissionId: 'submission123',
        assignmentId: 'assignment123',
        studentId: 'student123',
        grade: 85,
        feedback: 'Good work!',
        gradingNotes: 'Student showed good understanding',
        allowResubmission: true,
        resubmissionDeadline: '2025-12-31T23:59:59Z' // Use future date
      });

      // Mock assignment access check
      mockGet.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: mockAssignment
        })
      }).mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: mockSubmission
        })
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
      expect(body.data.gradingNotes).toBe('Student showed good understanding');
      expect(body.data.allowResubmission).toBe(true);
      expect(body.data.resubmissionDeadline).toBe('2025-12-31T23:59:59Z');
    });
  });

  describe('Optimistic Locking and DynamoDB Operations', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      (verifyJwtToken as jest.Mock).mockResolvedValue({
        success: true,
        user: mockInstructorUser
      });
    });

    it('should handle version conflicts gracefully with retry logic', async () => {
      const mockEvent = createMockEvent({
        submissionId: 'sub123',
        assignmentId: 'assign123',
        studentId: 'student123',
        grade: 85,
        feedback: 'Great work!'
      });

      // Mock getSubmission to return a submission with version
      mockGet.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: mockAssignment
        })
      }).mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: {
            assignmentId: 'assign123',
            userId: 'student123',
            status: 'completed',
            version: 5
          }
        })
      });

      // Mock update to fail with version conflict, then succeed
      mockUpdate.mockReturnValueOnce({
        promise: jest.fn().mockRejectedValue({
          code: 'ConditionalCheckFailedException',
          message: 'The conditional request failed'
        })
      }).mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({})
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      expect(JSON.parse(response?.body || '{}')).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            submissionId: 'sub123'
          })
        })
      );

      // Verify retry logic was used
      expect(mockUpdate).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries for version conflicts', async () => {
      const mockEvent = createMockEvent({
        submissionId: 'sub123',
        assignmentId: 'assign123',
        studentId: 'student123',
        grade: 85,
        feedback: 'Great work!'
      });

      // Mock assignment access check
      mockGet.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: mockAssignment
        })
      }).mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: {
            assignmentId: 'assign123',
            userId: 'student123',
            status: 'completed',
            version: 5
          }
        })
      });

      // Mock update to always fail with version conflict
      mockUpdate.mockReturnValue({
        promise: jest.fn().mockRejectedValue({
          code: 'ConditionalCheckFailedException',
          message: 'The conditional request failed'
        })
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(500);
      expect(JSON.parse(response?.body || '{}')).toEqual(
        expect.objectContaining({
          success: false,
          error: {
            message: 'Submission was modified by another process. Please refresh and try again.',
            code: 500
          }
        })
      );

      // Verify retry logic was used (3 attempts)
      expect(mockUpdate).toHaveBeenCalledTimes(3);
    });

    it('should handle DynamoDB throughput exceeded errors with retry', async () => {
      const mockEvent = createMockEvent({
        submissionId: 'sub123',
        assignmentId: 'assign123',
        studentId: 'student123',
        grade: 85,
        feedback: 'Great work!'
      });

      // Mock assignment access check
      mockGet.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: mockAssignment
        })
      }).mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: {
            assignmentId: 'assign123',
            userId: 'student123',
            status: 'completed'
          }
        })
      });

      // Mock update to fail with throughput exceeded, then succeed
      mockUpdate.mockReturnValueOnce({
        promise: jest.fn().mockRejectedValue({
          code: 'ProvisionedThroughputExceededException',
          message: 'Rate exceeded'
        })
      }).mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({})
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      expect(JSON.parse(response?.body || '{}')).toEqual(
        expect.objectContaining({
          success: true
        })
      );

      // Verify retry logic was used
      expect(mockUpdate).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries for throughput exceeded', async () => {
      const mockEvent = createMockEvent({
        submissionId: 'sub123',
        assignmentId: 'assign123',
        studentId: 'student123',
        grade: 85,
        feedback: 'Great work!'
      });

      // Mock assignment access check
      mockGet.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: mockAssignment
        })
      }).mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: {
            assignmentId: 'assign123',
            userId: 'student123',
            status: 'completed'
          }
        })
      });

      // Mock update to always fail with throughput exceeded
      mockUpdate.mockReturnValue({
        promise: jest.fn().mockRejectedValue({
          code: 'ProvisionedThroughputExceededException',
          message: 'Rate exceeded'
        })
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(500);
      expect(JSON.parse(response?.body || '{}')).toEqual(
        expect.objectContaining({
          success: false,
          error: {
            message: 'Database temporarily unavailable. Please try again later.',
            code: 500
          }
        })
      );

      // Verify retry logic was used (3 attempts)
      expect(mockUpdate).toHaveBeenCalledTimes(3);
    });

    it('should include version and lastModified in DynamoDB update', async () => {
      const mockEvent = createMockEvent({
        submissionId: 'sub123',
        assignmentId: 'assign123',
        studentId: 'student123',
        grade: 85,
        feedback: 'Great work!'
      });

      // Mock assignment access check
      mockGet.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: mockAssignment
        })
      }).mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: {
            assignmentId: 'assign123',
            userId: 'student123',
            status: 'completed',
            version: 0 // Start with version 0
          }
        })
      });

      mockUpdate.mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      });

      await handler(mockEvent as any, {} as any, () => {});

      // Verify the update parameters include version and lastModified
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          UpdateExpression: expect.stringContaining('version = :newVersion, lastModified = :lastModified'),
          ConditionExpression: 'attribute_not_exists(grade) AND (attribute_not_exists(version) OR version = :currentVersion)',
          ExpressionAttributeValues: expect.objectContaining({
            ':currentVersion': 0,
            ':newVersion': 1,
            ':lastModified': expect.any(String)
          })
        })
      );
    });

    it('should handle submission not found during update gracefully', async () => {
      const mockEvent = createMockEvent({
        submissionId: 'sub123',
        assignmentId: 'assign123',
        studentId: 'student123',
        grade: 85,
        feedback: 'Great work!'
      });

      // Mock assignment access check
      mockGet.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: mockAssignment
        })
      }).mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: {
            assignmentId: 'assign123',
            userId: 'student123',
            status: 'completed'
          }
        })
      }).mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: null // No item found during update
        })
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(500);
      expect(JSON.parse(response?.body || '{}')).toEqual(
        expect.objectContaining({
          success: false,
          error: {
            message: 'Submission not found during update',
            code: 500
          }
        })
      );
    });

    it('should detect if submission was already graded by another process', async () => {
      const mockEvent = createMockEvent({
        submissionId: 'sub123',
        assignmentId: 'assign123',
        studentId: 'student123',
        grade: 85,
        feedback: 'Great work!'
      });

      // Mock assignment access check
      mockGet.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: mockAssignment
        })
      }).mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: {
            assignmentId: 'assign123',
            userId: 'student123',
            status: 'completed'
          }
        })
      }).mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: {
            assignmentId: 'assign123',
            userId: 'student123',
            status: 'completed',
            grade: 90, // Already graded by another process
            gradedBy: 'other-instructor'
          }
        })
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(500);
      expect(JSON.parse(response?.body || '{}')).toEqual(
        expect.objectContaining({
          success: false,
          error: {
            message: 'Submission has already been graded by another process',
            code: 500
          }
        })
      );
    });

    it('should handle other DynamoDB errors without retry', async () => {
      const mockEvent = createMockEvent({
        submissionId: 'sub123',
        assignmentId: 'assign123',
        studentId: 'student123',
        grade: 85,
        feedback: 'Great work!'
      });

      // Mock assignment access check
      mockGet.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: mockAssignment
        })
      }).mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: {
            assignmentId: 'assign123',
            userId: 'student123',
            status: 'completed'
          }
        })
      });

      // Mock update to fail with a different error
      mockUpdate.mockReturnValue({
        promise: jest.fn().mockRejectedValue({
          code: 'ResourceNotFoundException',
          message: 'Table not found'
        })
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(500);
      expect(JSON.parse(response?.body || '{}')).toEqual(
        expect.objectContaining({
          success: false,
          error: {
            message: 'Failed to update submission grade',
            code: 500
          }
        })
      );

      // Verify no retry for non-retryable errors
      expect(mockUpdate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Response Format', () => {
    it('should include CORS headers', async () => {
      const mockEvent = createMockEvent({
        submissionId: 'submission123',
        assignmentId: 'assignment123',
        studentId: 'student123',
        grade: 85,
        feedback: 'Good work!'
      }, mockInstructorUser);

      // Mock assignment access check
      mockGet.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: mockAssignment
        })
      }).mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: mockSubmission
        })
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.headers).toMatchObject({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      });
    });

    it('should include request ID and timestamp', async () => {
      const mockEvent = createMockEvent({
        submissionId: 'submission123',
        assignmentId: 'assignment123',
        studentId: 'student123',
        grade: 85,
        feedback: 'Good work!'
      }, mockInstructorUser);

      // Mock assignment access check
      mockGet.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: mockAssignment
        })
      }).mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: mockSubmission
        })
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.requestId).toMatch(/^grade_\d+_[a-z0-9]+$/);
      expect(body.timestamp).toBeDefined();
    });
  });
});
