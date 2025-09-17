import { NextRequest, NextResponse } from 'next/server';
import { dynamoDBService } from '../../../lib/dynamodb';
import { User, UserRole, UserStatus } from '../../../types/dynamodb';

// GET /api/users - Get all users or filter by role
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const limit = parseInt(searchParams.get('limit') || '100');

    let users: User[] = [];

    if (role) {
      // Get users by specific role
      users = await dynamoDBService.getUsersByRole(role, limit);
    } else {
      // Get all users (use scan for small datasets, consider pagination for large ones)
      const response = await dynamoDBService.scan({
        TableName: 'classcast-users',
        Limit: limit,
        ProjectionExpression: 'userId, email, firstName, lastName, role, status, createdAt',
      });
      users = response.Items;
    }

    return NextResponse.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch users',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['email', 'firstName', 'lastName', 'role'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          {
            success: false,
            error: `Missing required field: ${field}`,
          },
          { status: 400 }
        );
      }
    }

    // Generate unique user ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create user object
    const user: User = {
      userId,
      email: body.email.toLowerCase(),
      firstName: body.firstName,
      lastName: body.lastName,
      role: body.role as UserRole,
      status: UserStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      profile: body.profile || {},
      preferences: body.preferences || {
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          push: false,
          sms: false,
        },
      },
      // Set TTL for 1 year from now (optional cleanup)
      ttl: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
    };

    // Validate role
    if (!Object.values(UserRole).includes(user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid role: ${user.role}. Valid roles are: ${Object.values(UserRole).join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Check if user with email already exists
    const existingUser = await dynamoDBService.getUserByEmail(user.email);
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User with this email already exists',
        },
        { status: 409 }
      );
    }

    // Create user in DynamoDB
    await dynamoDBService.createUser(user);

    // Return user without sensitive information
    const { passwordHash, ...userResponse } = user;

    return NextResponse.json(
      {
        success: true,
        data: userResponse,
        message: 'User created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create user',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
