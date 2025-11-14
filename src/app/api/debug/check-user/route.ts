import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USERS_TABLE = 'classcast-users';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    console.log('Checking user existence for:', email);

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
        success: true,
        exists: false,
        message: 'User not found in database',
        email: email
      });
    }

    const userData = userResult.Items[0];
    return NextResponse.json({
      success: true,
      exists: true,
      message: 'User found in database',
      email: email,
      user: {
        userId: userData.userId,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        hasPassword: !!userData.password,
        emailVerified: userData.emailVerified,
        createdAt: userData.createdAt
      }
    });

  } catch (error) {
    console.error('Error checking user:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to check user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
