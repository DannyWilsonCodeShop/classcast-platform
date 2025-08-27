import { handler } from '../fetch-assignments';
import { DynamoDB } from 'aws-sdk';

// Mock AWS SDK
jest.mock('aws-sdk');
const mockDynamoDB = DynamoDB as jest.MockedClass<typeof DynamoDB>;
const mockDynamoClient = {
  query: jest.fn(),
  get: jest.fn(),
  scan: jest.fn()
};

// Mock JWT verifier
jest.mock('../jwt-verifier', () => ({
  verifyJwtToken: jest.fn()
}));

const { verifyJwtToken } = require('../jwt-verifier');

// Helper function to call handler with proper signature
const callHandler = async (event: any) => {
  return await handler(event, {} as any, () => {});
};

describe('Assignment Queries', () => {
  let mockEvent: any;
  let mockUser: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup DynamoDB mock
    mockDynamoDB.DocumentClient = jest.fn().mockImplementation(() => mockDynamoClient);
    
    // Setup JWT mock
    verifyJwtToken.mockResolvedValue({
      success: true,
      user: mockUser
    });

    // Mock user
    mockUser = {
      sub: 'user123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'instructor',
      isInstructor: true,
      isAdmin: false,
      instructorId: 'instructor123',
      department: 'Computer Science',
      status: 'active',
      enabled: true,
      instructorStatus: 'approved',
      reviewStatus: 'approved',
      warningCount: 0
    };

    // Mock event
    mockEvent = {
      queryStringParameters: {},
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
    };
  });

  describe('Query Parameter Building', () => {
    it('should build basic query parameters for course-based queries', async () => {
      mockEvent.queryStringParameters = {
        courseId: 'CS101',
        status: 'published'
      };

      mockDynamoClient.query.mockResolvedValue({
        Items: [],
        LastEvaluatedKey: undefined
      });

      const response = await callHandler(mockEvent);
      const body = JSON.parse(response?.body || '{}');

      expect(response?.statusCode).toBe(200);
      expect(body.success).toBe(true);
      
      // Verify DynamoDB query was called with correct parameters
      expect(mockDynamoClient.query).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: 'DemoProject-Assignments',
          IndexName: 'CourseStatusIndex',
          KeyConditionExpression: 'courseId = :courseId AND #status = :status',
          ExpressionAttributeNames: {
            '#courseId': 'courseId',
            '#status': 'status'
          },
          ExpressionAttributeValues: {
            ':courseId': 'CS101',
            ':status': 'published'
          }
        })
      );
    });

    it('should build query parameters for instructor-based queries', async () => {
      mockEvent.queryStringParameters = {
        instructorId: 'instructor123'
      };

      mockDynamoClient.query.mockResolvedValue({
        Items: [],
        LastEvaluatedKey: undefined
      });

      const response = await callHandler(mockEvent);
      const body = JSON.parse(response?.body || '{}');

      expect(response?.statusCode).toBe(200);
      expect(body.success).toBe(true);
      
      expect(mockDynamoClient.query).toHaveBeenCalledWith(
        expect.objectContaining({
          IndexName: 'InstructorCreatedIndex',
          KeyConditionExpression: 'instructorId = :instructorId'
        })
      );
    });

    it('should use scan with filters for general queries', async () => {
      mockEvent.queryStringParameters = {};

      mockDynamoClient.query.mockResolvedValue({
        Items: [],
        LastEvaluatedKey: undefined
      });

      const response = await callHandler(mockEvent);
      const body = JSON.parse(response?.body || '{}');

      expect(response?.statusCode).toBe(200);
      expect(body.success).toBe(true);
      
      // Should use scan with status filter for students
      expect(mockDynamoClient.query).toHaveBeenCalledWith(
        expect.objectContaining({
          FilterExpression: '#status = :status'
        })
      );
    });
  });

  describe('Filtering Operations', () => {
    beforeEach(() => {
      // Mock successful query with sample data
      mockDynamoClient.query.mockResolvedValue({
        Items: [
          {
            assignmentId: 'assignment1',
            title: 'Assignment 1',
            status: 'published',
            type: 'essay',
            dueDate: '2024-12-31T23:59:59Z',
            points: 100,
            individualSubmission: true,
            tags: ['programming', 'algorithms'],
            searchableText: 'programming algorithms data structures',
            description: 'Implement sorting algorithms'
          },
          {
            assignmentId: 'assignment2',
            title: 'Assignment 2',
            status: 'active',
            type: 'quiz',
            dueDate: '2024-12-15T23:59:59Z',
            points: 50,
            individualSubmission: false,
            tags: ['math', 'calculus'],
            searchableText: 'calculus derivatives integrals',
            description: 'Solve calculus problems'
          }
        ],
        LastEvaluatedKey: undefined
      });
    });

    it('should filter by single status', async () => {
      mockEvent.queryStringParameters = {
        courseId: 'CS101',
        status: 'published'
      };

      const response = await handler(mockEvent);
      const body = JSON.parse(response?.body || '{}');

      expect(response?.statusCode).toBe(200);
      expect(body.data.assignments).toHaveLength(1);
      expect(body.data.assignments[0].status).toBe('published');
    });

    it('should filter by multiple statuses', async () => {
      mockEvent.queryStringParameters = {
        courseId: 'CS101',
        statuses: 'published,active'
      };

      const response = await handler(mockEvent);
      const body = JSON.parse(response?.body || '{}');

      expect(response?.statusCode).toBe(200);
      expect(body.data.assignments).toHaveLength(2);
      expect(body.data.filters.statuses).toEqual(['published', 'active']);
    });

    it('should filter by assignment type', async () => {
      mockEvent.queryStringParameters = {
        courseId: 'CS101',
        type: 'essay'
      };

      const response = await handler(mockEvent);
      const body = JSON.parse(response?.body || '{}');

      expect(response?.statusCode).toBe(200);
      expect(body.data.assignments).toHaveLength(1);
      expect(body.data.assignments[0].type).toBe('essay');
    });

    it('should filter by week number', async () => {
      mockEvent.queryStringParameters = {
        courseId: 'CS101',
        weekNumber: '52'
      };

      const response = await handler(mockEvent);
      const body = JSON.parse(response?.body || '{}');

      expect(response?.statusCode).toBe(200);
      expect(body.data.filters.weekNumber).toBe(52);
    });

    it('should filter by week date range', async () => {
      mockEvent.queryStringParameters = {
        courseId: 'CS101',
        weekStart: '2024-12-01',
        weekEnd: '2024-12-31'
      };

      const response = await handler(mockEvent);
      const body = JSON.parse(response?.body || '{}');

      expect(response?.statusCode).toBe(200);
      expect(body.data.filters.weekStart).toBe('2024-12-01');
      expect(body.data.filters.weekEnd).toBe('2024-12-31');
    });

    it('should filter by due date range', async () => {
      mockEvent.queryStringParameters = {
        courseId: 'CS101',
        dueDateFrom: '2024-12-01',
        dueDateTo: '2024-12-31'
      };

      const response = await handler(mockEvent);
      const body = JSON.parse(response?.body || '{}');

      expect(response?.statusCode).toBe(200);
      expect(body.data.filters.dueDateFrom).toBe('2024-12-01');
      expect(body.data.filters.dueDateTo).toBe('2024-12-31');
    });

    it('should filter by difficulty (based on points)', async () => {
      mockEvent.queryStringParameters = {
        courseId: 'CS101',
        difficulty: 'hard'
      };

      const response = await handler(mockEvent);
      const body = JSON.parse(response?.body || '{}');

      expect(response?.statusCode).toBe(200);
      expect(body.data.filters.difficulty).toBe('hard');
      // Should only return assignments with >100 points
      expect(body.data.assignments.every((a: any) => a.points > 100)).toBe(true);
    });

    it('should filter by submission type', async () => {
      mockEvent.queryStringParameters = {
        courseId: 'CS101',
        submissionType: 'individual'
      };

      const response = await handler(mockEvent);
      const body = JSON.parse(response?.body || '{}');

      expect(response?.statusCode).toBe(200);
      expect(body.data.filters.submissionType).toBe('individual');
      expect(body.data.assignments.every((a: any) => a.individualSubmission)).toBe(true);
    });

    it('should filter by tags', async () => {
      mockEvent.queryStringParameters = {
        courseId: 'CS101',
        tags: 'programming,algorithms'
      };

      const response = await handler(mockEvent);
      const body = JSON.parse(response?.body || '{}');

      expect(response?.statusCode).toBe(200);
      expect(body.data.filters.tags).toEqual(['programming', 'algorithms']);
      expect(body.data.assignments.every((a: any) => 
        a.tags.some((tag: string) => 
          tag.toLowerCase().includes('programming') || 
          tag.toLowerCase().includes('algorithms')
        )
      )).toBe(true);
    });

    it('should filter by search term', async () => {
      mockEvent.queryStringParameters = {
        courseId: 'CS101',
        search: 'algorithms'
      };

      const response = await handler(mockEvent);
      const body = JSON.parse(response?.body || '{}');

      expect(response?.statusCode).toBe(200);
      expect(body.data.filters.search).toBe('algorithms');
      expect(body.data.assignments.every((a: any) => 
        a.searchableText.toLowerCase().includes('algorithms') ||
        a.title.toLowerCase().includes('algorithms') ||
        a.description.toLowerCase().includes('algorithms')
      )).toBe(true);
    });
  });

  describe('Sorting Operations', () => {
    beforeEach(() => {
      mockDynamoClient.query.mockResolvedValue({
        Items: [
          {
            assignmentId: 'assignment1',
            title: 'Assignment A',
            dueDate: '2024-12-31T23:59:59Z',
            createdAt: '2024-01-01T00:00:00Z',
            points: 50,
            status: 'published'
          },
          {
            assignmentId: 'assignment2',
            title: 'Assignment B',
            dueDate: '2024-12-15T23:59:59Z',
            createdAt: '2024-01-02T00:00:00Z',
            points: 100,
            status: 'active'
          },
          {
            assignmentId: 'assignment3',
            title: 'Assignment C',
            dueDate: '2024-12-01T23:59:59Z',
            createdAt: '2024-01-03T00:00:00Z',
            points: 75,
            status: 'draft'
          }
        ],
        LastEvaluatedKey: undefined
      });
    });

    it('should sort by due date ascending (default)', async () => {
      mockEvent.queryStringParameters = {
        courseId: 'CS101',
        sortBy: 'dueDate',
        sortOrder: 'asc'
      };

      const response = await handler(mockEvent);
      const body = JSON.parse(response?.body || '{}');

      expect(response?.statusCode).toBe(200);
      expect(body.data.filters.sortBy).toBe('dueDate');
      expect(body.data.filters.sortOrder).toBe('asc');
      
      // Should be sorted by due date ascending
      const dueDates = body.data.assignments.map((a: any) => new Date(a.dueDate).getTime());
      expect(dueDates).toEqual([...dueDates].sort((a, b) => a - b));
    });

    it('should sort by due date descending', async () => {
      mockEvent.queryStringParameters = {
        courseId: 'CS101',
        sortBy: 'dueDate',
        sortOrder: 'desc'
      };

      const response = await handler(mockEvent);
      const body = JSON.parse(response?.body || '{}');

      expect(response?.statusCode).toBe(200);
      
      // Should be sorted by due date descending
      const dueDates = body.data.assignments.map((a: any) => new Date(a.dueDate).getTime());
      expect(dueDates).toEqual([...dueDates].sort((a, b) => b - a));
    });

    it('should sort by title alphabetically', async () => {
      mockEvent.queryStringParameters = {
        courseId: 'CS101',
        sortBy: 'title',
        sortOrder: 'asc'
      };

      const response = await handler(mockEvent);
      const body = JSON.parse(response?.body || '{}');

      expect(response?.statusCode).toBe(200);
      
      // Should be sorted by title alphabetically
      const titles = body.data.assignments.map((a: any) => a.title);
      expect(titles).toEqual([...titles].sort());
    });

    it('should sort by points numerically', async () => {
      mockEvent.queryStringParameters = {
        courseId: 'CS101',
        sortBy: 'points',
        sortOrder: 'desc'
      };

      const response = await handler(mockEvent);
      const body = JSON.parse(response?.body || '{}');

      expect(response?.statusCode).toBe(200);
      
      // Should be sorted by points descending
      const points = body.data.assignments.map((a: any) => a.points);
      expect(points).toEqual([...points].sort((a, b) => b - a));
    });
  });

  describe('Pagination Operations', () => {
    beforeEach(() => {
      // Create 150 mock assignments for pagination testing
      const mockItems = Array.from({ length: 150 }, (_, i) => ({
        assignmentId: `assignment_${i + 1}`,
        title: `Assignment ${i + 1}`,
        status: 'published',
        dueDate: new Date(Date.now() + (i * 24 * 60 * 60 * 1000)).toISOString()
      }));

      mockDynamoClient.query.mockResolvedValue({
        Items: mockItems,
        LastEvaluatedKey: undefined
      });
    });

    it('should apply default pagination (page 1, 20 items)', async () => {
      mockEvent.queryStringParameters = {
        courseId: 'CS101'
      };

      const response = await handler(mockEvent);
      const body = JSON.parse(response?.body || '{}');

      expect(response?.statusCode).toBe(200);
      expect(body.data.assignments).toHaveLength(20);
      expect(body.data.pagination.currentPage).toBe(1);
      expect(body.data.pagination.pageSize).toBe(20);
      expect(body.data.pagination.totalPages).toBe(8);
      expect(body.data.pagination.totalCount).toBe(150);
      expect(body.data.pagination.showingItems).toBe('1-20 of 150');
    });

    it('should handle custom page size', async () => {
      mockEvent.queryStringParameters = {
        courseId: 'CS101',
        limit: '50'
      };

      const response = await handler(mockEvent);
      const body = JSON.parse(response?.body || '{}');

      expect(response?.statusCode).toBe(200);
      expect(body.data.assignments).toHaveLength(50);
      expect(body.data.pagination.pageSize).toBe(50);
      expect(body.data.pagination.totalPages).toBe(3);
      expect(body.data.pagination.showingItems).toBe('1-50 of 150');
    });

    it('should navigate to specific page', async () => {
      mockEvent.queryStringParameters = {
        courseId: 'CS101',
        page: '3',
        limit: '25'
      };

      const response = await handler(mockEvent);
      const body = JSON.parse(response?.body || '{}');

      expect(response?.statusCode).toBe(200);
      expect(body.data.pagination.currentPage).toBe(3);
      expect(body.data.pagination.pageSize).toBe(25);
      expect(body.data.pagination.totalPages).toBe(6);
      expect(body.data.pagination.showingItems).toBe('51-75 of 150');
      expect(body.data.pagination.hasPreviousPage).toBe(true);
      expect(body.data.pagination.hasNextPage).toBe(true);
    });

    it('should generate smart page numbers', async () => {
      mockEvent.queryStringParameters = {
        courseId: 'CS101',
        page: '5',
        limit: '20'
      };

      const response = await handler(mockEvent);
      const body = JSON.parse(response?.body || '{}');

      expect(response?.statusCode).toBe(200);
      // Should show 5 pages around current page
      expect(body.data.pagination.pageNumbers).toHaveLength(5);
      expect(body.data.pagination.pageNumbers).toContain(3);
      expect(body.data.pagination.pageNumbers).toContain(4);
      expect(body.data.pagination.pageNumbers).toContain(5);
      expect(body.data.pagination.pageNumbers).toContain(6);
      expect(body.data.pagination.pageNumbers).toContain(7);
    });

    it('should handle edge cases for pagination', async () => {
      // Test invalid page number
      mockEvent.queryStringParameters = {
        courseId: 'CS101',
        page: '999',
        limit: '20'
      };

      const response = await handler(mockEvent);
      const body = JSON.parse(response?.body || '{}');

      expect(response?.statusCode).toBe(200);
      // Should clamp to last valid page
      expect(body.data.pagination.currentPage).toBe(8);
      expect(body.data.pagination.showingItems).toBe('141-150 of 150');
    });

    it('should handle cursor-based pagination', async () => {
      mockEvent.queryStringParameters = {
        courseId: 'CS101',
        paginationType: 'cursor',
        limit: '30'
      };

      const response = await handler(mockEvent);
      const body = JSON.parse(response?.body || '{}');

      expect(response?.statusCode).toBe(200);
      expect(body.data.assignments).toHaveLength(30);
      expect(body.data.cursors).toBeDefined();
      expect(body.data.cursors.first).toBeDefined();
      expect(body.data.cursors.last).toBeDefined();
      expect(body.data.cursors.next).toBeDefined();
      expect(body.data.filters.paginationType).toBe('cursor');
    });
  });

  describe('Query Execution and Error Handling', () => {
    it('should handle DynamoDB ResourceNotFoundException', async () => {
      mockEvent.queryStringParameters = { courseId: 'CS101' };
      
      mockDynamoClient.query.mockRejectedValue({
        code: 'ResourceNotFoundException',
        message: 'Table not found'
      });

      const response = await handler(mockEvent);
      const body = JSON.parse(response?.body || '{}');

      expect(response?.statusCode).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Failed to fetch assignments');
      expect(body.details.error).toContain('DynamoDB table');
    });

    it('should handle DynamoDB AccessDeniedException', async () => {
      mockEvent.queryStringParameters = { courseId: 'CS101' };
      
      mockDynamoClient.query.mockRejectedValue({
        code: 'AccessDeniedException',
        message: 'Access denied'
      });

      const response = await handler(mockEvent);
      const body = JSON.parse(response?.body || '{}');

      expect(response?.statusCode).toBe(500);
      expect(body.success).toBe(false);
      expect(body.details.error).toBe('Access denied to DynamoDB table');
    });

    it('should handle pagination with LastEvaluatedKey', async () => {
      mockEvent.queryStringParameters = { courseId: 'CS101' };
      
      // Mock first query with LastEvaluatedKey
      mockDynamoClient.query
        .mockResolvedValueOnce({
          Items: Array.from({ length: 100 }, (_, i) => ({
            assignmentId: `assignment_${i + 1}`,
            title: `Assignment ${i + 1}`,
            status: 'published'
          })),
          LastEvaluatedKey: { assignmentId: 'assignment_100' }
        })
        .mockResolvedValueOnce({
          Items: Array.from({ length: 50 }, (_, i) => ({
            assignmentId: `assignment_${i + 101}`,
            title: `Assignment ${i + 101}`,
            status: 'published'
          })),
          LastEvaluatedKey: undefined
        });

      const response = await handler(mockEvent);
      const body = JSON.parse(response?.body || '{}');

      expect(response?.statusCode).toBe(200);
      expect(body.data.totalCount).toBe(150);
      expect(mockDynamoClient.query).toHaveBeenCalledTimes(2);
    });

    it('should handle query result limits', async () => {
      mockEvent.queryStringParameters = { courseId: 'CS101' };
      
      // Mock query that would exceed limit
      const largeItems = Array.from({ length: 15000 }, (_, i) => ({
        assignmentId: `assignment_${i + 1}`,
        title: `Assignment ${i + 1}`,
        status: 'published'
      }));

      mockDynamoClient.query.mockResolvedValue({
        Items: largeItems,
        LastEvaluatedKey: undefined
      });

      const response = await handler(mockEvent);
      const body = JSON.parse(response?.body || '{}');

      expect(response?.statusCode).toBe(200);
      // Should stop at 10000 items for safety
      expect(body.data.totalCount).toBeLessThanOrEqual(10000);
    });
  });

  describe('Assignment Enrichment', () => {
    beforeEach(() => {
      mockDynamoClient.query.mockResolvedValue({
        Items: [
          {
            assignmentId: 'assignment1',
            courseId: 'CS101',
            title: 'Test Assignment',
            status: 'published'
          }
        ],
        LastEvaluatedKey: undefined
      });

      mockDynamoClient.get.mockResolvedValue({
        Item: {
          courseId: 'CS101',
          courseName: 'Introduction to Computer Science',
          department: 'Computer Science',
          instructorName: 'Dr. Smith'
        }
      });
    });

    it('should include assignment statistics when requested', async () => {
      mockEvent.queryStringParameters = {
        courseId: 'CS101',
        includeStats: 'true'
      };

      const response = await handler(mockEvent);
      const body = JSON.parse(response?.body || '{}');

      expect(response?.statusCode).toBe(200);
      expect(body.data.assignments[0].statistics).toBeDefined();
      expect(body.data.assignments[0].statistics.totalSubmissions).toBeDefined();
      expect(body.data.assignments[0].statistics.averageScore).toBeDefined();
    });

    it('should include submission information when requested', async () => {
      mockEvent.queryStringParameters = {
        courseId: 'CS101',
        includeSubmissions: 'true'
      };

      const response = await handler(mockEvent);
      const body = JSON.parse(response?.body || '{}');

      expect(response?.statusCode).toBe(200);
      expect(body.data.assignments[0].submissionInfo).toBeDefined();
      expect(body.data.assignments[0].submissionInfo.submissionCount).toBeDefined();
      expect(body.data.assignments[0].submissionInfo.gradingStatus).toBeDefined();
    });

    it('should always include course information', async () => {
      mockEvent.queryStringParameters = { courseId: 'CS101' };

      const response = await handler(mockEvent);
      const body = JSON.parse(response?.body || '{}');

      expect(response?.statusCode).toBe(200);
      expect(body.data.assignments[0].courseInfo).toBeDefined();
      expect(body.data.assignments[0].courseInfo.courseName).toBe('Introduction to Computer Science');
      expect(body.data.assignments[0].courseInfo.department).toBe('Computer Science');
    });
  });

  describe('Access Control', () => {
    it('should allow students to access only published assignments', async () => {
      mockUser.isInstructor = false;
      mockUser.isAdmin = false;
      
      mockEvent.queryStringParameters = { courseId: 'CS101' };

      mockDynamoClient.query.mockResolvedValue({
        Items: [
          { assignmentId: 'assignment1', status: 'published' },
          { assignmentId: 'assignment2', status: 'draft' },
          { assignmentId: 'assignment3', status: 'published' }
        ],
        LastEvaluatedKey: undefined
      });

      const response = await handler(mockEvent);
      const body = JSON.parse(response?.body || '{}');

      expect(response?.statusCode).toBe(200);
      // Should only show published assignments
      expect(body.data.assignments.every((a: any) => a.status === 'published')).toBe(true);
    });

    it('should require course ID for student access', async () => {
      mockUser.isInstructor = false;
      mockUser.isAdmin = false;
      
      mockEvent.queryStringParameters = {}; // No courseId

      const response = await handler(mockEvent);
      const body = JSON.parse(response?.body || '{}');

      expect(response?.statusCode).toBe(403);
      expect(body.success).toBe(false);
      expect(body.details.code).toBe('COURSE_ID_REQUIRED');
    });

    it('should allow instructors to access their department courses', async () => {
      mockUser.isInstructor = true;
      mockUser.isAdmin = false;
      
      mockEvent.queryStringParameters = { courseId: 'CS101' };

      mockDynamoClient.query.mockResolvedValue({
        Items: [],
        LastEvaluatedKey: undefined
      });

      const response = await handler(mockEvent);
      const body = JSON.parse(response?.body || '{}');

      expect(response?.statusCode).toBe(200);
      expect(body.success).toBe(true);
    });

    it('should allow admins full access', async () => {
      mockUser.isInstructor = false;
      mockUser.isAdmin = true;
      
      mockEvent.queryStringParameters = {};

      mockDynamoClient.query.mockResolvedValue({
        Items: [],
        LastEvaluatedKey: undefined
      });

      const response = await handler(mockEvent);
      const body = JSON.parse(response?.body || '{}');

      expect(response?.statusCode).toBe(200);
      expect(body.success).toBe(true);
    });
  });

  describe('Response Formatting', () => {
    beforeEach(() => {
      mockDynamoClient.query.mockResolvedValue({
        Items: [
          {
            assignmentId: 'assignment1',
            title: 'Test Assignment',
            status: 'published',
            courseId: 'CS101'
          }
        ],
        LastEvaluatedKey: undefined
      });
    });

    it('should include request ID in response', async () => {
      mockEvent.queryStringParameters = { courseId: 'CS101' };

      const response = await handler(mockEvent);
      const body = JSON.parse(response?.body || '{}');

      expect(response?.statusCode).toBe(200);
      expect(body.data.requestId).toBeDefined();
      expect(body.data.requestId).toMatch(/^req_\d+_[a-z0-9]+$/);
    });

    it('should include comprehensive filter summary', async () => {
      mockEvent.queryStringParameters = {
        courseId: 'CS101',
        status: 'published',
        type: 'essay',
        weekNumber: '25',
        limit: '15'
      };

      const response = await handler(mockEvent);
      const body = JSON.parse(response?.body || '{}');

      expect(response?.statusCode).toBe(200);
      expect(body.data.filters.courseId).toBe('CS101');
      expect(body.data.filters.status).toBe('published');
      expect(body.data.filters.type).toBe('essay');
      expect(body.data.filters.weekNumber).toBe(25);
      expect(body.data.filters.limit).toBe(15);
    });

    it('should include CORS headers', async () => {
      mockEvent.queryStringParameters = { courseId: 'CS101' };

      const response = await handler(mockEvent);

      expect(response?.headers).toBeDefined();
      expect(response?.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(response?.headers['Access-Control-Allow-Headers']).toBe('Content-Type,Authorization');
      expect(response?.headers['Access-Control-Allow-Methods']).toBe('GET,OPTIONS');
    });
  });
});
