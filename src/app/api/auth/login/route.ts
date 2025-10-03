import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcryptjs';
import { generateTokens } from '@/lib/jwt';

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USERS_TABLE = 'classcast-users';

export async function POST(request: NextRequest) {
  try {
    console.log('=== JWT-BASED LOGIN API CALLED ===');
    
    const body = await request.json();
    const { email, password } = body;
    
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

    // Password length validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: { message: 'Password must be at least 8 characters long' } },
        { status: 400 }
      );
    }

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

    const testUser = testUsers.find(u => u.email === email && u.password === password);
    
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
          ':email': email
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
    
    // Verify password
    const passwordMatch = await bcrypt.compare(password, userData.password);
    
    if (!passwordMatch) {
      console.log('Password mismatch for user:', email);
      return NextResponse.json(
        { error: { message: 'Invalid email or password' } },
        { status: 401 }
      );
    }

    console.log('Authentication successful for user:', email);
    
    // Create user object
    const user = {
      id: userData.userId,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      avatar: userData.avatar || '/api/placeholder/40/40',
      emailVerified: userData.emailVerified || false,
      bio: userData.bio || '',
      careerGoals: userData.careerGoals || '',
      classOf: userData.classOf || '',
      funFact: userData.funFact || '',
      favoriteSubject: userData.favoriteSubject || '',
      hobbies: userData.hobbies || '',
      schoolName: userData.schoolName || '',
      studentId: userData.studentId,
      instructorId: userData.instructorCode,
      department: userData.department,
    };

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