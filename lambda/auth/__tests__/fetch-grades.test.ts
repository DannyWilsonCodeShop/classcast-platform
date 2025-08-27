// Mock AWS SDK before importing the handler
const mockQuery = jest.fn().mockReturnValue({
  promise: jest.fn().mockResolvedValue({
    Items: []
  })
});

const mockGet = jest.fn().mockReturnValue({
  promise: jest.fn().mockResolvedValue({
    Item: null
  })
});

const mockScan = jest.fn().mockReturnValue({
  promise: jest.fn().mockResolvedValue({
    Items: []
  })
});

jest.mock('aws-sdk', () => ({
  DynamoDB: {
    DocumentClient: jest.fn().mockImplementation(() => ({
      query: mockQuery,
      get: mockGet,
      scan: mockScan
    }))
  }
}));

// Mock JWT verifier
jest.mock('../jwt-verifier', () => ({
  verifyJwtToken: jest.fn()
}));

import { verifyJwtToken } from '../jwt-verifier';
import { handler } from '../fetch-grades';

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
const createMockEvent = (queryParams: any = {}, user: any = mockInstructorUser) => ({
  headers: {
    Authorization: `Bearer valid-token-${user.sub}`
  },
  queryStringParameters: queryParams,
  httpMethod: 'GET',
  path: '/fetch-grades',
  body: null,
  pathParameters: null,
  stageVariables: null,
  requestContext: {} as any,
  resource: '',
  multiValueHeaders: {},
  multiValueQueryStringParameters: {},
  isBase64Encoded: false
});

// Mock grade data
const mockGrades = [
  {
    assignmentId: 'assignment123',
    userId: 'student123',
    courseId: 'CS101',
    grade: 85,
    feedback: 'Excellent work!',
    gradedAt: '2024-01-15T10:00:00Z',
    gradedBy: 'instructor456',
    submittedAt: '2024-01-14T15:00:00Z',
    allowResubmission: false,
    rubricScores: [
      { criterion: 'Code Quality', score: 42, maxScore: 50, comments: 'Well-structured' },
      { criterion: 'Functionality', score: 43, maxScore: 50, comments: 'All requirements met' }
    ],
    totalRubricScore: 85,
    maxRubricScore: 100,
    gradingNotes: 'Student showed good understanding'
  },
  {
    assignmentId: 'assignment124',
    userId: 'student124',
    courseId: 'CS101',
    grade: 92,
    feedback: 'Outstanding performance!',
    gradedAt: '2024-01-16T11:00:00Z',
    gradedBy: 'instructor456',
    submittedAt: '2024-01-15T16:00:00Z',
    allowResubmission: false,
    rubricScores: [
      { criterion: 'Code Quality', score: 48, maxScore: 50, comments: 'Excellent structure' },
      { criterion: 'Functionality', score: 44, maxScore: 50, comments: 'Exceeds requirements' }
    ],
    totalRubricScore: 92,
    maxRubricScore: 100,
    gradingNotes: 'Exceptional work'
  }
];

// Mock assignment data
const mockAssignment = {
  assignmentId: 'assignment123',
  title: 'Introduction to Programming',
  courseId: 'CS101',
  instructorId: 'instructor456'
};

// Mock course data
const mockCourse = {
  courseId: 'CS101',
  name: 'Computer Science Fundamentals',
  instructorId: 'instructor456'
};

