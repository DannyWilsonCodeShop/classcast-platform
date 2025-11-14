import jwt from 'jsonwebtoken';

export interface JwtUser {
  sub: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'instructor' | 'admin';
  studentId?: string;
  instructorId?: string;
  department?: string;
  emailVerified: boolean;
  iat: number;
  exp: number;
}

export interface JwtVerificationResult {
  success: boolean;
  user?: JwtUser;
  error?: string;
  statusCode?: number;
}

export const verifyJwtToken = async (token: string): Promise<JwtVerificationResult> => {
  try {
    // Get JWT secret from environment variables
    const jwtSecret = process.env['JWT_SECRET'];
    
    if (!jwtSecret) {
      console.error('JWT_SECRET environment variable not set');
      return {
        success: false,
        error: 'JWT secret not configured',
        statusCode: 500,
      };
    }

    // Verify and decode the JWT token
    const decoded = jwt.verify(token, jwtSecret) as JwtUser;

    // Check if token has expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTime) {
      return {
        success: false,
        error: 'Token expired',
        statusCode: 401,
      };
    }

    // Validate required fields
    if (!decoded.sub || !decoded.email || !decoded.role) {
      return {
        success: false,
        error: 'Invalid token payload',
        statusCode: 401,
      };
    }

    // Validate role
    if (!['student', 'instructor', 'admin'].includes(decoded.role)) {
      return {
        success: false,
        error: 'Invalid user role',
        statusCode: 401,
      };
    }

    // Return successful verification with user data
    return {
      success: true,
      user: {
        sub: decoded.sub,
        email: decoded.email,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        role: decoded.role,
        studentId: decoded.studentId,
        instructorId: decoded.instructorId,
        department: decoded.department,
        emailVerified: decoded.emailVerified,
        iat: decoded.iat,
        exp: decoded.exp,
      },
    };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return {
        success: false,
        error: 'Invalid token',
        statusCode: 401,
      };
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return {
        success: false,
        error: 'Token expired',
        statusCode: 401,
      };
    }
    
    if (error instanceof jwt.NotBeforeError) {
      return {
        success: false,
        error: 'Token not yet valid',
        statusCode: 401,
      };
    }

    console.error('JWT verification error:', error);
    return {
      success: false,
      error: 'Token verification failed',
      statusCode: 500,
    };
  }
};

// Helper function to extract user from request headers
export const extractUserFromRequest = async (request: Request): Promise<JwtVerificationResult> => {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'No authorization header or invalid format',
        statusCode: 401,
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    return await verifyJwtToken(token);
  } catch (error) {
    console.error('Error extracting user from request:', error);
    return {
      success: false,
      error: 'Failed to extract user from request',
      statusCode: 500,
    };
  }
};






