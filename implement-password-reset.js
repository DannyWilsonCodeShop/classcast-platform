const fs = require('fs');
const path = require('path');

console.log('🔧 Implementing Custom Password Reset System...\n');
console.log('This will create a complete password reset flow for DynamoDB users.\n');
console.log('='.repeat(60));

const files = [
  {
    path: 'src/app/api/auth/request-password-reset/route.ts',
    description: 'API endpoint to request password reset (sends email)',
    content: `import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import crypto from 'crypto';

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sesClient = new SESClient({ region: 'us-east-1' });

const USERS_TABLE = 'classcast-users';
const RESET_TOKENS_TABLE = 'classcast-password-reset-tokens';
const FROM_EMAIL = process.env.SMTP_FROM || 'ClassCast <noreply@myclasscast.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://class-cast.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: { message: 'Email is required' } },
        { status: 400 }
      );
    }

    const sanitizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const userResponse = await docClient.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { email: sanitizedEmail }
    }));

    // Always return success to prevent email enumeration
    if (!userResponse.Item) {
      console.log('User not found:', sanitizedEmail);
      return NextResponse.json({
        success: true,
        message: 'If an account exists with that email, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour

    // Store reset token in DynamoDB
    await docClient.send(new PutCommand({
      TableName: RESET_TOKENS_TABLE,
      Item: {
        email: sanitizedEmail,
        tokenHash: resetTokenHash,
        expiresAt,
        createdAt: Date.now(),
        used: false
      }
    }));

    // Send reset email
    const resetUrl = \`\${APP_URL}/reset-password?token=\${resetToken}&email=\${encodeURIComponent(sanitizedEmail)}\`;
    
    const emailParams = {
      Source: FROM_EMAIL,
      Destination: {
        ToAddresses: [sanitizedEmail]
      },
      Message: {
        Subject: {
          Data: 'Reset Your ClassCast Password'
        },
        Body: {
          Html: {
            Data: \`
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
                  .content { padding: 30px; background: #f9f9f9; }
                  .button { display: inline-block; padding: 12px 30px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                  .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>Password Reset Request</h1>
                  </div>
                  <div class="content">
                    <p>Hello,</p>
                    <p>We received a request to reset your ClassCast password. Click the button below to create a new password:</p>
                    <p style="text-align: center;">
                      <a href="\${resetUrl}" class="button">Reset Password</a>
                    </p>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #4F46E5;">\${resetUrl}</p>
                    <p><strong>This link will expire in 1 hour.</strong></p>
                    <p>If you didn't request this password reset, you can safely ignore this email. Your password will not be changed.</p>
                  </div>
                  <div class="footer">
                    <p>© 2025 ClassCast. All rights reserved.</p>
                    <p>If you have questions, contact us at support@myclasscast.com</p>
                  </div>
                </div>
              </body>
              </html>
            \`
          },
          Text: {
            Data: \`
Password Reset Request

We received a request to reset your ClassCast password.

Click this link to reset your password:
\${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, you can safely ignore this email.

© 2025 ClassCast
            \`
          }
        }
      }
    };

    await sesClient.send(new SendEmailCommand(emailParams));

    console.log('Password reset email sent to:', sanitizedEmail);

    return NextResponse.json({
      success: true,
      message: 'If an account exists with that email, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    
    // Don't expose internal errors
    return NextResponse.json({
      success: true,
      message: 'If an account exists with that email, a password reset link has been sent.'
    });
  }
}
`
  },
  {
    path: 'src/app/api/auth/confirm-password-reset/route.ts',
    description: 'API endpoint to confirm password reset with token',
    content: `import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
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

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]/;
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

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await docClient.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { email: sanitizedEmail },
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
`
  }
];

console.log('\n📝 Files to create:\n');
files.forEach((file, index) => {
  console.log(`${index + 1}. ${file.path}`);
  console.log(`   ${file.description}\n`);
});

console.log('='.repeat(60));
console.log('\n💡 This script will create the API endpoints.');
console.log('   You also need to:');
console.log('   1. Create the DynamoDB table for reset tokens');
console.log('   2. Update the frontend forgot password page');
console.log('   3. Create the reset password page');
console.log('\nRun: node create-password-reset-system.js');
