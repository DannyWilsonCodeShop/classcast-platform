// Mock AWS SDK before importing the handler
const mockQuery = jest.fn().mockReturnValue({
  promise: jest.fn().mockResolvedValue({
    Items: [],
    Count: 0
  })
});

const mockGet = jest.fn().mockReturnValue({
  promise: jest.fn().mockResolvedValue({
    Item: null
  })
});

const mockGetSignedUrlPromise = jest.fn().mockResolvedValue('https://example.com/temp-video-url');

jest.mock('aws-sdk', () => ({
  DynamoDB: {
    DocumentClient: jest.fn().mockImplementation(() => ({
      query: mockQuery,
      get: mockGet
    }))
  },
  S3: jest.fn().mockImplementation(() => ({
    getSignedUrlPromise: mockGetSignedUrlPromise
  }))
}));

// Mock JWT verifier
jest.mock('../jwt-verifier', () => ({
  verifyJwtToken: jest.fn()
}));

import { verifyJwtToken } from '../jwt-verifier';
import { handler } from '../fetch-submissions';

// Mock user objects
const mockStudentUser = {
  sub: 'student123',
  role: 'student',
  name: 'John Student'
};

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

// Helper function to create mock events
const createMockEvent = (queryParams: Record<string, string> = {}, user: any = mockStudentUser) => ({
  headers: {
    Authorization: `Bearer valid-token-${user.sub}`
  },
  queryStringParameters: queryParams,
  httpMethod: 'GET',
  path: '/submissions',
  body: null,
  isBase64Encoded: false,
  multiValueHeaders: {},
  multiValueQueryStringParameters: {},
  pathParameters: {},
  stageVariables: {},
  requestContext: {} as any,
  resource: ''
});

// Mock submission data
const mockSubmissions = [
  {
    assignmentId: 'assignment123',
    userId: 'student123',
    courseId: 'CS101',
    status: 'completed',
    submittedAt: '2024-01-01T00:00:00Z',
    processedAt: '2024-01-01T01:00:00Z',
    grade: 85,
    feedback: 'Good work!',
    thumbnailUrls: ['https://example.com/thumb1.jpg'],
    videoDuration: 120,
    videoResolution: { width: 1920, height: 1080 },
    processingDuration: 5000,
    retryCount: 0,
    metadata: {
      s3Key: 'CS101/assignment123/student123/1704067200000_video.mp4'
    }
  },
  {
    assignmentId: 'assignment456',
    userId: 'student123',
    courseId: 'CS101',
    status: 'processing',
    submittedAt: '2024-01-02T00:00:00Z',
    retryCount: 0,
    metadata: {}
  }
];

// Mock assignment data
const mockAssignments = {
  assignment123: {
    assignmentId: 'assignment123',
    title: 'Introduction to Programming',
    courseId: 'CS101',
    instructorId: 'instructor456'
  },
  assignment456: {
    assignmentId: 'assignment456',
    title: 'Data Structures',
    courseId: 'CS101',
    instructorId: 'instructor456'
  }
};

// Mock user data
const mockUsers = {
  student123: {
    userId: 'student123',
    name: 'John Student',
    role: 'student'
  },
  instructor456: {
    userId: 'instructor456',
    name: 'Dr. Smith',
    role: 'instructor'
  }
};

