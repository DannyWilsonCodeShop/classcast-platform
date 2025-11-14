import { validateInstructorAccess, validateInstructorPermissions, checkInstructorStatus, checkAssignmentCreationLimits, checkActiveCourses, checkInstructorReviewStatus } from '../create-assignment';
import { DynamoDB } from 'aws-sdk';
import { AuthenticatedUser } from '../jwt-verifier';

// Mock AWS SDK
jest.mock('aws-sdk');
const mockDynamoDB = DynamoDB as jest.MockedClass<typeof DynamoDB>;

describe('Instructor Access Control', () => {
  let mockDynamoClient: any;
  let mockGet: jest.Mock;
  let mockQuery: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockGet = jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({}) });
    mockQuery = jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({ Items: [] }) });

    mockDynamoClient = {
      get: mockGet,
      query: mockQuery
    };

    mockDynamoDB.mockImplementation(() => mockDynamoClient as any);
  });

  const mockAuthenticatedUser: AuthenticatedUser = {
    sub: 'user123',
    email: 'instructor@example.com',
    isInstructor: true,
    isAdmin: false,
    instructorId: 'inst123',
    department: 'Computer Science'
  };

  const mockAdminUser: AuthenticatedUser = {
    sub: 'admin123',
    email: 'admin@example.com',
    isInstructor: false,
    isAdmin: true,
    instructorId: undefined,
    department: 'Administration'
  };

  const mockStudentUser: AuthenticatedUser = {
    sub: 'student123',
    email: 'student@example.com',
    isInstructor: false,
    isAdmin: false,
    instructorId: undefined,
    department: 'Computer Science'
  };

  describe('validateInstructorAccess', () => {
    it('should allow admin users access', async () => {
      const result = await validateInstructorAccess(mockAdminUser, 'req123');
      
      expect(result.hasAccess).toBe(true);
      expect(result.reason).toBeUndefined();
      expect(result.code).toBeUndefined();
    });

    it('should deny student users access', async () => {
      const result = await validateInstructorAccess(mockStudentUser, 'req123');
      
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBe('Only instructors and administrators can create assignments');
      expect(result.code).toBe('INSUFFICIENT_ROLE');
    });

    it('should allow valid instructor users access', async () => {
      // Mock successful instructor validation
      mockGet.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: {
            userId: 'inst123',
            status: 'CONFIRMED',
            enabled: true,
            instructorStatus: 'ACTIVE'
          }
        })
      });

      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [{ courseId: 'CS101', status: 'active' }]
        })
      });

      const result = await validateInstructorAccess(mockAuthenticatedUser, 'req123');
      
      expect(result.hasAccess).toBe(true);
    });

    it('should deny access for unconfirmed accounts', async () => {
      const unconfirmedUser = { ...mockAuthenticatedUser } as any;
      unconfirmedUser.status = 'UNCONFIRMED';

      const result = await validateInstructorAccess(unconfirmedUser, 'req123');
      
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBe('Account must be confirmed and active to create assignments');
      expect(result.code).toBe('ACCOUNT_INACTIVE');
    });

    it('should deny access for archived accounts', async () => {
      const archivedUser = { ...mockAuthenticatedUser } as any;
      archivedUser.status = 'ARCHIVED';

      const result = await validateInstructorAccess(archivedUser, 'req123');
      
      expect(result.hasAccess).toBe(false);
      expect(result.code).toBe('ACCOUNT_INACTIVE');
    });

    it('should deny access for compromised accounts', async () => {
      const compromisedUser = { ...mockAuthenticatedUser } as any;
      compromisedUser.status = 'COMPROMISED';

      const result = await validateInstructorAccess(compromisedUser, 'req123');
      
      expect(result.hasAccess).toBe(false);
      expect(result.code).toBe('ACCOUNT_INACTIVE');
    });
  });

  describe('validateInstructorPermissions', () => {
    it('should validate instructor with missing instructor ID', async () => {
      const userWithoutId = { ...mockAuthenticatedUser, instructorId: undefined };
      
      const result = await validateInstructorPermissions(userWithoutId, 'req123');
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Instructor ID not found. Please contact administration.');
      expect(result.code).toBe('MISSING_INSTRUCTOR_ID');
    });

    it('should validate instructor with missing department', async () => {
      const userWithoutDept = { ...mockAuthenticatedUser, department: undefined };
      
      const result = await validateInstructorPermissions(userWithoutDept, 'req123');
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Department not assigned. Please contact administration.');
      expect(result.code).toBe('MISSING_DEPARTMENT');
    });

    it('should validate instructor with inactive status', async () => {
      mockGet.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: {
            userId: 'inst123',
            status: 'SUSPENDED',
            enabled: true
          }
        })
      });

      const result = await validateInstructorPermissions(mockAuthenticatedUser, 'req123');
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Instructor account is suspended');
      expect(result.code).toBe('INSTRUCTOR_INACTIVE');
    });

    it('should validate instructor with disabled account', async () => {
      mockGet.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: {
            userId: 'inst123',
            status: 'CONFIRMED',
            enabled: false
          }
        })
      });

      const result = await validateInstructorPermissions(mockAuthenticatedUser, 'req123');
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Account is disabled');
      expect(result.code).toBe('INSTRUCTOR_INACTIVE');
    });

    it('should validate instructor with no active courses', async () => {
      mockGet.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: {
            userId: 'inst123',
            status: 'CONFIRMED',
            enabled: true,
            instructorStatus: 'ACTIVE'
          }
        })
      });

      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [] // No active courses
        })
      });

      const result = await validateInstructorPermissions(mockAuthenticatedUser, 'req123');
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('No active courses found. You must have at least one active course to create assignments.');
      expect(result.code).toBe('NO_ACTIVE_COURSES');
    });

    it('should validate instructor with assignment limits exceeded', async () => {
      mockGet.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: {
            userId: 'inst123',
            status: 'CONFIRMED',
            enabled: true,
            instructorStatus: 'ACTIVE'
          }
        })
      });

      // Mock active courses
      mockQuery.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Items: [{ courseId: 'CS101', status: 'active' }]
        })
      });

      // Mock assignment count exceeding limit
      mockQuery.mockReturnValueOnce({
        promise: jest.fn().mockResolvedValue({
          Items: Array(60).fill({}).map((_, i) => ({ assignmentId: `assignment_${i}` }))
        })
      });

      const result = await validateInstructorPermissions(mockAuthenticatedUser, 'req123');
      
      expect(result.valid).toBe(true);
      expect(result.restrictions).toContain('Monthly assignment limit: 60/50');
    });

    it('should validate instructor with flagged account', async () => {
      mockGet.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: {
            userId: 'inst123',
            status: 'CONFIRMED',
            enabled: true,
            instructorStatus: 'ACTIVE',
            reviewStatus: 'FLAGGED',
            reviewReason: 'Multiple complaints received'
          }
        })
      });

      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [{ courseId: 'CS101', status: 'active' }]
        })
      });

      const result = await validateInstructorPermissions(mockAuthenticatedUser, 'req123');
      
      expect(result.valid).toBe(true);
      expect(result.restrictions).toContain('Account under review: Multiple complaints received');
    });

    it('should validate instructor with multiple warnings', async () => {
      mockGet.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: {
            userId: 'inst123',
            status: 'CONFIRMED',
            enabled: true,
            instructorStatus: 'ACTIVE',
            warningCount: 3
          }
        })
      });

      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [{ courseId: 'CS101', status: 'active' }]
        })
      });

      const result = await validateInstructorPermissions(mockAuthenticatedUser, 'req123');
      
      expect(result.valid).toBe(true);
      expect(result.restrictions).toContain('Account under review: Multiple warnings received (3)');
    });
  });

  describe('checkInstructorStatus', () => {
    it('should return active for confirmed instructor', async () => {
      mockGet.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: {
            userId: 'inst123',
            status: 'CONFIRMED',
            enabled: true,
            instructorStatus: 'ACTIVE'
          }
        })
      });

      const result = await checkInstructorStatus('inst123', 'req123');
      
      expect(result.active).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should return inactive for unconfirmed instructor', async () => {
      mockGet.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: {
            userId: 'inst123',
            status: 'UNCONFIRMED',
            enabled: true
          }
        })
      });

      const result = await checkInstructorStatus('inst123', 'req123');
      
      expect(result.active).toBe(false);
      expect(result.reason).toBe('Account status: UNCONFIRMED');
    });

    it('should return inactive for disabled instructor', async () => {
      mockGet.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: {
            userId: 'inst123',
            status: 'CONFIRMED',
            enabled: false
          }
        })
      });

      const result = await checkInstructorStatus('inst123', 'req123');
      
      expect(result.active).toBe(false);
      expect(result.reason).toBe('Account is disabled');
    });

    it('should return inactive for suspended instructor', async () => {
      mockGet.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: {
            userId: 'inst123',
            status: 'CONFIRMED',
            enabled: true,
            instructorStatus: 'SUSPENDED'
          }
        })
      });

      const result = await checkInstructorStatus('inst123', 'req123');
      
      expect(result.active).toBe(false);
      expect(result.reason).toBe('Instructor account is suspended');
    });

    it('should return inactive for pending approval instructor', async () => {
      mockGet.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: {
            userId: 'inst123',
            status: 'CONFIRMED',
            enabled: true,
            instructorStatus: 'PENDING_APPROVAL'
          }
        })
      });

      const result = await checkInstructorStatus('inst123', 'req123');
      
      expect(result.active).toBe(false);
      expect(result.reason).toBe('Instructor account pending approval');
    });

    it('should return inactive for non-existent instructor', async () => {
      mockGet.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: null
        })
      });

      const result = await checkInstructorStatus('inst123', 'req123');
      
      expect(result.active).toBe(false);
      expect(result.reason).toBe('Instructor not found in system');
    });
  });

  describe('checkAssignmentCreationLimits', () => {
    it('should return within limits for new instructor', async () => {
      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: []
        })
      });

      const result = await checkAssignmentCreationLimits('inst123', 'req123');
      
      expect(result.withinLimits).toBe(true);
      expect(result.current).toBe(0);
      expect(result.limit).toBe(50);
    });

    it('should return within limits for instructor under limit', async () => {
      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: Array(25).fill({}).map((_, i) => ({ assignmentId: `assignment_${i}` }))
        })
      });

      const result = await checkAssignmentCreationLimits('inst123', 'req123');
      
      expect(result.withinLimits).toBe(true);
      expect(result.current).toBe(25);
      expect(result.limit).toBe(50);
    });

    it('should return exceeded limits for instructor at limit', async () => {
      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: Array(50).fill({}).map((_, i) => ({ assignmentId: `assignment_${i}` }))
        })
      });

      const result = await checkAssignmentCreationLimits('inst123', 'req123');
      
      expect(result.withinLimits).toBe(false);
      expect(result.current).toBe(50);
      expect(result.limit).toBe(50);
    });

    it('should return exceeded limits for instructor over limit', async () => {
      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: Array(60).fill({}).map((_, i) => ({ assignmentId: `assignment_${i}` }))
        })
      });

      const result = await checkAssignmentCreationLimits('inst123', 'req123');
      
      expect(result.withinLimits).toBe(false);
      expect(result.current).toBe(60);
      expect(result.limit).toBe(50);
    });

    it('should handle database errors gracefully', async () => {
      mockQuery.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('Database connection failed'))
      });

      const result = await checkAssignmentCreationLimits('inst123', 'req123');
      
      expect(result.withinLimits).toBe(true);
      expect(result.current).toBe(0);
      expect(result.limit).toBe(50);
    });
  });

  describe('checkActiveCourses', () => {
    it('should return 0 for instructor with no active courses', async () => {
      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: []
        })
      });

      const result = await checkActiveCourses('inst123', 'req123');
      
      expect(result.count).toBe(0);
    });

    it('should return correct count for instructor with active courses', async () => {
      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [
            { courseId: 'CS101', status: 'active' },
            { courseId: 'CS102', status: 'active' },
            { courseId: 'CS103', status: 'active' }
          ]
        })
      });

      const result = await checkActiveCourses('inst123', 'req123');
      
      expect(result.count).toBe(3);
    });

    it('should handle database errors gracefully', async () => {
      mockQuery.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('Database connection failed'))
      });

      const result = await checkActiveCourses('inst123', 'req123');
      
      expect(result.count).toBe(0);
    });
  });

  describe('checkInstructorReviewStatus', () => {
    it('should return not flagged for normal instructor', async () => {
      mockGet.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: {
            userId: 'inst123',
            reviewStatus: 'CLEAR',
            warningCount: 0
          }
        })
      });

      const result = await checkInstructorReviewStatus('inst123', 'req123');
      
      expect(result.flagged).toBe(false);
      expect(result.reason).toBeUndefined();
    });

    it('should return flagged for instructor under review', async () => {
      mockGet.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: {
            userId: 'inst123',
            reviewStatus: 'FLAGGED',
            reviewReason: 'Multiple student complaints'
          }
        })
      });

      const result = await checkInstructorReviewStatus('inst123', 'req123');
      
      expect(result.flagged).toBe(true);
      expect(result.reason).toBe('Multiple student complaints');
    });

    it('should return flagged for instructor with multiple warnings', async () => {
      mockGet.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: {
            userId: 'inst123',
            reviewStatus: 'CLEAR',
            warningCount: 3
          }
        })
      });

      const result = await checkInstructorReviewStatus('inst123', 'req123');
      
      expect(result.flagged).toBe(true);
      expect(result.reason).toBe('Multiple warnings received (3)');
    });

    it('should return not flagged for instructor with few warnings', async () => {
      mockGet.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: {
            userId: 'inst123',
            reviewStatus: 'CLEAR',
            warningCount: 2
          }
        })
      });

      const result = await checkInstructorReviewStatus('inst123', 'req123');
      
      expect(result.flagged).toBe(false);
      expect(result.reason).toBeUndefined();
    });

    it('should handle missing instructor gracefully', async () => {
      mockGet.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: null
        })
      });

      const result = await checkInstructorReviewStatus('inst123', 'req123');
      
      expect(result.flagged).toBe(false);
      expect(result.reason).toBeUndefined();
    });

    it('should handle database errors gracefully', async () => {
      mockGet.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('Database connection failed'))
      });

      const result = await checkInstructorReviewStatus('inst123', 'req123');
      
      expect(result.flagged).toBe(false);
      expect(result.reason).toBeUndefined();
    });
  });

  describe('Integration Tests', () => {
    it('should perform complete access control validation for valid instructor', async () => {
      // Mock all successful validations
      mockGet.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: {
            userId: 'inst123',
            status: 'CONFIRMED',
            enabled: true,
            instructorStatus: 'ACTIVE',
            reviewStatus: 'CLEAR',
            warningCount: 0
          }
        })
      });

      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Items: [
            { courseId: 'CS101', status: 'active' },
            { courseId: 'CS102', status: 'active' }
          ]
        })
      });

      const result = await validateInstructorAccess(mockAuthenticatedUser, 'req123');
      
      expect(result.hasAccess).toBe(true);
      expect(result.reason).toBeUndefined();
      expect(result.code).toBeUndefined();
      expect(result.restrictions).toBeUndefined();
    });

    it('should deny access for instructor with multiple issues', async () => {
      // Mock instructor with multiple problems
      mockGet.mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Item: {
            userId: 'inst123',
            status: 'CONFIRMED',
            enabled: true,
            instructorStatus: 'SUSPENDED'
          }
        })
      });

      const result = await validateInstructorAccess(mockAuthenticatedUser, 'req123');
      
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBe('Instructor account is suspended');
      expect(result.code).toBe('INSTRUCTOR_INACTIVE');
    });

    it('should handle cascading validation failures gracefully', async () => {
      // Mock database connection failure
      mockGet.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('Database connection failed'))
      });

      const result = await validateInstructorAccess(mockAuthenticatedUser, 'req123');
      
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toBe('Error validating access permissions');
      expect(result.code).toBe('VALIDATION_ERROR');
    });
  });
});

