import { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

// Configure AWS
const dynamodb = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

const ses = new AWS.SES({
  region: process.env.AWS_REGION || 'us-east-1'
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    console.log('🔍 Processing password reset for:', email);

    // Find user by email
    const userParams = {
      TableName: 'classcast-users',
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email.toLowerCase()
      }
    };

    const userResult = await dynamodb.scan(userParams).promise();

    if (!userResult.Items || userResult.Items.length === 0) {
      console.log('❌ User not found:', email);
      // Don't reveal if email exists or not for security
      return res.status(200).json({ 
        message: 'If an account with that email exists, a password reset link has been sent.',
        success: true
      });
    }

    const user = userResult.Items[0];
    console.log('✅ User found:', user.name);

    // Generate reset token
    const resetToken = uuidv4();
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store reset token in database
    try {
      const tokenParams = {
        TableName: 'password-reset-tokens',
        Item: {
          token: resetToken,
          userId: user.userId,
          email: user.email,
          expiresAt: resetExpiry.toISOString(),
          createdAt: new Date().toISOString(),
          used: false
        }
      };

      await dynamodb.put(tokenParams).promise();
      console.log('💾 Reset token stored');
    } catch (tokenError) {
      console.error('❌ Error storing token:', tokenError);
      // Continue with email sending even if token storage fails
    }

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'https://app.classcast.io'}/reset-password?token=${resetToken}`;

    // Try to send email via SES
    try {
      const emailParams = {
        Source: process.env.SES_FROM_EMAIL || 'noreply@classcast.app',
        Destination: {
          ToAddresses: [user.email]
        },
        Message: {
          Subject: {
            Data: 'ClassCast Password Reset Request'
          },
          Body: {
            Html: {
              Data: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <title>Password Reset</title>
                </head>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2563eb;">ClassCast</h1>
                  </div>
                  
                  <h2>Password Reset Request</h2>
                  
                  <p>Hello ${user.name},</p>
                  
                  <p>We received a request to reset your password for your ClassCast account. If you made this request, click the button below to reset your password:</p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
                  </div>
                  
                  <p>Or copy and paste this link into your browser:</p>
                  <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
                  
                  <p><strong>This link will expire in 1 hour.</strong></p>
                  
                  <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
                  
                  <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                  
                  <p style="font-size: 12px; color: #6b7280;">
                    This email was sent from ClassCast. If you have questions, please contact your instructor or system administrator.
                  </p>
                </body>
                </html>
              `
            },
            Text: {
              Data: `
                ClassCast Password Reset Request
                
                Hello ${user.name},
                
                We received a request to reset your password for your ClassCast account.
                
                To reset your password, visit this link:
                ${resetUrl}
                
                This link will expire in 1 hour.
                
                If you didn't request a password reset, you can safely ignore this email.
                
                ClassCast Team
              `
            }
          }
        }
      };

      const emailResult = await ses.sendEmail(emailParams).promise();
      console.log('📧 Password reset email sent via SES:', emailResult.MessageId);

      return res.status(200).json({
        message: 'Password reset email sent successfully.',
        success: true,
        method: 'SES',
        messageId: emailResult.MessageId
      });

    } catch (sesError) {
      console.error('❌ SES Error:', sesError.message);
      
      // Fallback: Try alternative email method or log for manual processing
      console.log('🔄 Attempting fallback email method...');
      
      // Log the reset request for manual processing
      const logEntry = {
        timestamp: new Date().toISOString(),
        email: user.email,
        name: user.name,
        resetToken: resetToken,
        resetUrl: resetUrl,
        error: sesError.message
      };
      
      // Save to a log file for manual processing
      const logPath = 'password-reset-requests.log';
      fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
      
      console.log(`📝 Reset request logged to ${logPath} for manual processing`);
      
      return res.status(200).json({
        message: 'Password reset request received. If SES is unavailable, please contact your administrator.',
        success: true,
        method: 'LOGGED',
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
      });
    }

  } catch (error) {
    console.error('❌ Password reset error:', error);
    
    return res.status(500).json({
      error: 'Failed to process password reset request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}