import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USERS_TABLE = 'classcast-users';

// Password reset tokens storage (in production, use Redis or database)
const resetTokens = new Map<string, { userId: string; expiresAt: number }>();
const TOKEN_EXPIRY = 30 * 60 * 1000; // 30 minutes

export async function POST(request: NextRequest) {
  try {
    console.log('=== PASSWORD RESET API CALLED ===');
    
    const body = await request.json();
    const { email, currentPassword, newPassword, token } = body;
    
    // Rate limiting for password reset attempts
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    // Input validation
    if (!email || !newPassword) {
      return NextResponse.json(
        { error: { message: 'Email and new password are required' } },
        { status: 400 }
      );
    }

    // Password strength validation
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: { message: 'Password must be at least 8 characters long' } },
        { status: 400 }
      );
    }

    // Password complexity validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(newPassword)) {
      return NextResponse.json(
        { error: { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' } },
        { status: 400 }
      );
    }

    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedNewPassword = newPassword.trim();

    // Look up user in DynamoDB
    const userResult = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': sanitizedEmail
      }
    }));

    if (!userResult.Items || userResult.Items.length === 0) {
      return NextResponse.json(
        { error: { message: 'No account found with this email address' } },
        { status: 404 }
      );
    }

    const userData = userResult.Items[0];

    // If token is provided, verify it
    if (token) {
      const tokenData = resetTokens.get(token);
      if (!tokenData || tokenData.expiresAt < Date.now()) {
        return NextResponse.json(
          { error: { message: 'Invalid or expired reset token' } },
          { status: 400 }
        );
      }

      if (tokenData.userId !== userData.userId) {
        return NextResponse.json(
          { error: { message: 'Invalid reset token for this user' } },
          { status: 400 }
        );
      }

      // Remove the used token
      resetTokens.delete(token);
    } else if (currentPassword) {
      // Verify current password
      const sanitizedCurrentPassword = currentPassword.trim();
      let passwordMatch = false;

      try {
        passwordMatch = await bcrypt.compare(sanitizedCurrentPassword, userData.password);
      } catch (bcryptError) {
        // Legacy password support
        if (userData.password === sanitizedCurrentPassword) {
          passwordMatch = true;
        }
      }

      if (!passwordMatch) {
        return NextResponse.json(
          { error: { message: 'Current password is incorrect' } },
          { status: 401 }
        );
      }
    } else {
      return NextResponse.json(
        { error: { message: 'Either current password or reset token is required' } },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(sanitizedNewPassword, 12);

    // Update user password in DynamoDB
    await docClient.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: {
        userId: userData.userId
      },
      UpdateExpression: 'SET password = :password, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':password': hashedPassword,
        ':updatedAt': new Date().toISOString()
      }
    }));

    console.log('Password updated successfully for user:', sanitizedEmail);

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Internal server error. Please try again later',
          details: error instanceof Error ? error.message : 'Unknown error'
        } 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json(
        { error: { message: 'Email is required' } },
        { status: 400 }
      );
    }

    const sanitizedEmail = email.toLowerCase().trim();

    // Look up user in DynamoDB
    const userResult = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': sanitizedEmail
      }
    }));

    if (!userResult.Items || userResult.Items.length === 0) {
      return NextResponse.json(
        { error: { message: 'No account found with this email address' } },
        { status: 404 }
      );
    }

    const userData = userResult.Items[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + TOKEN_EXPIRY;

    // Store reset token
    resetTokens.set(resetToken, {
      userId: userData.userId,
      expiresAt: expiresAt
    });

    // In production, send email with reset link
    // For now, we'll return the token (this should be sent via email)
    console.log(`Password reset token generated for ${sanitizedEmail}: ${resetToken}`);

    return NextResponse.json({
      success: true,
      message: 'Password reset token generated',
      // In production, don't return the token - send it via email instead
      resetToken: resetToken, // Remove this in production
      expiresIn: TOKEN_EXPIRY
    });

  } catch (error) {
    console.error('Password reset token generation error:', error);
    
    return NextResponse.json(
      { 
        error: { 
          message: 'Internal server error. Please try again later',
          details: error instanceof Error ? error.message : 'Unknown error'
        } 
      },
      { status: 500 }
    );
  }
}

// Clean up expired tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of resetTokens.entries()) {
    if (data.expiresAt < now) {
      resetTokens.delete(token);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes