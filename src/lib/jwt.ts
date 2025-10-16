import jwt from 'jsonwebtoken';

// Use a more secure JWT secret - in production, this should be a strong random string
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-must-be-at-least-32-characters-long';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

// Rate limiting for token generation (in production, use Redis or similar)
const tokenGenerationAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS_PER_MINUTE = 10;

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export function generateTokens(user: {
  id: string;
  email: string;
  role: string;
}): TokenPair {
  // Rate limiting check
  const now = Date.now();
  const userAttempts = tokenGenerationAttempts.get(user.email);
  
  if (userAttempts) {
    if (now - userAttempts.lastAttempt < 60000) { // 1 minute window
      if (userAttempts.count >= MAX_ATTEMPTS_PER_MINUTE) {
        throw new Error('Too many token generation attempts. Please try again later.');
      }
      userAttempts.count++;
    } else {
      userAttempts.count = 1;
    }
    userAttempts.lastAttempt = now;
  } else {
    tokenGenerationAttempts.set(user.email, { count: 1, lastAttempt: now });
  }

  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'classcast-app',
    audience: 'classcast-users',
  });

  const refreshToken = jwt.sign(
    { userId: user.id, type: 'refresh', email: user.email },
    JWT_SECRET,
    {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      issuer: 'classcast-app',
      audience: 'classcast-users',
    }
  );

  return {
    accessToken,
    refreshToken,
  };
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'classcast-app',
      audience: 'classcast-users',
    }) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

export function verifyRefreshToken(token: string): { userId: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'classcast-app',
      audience: 'classcast-users',
    }) as any;
    if (decoded.type === 'refresh') {
      return { userId: decoded.userId, email: decoded.email };
    }
    return null;
  } catch (error) {
    console.error('Refresh token verification failed:', error);
    return null;
  }
}

export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}

// Clean up old rate limiting entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [email, attempts] of tokenGenerationAttempts.entries()) {
    if (now - attempts.lastAttempt > 300000) { // 5 minutes
      tokenGenerationAttempts.delete(email);
    }
  }
}, 300000); // Clean up every 5 minutes
