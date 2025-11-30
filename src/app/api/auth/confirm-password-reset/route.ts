import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USERS_TABLE = 'classcast-users';
const RESET_TOKENS_TABLE = 'classcast-password-reset-tokens';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, token, newPassword } = body;

    // Validation
    if (!email || !token || !newPassword) {
      return NextResponse.json(
        { error: { message: 'Email, token, and new password are required' } },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: { message: 'Password must be at least 8 characters long' } },
        { status: 400 }
      );
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(newPassword)) {
      return NextResponse.json(
        { error: { message: 'Password must contain uppercase, lowercase, number, and special character' } },
        { status: 400 }
      );
    }

    const sanitizedEmail = email.toLowerCase().trim();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Get reset token
    const tokenResponse = await docClient.send(new GetCommand({
      TableName: RESET_TOKENS_TABLE,
      Key: { email: sanitizedEmail }
    }));

    if (!tokenResponse.Item) {
      return NextResponse.json(
        { error: { message: 'Invalid or expired reset token' } },
        { status: 400 }
      );
    }

    const tokenData = tokenResponse.Item;

    // Verify token
    if (tokenData.tokenHash !== tokenHash) {
      return NextResponse.json(
        { error: { message: 'Invalid reset token' } },
        { status: 400 }
      );
    }

    // Check expiration
    if (Date.now() > tokenData.expiresAt) {
      await docClient.send(new DeleteCommand({
        TableName: RESET_TOKENS_TABLE,
        Key: { email: sanitizedEmail }
      }));
      return NextResponse.json(
        { error: { message: 'Reset token has expired. Please request a new one.' } },
        { status: 400 }
      );
    }

    // Check if already used
    if (tokenData.used) {
      return NextResponse.json(
        { error: { message: 'This reset token has already been used' } },
        { status: 400 }
      );
    }

    // Find user by email
    const userResponse = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': sanitizedEmail
      },
      Limit: 1
    }));

    if (!userResponse.Items || userResponse.Items.length === 0) {
      return NextResponse.json(
        { error: { message: 'User not found' } },
        { status: 404 }
      );
    }

    const user = userResponse.Items[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password (using userId as primary key)
    await docClient.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { userId: user.userId },
      UpdateExpression: 'SET password = :password, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':password': hashedPassword,
        ':updatedAt': new Date().toISOString()
      }
    }));

    // Mark token as used
    await docClient.send(new UpdateCommand({
      TableName: RESET_TOKENS_TABLE,
      Key: { email: sanitizedEmail },
      UpdateExpression: 'SET used = :used',
      ExpressionAttributeValues: {
        ':used': true
      }
    }));

    console.log('Password reset successful for:', sanitizedEmail);

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.'
    });

  } catch (error) {
    console.error('Password reset confirmation error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to reset password. Please try again.' } },
      { status: 500 }
    );
  }
}
