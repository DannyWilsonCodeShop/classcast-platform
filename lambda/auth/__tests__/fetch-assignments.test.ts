import { handler } from '../fetch-assignments';
import { DynamoDB } from 'aws-sdk';
import { verifyJwtToken } from '../jwt-verifier';

// Mock dependencies
jest.mock('../jwt-verifier');
jest.mock('aws-sdk');

const mockVerifyJwtToken = verifyJwtToken as jest.MockedFunction<typeof verifyJwtToken>;
const mockDynamoDB = DynamoDB as jest.MockedClass<typeof DynamoDB>;

describe('Fetch Assignments Handler', () => {
  let mockDynamoClient: any;
  let mockQuery: jest.Mock;
  let mockGet: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockQuery = jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({ Items: [] }) });
    mockGet = jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({ Item: {} }) });

    mockDynamoClient = {
      query: mockQuery,
      get: mockGet
    };

    // Mock the DocumentClient constructor
    mockDynamoDB.DocumentClient = jest.fn().mockImplementation(() => mockDynamoClient);
  });

  const mockAuthenticatedUser = {
    sub: 'user123',
    email: 'instructor@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'instructor',
    department: 'Computer Science',
    studentId: undefined,
    instructorId: 'inst123',
    groups: ['instructors'],
    isStudent: false,
    isInstructor: true,
    isAdmin: false,
    lastLogin: '2024-01-01T00:00:00.000Z',
    preferences: {},
    tokenUse: 'access',
    scope: 'openid profile email',
    authTime: 1704067200,
    exp: 1704153600,
    iat: 1704067200
  };

  const mockAdminUser = {
    sub: 'admin123',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    department: 'Administration',
    studentId: undefined,
    instructorId: undefined,
    groups: ['admins'],
    isStudent: false,
    isInstructor: false,
    isAdmin: true,
    lastLogin: '2024-01-01T00:00:00.000Z',
    preferences: {},
    tokenUse: 'access',
    scope: 'openid profile email',
    authTime: 1704067200,
    exp: 1704153600,
    iat: 1704067200
  };

  const mockStudentUser = {
    sub: 'student123',
    email: 'student@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'student',
    department: 'Computer Science',
    studentId: 'STU123',
    instructorId: undefined,
    groups: ['students'],
    isStudent: true,
    isInstructor: false,
    isAdmin: false,
    lastLogin: '2024-01-01T00:00:00.000Z',
    preferences: {},
    tokenUse: 'access',
    scope: 'openid profile email',
    authTime: 1704067200,
    exp: 1704153600,
    iat: 1704067200
  };

  const createMockEvent = (queryParams: any = {}) => ({
    queryStringParameters: queryParams,
    headers: {
      Authorization: 'Bearer mock-token'
    },
    body: null,
    multiValueHeaders: {},
    httpMethod: 'GET',
    isBase64Encoded: false,
    path: '/assignments',
    pathParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: ''
  });

  describe('Authentication and Authorization', () => {
    it('should return 401 for missing JWT token', async () => {
      mockVerifyJwtToken.mockResolvedValue({
        success: false,
        error: 'No JWT token provided'
      });

      const event = createMockEvent();
      const response = await handler(event, {} as any, {} as any);

      expect(response?.statusCode).toBe(401);
      expect(JSON.parse(response?.body || '{}')).toEqual(
        expect.objectContaining({
          success: false,
          error: 'Unauthorized'
        })
      );
    });

    it('should allow instructors to fetch assignments', async () => {
      mockVerifyJwtToken.mockResolvedValue({
        success: true,
        user: mockAuthenticatedUser
      });

      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [
            {
              assignmentId: 'assignment_1',
              title: 'Test Assignment',
              courseId: 'CS101',
              status: 'published'
            }
          ]
        })
      });

      const event = createMockEvent({ courseId: 'CS101' });
      const response = await handler(event, {} as any, {} as any);

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
      expect(body.data.assignments).toHaveLength(1);
    });

    it('should allow admins to fetch all assignments', async () => {
      mockVerifyJwtToken.mockResolvedValue({
        success: true,
        user: mockAdminUser
      });

      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [
            {
              assignmentId: 'assignment_1',
              title: 'Test Assignment',
              courseId: 'CS101',
              status: 'draft'
            }
          ]
        })
      });

      const event = createMockEvent();
      const response = await handler(event, {} as any, {} as any);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.assignments).toHaveLength(1);
    });

    it('should require course ID for students', async () => {
      mockVerifyJwtToken.mockResolvedValue({
        success: true,
        user: mockStudentUser
      });

      const event = createMockEvent(); // No courseId
      const response = await handler(event, {} as any, {} as any);

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.details.code).toBe('COURSE_ID_REQUIRED');
    });

    it('should allow students to fetch assignments for enrolled courses', async () => {
      mockVerifyJwtToken.mockResolvedValue({
        success: true,
        user: mockStudentUser
      });

      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [
            {
              assignmentId: 'assignment_1',
              title: 'Test Assignment',
              courseId: 'CS101',
              status: 'published'
            }
          ]
        })
      });

      const event = createMockEvent({ courseId: 'CS101' });
      const response = await handler(event, {} as any, {} as any);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.assignments).toHaveLength(1);
    });
  });

  describe('Query Parameter Validation', () => {
    beforeEach(() => {
      mockVerifyJwtToken.mockResolvedValue({
        success: true,
        user: mockAuthenticatedUser
      });
    });

    it('should validate valid query parameters', async () => {
      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Items: [] })
      });

      const event = createMockEvent({
        courseId: 'CS101',
        status: 'published',
        type: 'essay',
        page: '1',
        limit: '20'
      });

      const response = await handler(event, {} as any, {} as any);
      expect(response.statusCode).toBe(200);
    });

    it('should reject invalid status values', async () => {
      const event = createMockEvent({
        courseId: 'CS101',
        status: 'invalid_status'
      });

      const response = await handler(event, {} as any, {} as any);
      expect(response.statusCode).toBe(400);
      
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.details.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'status',
            message: expect.stringContaining('status')
          })
        ])
      );
    });

    it('should reject invalid page numbers', async () => {
      const event = createMockEvent({
        courseId: 'CS101',
        page: '0'
      });

      const response = await handler(event, {} as any, {} as any);
      expect(response.statusCode).toBe(400);
      
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.details.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'page',
            message: expect.stringContaining('page')
          })
        ])
      );
    });

    it('should reject invalid limit values', async () => {
      const event = createMockEvent({
        courseId: 'CS101',
        limit: '150'
      });

      const response = await handler(event, {} as any, {} as any);
      expect(response.statusCode).toBe(400);
      
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.details.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'limit',
            message: expect.stringContaining('limit')
          })
        ])
      );
    });

    it('should parse boolean parameters correctly', async () => {
      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Items: [] })
      });

      const event = createMockEvent({
        courseId: 'CS101',
        includeStats: 'true',
        includeSubmissions: 'false'
      });

      const response = await handler(event, {} as any, {} as any);
      expect(response.statusCode).toBe(200);
    });

    it('should parse array parameters correctly', async () => {
      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Items: [] })
      });

      const event = createMockEvent({
        courseId: 'CS101',
        tags: 'essay,writing,academic'
      });

      const response = await handler(event, {} as any, {} as any);
      expect(response.statusCode).toBe(200);
    });

    it('should parse week number parameter correctly', async () => {
      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Items: [] })
      });

      const event = createMockEvent({
        courseId: 'CS101',
        weekNumber: '26'
      });

      const response = await handler(event, {} as any, {} as any);
      expect(response.statusCode).toBe(200);
    });

    it('should parse multiple statuses parameter correctly', async () => {
      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Items: [] })
      });

      const event = createMockEvent({
        courseId: 'CS101',
        statuses: 'published,active'
      });

      const response = await handler(event, {} as any, {} as any);
      expect(response.statusCode).toBe(200);
    });

    it('should parse week start and end parameters correctly', async () => {
      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Items: [] })
      });

      const event = createMockEvent({
        courseId: 'CS101',
        weekStart: '2024-06-24T00:00:00.000Z',
        weekEnd: '2024-06-30T23:59:59.999Z'
      });

      const response = await handler(event, {} as any, {} as any);
      expect(response.statusCode).toBe(200);
    });
  });

  describe('Access Control Validation', () => {
    beforeEach(() => {
      mockVerifyJwtToken.mockResolvedValue({
        success: true,
        user: mockAuthenticatedUser
      });
    });

    it('should allow instructors to access their own courses', async () => {
      mockGet.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: {
            courseId: 'CS101',
            instructorId: 'inst123',
            department: 'Computer Science'
          }
        })
      });

      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Items: [] })
      });

      const event = createMockEvent({ courseId: 'CS101' });
      const response = await handler(event, {} as any, {} as any);

      expect(response.statusCode).toBe(200);
    });

    it('should allow instructors to access courses in their department', async () => {
      mockGet.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: {
            courseId: 'CS101',
            instructorId: 'inst456',
            department: 'Computer Science'
          }
        })
      });

      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Items: [] })
      });

      const event = createMockEvent({ courseId: 'CS101' });
      const response = await handler(event, {} as any, {} as any);

      expect(response.statusCode).toBe(200);
    });

    it('should deny instructors access to unrelated courses', async () => {
      mockGet.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: {
            courseId: 'CS101',
            instructorId: 'inst456',
            department: 'Mathematics'
          }
        })
      });

      const event = createMockEvent({ courseId: 'CS101' });
      const response = await handler(event, {} as any, {} as any);

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.details.code).toBe('COURSE_ACCESS_DENIED');
    });

    it('should prevent instructors from viewing other instructors\' assignments', async () => {
      const event = createMockEvent({ instructorId: 'inst456' });
      const response = await handler(event, {} as any, {} as any);

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.details.code).toBe('INSTRUCTOR_MISMATCH');
    });
  });

  describe('DynamoDB Query Operations', () => {
    beforeEach(() => {
      mockVerifyJwtToken.mockResolvedValue({
        success: true,
        user: mockAuthenticatedUser
      });
    });

    it('should use CourseStatusIndex when courseId is specified', async () => {
      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Items: [] })
      });

      const event = createMockEvent({ courseId: 'CS101' });
      await handler(event, {} as any, {} as any);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          IndexName: 'CourseStatusIndex',
          KeyConditionExpression: 'courseId = :courseId'
        })
      );
    });

    it('should use InstructorCreatedIndex when instructorId is specified', async () => {
      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Items: [] })
      });

      const event = createMockEvent({ instructorId: 'inst123' });
      await handler(event, {} as any, {} as any);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          IndexName: 'InstructorCreatedIndex',
          KeyConditionExpression: 'instructorId = :instructorId'
        })
      );
    });

    it('should handle pagination with LastEvaluatedKey', async () => {
      mockQuery.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Items: Array(100).fill({ assignmentId: 'test' }),
          LastEvaluatedKey: { assignmentId: 'last_key' }
        })
      }).mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Items: Array(50).fill({ assignmentId: 'test2' })
        })
      });

      const event = createMockEvent({ courseId: 'CS101' });
      const response = await handler(event, {} as any, {} as any);

      expect(response.statusCode).toBe(200);
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('should handle DynamoDB ResourceNotFoundException', async () => {
      mockQuery.mockReturnValue({
        promise: jest.fn().mockRejectedValue({ code: 'ResourceNotFoundException' })
      });

      const event = createMockEvent({ courseId: 'CS101' });
      const response = await handler(event, {} as any, {} as any);

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.details.error).toContain('DynamoDB table');
    });

    it('should handle DynamoDB AccessDeniedException', async () => {
      mockQuery.mockReturnValue({
        promise: jest.fn().mockRejectedValue({ code: 'AccessDeniedException' })
      });

      const event = createMockEvent({ courseId: 'CS101' });
      const response = await handler(event, {} as any, {} as any);

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.details.error).toContain('Access denied');
    });
  });

  describe('Filtering and Sorting', () => {
    beforeEach(() => {
      mockVerifyJwtToken.mockResolvedValue({
        success: true,
        user: mockAuthenticatedUser
      });

      const mockAssignments = [
        {
          assignmentId: 'assignment_1',
          title: 'Essay Assignment',
          type: 'essay',
          points: 100,
          dueDate: '2024-12-31T23:59:59.000Z',
          individualSubmission: true,
          autoGrade: false,
          tags: ['essay', 'writing'],
          searchableText: 'essay assignment writing skills'
        },
        {
          assignmentId: 'assignment_2',
          title: 'Quiz Assignment',
          type: 'quiz',
          points: 50,
          dueDate: '2024-11-30T23:59:59.000Z',
          individualSubmission: true,
          autoGrade: true,
          tags: ['quiz', 'testing'],
          searchableText: 'quiz assignment testing knowledge'
        }
      ];

      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Items: mockAssignments })
      });
    });

    it('should filter by assignment type', async () => {
      const event = createMockEvent({ courseId: 'CS101', type: 'essay' });
      const response = await handler(event, {} as any, {} as any);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.assignments).toHaveLength(1);
      expect(body.data.assignments[0].type).toBe('essay');
    });

    it('should filter by due date range', async () => {
      const event = createMockEvent({
        courseId: 'CS101',
        dueDateFrom: '2024-11-01T00:00:00.000Z',
        dueDateTo: '2024-12-01T00:00:00.000Z'
      });
      const response = await handler(event, {} as any, {} as any);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.assignments).toHaveLength(1);
      expect(body.data.assignments[0].assignmentId).toBe('assignment_2');
    });

    it('should filter by difficulty level', async () => {
      const event = createMockEvent({ courseId: 'CS101', difficulty: 'easy' });
      const response = await handler(event, {} as any, {} as any);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.assignments).toHaveLength(1);
      expect(body.data.assignments[0].assignmentId).toBe('assignment_2');
    });

    it('should filter by submission type', async () => {
      const event = createMockEvent({ courseId: 'CS101', submissionType: 'individual' });
      const response = await handler(event, {} as any, {} as any);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.assignments).toHaveLength(2);
    });

    it('should filter by grading type', async () => {
      const event = createMockEvent({ courseId: 'CS101', gradingType: 'auto' });
      const response = await handler(event, {} as any, {} as any);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.assignments).toHaveLength(1);
      expect(body.data.assignments[0].assignmentId).toBe('assignment_2');
    });

    it('should filter by tags', async () => {
      const event = createMockEvent({ courseId: 'CS101', tags: 'essay,writing' });
      const response = await handler(event, {} as any, {} as any);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.assignments).toHaveLength(1);
      expect(body.data.assignments[0].assignmentId).toBe('assignment_1');
    });

    it('should filter by search term', async () => {
      const event = createMockEvent({ courseId: 'CS101', search: 'essay' });
      const response = await handler(event, {} as any, {} as any);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.assignments).toHaveLength(1);
      expect(body.data.assignments[0].assignmentId).toBe('assignment_1');
    });

    it('should sort assignments by due date ascending', async () => {
      const event = createMockEvent({ courseId: 'CS101', sortBy: 'dueDate', sortOrder: 'asc' });
      const response = await handler(event, {} as any, {} as any);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.assignments[0].assignmentId).toBe('assignment_2'); // Earlier due date
      expect(body.data.assignments[1].assignmentId).toBe('assignment_1'); // Later due date
    });

    it('should sort assignments by title descending', async () => {
      const event = createMockEvent({ courseId: 'CS101', sortBy: 'title', sortOrder: 'desc' });
      const response = await handler(event, {} as any, {} as any);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.assignments[0].title).toBe('Quiz Assignment');
      expect(body.data.assignments[1].title).toBe('Essay Assignment');
    });

    it('should filter by week number', async () => {
      // Create assignments with specific due dates for week 26 (June 24-30, 2024)
      const mockAssignmentsWithWeek = [
        {
          assignmentId: 'assignment_1',
          title: 'Week 26 Assignment',
          type: 'essay',
          points: 100,
          dueDate: '2024-06-25T23:59:59.000Z', // Tuesday of week 26
          individualSubmission: true,
          autoGrade: false,
          tags: ['essay', 'writing'],
          searchableText: 'week 26 essay assignment'
        },
        {
          assignmentId: 'assignment_2',
          title: 'Other Week Assignment',
          type: 'quiz',
          points: 50,
          dueDate: '2024-07-15T23:59:59.000Z', // Different week
          individualSubmission: true,
          autoGrade: true,
          tags: ['quiz', 'testing'],
          searchableText: 'other week quiz assignment'
        }
      ];

      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Items: mockAssignmentsWithWeek })
      });

      const event = createMockEvent({ courseId: 'CS101', weekNumber: '26' });
      const response = await handler(event, {} as any, {} as any);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.assignments).toHaveLength(1);
      expect(body.data.assignments[0].assignmentId).toBe('assignment_1');
      expect(body.data.assignments[0].title).toBe('Week 26 Assignment');
    });

    it('should filter by multiple statuses', async () => {
      const mockAssignmentsWithStatuses = [
        {
          assignmentId: 'assignment_1',
          title: 'Published Assignment',
          type: 'essay',
          points: 100,
          dueDate: '2024-12-31T23:59:59.000Z',
          status: 'published',
          individualSubmission: true,
          autoGrade: false,
          tags: ['essay', 'writing'],
          searchableText: 'published essay assignment'
        },
        {
          assignmentId: 'assignment_2',
          title: 'Active Assignment',
          type: 'quiz',
          points: 50,
          dueDate: '2024-11-30T23:59:59.000Z',
          status: 'active',
          individualSubmission: true,
          autoGrade: true,
          tags: ['quiz', 'testing'],
          searchableText: 'active quiz assignment'
        },
        {
          assignmentId: 'assignment_3',
          title: 'Draft Assignment',
          type: 'project',
          points: 150,
          dueDate: '2025-01-15T23:59:59.000Z',
          status: 'draft',
          individualSubmission: true,
          autoGrade: false,
          tags: ['project', 'development'],
          searchableText: 'draft project assignment'
        }
      ];

      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Items: mockAssignmentsWithStatuses })
      });

      const event = createMockEvent({ courseId: 'CS101', statuses: 'published,active' });
      const response = await handler(event, {} as any, {} as any);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.assignments).toHaveLength(2);
      expect(body.data.assignments.map((a: any) => a.status)).toEqual(['published', 'active']);
    });

    it('should filter by week start and end dates', async () => {
      const mockAssignmentsWithWeekDates = [
        {
          assignmentId: 'assignment_1',
          title: 'Week Start Assignment',
          type: 'essay',
          points: 100,
          dueDate: '2024-06-24T12:00:00.000Z', // Monday of week 26
          individualSubmission: true,
          autoGrade: false,
          tags: ['essay', 'writing'],
          searchableText: 'week start essay assignment'
        },
        {
          assignmentId: 'assignment_2',
          title: 'Week End Assignment',
          type: 'quiz',
          points: 50,
          dueDate: '2024-06-30T18:00:00.000Z', // Sunday of week 26
          individualSubmission: true,
          autoGrade: true,
          tags: ['quiz', 'testing'],
          searchableText: 'week end quiz assignment'
        },
        {
          assignmentId: 'assignment_3',
          title: 'Outside Week Assignment',
          type: 'project',
          points: 150,
          dueDate: '2024-07-05T23:59:59.000Z', // Outside week 26
          individualSubmission: true,
          autoGrade: false,
          tags: ['project', 'development'],
          searchableText: 'outside week project assignment'
        }
      ];

      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Items: mockAssignmentsWithWeekDates })
      });

      const event = createMockEvent({
        courseId: 'CS101',
        weekStart: '2024-06-24T00:00:00.000Z',
        weekEnd: '2024-06-30T23:59:59.999Z'
      });
      const response = await handler(event, {} as any, {} as any);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.assignments).toHaveLength(2);
      expect(body.data.assignments.map((a: any) => a.assignmentId)).toEqual(['assignment_1', 'assignment_2']);
    });

    it('should prioritize multiple statuses over single status', async () => {
      const mockAssignmentsWithStatuses = [
        {
          assignmentId: 'assignment_1',
          title: 'Published Assignment',
          type: 'essay',
          points: 100,
          dueDate: '2024-12-31T23:59:59.000Z',
          status: 'published',
          individualSubmission: true,
          autoGrade: false,
          tags: ['essay', 'writing'],
          searchableText: 'published essay assignment'
        },
        {
          assignmentId: 'assignment_2',
          title: 'Active Assignment',
          type: 'quiz',
          points: 50,
          dueDate: '2024-11-30T23:59:59.000Z',
          status: 'active',
          individualSubmission: true,
          autoGrade: true,
          tags: ['quiz', 'testing'],
          searchableText: 'active quiz assignment'
        }
      ];

      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Items: mockAssignmentsWithStatuses })
      });

      // When both status and statuses are provided, statuses should take precedence
      const event = createMockEvent({
        courseId: 'CS101',
        status: 'draft',
        statuses: 'published,active'
      });
      const response = await handler(event, {} as any, {} as any);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.assignments).toHaveLength(2);
      expect(body.data.assignments.map((a: any) => a.status)).toEqual(['published', 'active']);
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      mockVerifyJwtToken.mockResolvedValue({
        success: true,
        user: mockAuthenticatedUser
      });

      const mockAssignments = Array(100).fill(null).map((_, i) => ({
        assignmentId: `assignment_${i}`,
        title: `Assignment ${i}`,
        courseId: 'CS101'
      }));

      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Items: mockAssignments })
      });
    });

    it('should apply default pagination (page 1, limit 20)', async () => {
      const event = createMockEvent({ courseId: 'CS101' });
      const response = await handler(event, {} as any, {} as any);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.assignments).toHaveLength(20);
      expect(body.data.pagination.currentPage).toBe(1);
      expect(body.data.pagination.pageSize).toBe(20);
      expect(body.data.pagination.totalCount).toBe(100);
      expect(body.data.pagination.totalPages).toBe(5);
    });

    it('should apply custom pagination parameters', async () => {
      const event = createMockEvent({ courseId: 'CS101', page: '3', limit: '15' });
      const response = await handler(event, {} as any, {} as any);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.assignments).toHaveLength(15);
      expect(body.data.pagination.currentPage).toBe(3);
      expect(body.data.pagination.pageSize).toBe(15);
      expect(body.data.pagination.hasNextPage).toBe(true);
      expect(body.data.pagination.hasPreviousPage).toBe(true);
    });

    it('should handle last page correctly', async () => {
      const event = createMockEvent({ courseId: 'CS101', page: '5', limit: '20' });
      const response = await handler(event, {} as any, {} as any);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.pagination.hasNextPage).toBe(false);
      expect(body.data.pagination.hasPreviousPage).toBe(true);
    });

    it('should handle first page correctly', async () => {
      const event = createMockEvent({ courseId: 'CS101', page: '1', limit: '20' });
      const response = await handler(event, {} as any, {} as any);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.pagination.hasPreviousPage).toBe(false);
      expect(body.data.pagination.hasNextPage).toBe(true);
    });
  });

  describe('Assignment Enrichment', () => {
    beforeEach(() => {
      mockVerifyJwtToken.mockResolvedValue({
        success: true,
        user: mockAuthenticatedUser
      });

      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [
            {
              assignmentId: 'assignment_1',
              title: 'Test Assignment',
              courseId: 'CS101'
            }
          ]
        })
      });

      mockGet.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: {
            courseId: 'CS101',
            courseName: 'Introduction to Computer Science',
            department: 'Computer Science',
            instructorName: 'Dr. Smith'
          }
        })
      });
    });

    it('should include statistics when requested', async () => {
      const event = createMockEvent({ courseId: 'CS101', includeStats: 'true' });
      const response = await handler(event, {} as any, {} as any);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.assignments[0].statistics).toBeDefined();
      expect(body.data.assignments[0].statistics.totalSubmissions).toBeDefined();
    });

    it('should include submission info when requested', async () => {
      const event = createMockEvent({ courseId: 'CS101', includeSubmissions: 'true' });
      const response = await handler(event, {} as any, {} as any);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.assignments[0].submissionInfo).toBeDefined();
      expect(body.data.assignments[0].submissionInfo.submissionCount).toBeDefined();
    });

    it('should always include course information', async () => {
      const event = createMockEvent({ courseId: 'CS101' });
      const response = await handler(event, {} as any, {} as any);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.assignments[0].courseInfo).toBeDefined();
      expect(body.data.assignments[0].courseInfo.courseName).toBe('Introduction to Computer Science');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockVerifyJwtToken.mockResolvedValue({
        success: true,
        user: mockAuthenticatedUser
      });
    });

    it('should handle DynamoDB query errors gracefully', async () => {
      mockQuery.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('Database connection failed'))
      });

      const event = createMockEvent({ courseId: 'CS101' });
      const response = await handler(event, {} as any, {} as any);

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.details.error).toContain('Database connection failed');
    });

    it('should handle course access validation errors', async () => {
      mockGet.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('Course validation failed'))
      });

      const event = createMockEvent({ courseId: 'CS101' });
      const response = await handler(event, {} as any, {} as any);

      expect(response.statusCode).toBe(500);
    });

    it('should handle assignment enrichment errors gracefully', async () => {
      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [{ assignmentId: 'assignment_1', courseId: 'CS101' }]
        })
      });

      mockGet.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('Course info fetch failed'))
      });

      const event = createMockEvent({ courseId: 'CS101' });
      const response = await handler(event, {} as any, {} as any);

      // Should still succeed even if enrichment fails
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.assignments[0].courseInfo).toBeNull();
    });
  });

  describe('Response Format', () => {
    beforeEach(() => {
      mockVerifyJwtToken.mockResolvedValue({
        success: true,
        user: mockAuthenticatedUser
      });

      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [
            {
              assignmentId: 'assignment_1',
              title: 'Test Assignment',
              courseId: 'CS101',
              status: 'published'
            }
          ]
        })
      });
    });

    it('should return properly formatted success response', async () => {
      const event = createMockEvent({ courseId: 'CS101' });
      const response = await handler(event, {} as any, {} as any);

      expect(response.statusCode).toBe(200);
      expect(response.headers['Content-Type']).toBe('application/json');
      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');

      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Assignments retrieved successfully');
      expect(body.timestamp).toBeDefined();
      expect(body.data.assignments).toBeDefined();
      expect(body.data.pagination).toBeDefined();
      expect(body.data.filters).toBeDefined();
      expect(body.data.totalCount).toBeDefined();
      expect(body.data.requestId).toBeDefined();
    });

    it('should return properly formatted error response', async () => {
      mockQuery.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('Test error'))
      });

      const event = createMockEvent({ courseId: 'CS101' });
      const response = await handler(event, {} as any, {} as any);

      expect(response.statusCode).toBe(500);
      expect(response.headers['Content-Type']).toBe('application/json');

      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Internal server error');
      expect(body.timestamp).toBeDefined();
      expect(body.details.error).toBe('Test error');
      expect(body.details.requestId).toBeDefined();
    });
  });
});
