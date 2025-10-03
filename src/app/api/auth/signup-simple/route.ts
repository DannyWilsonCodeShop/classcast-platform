import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcryptjs';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = 'classcast-users';

export async function POST(request: NextRequest) {
  try {
    console.log('=== SIMPLE SIGNUP API CALLED ===');
    
    const body = await request.json();
    const { email, firstName, lastName, password, role, studentId, department, instructorCode } = body;

    console.log('Signup request:', { email, firstName, lastName, role });

    // Basic validation
    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: { message: 'Missing required fields' } },
        { status: 400 }
      );
    }

    if (role !== 'student' && role !== 'instructor' && role !== 'admin') {
      return NextResponse.json(
        { error: { message: 'Invalid role specified' } },
        { status: 400 }
      );
    }

    if (role === 'instructor' && !department) {
      return NextResponse.json(
        { error: { message: 'Department is required for instructor role' } },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: { message: 'Password must be at least 8 characters long' } },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUserResult = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email
      }
    }));

    if (existingUserResult.Items && existingUserResult.Items.length > 0) {
      return NextResponse.json(
        { error: { message: 'User with this email already exists' } },
        { status: 400 }
      );
    }

    // Generate user ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user object
    const userData = {
      userId,
      email,
      firstName,
      lastName,
      role,
      password: hashedPassword,
      emailVerified: true, // For now, skip email verification
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(role === 'student' && studentId && { studentId }),
      ...(role === 'instructor' && { 
        department,
        instructorCode: instructorCode || `INS-${Date.now()}`
      }),
    };

    // Save user to database
    await docClient.send(new PutCommand({
      TableName: USERS_TABLE,
      Item: userData
    }));

    console.log('User created successfully:', userId);

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: userId,
        email,
        firstName,
        lastName,
        role,
        studentId: role === 'student' ? studentId : undefined,
        instructorId: role === 'instructor' ? userData.instructorCode : undefined,
        department: role === 'instructor' ? department : undefined,
        emailVerified: true
      }
    });

  } catch (error) {
    console.error('Simple signup error:', error);
    
    return NextResponse.json(
      { error: { message: 'Failed to create account. Please try again later' } },
      { status: 500 }
    );
  }
}
