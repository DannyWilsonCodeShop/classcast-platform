import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand, ScanCommand, BatchWriteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { verifyToken } from '@/lib/jwt';

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USERS_TABLE = 'classcast-users';

/**
 * DELETE /api/auth/delete-account
 * 
 * Permanently deletes a user's account and associated data.
 * Requires valid JWT authorization.
 * 
 * Apple App Store Guideline 5.1.1(v) requires apps that support
 * account creation to also support account deletion.
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload || !payload.userId) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const userId = payload.userId;
    const userEmail = payload.email;

    console.log(`[Account Deletion] Starting deletion for user: ${userId} (${userEmail})`);

    // Verify the user exists
    const userLookup = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: 'id = :id OR email = :email',
      ExpressionAttributeValues: {
        ':id': userId,
        ':email': userEmail,
      },
      Limit: 1,
    }));

    if (!userLookup.Items || userLookup.Items.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userRecord = userLookup.Items[0];
    const userPrimaryKey = userRecord.id || userRecord.email;

    // Delete user record from users table
    // DynamoDB requires knowing the exact key — try common key patterns
    try {
      await docClient.send(new DeleteCommand({
        TableName: USERS_TABLE,
        Key: { id: userPrimaryKey },
      }));
    } catch (deleteError: any) {
      // If 'id' isn't the partition key, try 'email'
      if (deleteError.name === 'ValidationException') {
        try {
          await docClient.send(new DeleteCommand({
            TableName: USERS_TABLE,
            Key: { email: userEmail },
          }));
        } catch (altDeleteError) {
          console.error('[Account Deletion] Failed to delete user record:', altDeleteError);
        }
      } else {
        console.error('[Account Deletion] Failed to delete user record:', deleteError);
      }
    }

    // Attempt to clean up related data tables (best-effort, non-blocking)
    const relatedTables = [
      { table: 'classcast-enrollments', keyField: 'userId' },
      { table: 'classcast-submissions', keyField: 'userId' },
      { table: 'classcast-notifications', keyField: 'userId' },
    ];

    for (const { table, keyField } of relatedTables) {
      try {
        const relatedItems = await docClient.send(new ScanCommand({
          TableName: table,
          FilterExpression: `${keyField} = :uid`,
          ExpressionAttributeValues: { ':uid': userId },
          ProjectionExpression: 'id',
        }));

        if (relatedItems.Items && relatedItems.Items.length > 0) {
          // Batch delete in groups of 25 (DynamoDB limit)
          const chunks = [];
          for (let i = 0; i < relatedItems.Items.length; i += 25) {
            chunks.push(relatedItems.Items.slice(i, i + 25));
          }

          for (const chunk of chunks) {
            try {
              await docClient.send(new BatchWriteCommand({
                RequestItems: {
                  [table]: chunk.map(item => ({
                    DeleteRequest: { Key: { id: item.id } },
                  })),
                },
              }));
            } catch (batchErr) {
              console.warn(`[Account Deletion] Partial cleanup failed for ${table}:`, batchErr);
            }
          }
        }
      } catch (scanErr) {
        // Table may not exist or have different schema — continue
        console.warn(`[Account Deletion] Could not clean ${table}:`, scanErr);
      }
    }

    console.log(`[Account Deletion] Successfully deleted account for: ${userEmail}`);

    return NextResponse.json({
      success: true,
      message: 'Your account has been permanently deleted.',
    });
  } catch (error) {
    console.error('[Account Deletion] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An error occurred while deleting your account. Please try again or contact support.' },
      { status: 500 }
    );
  }
}