describe('Fetch Grades Lambda Function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock implementations
    mockQuery.mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Items: mockGrades
      })
    });
    
    mockGet.mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Item: mockAssignment
      })
    });
    
    mockScan.mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Items: [mockCourse]
      })
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
        error: { message: 'Missing or invalid authorization header' }
      });
    });

    it('should reject requests with invalid token format', async () => {
      const mockEvent = createMockEvent({}, mockInstructorUser);
      mockEvent.headers.Authorization = 'InvalidToken';

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(401);
      expect(JSON.parse(response?.body || '{}')).toMatchObject({
        success: false,
        error: { message: 'Missing or invalid authorization header' }
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
        error: { message: 'Token expired' }
      });
    });

    it('should allow students to view their own grades', async () => {
      const mockEvent = createMockEvent({}, mockStudentUser);
      (verifyJwtToken as jest.Mock).mockResolvedValue({
        success: true,
        user: mockStudentUser
      });

      // Mock query to return student's grades
      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [mockGrades[0]] // Only the student's grade
        })
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
      expect(body.data.grades).toHaveLength(1);
      expect(body.data.grades[0].userId).toBe('student123');
    });

    it('should prevent students from viewing other students grades', async () => {
      const mockEvent = createMockEvent({ studentId: 'student999' }, mockStudentUser);
      (verifyJwtToken as jest.Mock).mockResolvedValue({
        success: true,
        user: mockStudentUser
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(403);
      expect(JSON.parse(response?.body || '{}')).toMatchObject({
        success: false,
        error: { message: 'Students can only view their own grades' }
      });
    });

    it('should allow instructors to view grades for their courses', async () => {
      const mockEvent = createMockEvent({}, mockInstructorUser);

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
      expect(body.data.grades).toHaveLength(2);
    });

    it('should allow admins to view all grades', async () => {
      const mockEvent = createMockEvent({}, mockAdminUser);
      (verifyJwtToken as jest.Mock).mockResolvedValue({
        success: true,
        user: mockAdminUser
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
      expect(body.data.grades).toHaveLength(2);
    });
  });

  describe('Input Validation', () => {
    it('should accept valid query parameters', async () => {
      const mockEvent = createMockEvent({
        courseId: 'CS101',
        minGrade: 80,
        maxGrade: 95,
        sortBy: 'grade',
        sortOrder: 'desc'
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
    });

    it('should reject invalid grade range values', async () => {
      const mockEvent = createMockEvent({
        minGrade: -10, // Invalid negative grade
        maxGrade: 150  // Invalid grade > 100
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(400);
      expect(JSON.parse(response?.body || '{}')).toMatchObject({
        success: false,
        error: { message: expect.stringContaining('Invalid parameters') }
      });
    });

    it('should reject invalid sort parameters', async () => {
      const mockEvent = createMockEvent({
        sortBy: 'invalidField',
        sortOrder: 'invalidOrder'
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(400);
      expect(JSON.parse(response?.body || '{}')).toMatchObject({
        success: false,
        error: { message: expect.stringContaining('Invalid parameters') }
      });
    });

    it('should reject invalid pagination values', async () => {
      const mockEvent = createMockEvent({
        page: 0,    // Invalid page number
        limit: 1000 // Invalid limit > 100
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(400);
      expect(JSON.parse(response?.body || '{}')).toMatchObject({
        success: false,
        error: { message: expect.stringContaining('Invalid parameters') }
      });
    });

    it('should use default values for missing parameters', async () => {
      const mockEvent = createMockEvent({}); // No parameters

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
      expect(body.data.pagination.currentPage).toBe(1);
      expect(body.data.pagination.totalItems).toBe(2);
    });
  });

  describe('Filtering Functionality', () => {
    it('should filter by course ID', async () => {
      const mockEvent = createMockEvent({ courseId: 'CS101' });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
      expect(body.data.grades.every((g: any) => g.courseId === 'CS101')).toBe(true);
    });

    it('should filter by assignment ID', async () => {
      const mockEvent = createMockEvent({ assignmentId: 'assignment123' });

      // Mock query to return only the specific assignment
      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [mockGrades[0]] // Only assignment123
        })
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
      expect(body.data.grades.every((g: any) => g.assignmentId === 'assignment123')).toBe(true);
    });

    it('should filter by grade range', async () => {
      const mockEvent = createMockEvent({
        minGrade: 80,
        maxGrade: 90
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
      expect(body.data.grades.every((g: any) => g.grade >= 80 && g.grade <= 90)).toBe(true);
    });

    it('should filter by grade range category', async () => {
      const mockEvent = createMockEvent({ gradeRange: 'excellent' });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
      expect(body.data.grades.every((g: any) => g.grade >= 90)).toBe(true);
    });

    it('should filter by date ranges', async () => {
      const mockEvent = createMockEvent({
        gradedAfter: '2024-01-14T00:00:00Z',
        gradedBefore: '2024-01-17T00:00:00Z'
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
      expect(body.data.grades.every((g: any) => {
        const gradedAt = new Date(g.gradedAt);
        return gradedAt >= new Date('2024-01-14T00:00:00Z') && 
               gradedAt <= new Date('2024-01-17T00:00:00Z');
      })).toBe(true);
    });

    it('should filter by feedback presence', async () => {
      const mockEvent = createMockEvent({ hasFeedback: true });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
      expect(body.data.grades.every((g: any) => g.feedback && g.feedback.trim() !== '')).toBe(true);
    });

    it('should filter by rubric scores presence', async () => {
      const mockEvent = createMockEvent({ hasRubricScores: true });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
      expect(body.data.grades.every((g: any) => g.rubricScores && g.rubricScores.length > 0)).toBe(true);
    });

    it('should filter by resubmission allowance', async () => {
      const mockEvent = createMockEvent({ allowResubmission: false });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
      expect(body.data.grades.every((g: any) => g.allowResubmission === false)).toBe(true);
    });

    it('should filter by search term', async () => {
      const mockEvent = createMockEvent({ searchTerm: 'Excellent' });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
      expect(body.data.grades.every((g: any) => 
        g.feedback.toLowerCase().includes('excellent') ||
        g.gradingNotes?.toLowerCase().includes('excellent')
      )).toBe(true);
    });
  });

  describe('Sorting Functionality', () => {
    it('should sort by grade in ascending order', async () => {
      const mockEvent = createMockEvent({
        sortBy: 'grade',
        sortOrder: 'asc'
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
      
      const grades = body.data.grades;
      expect(grades[0].grade).toBeLessThanOrEqual(grades[1].grade);
    });

    it('should sort by grade in descending order', async () => {
      const mockEvent = createMockEvent({
        sortBy: 'grade',
        sortOrder: 'desc'
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
      
      const grades = body.data.grades;
      expect(grades[0].grade).toBeGreaterThanOrEqual(grades[1].grade);
    });

    it('should sort by graded date by default', async () => {
      const mockEvent = createMockEvent({}); // Default sorting

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
      
             const grades = body.data.grades;
       expect(new Date(grades[0].gradedAt).getTime()).toBeGreaterThanOrEqual(new Date(grades[1].gradedAt).getTime());
    });

    it('should sort by assignment title', async () => {
      const mockEvent = createMockEvent({
        sortBy: 'assignmentTitle',
        sortOrder: 'asc'
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
    });
  });

  describe('Pagination Functionality', () => {
    it('should apply pagination correctly', async () => {
      const mockEvent = createMockEvent({
        page: 1,
        limit: 1
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
      expect(body.data.grades).toHaveLength(1);
      expect(body.data.pagination.currentPage).toBe(1);
      expect(body.data.pagination.totalPages).toBe(2);
      expect(body.data.pagination.totalItems).toBe(2);
      expect(body.data.pagination.hasNextPage).toBe(true);
      expect(body.data.pagination.hasPreviousPage).toBe(false);
    });

    it('should handle second page correctly', async () => {
      const mockEvent = createMockEvent({
        page: 2,
        limit: 1
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
      expect(body.data.grades).toHaveLength(1);
      expect(body.data.pagination.currentPage).toBe(2);
      expect(body.data.pagination.hasNextPage).toBe(false);
      expect(body.data.pagination.hasPreviousPage).toBe(true);
    });

    it('should handle page beyond available data', async () => {
      const mockEvent = createMockEvent({
        page: 10,
        limit: 10
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
      expect(body.data.grades).toHaveLength(0);
      expect(body.data.pagination.currentPage).toBe(10);
      expect(body.data.pagination.hasNextPage).toBe(false);
    });
  });

  describe('Data Enrichment', () => {
    it('should include assignment details by default', async () => {
      const mockEvent = createMockEvent({});

      // Mock assignment details
      mockGet.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: { assignmentId: 'assignment123', title: 'Test Assignment' }
        })
      }).mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: { assignmentId: 'assignment124', title: 'Test Assignment 2' }
        })
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
      expect(body.data.grades[0].assignmentTitle).toBe('Test Assignment');
    });

    it('should include course details by default', async () => {
      const mockEvent = createMockEvent({});

      // Mock course details
      mockGet.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: { courseId: 'CS101', name: 'Computer Science' }
        })
      }).mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Item: { courseId: 'CS101', name: 'Computer Science' }
        })
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
      expect(body.data.grades[0].courseName).toBe('Computer Science');
    });

    it('should include instructor details when requested', async () => {
      const mockEvent = createMockEvent({
        includeInstructorDetails: true
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
      expect(body.data.grades[0].instructorName).toBeDefined();
    });
  });

  describe('Aggregation Functionality', () => {
    it('should calculate basic aggregates when requested', async () => {
      const mockEvent = createMockEvent({
        includeAggregates: true
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
      expect(body.data.aggregates).toBeDefined();
      expect(body.data.aggregates.totalSubmissions).toBe(2);
      expect(body.data.aggregates.averageGrade).toBe(88.5);
      expect(body.data.aggregates.gradeDistribution.excellent).toBe(1);
      expect(body.data.aggregates.gradeDistribution.good).toBe(1);
    });

    it('should calculate course breakdown when grouped by course', async () => {
      const mockEvent = createMockEvent({
        includeAggregates: true,
        groupBy: 'course'
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
      expect(body.data.aggregates.courseBreakdown).toBeDefined();
      expect(body.data.aggregates.courseBreakdown).toHaveLength(1);
      expect(body.data.aggregates.courseBreakdown[0].courseId).toBe('CS101');
      expect(body.data.aggregates.courseBreakdown[0].averageGrade).toBe(88.5);
    });

    it('should calculate assignment breakdown when grouped by assignment', async () => {
      const mockEvent = createMockEvent({
        includeAggregates: true,
        groupBy: 'assignment'
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
      expect(body.data.aggregates.assignmentBreakdown).toBeDefined();
      expect(body.data.aggregates.assignmentBreakdown).toHaveLength(2);
    });

    it('should calculate weekly breakdown when grouped by week', async () => {
      const mockEvent = createMockEvent({
        includeAggregates: true,
        groupBy: 'week'
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
      expect(body.data.aggregates.weeklyBreakdown).toBeDefined();
      expect(body.data.aggregates.weeklyBreakdown.length).toBeGreaterThan(0);
    });
  });

  describe('Available Filters', () => {
    it('should provide available courses for instructors and admins', async () => {
      const mockEvent = createMockEvent({}, mockInstructorUser);

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
      expect(body.data.filters.available.courses).toBeDefined();
      expect(body.data.filters.available.courses.length).toBeGreaterThan(0);
    });

    it('should provide available assignments for instructors and admins', async () => {
      const mockEvent = createMockEvent({}, mockInstructorUser);

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
      expect(body.data.filters.available.assignments).toBeDefined();
    });

    it('should not provide available filters for students', async () => {
      const mockEvent = createMockEvent({}, mockStudentUser);
      (verifyJwtToken as jest.Mock).mockResolvedValue({
        success: true,
        user: mockStudentUser
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
      expect(body.data.filters.available.courses).toHaveLength(0);
      expect(body.data.filters.available.assignments).toHaveLength(0);
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
        error: { message: 'Failed to execute grade query' }
      });
    });

    it('should handle missing assignment details gracefully', async () => {
      const mockEvent = createMockEvent({});
      
      mockGet.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: null // Assignment not found
        })
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
      expect(body.data.grades[0].assignmentTitle).toBe('');
    });

    it('should handle missing course details gracefully', async () => {
      const mockEvent = createMockEvent({});
      
      mockGet.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: null // Course not found
        })
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
      expect(body.data.grades[0].courseName).toBe('');
    });
  });

  describe('Response Format', () => {
    it('should include CORS headers', async () => {
      const mockEvent = createMockEvent({});

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.headers).toMatchObject({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,OPTIONS'
      });
    });

    it('should include request ID and timestamp', async () => {
      const mockEvent = createMockEvent({});

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.requestId).toMatch(/^fetch_grades_\d+_[a-z0-9]+$/);
      expect(body.timestamp).toBeDefined();
    });

    it('should include applied filters in response', async () => {
      const mockEvent = createMockEvent({
        courseId: 'CS101',
        minGrade: 80
      });

      const response = await handler(mockEvent as any, {} as any, () => {});

      expect(response?.statusCode).toBe(200);
      const body = JSON.parse(response?.body || '{}');
      expect(body.success).toBe(true);
      expect(body.data.filters.applied.courseId).toBe('CS101');
      expect(body.data.filters.applied.minGrade).toBe(80);
    });
  });
});
