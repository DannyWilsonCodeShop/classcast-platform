import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = 'classcast-users';

/**
 * Search users by email address and role
 * GET /api/users/search?email=user@example.com&role=instructor
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const role = searchParams.get('role'); // Optional: filter by role

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Searching for user:', { email, role });

    // Build filter expression
    let filterExpressions: string[] = [];
    let expressionAttributeValues: { [key: string]: any } = {};
    let expressionAttributeNames: { [key: string]: string } = {};

    // Always filter by email (case-insensitive partial match)
    filterExpressions.push('contains(#email, :email)');
    expressionAttributeValues[':email'] = email.toLowerCase();
    expressionAttributeNames['#email'] = 'email';

    // Add role filter if specified
    if (role) {
      filterExpressions.push('#role = :role');
      expressionAttributeValues[':role'] = role;
      expressionAttributeNames['#role'] = 'role';
    }

    const scanCommand: any = {
      TableName: USERS_TABLE,
      FilterExpression: filterExpressions.join(' AND '),
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
      Limit: 10 // Limit results to prevent overwhelming response
    };

    const result = await docClient.send(new ScanCommand(scanCommand));

    // Format the response to only include necessary fields
    const users = (result.Items || []).map((user: any) => ({
      id: user.userId || user.id,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User',
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    }));

    console.log(`✅ Found ${users.length} users matching search criteria`);

    return NextResponse.json({
      success: true,
      users,
      count: users.length,
      searchCriteria: { email, role }
    });

  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to search users',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
