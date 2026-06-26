import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcryptjs';

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USERS_TABLE = 'classcast-users';

/**
 * POST /api/auth/change-password
 * 
 * Changes the password for a logged-in user by verifying current password first.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, currentPassword, newPassword } = body;

    if (!email || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: { message: 'Email, current password, and new password are required' } },
        { status: 400 }
      );
    }

    // Password complexity validation for new password
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: { message: 'New password must be at least 8 characters long' } },
        { status: 400 }
      );
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(newPassword)) {
      return NextResponse.json(
        { error: { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' } },
        { status: 400 }
      );
    }

    // Find the user
    const sanitizedEmail = email.toLowerCase().trim();
    const userResult = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': sanitizedEmail },
      Limit: 1,
    }));

    if (!userResult.Items || userResult.Items.length === 0) {
      return NextResponse.json(
        { error: { message: 'User not found' } },
        { status: 404 }
      );
    }

    const user = userResult.Items[0];

    // Verify current password
    const storedPassword = user.password || user.passwordHash;
    if (!storedPassword) {
      return NextResponse.json(
        { error: { message: 'Account does not support password change. Please use forgot password instead.' } },
        { status: 400 }
      );
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, storedPassword);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: { message: 'Current password is incorrect' } },
        { status: 401 }
      );
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(12);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update the password in DynamoDB
    const userKey = user.id || user.email;
    try {
      await docClient.send(new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { id: userKey },
        UpdateExpression: 'SET password = :newPwd, passwordHash = :newPwd, updatedAt = :now',
        ExpressionAttributeValues: {
          ':newPwd': newPasswordHash,
          ':now': new Date().toISOString(),
        },
      }));
    } catch (updateErr: any) {
      // Try with email as key if id doesn't work
      if (updateErr.name === 'ValidationException') {
        await docClient.send(new UpdateCommand({
          TableName: USERS_TABLE,
          Key: { email: sanitizedEmail },
          UpdateExpression: 'SET password = :newPwd, passwordHash = :newPwd, updatedAt = :now',
          ExpressionAttributeValues: {
            ':newPwd': newPasswordHash,
            ':now': new Date().toISOString(),
          },
        }));
      } else {
        throw updateErr;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('[Change Password] Error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to change password. Please try again.' } },
      { status: 500 }
    );
  }
}
