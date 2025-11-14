import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcryptjs';

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USERS_TABLE = 'classcast-users';

export async function POST(request: NextRequest) {
  try {
    console.log('=== LEGACY PASSWORD RESET ===');
    
    const body = await request.json();
    const { email, newPassword } = body;
    
    console.log('Email:', email);
    console.log('New password provided:', !!newPassword);

    if (!email || !newPassword) {
      return NextResponse.json({
        success: false,
        error: 'Email and new password are required'
      }, { status: 400 });
    }

    // Look up user in DynamoDB
    console.log('Looking up user in DynamoDB...');
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
      hasPassword: !!userData.password,
      passwordLength: userData.password?.length || 0
    });

    // Hash the new password
    console.log('Hashing new password...');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('Password hashed successfully');

    // Update the user's password
    console.log('Updating user password...');
    const updateResult = await docClient.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: {
        userId: userData.userId
      },
      UpdateExpression: 'SET password = :password, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':password': hashedPassword,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'UPDATED_NEW'
    }));

    console.log('Password updated successfully:', updateResult);

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully for legacy user',
      user: {
        id: userData.userId,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role
      }
    });

  } catch (error) {
    console.error('Legacy password reset error:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    return NextResponse.json({
      success: false,
      error: 'Password reset failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
