import { NextRequest, NextResponse } from 'next/server';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const sesClient = new SESClient({ region: 'us-east-1' });

export async function POST(request: NextRequest) {
  try {
    const { email, subject, body } = await request.json();

    const fromEmail = 'noreply@class-cast.com';
    const toEmail = email || 'wilson.danny@me.com';
    const emailSubject = subject || 'ClassCast Test Email';
    const emailBody = body || `
      <html>
        <body>
          <h2>ClassCast Test Email</h2>
          <p>This is a test email to verify that ClassCast email notifications are working correctly.</p>
          <p>If you received this email, your notification system is set up properly!</p>
          <hr>
          <p style="color: #666; font-size: 12px;">Sent from ClassCast Platform</p>
        </body>
      </html>
    `;

    const params = {
      Source: fromEmail,
      Destination: {
        ToAddresses: [toEmail],
      },
      Message: {
        Subject: {
          Data: emailSubject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: emailBody,
            Charset: 'UTF-8',
          },
        },
      },
    };

    const command = new SendEmailCommand(params);
    const result = await sesClient.send(command);

    console.log('✅ Email sent successfully:', result.MessageId);

    return NextResponse.json({
      success: true,
      messageId: result.MessageId,
      message: 'Test email sent successfully'
    });

  } catch (error) {
    console.error('❌ Error sending email:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

