import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcryptjs';

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USERS_TABLE = 'classcast-users';

export async function POST(request: NextRequest) {
  try {
    console.log('=== SIMPLE LOGIN DEBUG ===');
    
    const body = await request.json();
    const { email, password } = body;
    
    console.log('Email:', email);
    console.log('Password provided:', !!password);

    // Basic validation
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email and password are required'
      }, { status: 400 });
    }

    console.log('Looking up user in DynamoDB...');
    
    // Look up user in DynamoDB
    const userResult = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email
      }
    }));

    console.log('DynamoDB result:', {
      count: userResult.Count,
      scannedCount: userResult.ScannedCount,
      items: userResult.Items?.length || 0
    });

    if (!userResult.Items || userResult.Items.length === 0) {
      console.log('User not found');
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    const userData = userResult.Items[0];
    console.log('User found:', {
      userId: userData.userId,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      hasPassword: !!userData.password
    });

    // Test password verification
    console.log('Testing password verification...');
    const passwordMatch = await bcrypt.compare(password, userData.password);
    console.log('Password match:', passwordMatch);

    if (!passwordMatch) {
      console.log('Password mismatch');
      return NextResponse.json({
        success: false,
        error: 'Invalid password'
      }, { status: 401 });
    }

    console.log('Login successful');
    
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: userData.userId,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role
      }
    });

  } catch (error) {
    console.error('Simple login error:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    return NextResponse.json({
      success: false,
      error: 'Login failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
