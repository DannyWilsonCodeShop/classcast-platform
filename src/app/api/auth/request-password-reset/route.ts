import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
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

    // Find user by email (scan since email is not the primary key)
    const userResponse = await docClient.send(new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': sanitizedEmail
      },
      Limit: 1
    }));

    // Always return success to prevent email enumeration
    if (!userResponse.Items || userResponse.Items.length === 0) {
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
    const ttl = Math.floor((Date.now() + (25 * 60 * 60 * 1000)) / 1000); // 25 hours (auto-delete)

    // Store reset token in DynamoDB
    await docClient.send(new PutCommand({
      TableName: RESET_TOKENS_TABLE,
      Item: {
        email: sanitizedEmail,
        tokenHash: resetTokenHash,
        expiresAt,
        ttl,
        createdAt: Date.now(),
        used: false
      }
    }));

    // Send reset email
    const resetUrl = `${APP_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(sanitizedEmail)}`;
    
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
            Data: `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                  .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 8px 8px; }
                  .button { display: inline-block; padding: 12px 30px; background: #4F46E5; color: white !important; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                  .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
                  .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px; margin: 20px 0; }
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
                      <a href="${resetUrl}" class="button">Reset Password</a>
                    </p>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #4F46E5; font-size: 12px;">${resetUrl}</p>
                    <div class="warning">
                      <strong>⏰ This link will expire in 1 hour.</strong>
                    </div>
                    <p>If you didn't request this password reset, you can safely ignore this email. Your password will not be changed.</p>
                  </div>
                  <div class="footer">
                    <p>© 2025 ClassCast. All rights reserved.</p>
                    <p>If you have questions, contact us at support@myclasscast.com</p>
                  </div>
                </div>
              </body>
              </html>
            `
          },
          Text: {
            Data: `
Password Reset Request

We received a request to reset your ClassCast password.

Click this link to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, you can safely ignore this email.

© 2025 ClassCast
            `
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
