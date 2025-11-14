import { handler } from '../create-assignment';
import { DynamoDB } from 'aws-sdk';
import { verifyJwtToken } from '../jwt-verifier';

// Mock AWS SDK
jest.mock('aws-sdk');
const mockDynamoDB = DynamoDB as jest.MockedClass<typeof DynamoDB>;

// Mock JWT verifier
jest.mock('../jwt-verifier');
const mockVerifyJwtToken = verifyJwtToken as jest.MockedFunction<typeof verifyJwtToken>;

describe('Create Assignment Handler', () => {
  let mockDynamoClient: any;
  let mockPut: jest.Mock;
  let mockGet: jest.Mock;
  let mockQuery: jest.Mock;
  let mockScan: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup DynamoDB mocks
    mockPut = jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({}) });
    mockGet = jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({}) });
    mockQuery = jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({ Items: [] }) });
    mockScan = jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({ Items: [] }) });

    mockDynamoClient = {
      put: mockPut,
      get: mockGet,
      query: mockQuery,
      scan: mockScan
    };

    // Mock DynamoDB constructor
    mockDynamoDB.mockImplementation(() => mockDynamoClient as any);
  });

  const mockAuthenticatedUser = {
    sub: 'user123',
    email: 'instructor@example.com',
    isInstructor: true,
    isAdmin: false,
    instructorId: 'inst123',
    department: 'Computer Science'
  };

  const validAssignmentData = {
    title: 'Introduction to Algorithms',
    description: 'A comprehensive introduction to fundamental algorithms and data structures',
    courseId: 'CS101',
    type: 'project' as const,
    points: 100,
    weight: 15,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    startDate: new Date().toISOString(),
    allowLateSubmission: true,
    latePenalty: 10,
    maxSubmissions: 3,
    allowedFileTypes: ['pdf', 'docx', 'zip'],
    maxFileSize: 10485760, // 10MB
    individualSubmission: true,
    autoGrade: false,
    peerReview: true,
    requirements: [
      'Implement at least 3 sorting algorithms',
      'Provide time complexity analysis',
      'Include unit tests for all functions'
    ],
    instructions: 'Create a comprehensive implementation of sorting algorithms with proper documentation and testing.',
    rubric: {
      criteria: [
        {
          name: 'Implementation',
          description: 'Correct implementation of algorithms',
          maxPoints: 40,
          weight: 40
        },
        {
          name: 'Documentation',
          description: 'Clear and comprehensive documentation',
          maxPoints: 30,
          weight: 30
        },
        {
          name: 'Testing',
          description: 'Thorough unit test coverage',
          maxPoints: 30,
          weight: 30
        }
      ],
      totalPoints: 100
    }
  };

  describe('Authentication and Authorization', () => {
    it('should return 401 for missing JWT token', async () => {
      mockVerifyJwtToken.mockResolvedValue({
        success: false,
        error: 'No token provided'
      });

      const event = {
        body: JSON.stringify(validAssignmentData),
        headers: {}
      } as any;

      const result = await handler(event, {} as any, {} as any);

      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body)).toMatchObject({
        success: false,
        error: 'Unauthorized'
      });
    });

    it('should return 403 for non-instructor users', async () => {
      mockVerifyJwtToken.mockResolvedValue({
        success: true,
        user: {
          ...mockAuthenticatedUser,
          isInstructor: false,
          isAdmin: false
        }
      });

      const event = {
        body: JSON.stringify(validAssignmentData),
        headers: { Authorization: 'Bearer valid-token' }
      } as any;

      const result = await handler(event, {} as any, {} as any);

      expect(result.statusCode).toBe(403);
      expect(JSON.parse(result.body)).toMatchObject({
        success: false,
        error: 'Forbidden'
      });
    });

    it('should allow admin users to create assignments', async () => {
      mockVerifyJwtToken.mockResolvedValue({
        success: true,
        user: {
          ...mockAuthenticatedUser,
          isInstructor: false,
          isAdmin: true
        }
      });

      // Mock course access check
      mockGet.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: { courseId: 'CS101', instructorId: 'inst123' }
        })
      });

      const event = {
        body: JSON.stringify(validAssignmentData),
        headers: { Authorization: 'Bearer valid-token' }
      } as any;

      const result = await handler(event, {} as any, {} as any);

      expect(result.statusCode).toBe(201);
    });
  });

  describe('Input Validation', () => {
    beforeEach(() => {
      mockVerifyJwtToken.mockResolvedValue({
        success: true,
        user: mockAuthenticatedUser
      });

      // Mock course access check
      mockGet.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: { courseId: 'CS101', instructorId: 'inst123' }
        })
      });
    });

    it('should validate required fields', async () => {
      const invalidData = {
        title: '', // Empty title
        description: 'Too short', // Less than 10 characters
        courseId: 'CS101',
        type: 'project',
        points: 100,
        weight: 15,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        startDate: new Date().toISOString(),
        allowLateSubmission: true,
        maxSubmissions: 3,
        allowedFileTypes: ['pdf'],
        maxFileSize: 10485760,
        individualSubmission: true,
        autoGrade: false,
        peerReview: true,
        requirements: ['Requirement 1']
      };

      const event = {
        body: JSON.stringify(invalidData),
        headers: { Authorization: 'Bearer valid-token' }
      } as any;

      const result = await handler(event, {} as any, {} as any);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.details.errors).toHaveLength(2); // title and description errors
    });

    it('should validate date constraints', async () => {
      const invalidData = {
        ...validAssignmentData,
        startDate: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 2 years ago
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      };

      const event = {
        body: JSON.stringify(invalidData),
        headers: { Authorization: 'Bearer valid-token' }
      } as any;

      const result = await handler(event, {} as any, {} as any);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
    });

    it('should validate rubric consistency', async () => {
      const invalidData = {
        ...validAssignmentData,
        rubric: {
          criteria: [
            {
              name: 'Implementation',
              description: 'Correct implementation of algorithms',
              maxPoints: 40,
              weight: 30
            },
            {
              name: 'Documentation',
              description: 'Clear and comprehensive documentation',
              maxPoints: 30,
              weight: 40
            }
          ],
          totalPoints: 100 // Should be 70
        }
      };

      const event = {
        body: JSON.stringify(invalidData),
        headers: { Authorization: 'Bearer valid-token' }
      } as any;

      const result = await handler(event, {} as any, {} as any);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
    });

    it('should validate file type restrictions', async () => {
      const invalidData = {
        ...validAssignmentData,
        allowedFileTypes: [] // Empty array
      };

      const event = {
        body: JSON.stringify(invalidData),
        headers: { Authorization: 'Bearer valid-token' }
      } as any;

      const result = await handler(event, {} as any, {} as any);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
    });
  });

  describe('Business Logic Validation', () => {
    beforeEach(() => {
      mockVerifyJwtToken.mockResolvedValue({
        success: true,
        user: mockAuthenticatedUser
      });

      // Mock course access check
      mockGet.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: { courseId: 'CS101', instructorId: 'inst123' }
        })
      });
    });

    it('should validate instructor file size limits', async () => {
      const invalidData = {
        ...validAssignmentData,
        maxFileSize: 104857600 // 100MB - exceeds instructor limit
      };

      const event = {
        body: JSON.stringify(invalidData),
        headers: { Authorization: 'Bearer valid-token' }
      } as any;

      const result = await handler(event, {} as any, {} as any);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('50MB');
    });

    it('should validate late submission settings', async () => {
      const invalidData = {
        ...validAssignmentData,
        allowLateSubmission: true,
        latePenalty: undefined // Missing late penalty
      };

      const event = {
        body: JSON.stringify(invalidData),
        headers: { Authorization: 'Bearer valid-token' }
      } as any;

      const result = await handler(event, {} as any, {} as any);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
    });
  });

  describe('Duplicate Prevention', () => {
    beforeEach(() => {
      mockVerifyJwtToken.mockResolvedValue({
        success: true,
        user: mockAuthenticatedUser
      });

      // Mock course access check
      mockGet.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: { courseId: 'CS101', instructorId: 'inst123' }
        })
      });
    });

    it('should prevent duplicate assignment titles in the same course', async () => {
      // Mock duplicate check finding existing assignment
      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [{ assignmentId: 'existing123', title: 'Introduction to Algorithms' }]
        })
      });

      const event = {
        body: JSON.stringify(validAssignmentData),
        headers: { Authorization: 'Bearer valid-token' }
      } as any;

      const result = await handler(event, {} as any, {} as any);

      expect(result.statusCode).toBe(409);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('Conflict');
    });
  });

  describe('Successful Assignment Creation', () => {
    beforeEach(() => {
      mockVerifyJwtToken.mockResolvedValue({
        success: true,
        user: mockAuthenticatedUser
      });

      // Mock course access check
      mockGet.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: { courseId: 'CS101', instructorId: 'inst123' }
        })
      });

      // Mock successful DynamoDB operations
      mockPut.mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      });
    });

    it('should create assignment successfully with valid data', async () => {
      const event = {
        body: JSON.stringify(validAssignmentData),
        headers: { Authorization: 'Bearer valid-token' }
      } as any;

      const result = await handler(event, {} as any, {} as any);

      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.data.assignmentId).toBeDefined();
      expect(body.data.title).toBe(validAssignmentData.title);
      expect(body.data.status).toBe('draft');
      expect(body.data.version).toBe(1);
      expect(body.data.tags).toBeDefined();
    });

    it('should include generated metadata', async () => {
      const event = {
        body: JSON.stringify(validAssignmentData),
        headers: { Authorization: 'Bearer valid-token' }
      } as any;

      const result = await handler(event, {} as any, {} as any);

      const body = JSON.parse(result.body);
      expect(body.data.durationDays).toBeDefined();
      expect(body.data.searchableText).toBeDefined();
      expect(body.data.tags).toContain('type:project');
      expect(body.data.tags).toContain('difficulty:hard');
      expect(body.data.tags).toContain('submission:individual');
    });
  });

  describe('Error Handling', () => {
    it('should handle DynamoDB errors gracefully', async () => {
      mockVerifyJwtToken.mockResolvedValue({
        success: true,
        user: mockAuthenticatedUser
      });

      // Mock course access check
      mockGet.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: { courseId: 'CS101', instructorId: 'inst123' }
        })
      });

      // Mock DynamoDB error
      mockPut.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('DynamoDB connection failed'))
      });

      const event = {
        body: JSON.stringify(validAssignmentData),
        headers: { Authorization: 'Bearer valid-token' }
      } as any;

      const result = await handler(event, {} as any, {} as any);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('Failed to create assignment');
    });

    it('should handle malformed JSON gracefully', async () => {
      mockVerifyJwtToken.mockResolvedValue({
        success: true,
        user: mockAuthenticatedUser
      });

      const event = {
        body: 'invalid json {',
        headers: { Authorization: 'Bearer valid-token' }
      } as any;

      const result = await handler(event, {} as any, {} as any);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('Invalid JSON');
    });
  });

  describe('Request Tracking', () => {
    it('should include request ID in all responses', async () => {
      mockVerifyJwtToken.mockResolvedValue({
        success: true,
        user: mockAuthenticatedUser
      });

      // Mock course access check
      mockGet.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: { courseId: 'CS101', instructorId: 'inst123' }
        })
      });

      const event = {
        body: JSON.stringify(validAssignmentData),
        headers: { Authorization: 'Bearer valid-token' }
      } as any;

      const result = await handler(event, {} as any, {} as any);

      const body = JSON.parse(result.body);
      expect(body.data.requestId).toBeDefined();
      expect(body.data.requestId).toMatch(/^req_\d+_[a-z0-9]+$/);
    });
  });
});
