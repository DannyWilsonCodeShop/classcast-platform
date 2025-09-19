import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { EmailNotificationData } from '@/types/messaging';

const sesClient = new SESClient({ region: process.env.AWS_REGION });

export async function sendEmailNotification(data: EmailNotificationData) {
  try {
    const { 
      recipientEmail, 
      recipientName, 
      senderName, 
      subject, 
      messageContent, 
      conversationUrl, 
      courseName, 
      assignmentTitle 
    } = data;

    const emailSubject = `[ClassCast] ${subject}`;
    
    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Message - ClassCast</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #64748b, #475569); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .message-box { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #64748b; margin: 20px 0; }
          .button { display: inline-block; background: #64748b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
          .course-info { background: #e2e8f0; padding: 15px; border-radius: 6px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📚 ClassCast</h1>
            <p>You have a new message from ${senderName}</p>
          </div>
          
          <div class="content">
            <h2>Hello ${recipientName}!</h2>
            
            ${courseName ? `
              <div class="course-info">
                <strong>Course:</strong> ${courseName}
                ${assignmentTitle ? `<br><strong>Assignment:</strong> ${assignmentTitle}` : ''}
              </div>
            ` : ''}
            
            <div class="message-box">
              <h3>${subject}</h3>
              <p>${messageContent.replace(/\n/g, '<br>')}</p>
            </div>
            
            <p>Click the button below to view and reply to this message:</p>
            <a href="${conversationUrl}" class="button">View Message</a>
            
            <div class="footer">
              <p>This message was sent through ClassCast messaging system.</p>
              <p>If you no longer wish to receive these notifications, please contact your instructor.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const command = new SendEmailCommand({
      Source: process.env.FROM_EMAIL || 'noreply@classcast.com',
      Destination: {
        ToAddresses: [recipientEmail]
      },
      Message: {
        Subject: {
          Data: emailSubject,
          Charset: 'UTF-8'
        },
        Body: {
          Html: {
            Data: emailBody,
            Charset: 'UTF-8'
          }
        }
      }
    });

    const result = await sesClient.send(command);
    console.log('Email sent successfully:', result.MessageId);
    return result;
  } catch (error) {
    console.error('Error sending email notification:', error);
    throw error;
  }
}

export async function sendBulkEmailNotifications(notifications: EmailNotificationData[]) {
  const results = [];
  
  for (const notification of notifications) {
    try {
      const result = await sendEmailNotification(notification);
      results.push({ success: true, messageId: result.MessageId });
    } catch (error) {
      console.error(`Failed to send email to ${notification.recipientEmail}:`, error);
      results.push({ success: false, error: error.message });
    }
  }
  
  return results;
}
