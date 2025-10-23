import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcryptjs';
import { generateTokens } from '@/lib/jwt';
import crypto from 'crypto';

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USERS_TABLE = 'classcast-users';

// Rate limiting for login attempts (in production, use Redis or similar)
const loginAttempts = new Map<string, { count: number; lastAttempt: number; blockedUntil?: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes

// CSRF protection
function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function verifyCSRFToken(token: string, sessionToken: string): boolean {
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(sessionToken));
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== JWT-BASED LOGIN API CALLED ===');
    
    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const now = Date.now();
    const userAttempts = loginAttempts.get(clientIP);
    
    if (userAttempts) {
      if (userAttempts.blockedUntil && now < userAttempts.blockedUntil) {
        return NextResponse.json(
          { error: { message: 'Too many login attempts. Please try again later.' } },
          { status: 429 }
        );
      }
      
      if (now - userAttempts.lastAttempt < ATTEMPT_WINDOW) {
        if (userAttempts.count >= MAX_LOGIN_ATTEMPTS) {
          userAttempts.blockedUntil = now + BLOCK_DURATION;
          return NextResponse.json(
            { error: { message: 'Too many login attempts. Please try again later.' } },
            { status: 429 }
          );
        }
        userAttempts.count++;
      } else {
        userAttempts.count = 1;
        userAttempts.blockedUntil = undefined;
      }
      userAttempts.lastAttempt = now;
    } else {
      loginAttempts.set(clientIP, { count: 1, lastAttempt: now });
    }
    
    const body = await request.json();
    const { email, password, csrfToken } = body;
    
    console.log('Login request:', { email, password: password ? '***' : 'undefined' });

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: { message: 'Email and password are required' } },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: { message: 'Please enter a valid email address' } },
        { status: 400 }
      );
    }

    // Password strength validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: { message: 'Password must be at least 8 characters long' } },
        { status: 400 }
      );
    }

    // Password complexity validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { error: { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' } },
        { status: 400 }
      );
    }

    // Input sanitization
    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedPassword = password.trim();

    // Check for test credentials first
    const testUsers = [
      {
        email: 'teststudent@classcast.com',
        password: 'TestPassword123!',
        user: {
          id: 'test-student-123',
          email: 'teststudent@classcast.com',
          firstName: 'Test',
          lastName: 'Student',
          role: 'student' as const,
          avatar: '/api/placeholder/40/40',
          emailVerified: true,
          bio: 'Test student account',
          careerGoals: 'Learn and grow',
          classOf: '2025',
          funFact: 'I love testing!',
          favoriteSubject: 'Math',
          hobbies: 'Coding, Reading',
          schoolName: 'Test University',
        }
      },
      {
        email: 'testinstructor@classcast.com',
        password: 'TestPassword123!',
        user: {
          id: 'test-instructor-123',
          email: 'testinstructor@classcast.com',
          firstName: 'Test',
          lastName: 'Instructor',
          role: 'instructor' as const,
          avatar: '/api/placeholder/40/40',
          emailVerified: true,
          bio: 'Test instructor account',
          careerGoals: 'Teach and inspire',
          classOf: '2020',
          funFact: 'I love teaching!',
          favoriteSubject: 'Mathematics',
          hobbies: 'Teaching, Research',
          schoolName: 'Test University',
        }
      }
    ];

        const testUser = testUsers.find(u => u.email === sanitizedEmail && u.password === sanitizedPassword);
    
    if (testUser) {
      console.log('Using test credentials for:', email);
      
      // Generate JWT tokens for test users
      const tokens = generateTokens({
        id: testUser.user.id,
        email: testUser.user.email,
        role: testUser.user.role,
      });

      return NextResponse.json({
        success: true,
        user: testUser.user,
        tokens,
      });
    }

    // Look up user in DynamoDB
    console.log('Looking up user in DynamoDB:', email);
    
    let userData;
    try {
        const userResult = await docClient.send(new ScanCommand({
          TableName: USERS_TABLE,
          FilterExpression: 'email = :email',
          ExpressionAttributeValues: {
            ':email': sanitizedEmail
          }
        }));

      console.log('DynamoDB scan result:', {
        count: userResult.Count,
        scannedCount: userResult.ScannedCount,
        items: userResult.Items?.length || 0
      });

      if (!userResult.Items || userResult.Items.length === 0) {
        console.log('User not found in DynamoDB:', email);
        return NextResponse.json(
          { error: { message: 'No account found with this email address' } },
          { status: 401 }
        );
      }

      userData = userResult.Items[0];
      console.log('Found user data:', {
        userId: userData.userId,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        hasPassword: !!userData.password
      });
    } catch (dbError) {
      console.error('DynamoDB lookup error:', dbError);
      throw dbError;
    }
    
    // Verify password - handle legacy users
    let passwordMatch = false;
    
    // Check if user has a valid password field
    if (!userData.password) {
      console.log('User has no password field - legacy user needs password reset');
      return NextResponse.json(
        { error: { message: 'Account needs password reset. Please contact support or create a new account.' } },
        { status: 401 }
      );
    }
    
        try {
          // First try bcrypt comparison (new format)
          passwordMatch = await bcrypt.compare(sanitizedPassword, userData.password);
          console.log('Bcrypt password match:', passwordMatch);
        } catch (bcryptError) {
          console.log('Bcrypt comparison failed, trying legacy format:', bcryptError);
          
          // If bcrypt fails, try simple string comparison for legacy users
          // This is a temporary migration solution
          if (userData.password === sanitizedPassword) {
            passwordMatch = true;
            console.log('Legacy password match found');
            
            // Update the user to use bcrypt for future logins
            try {
              const hashedPassword = await bcrypt.hash(sanitizedPassword, 12); // Increased rounds for better security
              // Note: We can't update the user here without the UpdateCommand
              // This is just for logging purposes
              console.log('User needs password migration to bcrypt');
            } catch (hashError) {
              console.log('Failed to hash password for migration:', hashError);
            }
          }
        }
    
        if (!passwordMatch) {
          console.log('Password mismatch for user:', sanitizedEmail);
          return NextResponse.json(
            { error: { message: 'Invalid email or password' } },
            { status: 401 }
          );
        }

        // Reset login attempts on successful login
        loginAttempts.delete(clientIP);

        console.log('Authentication successful for user:', sanitizedEmail);
    
        // Create user object with safe defaults for legacy users
        const user = {
          id: userData.userId || userData.id || 'unknown',
          email: userData.email || sanitizedEmail,
          firstName: userData.firstName || userData.first_name || '',
          lastName: userData.lastName || userData.last_name || '',
          role: userData.role || 'student',
          avatar: userData.avatar || '/api/placeholder/40/40',
          emailVerified: userData.emailVerified || userData.email_verified || false,
          bio: userData.bio || '',
          careerGoals: userData.careerGoals || userData.career_goals || '',
          classOf: userData.classOf || userData.class_of || '',
          funFact: userData.funFact || userData.fun_fact || '',
          favoriteSubject: userData.favoriteSubject || userData.favorite_subject || '',
          hobbies: userData.hobbies || '',
          schoolName: userData.schoolName || userData.school_name || '',
          studentId: userData.studentId || userData.student_id,
          instructorId: userData.instructorCode || userData.instructor_code,
          department: userData.department || '',
        };
    
    console.log('Created user object:', {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    });

    // Generate JWT tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      user,
      tokens,
    });
  } catch (error) {
    console.error('Login request error:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: { message: 'Invalid request format' } },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Internal server error. Please try again later',
          details: error instanceof Error ? error.message : 'Unknown error'
        } 
      },
      { status: 500 }
    );
  }
}

// Clean up old login attempts periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, attempts] of loginAttempts.entries()) {
    if (now - attempts.lastAttempt > ATTEMPT_WINDOW && !attempts.blockedUntil) {
      loginAttempts.delete(ip);
    }
  }
}, ATTEMPT_WINDOW); // Clean up every 15 minutes