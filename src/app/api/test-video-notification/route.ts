import { NextRequest, NextResponse } from 'next/server';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing video notification email...');
    
    const sesClient = new SESClient({ region: 'us-east-1' });

    const emailBody = `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #3b82f6; margin-bottom: 20px;">🧪 Test Video Notification</h2>
            
            <p>This is a test email to verify the video notification system is working.</p>
            
            <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 5px 0;"><strong>Test Student:</strong> Test User</p>
              <p style="margin: 5px 0;"><strong>Assignment:</strong> Test Video Assignment</p>
              <p style="margin: 5px 0;"><strong>Submitted At:</strong> ${new Date().toISOString()}</p>
            </div>

            <p style="color: #16a34a;">✅ If you receive this email, the notification system is working correctly!</p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 12px; text-align: center;">
              Test email from ClassCast Platform<br>
              Generated at ${new Date().toISOString()}
            </p>
          </div>
        </body>
      </html>
    `;

    const params = {
      Source: 'noreply@myclasscast.com',
      Destination: {
        ToAddresses: ['wilson.danny@me.com'],
      },
      Message: {
        Subject: {
          Data: '🧪 Test: Video Notification System',
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: emailBody,
            Charset: 'UTF-8',
          },
          Text: {
            Data: `
Test Video Notification

This is a test email to verify the video notification system is working.

Test Student: Test User
Assignment: Test Video Assignment
Submitted At: ${new Date().toISOString()}

✅ If you receive this email, the notification system is working correctly!

Generated at ${new Date().toISOString()}
            `,
            Charset: 'UTF-8',
          },
        },
      },
    };

    const command = new SendEmailCommand(params);
    await sesClient.send(command);
    
    console.log('✅ Test email sent successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Test email sent to wilson.danny@me.com',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Failed to send test email:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error',
      troubleshooting: {
        step1: 'Check if myclasscast.com domain is verified in AWS SES',
        step2: 'Check if wilson.danny@me.com is verified (if in SES sandbox)',
        step3: 'Verify AWS credentials have SES permissions',
        step4: 'Check spam/junk folder'
      }
    }, { status: 500 });
  }
}