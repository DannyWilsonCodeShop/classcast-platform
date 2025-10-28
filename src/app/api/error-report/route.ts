import { NextRequest, NextResponse } from 'next/server';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const sesClient = new SESClient({ region: 'us-east-1' });
const ADMIN_EMAIL = 'wilson.danny@me.com';

export async function POST(request: NextRequest) {
  try {
    const errorData = await request.json();
    const {
      error,
      url,
      userId,
      userAgent,
      timestamp,
      stack,
      component,
      action
    } = errorData;

    // Create detailed error report
    const errorReport = `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
          <div style="max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #dc2626; margin-bottom: 20px;">⚠️ ClassCast Error Alert</h2>
            
            <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
              <h3 style="color: #991b1b; margin-top: 0;">Error Details</h3>
              <p style="margin: 0; word-break: break-all;"><strong>Error:</strong> ${error}</p>
            </div>

            <div style="background: #f9fafb; padding: 15px; margin-bottom: 15px; border-radius: 4px;">
              <p style="margin: 5px 0;"><strong>URL:</strong> <code>${url}</code></p>
              <p style="margin: 5px 0;"><strong>User ID:</strong> ${userId || 'Unknown'}</p>
              <p style="margin: 5px 0;"><strong>Timestamp:</strong> ${timestamp || new Date().toISOString()}</p>
              <p style="margin: 5px 0;"><strong>Component:</strong> ${component || 'Unknown'}</p>
              <p style="margin: 5px 0;"><strong>Action:</strong> ${action || 'Unknown'}</p>
              <p style="margin: 5px 0;"><strong>User Agent:</strong> ${userAgent || 'Unknown'}</p>
            </div>

            ${stack ? `
              <div style="background: #1f2937; color: #f3f4f6; padding: 15px; margin-top: 20px; border-radius: 4px; overflow-x: auto;">
                <h4 style="margin-top: 0; color: #f9fafb;">Stack Trace:</h4>
                <pre style="margin: 0; white-space: pre-wrap; font-size: 12px; line-height: 1.5;">${stack}</pre>
              </div>
            ` : ''}

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 12px; text-align: center;">
              This is an automated error notification from ClassCast Platform<br>
              Generated at ${new Date().toISOString()}
            </p>
          </div>
        </body>
      </html>
    `;

    const params = {
      Source: 'noreply@myclasscast.com',
      Destination: {
        ToAddresses: [ADMIN_EMAIL],
      },
      Message: {
        Subject: {
          Data: `🚨 ClassCast Error: ${error.substring(0, 50)}`,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: errorReport,
            Charset: 'UTF-8',
          },
          Text: {
            Data: `
ClassCast Error Alert

Error: ${error}
URL: ${url}
User ID: ${userId || 'Unknown'}
Timestamp: ${timestamp || new Date().toISOString()}
Component: ${component || 'Unknown'}
Action: ${action || 'Unknown'}

${stack ? `\nStack Trace:\n${stack}` : ''}
            `,
            Charset: 'UTF-8',
          },
        },
      },
    };

    const command = new SendEmailCommand(params);
    const result = await sesClient.send(command);

    console.log('✅ Error report sent to admin:', result.MessageId);

    return NextResponse.json({
      success: true,
      messageId: result.MessageId,
      message: 'Error report sent successfully'
    });

  } catch (error) {
    console.error('❌ Error sending error report:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send error report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

