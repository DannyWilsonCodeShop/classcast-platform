import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { shouldSendEmailNotification } from './notificationPreferences';

const sesClient = new SESClient({ region: process.env.REGION || 'us-east-1' });

interface EmailOptions {
  to: string;
  toName: string;
  userId: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  notificationType: 'newAssignments' | 'gradedAssignments' | 'peerFeedback' | 'courseAnnouncements' | 'discussionReplies' | 'upcomingDeadlines';
}

/**
 * Send an email notification with preference checking and unsubscribe link
 */
export async function sendEmailNotification(options: EmailOptions): Promise<boolean> {
  try {
    // Check if user wants this type of notification
    const shouldSend = await shouldSendEmailNotification(
      options.userId,
      options.notificationType
    );

    if (!shouldSend) {
      console.log(`Skipping email to ${options.to} - notifications disabled for ${options.notificationType}`);
      return false;
    }

    const unsubscribeUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://class-cast.com'}/api/unsubscribe?userId=${options.userId}&token=placeholder`;

    // Add unsubscribe link to HTML content
    const htmlWithUnsubscribe = options.htmlContent.replace(
      '</body>',
      `
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
          <p>
            <a href="${unsubscribeUrl}" style="color: #64748b; text-decoration: underline;">
              Unsubscribe from email notifications
            </a>
          </p>
        </div>
      </body>
      `
    );

    // Add unsubscribe link to text content
    const textWithUnsubscribe = `${options.textContent}\n\n---\nUnsubscribe: ${unsubscribeUrl}`;

    const command = new SendEmailCommand({
      Source: process.env.SES_SENDER_EMAIL || 'noreply@class-cast.com',
      Destination: {
        ToAddresses: [options.to]
      },
      Message: {
        Subject: {
          Data: `[ClassCast] ${options.subject}`,
          Charset: 'UTF-8'
        },
        Body: {
          Html: {
            Data: htmlWithUnsubscribe,
            Charset: 'UTF-8'
          },
          Text: {
            Data: textWithUnsubscribe,
            Charset: 'UTF-8'
          }
        }
      }
    });

    await sesClient.send(command);
    console.log(`✅ Email sent to ${options.to}`);
    return true;
  } catch (error) {
    console.error(`Failed to send email to ${options.to}:`, error);
    return false;
  }
}

/**
 * Send graded assignment notification to a student
 */
export async function sendGradedAssignmentNotification(
  userId: string,
  userEmail: string,
  userName: string,
  assignment: {
    title: string;
    description?: string;
    grade: number;
    maxScore: number;
    feedback?: string;
    assignmentId: string;
  },
  courseName: string
): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://class-cast.com';
  const assignmentUrl = `${baseUrl}/student/assignments/${assignment.assignmentId}`;
  
  const percentage = Math.round((assignment.grade / assignment.maxScore) * 100);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Assignment Graded - ClassCast</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .grade-box { background: white; padding: 30px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .grade-score { font-size: 48px; font-weight: bold; color: #10b981; margin: 10px 0; }
        .feedback-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .button { display: inline-block; background: #10b981; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
        .button:hover { background: #059669; }
        .course-info { background: #dbeafe; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #3b82f6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Assignment Graded</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">ClassCast</p>
        </div>
        
        <div class="content">
          <p>Hello ${userName}!</p>
          
          <p>Your assignment has been graded:</p>
          
          <div class="course-info">
            <strong>📖 Course:</strong> ${courseName}<br>
            <strong>📝 Assignment:</strong> ${assignment.title}
          </div>
          
          <div class="grade-box">
            <div class="grade-score">${assignment.grade} / ${assignment.maxScore}</div>
            <p style="font-size: 20px; color: #64748b; margin: 0;">${percentage}%</p>
          </div>
          
          ${assignment.feedback ? `
            <div class="feedback-box">
              <strong>💬 Instructor Feedback:</strong>
              <p style="margin: 10px 0 0 0;">${assignment.feedback}</p>
            </div>
          ` : ''}
          
          <p style="text-align: center;">
            <a href="${assignmentUrl}" class="button">
              View Full Results
            </a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Assignment Graded

Hello ${userName}!

Your assignment has been graded:

Course: ${courseName}
Assignment: ${assignment.title}

Grade: ${assignment.grade} / ${assignment.maxScore} (${percentage}%)

${assignment.feedback ? `Instructor Feedback: ${assignment.feedback}` : ''}

View your full results at: ${assignmentUrl}

---
This notification was sent from ClassCast Learning Management System.
  `.trim();

  return sendEmailNotification({
    to: userEmail,
    toName: userName,
    userId,
    subject: `Assignment Graded: ${assignment.title}`,
    htmlContent,
    textContent,
    notificationType: 'gradedAssignments'
  });
}

/**
 * Send peer feedback notification to a student
 */
export async function sendPeerFeedbackNotification(
  userId: string,
  userEmail: string,
  userName: string,
  feedback: {
    reviewerName: string;
    content: string;
    assignmentTitle: string;
    videoId: string;
    assignmentId: string;
  },
  courseName: string
): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://class-cast.com';
  const videoUrl = `${baseUrl}/student/assignments/${feedback.assignmentId}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Peer Feedback - ClassCast</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .feedback-box { background: white; padding: 25px; border-radius: 8px; border-left: 4px solid #8b5cf6; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .button { display: inline-block; background: #8b5cf6; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
        .button:hover { background: #7c3aed; }
        .course-info { background: #ede9fe; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #8b5cf6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💬 New Peer Feedback</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">ClassCast</p>
        </div>
        
        <div class="content">
          <p>Hello ${userName}!</p>
          
          <p>You've received new peer feedback on your video submission:</p>
          
          <div class="course-info">
            <strong>📖 Course:</strong> ${courseName}<br>
            <strong>📝 Assignment:</strong> ${feedback.assignmentTitle}<br>
            <strong>👤 From:</strong> ${feedback.reviewerName}
          </div>
          
          <div class="feedback-box">
            <strong>Peer Feedback:</strong>
            <p style="margin: 10px 0 0 0;">${feedback.content}</p>
          </div>
          
          <p style="text-align: center;">
            <a href="${videoUrl}" class="button">
              View Full Feedback
            </a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
New Peer Feedback

Hello ${userName}!

You've received new peer feedback on your video submission:

Course: ${courseName}
Assignment: ${feedback.assignmentTitle}
From: ${feedback.reviewerName}

Feedback: ${feedback.content}

View full feedback at: ${videoUrl}

---
This notification was sent from ClassCast Learning Management System.
  `.trim();

  return sendEmailNotification({
    to: userEmail,
    toName: userName,
    userId,
    subject: `New Peer Feedback: ${feedback.assignmentTitle}`,
    htmlContent,
    textContent,
    notificationType: 'peerFeedback'
  });
}

