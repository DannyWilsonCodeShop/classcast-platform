import { APIGatewayProxyEvent } from 'aws-lambda';
import {
  verifyJwtToken,
  hasRole,
  hasGroup,
  canAccessResource,
  getUserCourseAccess,
  createAuthError,
  createSuccessResponse,
  type AuthenticatedUser
} from '../jwt-verifier';

// Mock aws-jwt-verify
jest.mock('aws-jwt-verify', () => ({
  CognitoJwtVerifier: {
    create: jest.fn(() => ({
      verify: jest.fn()
    }))
  }
}));

// Mock environment variables
const originalEnv = process.env;

describe('JWT Verifier', () => {
  let mockVerifier: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env = {
      ...originalEnv,
      USER_POOL_ID: 'test-user-pool-id',
      USER_POOL_CLIENT_ID: 'test-client-id'
    };

    // Get the mocked verifier instance
    const { CognitoJwtVerifier } = require('aws-jwt-verify');
    mockVerifier = CognitoJwtVerifier.create();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const createMockEvent = (headers: Record<string, string> = {}): APIGatewayProxyEvent => ({
    headers,
    multiValueHeaders: {},
    httpMethod: 'GET',
    isBase64Encoded: false,
    path: '/test',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: '',
    body: null
  });

  const createMockUser = (overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser => ({
    sub: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'student',
    department: 'Computer Science',
    studentId: 'STU123456',
    instructorId: undefined,
    groups: ['students'],
    isStudent: true,
    isInstructor: false,
    isAdmin: false,
    lastLogin: '2024-01-01T00:00:00Z',
    preferences: {},
    tokenUse: 'access',
    scope: 'openid email profile',
    authTime: 1704067200,
    exp: 1704153600,
    iat: 1704067200,
    ...overrides
  });

  describe('verifyJwtToken', () => {
    test('should successfully verify valid JWT token', async () => {
      const event = createMockEvent({
        Authorization: 'Bearer valid.jwt.token'
      });

      const mockPayload = {
        sub: 'test-user-id',
        email: 'test@example.com',
        given_name: 'Test',
        family_name: 'User',
        'custom:role': 'student',
        'custom:department': 'Computer Science',
        'custom:studentId': 'STU123456',
        groups: ['students'],
        isStudent: true,
        isInstructor: false,
        isAdmin: false,
        lastLogin: '2024-01-01T00:00:00Z',
        preferences: {},
        token_use: 'access',
        scope: 'openid email profile',
        auth_time: 1704067200,
        exp: 1704153600,
        iat: 1704067200
      };

      mockVerifier.verify.mockResolvedValue(mockPayload);

      const result = await verifyJwtToken(event);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.sub).toBe('test-user-id');
      expect(result.user?.email).toBe('test@example.com');
      expect(result.user?.firstName).toBe('Test');
      expect(result.user?.lastName).toBe('User');
      expect(result.user?.role).toBe('student');
      expect(result.user?.department).toBe('Computer Science');
      expect(result.user?.studentId).toBe('STU123456');
      expect(result.user?.groups).toEqual(['students']);
      expect(result.user?.isStudent).toBe(true);
      expect(result.user?.isInstructor).toBe(false);
      expect(result.user?.isAdmin).toBe(false);
    });

    test('should handle missing Authorization header', async () => {
      const event = createMockEvent();

      const result = await verifyJwtToken(event);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authorization header is missing');
      expect(result.statusCode).toBe(401);
    });

    test('should handle invalid Authorization header format', async () => {
      const event = createMockEvent({
        Authorization: 'InvalidFormat token'
      });

      const result = await verifyJwtToken(event);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid authorization format. Expected Bearer token');
      expect(result.statusCode).toBe(401);
    });

    test('should handle expired token', async () => {
      const event = createMockEvent({
        Authorization: 'Bearer expired.jwt.token'
      });

      const error = new Error('Token expired');
      error.message = 'expired';
      mockVerifier.verify.mockRejectedValue(error);

      const result = await verifyJwtToken(event);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Token has expired');
      expect(result.statusCode).toBe(401);
    });

    test('should handle invalid token', async () => {
      const event = createMockEvent({
        Authorization: 'Bearer invalid.jwt.token'
      });

      const error = new Error('Invalid token');
      error.message = 'invalid';
      mockVerifier.verify.mockRejectedValue(error);

      const result = await verifyJwtToken(event);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid token');
      expect(result.statusCode).toBe(401);
    });

    test('should handle unexpected verification errors', async () => {
      const event = createMockEvent({
        Authorization: 'Bearer error.jwt.token'
      });

      const error = new Error('Unexpected error');
      mockVerifier.verify.mockRejectedValue(error);

      const result = await verifyJwtToken(event);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Token verification failed');
      expect(result.statusCode).toBe(401);
    });

    test('should handle case-insensitive Authorization header', async () => {
      const event = createMockEvent({
        authorization: 'Bearer valid.jwt.token'
      });

      const mockPayload = {
        sub: 'test-user-id',
        email: 'test@example.com',
        given_name: 'Test',
        family_name: 'User',
        'custom:role': 'student',
        'custom:department': 'Computer Science'
      };

      mockVerifier.verify.mockResolvedValue(mockPayload);

      const result = await verifyJwtToken(event);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
    });

    test('should handle missing optional fields gracefully', async () => {
      const event = createMockEvent({
        Authorization: 'Bearer valid.jwt.token'
      });

      const mockPayload = {
        sub: 'test-user-id'
        // Missing optional fields
      };

      mockVerifier.verify.mockResolvedValue(mockPayload);

      const result = await verifyJwtToken(event);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe('');
      expect(result.user?.firstName).toBe('');
      expect(result.user?.lastName).toBe('');
      expect(result.user?.role).toBe('student');
      expect(result.user?.department).toBe('');
      expect(result.user?.groups).toEqual([]);
      expect(result.user?.isStudent).toBe(false);
      expect(result.user?.isInstructor).toBe(false);
      expect(result.user?.isAdmin).toBe(false);
    });

    test('should handle alternative field names', async () => {
      const event = createMockEvent({
        Authorization: 'Bearer valid.jwt.token'
      });

      const mockPayload = {
        sub: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test', // Direct field name
        lastName: 'User',  // Direct field name
        role: 'instructor', // Direct field name
        department: 'Engineering' // Direct field name
      };

      mockVerifier.verify.mockResolvedValue(mockPayload);

      const result = await verifyJwtToken(event);

      expect(result.success).toBe(true);
      expect(result.user?.firstName).toBe('Test');
      expect(result.user?.lastName).toBe('User');
      expect(result.user?.role).toBe('instructor');
      expect(result.user?.department).toBe('Engineering');
    });
  });

  describe('hasRole', () => {
    test('should return true for matching role', () => {
      const user = createMockUser({ role: 'instructor' });
      
      expect(hasRole(user, 'instructor')).toBe(true);
    });

    test('should return true for admin user regardless of role', () => {
      const user = createMockUser({ role: 'student', isAdmin: true });
      
      expect(hasRole(user, 'instructor')).toBe(true);
      expect(hasRole(user, 'admin')).toBe(true);
      expect(hasRole(user, 'student')).toBe(true);
    });

    test('should return false for non-matching role', () => {
      const user = createMockUser({ role: 'student' });
      
      expect(hasRole(user, 'instructor')).toBe(false);
    });

    test('should handle array of roles', () => {
      const user = createMockUser({ role: 'instructor' });
      
      expect(hasRole(user, ['instructor', 'admin'])).toBe(true);
      expect(hasRole(user, ['student', 'admin'])).toBe(false);
    });

    test('should handle empty role array', () => {
      const user = createMockUser({ role: 'student' });
      
      expect(hasRole(user, [])).toBe(false);
    });
  });

  describe('hasGroup', () => {
    test('should return true for matching group', () => {
      const user = createMockUser({ groups: ['students', 'honors'] });
      
      expect(hasGroup(user, 'students')).toBe(true);
      expect(hasGroup(user, 'honors')).toBe(true);
    });

    test('should return true for admin user regardless of groups', () => {
      const user = createMockUser({ groups: ['students'], isAdmin: true });
      
      expect(hasGroup(user, 'instructors')).toBe(true);
      expect(hasGroup(user, 'admins')).toBe(true);
    });

    test('should return false for non-matching group', () => {
      const user = createMockUser({ groups: ['students'] });
      
      expect(hasGroup(user, 'instructors')).toBe(false);
    });

    test('should handle array of groups', () => {
      const user = createMockUser({ groups: ['students', 'honors'] });
      
      expect(hasGroup(user, ['students', 'instructors'])).toBe(true);
      expect(hasGroup(user, ['instructors', 'admins'])).toBe(false);
    });

    test('should handle empty groups array', () => {
      const user = createMockUser({ groups: [] });
      
      expect(hasGroup(user, 'students')).toBe(false);
    });
  });

  describe('canAccessResource', () => {
    test('should return true for resource owner', () => {
      const user = createMockUser({ sub: 'user-123' });
      
      expect(canAccessResource(user, 'user-123')).toBe(true);
    });

    test('should return true for admin user', () => {
      const user = createMockUser({ sub: 'user-123', isAdmin: true });
      
      expect(canAccessResource(user, 'other-user-456')).toBe(true);
    });

    test('should return false for non-owner non-admin user', () => {
      const user = createMockUser({ sub: 'user-123', isAdmin: false });
      
      expect(canAccessResource(user, 'other-user-456')).toBe(false);
    });
  });

  describe('getUserCourseAccess', () => {
    test('should return full access for admin user', () => {
      const user = createMockUser({ isAdmin: true });
      
      const access = getUserCourseAccess(user);
      
      expect(access.canView).toBe(true);
      expect(access.canEdit).toBe(true);
      expect(access.canDelete).toBe(true);
      expect(access.scope).toBe('all');
    });

    test('should return department access for instructor user', () => {
      const user = createMockUser({ isInstructor: true, isAdmin: false });
      
      const access = getUserCourseAccess(user);
      
      expect(access.canView).toBe(true);
      expect(access.canEdit).toBe(true);
      expect(access.canDelete).toBe(false);
      expect(access.scope).toBe('department');
    });

    test('should return own access for student user', () => {
      const user = createMockUser({ isStudent: true, isInstructor: false, isAdmin: false });
      
      const access = getUserCourseAccess(user);
      
      expect(access.canView).toBe(true);
      expect(access.canEdit).toBe(false);
      expect(access.canDelete).toBe(false);
      expect(access.scope).toBe('own');
    });

    test('should return own access for user with no specific role', () => {
      const user = createMockUser({ 
        isStudent: false, 
        isInstructor: false, 
        isAdmin: false 
      });
      
      const access = getUserCourseAccess(user);
      
      expect(access.canView).toBe(false);
      expect(access.canEdit).toBe(false);
      expect(access.canDelete).toBe(false);
      expect(access.scope).toBe('own');
    });
  });

  describe('createAuthError', () => {
    test('should create proper authorization error response', () => {
      const result = createAuthError('Access denied', 403);
      
      expect(result.statusCode).toBe(403);
      expect(result.headers).toEqual({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
      });
      
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Authorization failed');
      expect(body.message).toBe('Access denied');
      expect(body.timestamp).toBeDefined();
    });

    test('should use default status code when not provided', () => {
      const result = createAuthError('Access denied');
      
      expect(result.statusCode).toBe(401);
    });
  });

  describe('createSuccessResponse', () => {
    test('should create proper success response with user context', () => {
      const user = createMockUser();
      const data = { message: 'Success' };
      
      const result = createSuccessResponse(data, user, 200);
      
      expect(result.statusCode).toBe(200);
      expect(result.headers).toEqual({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
      });
      
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(data);
      expect(body.user).toEqual({
        userId: 'test-user-id',
        role: 'student',
        department: 'Computer Science'
      });
      expect(body.timestamp).toBeDefined();
    });

    test('should use default status code when not provided', () => {
      const user = createMockUser();
      const data = { message: 'Success' };
      
      const result = createSuccessResponse(data, user);
      
      expect(result.statusCode).toBe(200);
    });
  });

  describe('Edge Cases', () => {
    test('should handle JWT token with minimal payload', async () => {
      const event = createMockEvent({
        Authorization: 'Bearer minimal.jwt.token'
      });

      const mockPayload = {
        sub: 'test-user-id'
        // Only required field
      };

      mockVerifier.verify.mockResolvedValue(mockPayload);

      const result = await verifyJwtToken(event);

      expect(result.success).toBe(true);
      expect(result.user?.sub).toBe('test-user-id');
      expect(result.user?.email).toBe('');
      expect(result.user?.firstName).toBe('');
      expect(result.user?.lastName).toBe('');
      expect(result.user?.role).toBe('student');
      expect(result.user?.department).toBe('');
    });

    test('should handle JWT token with all fields populated', async () => {
      const event = createMockEvent({
        Authorization: 'Bearer complete.jwt.token'
      });

      const mockPayload = {
        sub: 'test-user-id',
        email: 'test@example.com',
        given_name: 'Test',
        family_name: 'User',
        'custom:role': 'instructor',
        'custom:department': 'Engineering',
        'custom:instructorId': 'INS123456',
        groups: ['instructors', 'faculty'],
        isStudent: false,
        isInstructor: true,
        isAdmin: false,
        lastLogin: '2024-01-01T00:00:00Z',
        preferences: { theme: 'dark' },
        token_use: 'access',
        scope: 'openid email profile',
        auth_time: 1704067200,
        exp: 1704153600,
        iat: 1704067200
      };

      mockVerifier.verify.mockResolvedValue(mockPayload);

      const result = await verifyJwtToken(event);

      expect(result.success).toBe(true);
      expect(result.user?.instructorId).toBe('INS123456');
      expect(result.user?.preferences).toEqual({ theme: 'dark' });
    });

    test('should handle role precedence correctly', () => {
      const adminUser = createMockUser({ 
        role: 'student', 
        isAdmin: true,
        isInstructor: true,
        isStudent: true
      });
      
      // Admin should have access regardless of other roles
      expect(hasRole(adminUser, 'instructor')).toBe(true);
      expect(hasGroup(adminUser, 'admins')).toBe(true);
      expect(canAccessResource(adminUser, 'any-resource')).toBe(true);
      
      const access = getUserCourseAccess(adminUser);
      expect(access.scope).toBe('all');
    });
  });
});

