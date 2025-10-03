import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcryptjs';

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USERS_TABLE = 'classcast-users';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log('Testing password for:', email);

    // Look up user in DynamoDB
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
      return NextResponse.json({
        success: false,
        message: 'User not found in database',
        email: email
      });
    }

    const userData = userResult.Items[0];
    console.log('Found user data:', {
      userId: userData.userId,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      hasPassword: !!userData.password,
      passwordLength: userData.password?.length || 0
    });

    // Test password verification
    try {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      console.log('Password match result:', passwordMatch);
      
      return NextResponse.json({
        success: true,
        message: 'Password verification completed',
        email: email,
        passwordMatch: passwordMatch,
        user: {
          userId: userData.userId,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          hasPassword: !!userData.password,
          passwordLength: userData.password?.length || 0
        }
      });
    } catch (bcryptError) {
      console.error('Bcrypt error:', bcryptError);
      return NextResponse.json({
        success: false,
        message: 'Password verification failed',
        error: bcryptError instanceof Error ? bcryptError.message : 'Unknown bcrypt error',
        email: email
      });
    }

  } catch (error) {
    console.error('Error testing password:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to test password',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
