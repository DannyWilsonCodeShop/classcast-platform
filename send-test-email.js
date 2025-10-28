const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const sesClient = new SESClient({ region: 'us-east-1' });

async function sendTestEmail() {
  try {
    // Try with a verified email address first
    const verifiedEmails = [
      'danny@class-cast.com',
      'noreply@class-cast.com',
      'info@class-cast.com',
      'support@class-cast.com'
    ];
    
    const params = {
      Source: 'noreply@myclasscast.com', // Use verified sender
      Destination: {
        ToAddresses: ['wilson.danny@me.com'],
      },
      Message: {
        Subject: {
          Data: 'ClassCast Test Email - Email System Verification',
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: `
              <html>
                <body style="font-family: Arial, sans-serif; padding: 20px;">
                  <div style="max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #6366f1;">✅ ClassCast Email Test</h2>
                    <p>This is a test email to verify that ClassCast email notifications are working correctly.</p>
                    <p>If you received this email, your notification system is set up properly!</p>
                    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                      <p><strong>Test Details:</strong></p>
                      <ul>
                        <li>Email System: AWS SES</li>
                        <li>Region: us-east-1</li>
                        <li>Status: Operational ✓</li>
                      </ul>
                    </div>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">Sent from ClassCast Platform at ${new Date().toISOString()}</p>
                  </div>
                </body>
              </html>
            `,
            Charset: 'UTF-8',
          },
          Text: {
            Data: `
ClassCast Test Email

This is a test email to verify that ClassCast email notifications are working correctly.

Test Details:
- Email System: AWS SES
- Region: us-east-1
- Status: Operational

Sent from ClassCast Platform at ${new Date().toISOString()}
            `,
            Charset: 'UTF-8',
          },
        },
      },
    };

    console.log('📧 Sending test email to wilson.danny@me.com...');
    const command = new SendEmailCommand(params);
    const result = await sesClient.send(command);
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', result.MessageId);
    console.log('\n📬 Check your inbox at wilson.danny@me.com');

  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    if (error.name === 'SendingPausedException') {
      console.log('⚠️  SES sending is paused. Please check AWS Console.');
    } else if (error.name === 'MessageRejected') {
      console.log('⚠️  Email was rejected. Check sender verification.');
    } else {
      console.log('Error details:', error);
    }
  }
}

sendTestEmail();

