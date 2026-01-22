import AWS from 'aws-sdk';

// Configure SES
const ses = new AWS.SES({
  region: process.env.AWS_REGION || 'us-east-1'
});

export interface EmailOptions {
  to: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  from?: string;
}

export class EmailService {
  private static fromEmail = process.env.SES_FROM_EMAIL || 'noreply@classcast.app';

  static async sendEmail(options: EmailOptions): Promise<string> {
    const params = {
      Source: options.from || this.fromEmail,
      Destination: {
        ToAddresses: [options.to]
      },
      Message: {
        Subject: {
          Data: options.subject
        },
        Body: {
          Html: {
            Data: options.htmlBody
          },
          Text: {
            Data: options.textBody
          }
        }
      }
    };

    try {
      const result = await ses.sendEmail(params).promise();
      console.log(`📧 Email sent successfully to ${options.to}: ${result.MessageId}`);
      return result.MessageId;
    } catch (error) {
      console.error(`❌ Failed to send email to ${options.to}:`, error);
      throw error;
    }
  }

  static async sendPasswordResetEmail(
    email: string, 
    name: string, 
    resetUrl: string
  ): Promise<string> {
    const htmlBody = `
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
        
        <p>Hello ${name},</p>
        
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
    `;

    const textBody = `
      ClassCast Password Reset Request
      
      Hello ${name},
      
      We received a request to reset your password for your ClassCast account.
      
      To reset your password, visit this link:
      ${resetUrl}
      
      This link will expire in 1 hour.
      
      If you didn't request a password reset, you can safely ignore this email.
      
      ClassCast Team
    `;

    return this.sendEmail({
      to: email,
      subject: 'ClassCast Password Reset Request',
      htmlBody,
      textBody
    });
  }

  static async testEmailConfiguration(): Promise<boolean> {
    try {
      // Test by sending to the configured from email
      await this.sendEmail({
        to: this.fromEmail,
        subject: 'ClassCast Email Test',
        htmlBody: '<h2>Email Configuration Test</h2><p>If you receive this, email is working correctly.</p>',
        textBody: 'Email Configuration Test\n\nIf you receive this, email is working correctly.'
      });
      return true;
    } catch (error) {
      console.error('Email test failed:', error);
      return false;
    }
  }
}