describe('Fetch Submissions Lambda Function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock implementations
    mockQuery.mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Items: mockSubmissions,
        Count: mockSubmissions.length
      })
    });
    
    mockGet.mockReturnValue({
      promise: jest.fn().mockResolvedValue({ Item: null })
    });
    
    mockGetSignedUrlPromise.mockResolvedValue('https://example.com/temp-video-url');
    
          // Mock JWT verification
      (verifyJwtToken as jest.Mock).mockResolvedValue({
        success: true,
        user: mockStudentUser
      });
  });

  describe('Authentication and Authorization', () => {
    it('should reject requests without authorization header', async () => {
      const mockEvent = createMockEvent({}, mockStudentUser);
      (mockEvent.headers as any).Authorization = undefined;

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(401);
      expect(JSON.parse(response?.body || '{}')).toMatchObject({
        success: false,
        error: { message: 'Missing or invalid authorization header' }
      });
    });

    it('should reject requests with invalid token format', async () => {
      const mockEvent = createMockEvent({}, mockStudentUser);
      mockEvent.headers.Authorization = 'InvalidToken';

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(401);
      expect(JSON.parse(response?.body || '{}')).toMatchObject({
        success: false,
        error: { message: 'Missing or invalid authorization header' }
      });
    });

    it('should reject requests with expired tokens', async () => {
      const mockEvent = createMockEvent({}, mockStudentUser);
      (verifyJwtToken as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Token expired',
        statusCode: 401
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(401);
      expect(JSON.parse(response?.body || '{}')).toMatchObject({
        success: false,
        error: { message: 'Token expired' }
      });
    });

    it('should allow students to access their own submissions', async () => {
      const mockEvent = createMockEvent({ studentId: 'student123' }, mockStudentUser);
      
      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [mockSubmissions[0]],
          Count: 1
        })
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
      expect(body.data.submissions).toHaveLength(1);
    });

    it('should prevent students from accessing other students submissions', async () => {
      const mockEvent = createMockEvent({ studentId: 'other-student' }, mockStudentUser);

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(403);
      expect(JSON.parse(response?.body || '{}')).toMatchObject({
        success: false,
        error: { message: 'Students can only access their own submissions' }
      });
    });

    it('should allow instructors to access course submissions', async () => {
      const mockEvent = createMockEvent({ courseId: 'CS101' }, mockInstructorUser);
      
      // Mock instructor course access check
      mockQuery.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Items: [{ assignmentId: 'assignment123', instructorId: 'instructor456' }],
          Count: 1
        })
      }).mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Items: mockSubmissions,
          Count: mockSubmissions.length
        })
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
    });

    it('should allow admins full access', async () => {
      const mockEvent = createMockEvent({}, mockAdminUser);
      (verifyJwtToken as jest.Mock).mockResolvedValue({
        success: true,
        user: mockAdminUser
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
    });
  });

  describe('Query Parameter Validation', () => {
    it('should validate and parse query parameters correctly', async () => {
      const mockEvent = createMockEvent({
        page: '2',
        limit: '10',
        status: 'completed',
        hasGrade: 'true',
        sortBy: 'grade',
        sortOrder: 'desc'
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.data.filters.applied).toMatchObject({
        status: 'completed',
        hasGrade: true,
        sortBy: 'grade',
        sortOrder: 'desc'
      });
      // Note: page and limit are not included in filters.applied as they are pagination parameters
    });

    it('should reject invalid page numbers', async () => {
      const mockEvent = createMockEvent({ page: '0' });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(400);
      expect(JSON.parse(response?.body || '{}')).toMatchObject({
        success: false,
        error: { message: expect.stringContaining('Invalid parameters') }
      });
    });

    it('should reject invalid limit values', async () => {
      const mockEvent = createMockEvent({ limit: '150' });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(400);
      expect(JSON.parse(response?.body || '{}')).toMatchObject({
        success: false,
        error: { message: expect.stringContaining('Invalid parameters') }
      });
    });

    it('should reject invalid status values', async () => {
      const mockEvent = createMockEvent({ status: 'invalid-status' });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(400);
      expect(JSON.parse(response?.body || '{}')).toMatchObject({
        success: false,
        error: { message: expect.stringContaining('Invalid parameters') }
      });
    });

    it('should handle multiple statuses', async () => {
      const mockEvent = createMockEvent({
        statuses: 'completed,failed'
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.data.filters.applied.statuses).toEqual(['completed', 'failed']);
    });

    it('should validate grade range parameters', async () => {
      const mockEvent = createMockEvent({
        gradeRange: JSON.stringify({ min: 80, max: 100 })
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.data.filters.applied.gradeRange).toEqual({ min: 80, max: 100 });
    });

    it('should reject invalid grade range values', async () => {
      const mockEvent = createMockEvent({
        gradeRange: JSON.stringify({ min: -10, max: 150 })
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(400);
      expect(JSON.parse(response?.body || '{}')).toMatchObject({
        success: false,
        error: { message: expect.stringContaining('Invalid parameters') }
      });
    });
  });

  describe('DynamoDB Query Building', () => {
    it('should build query with assignment ID filter', async () => {
      const mockEvent = createMockEvent({ assignmentId: 'assignment123' });

      await handler(mockEvent as any, {} as any, () => {});

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          KeyConditionExpression: 'assignmentId = :assignmentId AND userId = :userId',
          ExpressionAttributeValues: expect.objectContaining({
            ':assignmentId': 'assignment123',
            ':userId': 'student123'
          })
        })
      );
    });

    it('should build query with student ID filter', async () => {
      const mockEvent = createMockEvent({ studentId: 'student123' });

      await handler(mockEvent as any, {} as any, () => {});

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: expect.objectContaining({
            ':userId': 'student123'
          })
        })
      );
    });

    it('should build query with both assignment and student ID', async () => {
      const mockEvent = createMockEvent({
        assignmentId: 'assignment123',
        studentId: 'student123'
      });

      await handler(mockEvent as any, {} as any, () => {});

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          KeyConditionExpression: 'assignmentId = :assignmentId AND userId = :userId',
          ExpressionAttributeValues: expect.objectContaining({
            ':assignmentId': 'assignment123',
            ':userId': 'student123'
          })
        })
      );
    });

    it('should add filter expressions for status', async () => {
      const mockEvent = createMockEvent({ status: 'completed' });

      await handler(mockEvent as any, {} as any, () => {});

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          FilterExpression: expect.stringContaining('#status = :status'),
          ExpressionAttributeNames: expect.objectContaining({
            '#status': 'status'
          }),
          ExpressionAttributeValues: expect.objectContaining({
            ':status': 'completed'
          })
        })
      );
    });

    it('should add filter expressions for course ID', async () => {
      const mockEvent = createMockEvent({ courseId: 'CS101' });

      await handler(mockEvent as any, {} as any, () => {});

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          FilterExpression: expect.stringContaining('courseId = :courseId'),
          ExpressionAttributeValues: expect.objectContaining({
            ':courseId': 'CS101'
          })
        })
      );
    });

    it('should add filter expressions for grade existence', async () => {
      const mockEvent = createMockEvent({ hasGrade: 'true' });

      await handler(mockEvent as any, {} as any, () => {});

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          FilterExpression: expect.stringContaining('attribute_exists(grade)')
        })
      );
    });

    it('should add filter expressions for grade range', async () => {
      const mockEvent = createMockEvent({
        gradeRange: JSON.stringify({ min: 80, max: 100 })
      });

      await handler(mockEvent as any, {} as any, () => {});

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          FilterExpression: expect.stringContaining('#grade >= :minGrade'),
          ExpressionAttributeNames: expect.objectContaining({
            '#grade': 'grade'
          }),
          ExpressionAttributeValues: expect.objectContaining({
            ':minGrade': 80,
            ':maxGrade': 100
          })
        })
      );
    });
  });

  describe('Data Enrichment', () => {
    it('should enrich submissions with assignment details', async () => {
      const mockEvent = createMockEvent({});
      
      // Mock assignment lookups for both submissions
      mockGet.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: mockAssignments.assignment123
        })
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      // Check that at least one submission was enriched
      const enrichedSubmission = body.data.submissions.find((s: any) => s.assignmentTitle === 'Introduction to Programming');
      expect(enrichedSubmission).toBeDefined();
    });

    it('should enrich submissions with student details', async () => {
      const mockEvent = createMockEvent({});
      
      mockGet.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: mockUsers.student123
        })
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.data.submissions[0].studentName).toBe('John Student');
    });

    it('should handle missing assignment details gracefully', async () => {
      const mockEvent = createMockEvent({});
      
      mockGet.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: null
        })
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.data.submissions[0].assignmentTitle).toBe('Unknown Assignment');
    });

    it('should handle missing student details gracefully', async () => {
      const mockEvent = createMockEvent({});
      
      mockGet.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: null
        })
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.data.submissions[0].studentName).toBe('Unknown Student');
    });
  });

  describe('Video URL Generation', () => {
    it('should generate temporary video URLs when requested', async () => {
      const mockEvent = createMockEvent({
        includeVideoUrls: 'true',
        videoUrlExpiry: '1800'
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      
      // Check that completed submissions have video URLs
      const completedSubmission = body.data.submissions.find((s: any) => s.status === 'completed');
      expect(completedSubmission.videoUrl).toBeDefined();
      expect(completedSubmission.videoUrlExpiry).toBeDefined();
      
      // Check that processing submissions don't have video URLs
      const processingSubmission = body.data.submissions.find((s: any) => s.status === 'processing');
      expect(processingSubmission.videoUrl).toBeUndefined();
    });

    it('should use default video URL expiry when not specified', async () => {
      const mockEvent = createMockEvent({
        includeVideoUrls: 'true'
      });

      await handler(mockEvent as any, {} as any, () => {});

      expect(mockGetSignedUrlPromise).toHaveBeenCalledWith(
        'getObject',
        expect.objectContaining({
          Expires: 900 // 15 minutes default
        })
      );
    });

    it('should handle video URL generation errors gracefully', async () => {
      const mockEvent = createMockEvent({
        includeVideoUrls: 'true'
      });

      mockGetSignedUrlPromise.mockRejectedValueOnce(new Error('S3 error'));

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      // Should still return submissions even if video URL generation fails
      const body = JSON.parse(response?.body || '{}');
      expect(body.data.submissions).toHaveLength(2);
    });
  });

  describe('Sorting and Pagination', () => {
    it('should sort results by submitted date in descending order by default', async () => {
      const mockEvent = createMockEvent({});

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      const submissions = body.data.submissions;
      
      // Should be sorted by submittedAt desc (newest first)
      expect(new Date(submissions[0].submittedAt).getTime())
        .toBeGreaterThan(new Date(submissions[1].submittedAt).getTime());
    });

    it('should sort results by grade in ascending order', async () => {
      const mockEvent = createMockEvent({
        sortBy: 'grade',
        sortOrder: 'asc'
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      const submissions = body.data.submissions;
      
      // Should be sorted by grade asc (lowest first)
      expect(submissions[0].grade || 0).toBeLessThanOrEqual(submissions[1].grade || 0);
    });

    it('should apply pagination correctly', async () => {
      const mockEvent = createMockEvent({
        page: '1',
        limit: '1'
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      
      expect(body.data.submissions).toHaveLength(1);
      expect(body.data.pagination).toMatchObject({
        currentPage: 1,
        totalPages: 2,
        totalItems: 2,
        itemsPerPage: 1,
        hasNextPage: true,
        hasPreviousPage: false
      });
    });

    it('should handle empty result sets', async () => {
      const mockEvent = createMockEvent({});
      
      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [],
          Count: 0
        })
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      
      expect(body.data.submissions).toHaveLength(0);
      expect(body.data.pagination).toMatchObject({
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: 20,
        hasNextPage: false,
        hasPreviousPage: false
      });
    });
  });

  describe('Filter Summary', () => {
    it('should build comprehensive filter summary', async () => {
      const mockEvent = createMockEvent({
        studentId: 'student123',
        courseId: 'CS101',
        status: 'completed',
        hasGrade: 'true',
        gradeRange: JSON.stringify({ min: 80, max: 100 }),
        submittedAfter: '2024-01-01T00:00:00Z'
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      
      expect(body.data.filters.summary).toContain('Student: student123');
      expect(body.data.filters.summary).toContain('Course: CS101');
      expect(body.data.filters.summary).toContain('Status: completed');
      expect(body.data.filters.summary).toContain('Has Grade: true');
      expect(body.data.filters.summary).toContain('Grade Range: ≥80 ≤100');
      expect(body.data.filters.summary).toContain('Submitted After: 2024-01-01T00:00:00Z');
    });

    it('should show student filter when no explicit filters are set for students', async () => {
      const mockEvent = createMockEvent({});

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      
      // For students, studentId is automatically set
      expect(body.data.filters.summary).toContain('Student: student123');
    });
  });

  describe('Error Handling', () => {
    it('should handle DynamoDB query errors gracefully', async () => {
      const mockEvent = createMockEvent({});
      
      mockQuery.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('DynamoDB error'))
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(500);
      expect(JSON.parse(response?.body || '{}')).toMatchObject({
        success: false,
        error: { message: 'Internal server error' }
      });
    });

    it('should handle DynamoDB get errors gracefully', async () => {
      const mockEvent = createMockEvent({});
      
      mockGet.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('DynamoDB get error'))
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      // Should still return submissions even if enrichment fails
      const body = JSON.parse(response?.body || '{}');
      expect(body.data.submissions).toHaveLength(2);
    });

    it('should continue processing if individual submission enrichment fails', async () => {
      const mockEvent = createMockEvent({});
      
      // First assignment lookup succeeds, second fails
      mockGet.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: mockAssignments.assignment123
        })
      }).mockReturnValueOnce({
        promise: jest.fn().mockRejectedValue(new Error('Assignment lookup failed'))
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      
      // Should still return both submissions
      expect(body.data.submissions).toHaveLength(2);
      // First should be enriched, second should have fallback values
      expect(body.data.submissions[0].assignmentTitle).toBe('Introduction to Programming');
      expect(body.data.submissions[1].assignmentTitle).toBe('Unknown Assignment');
    });
  });

  describe('Response Format', () => {
    it('should include request ID in response', async () => {
      const mockEvent = createMockEvent({});

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      
      expect(body.requestId).toMatch(/^fetch_\d+_[a-z0-9]+$/);
      expect(body.timestamp).toBeDefined();
    });

    it('should include CORS headers', async () => {
      const mockEvent = createMockEvent({});

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.headers).toMatchObject({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,OPTIONS'
      });
    });

    it('should format submission data correctly', async () => {
      const mockEvent = createMockEvent({});
      
      mockGet.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: mockAssignments.assignment123
        })
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      // Find the completed submission (should be the one with assignment123)
      const completedSubmission = body.data.submissions.find((s: any) => s.assignmentId === 'assignment123');
      expect(completedSubmission).toBeDefined();
      
      expect(completedSubmission).toMatchObject({
        submissionId: 'assignment123_student123',
        assignmentId: 'assignment123',
        courseId: 'CS101',
        studentId: 'student123',
        status: 'completed',
        grade: 85,
        feedback: 'Good work!',
        thumbnailUrls: ['https://example.com/thumb1.jpg'],
        videoDuration: 120,
        videoResolution: { width: 1920, height: 1080 },
        processingDuration: 5000,
        retryCount: 0
      });
    });
  });
});
