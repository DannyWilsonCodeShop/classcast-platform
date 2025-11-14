import { SESClient, SendEmailCommand, SendTemplatedEmailCommand } from '@aws-sdk/client-ses';

const sesClient = new SESClient({ region: 'us-east-1' });

export interface EmailTemplate {
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
}

export interface EmailData {
  to: string | string[];
  templateName: string;
  templateData: Record<string, any>;
  fromEmail?: string;
  replyTo?: string;
}

export class EmailService {
  private static instance: EmailService;
  private fromEmail: string;
  private replyToEmail: string;

  private constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@myclasscast.com';
    this.replyToEmail = process.env.REPLY_TO_EMAIL || 'support@myclasscast.com';
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  // Email templates
  private templates: Record<string, EmailTemplate> = {
    assignment_created: {
      name: 'assignment_created',
      subject: 'New Assignment: {{assignmentTitle}}',
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>New Assignment</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #003366; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .assignment-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .button { display: inline-block; background: #003366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Assignment Available</h1>
            </div>
            <div class="content">
              <p>Hello {{studentName}},</p>
              <p>A new assignment has been created in {{courseName}}:</p>
              
              <div class="assignment-details">
                <h3>{{assignmentTitle}}</h3>
                <p><strong>Due Date:</strong> {{dueDate}}</p>
                <p><strong>Type:</strong> {{assignmentType}}</p>
                <p><strong>Max Score:</strong> {{maxScore}} points</p>
                <p><strong>Description:</strong></p>
                <p>{{description}}</p>
                {{#if instructions}}
                <p><strong>Instructions:</strong></p>
                <p>{{instructions}}</p>
                {{/if}}
              </div>
              
              <p>Please log in to your ClassCast account to view the full assignment details and submit your work.</p>
              
              <a href="{{assignmentUrl}}" class="button">View Assignment</a>
            </div>
            <div class="footer">
              <p>This email was sent by ClassCast Platform. If you have any questions, please contact your instructor.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      textContent: `
        New Assignment: {{assignmentTitle}}
        
        Hello {{studentName}},
        
        A new assignment has been created in {{courseName}}:
        
        Assignment: {{assignmentTitle}}
        Due Date: {{dueDate}}
        Type: {{assignmentType}}
        Max Score: {{maxScore}} points
        Description: {{description}}
        {{#if instructions}}
        Instructions: {{instructions}}
        {{/if}}
        
        Please log in to your ClassCast account to view the full assignment details and submit your work.
        
        Assignment URL: {{assignmentUrl}}
        
        This email was sent by ClassCast Platform. If you have any questions, please contact your instructor.
      `
    },
    
    submission_graded: {
      name: 'submission_graded',
      subject: 'Your Submission Has Been Graded: {{assignmentTitle}}',
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Submission Graded</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .grade-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .grade-score { font-size: 24px; font-weight: bold; color: #28a745; }
            .button { display: inline-block; background: #003366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Submission Graded</h1>
            </div>
            <div class="content">
              <p>Hello {{studentName}},</p>
              <p>Your submission for "{{assignmentTitle}}" has been graded:</p>
              
              <div class="grade-details">
                <h3>{{assignmentTitle}}</h3>
                <p class="grade-score">{{grade}}% ({{pointsEarned}}/{{maxPoints}} points)</p>
                {{#if feedback}}
                <p><strong>Instructor Feedback:</strong></p>
                <p>{{feedback}}</p>
                {{/if}}
                <p><strong>Graded on:</strong> {{gradedDate}}</p>
              </div>
              
              <p>You can view detailed feedback and your grade in your ClassCast account.</p>
              
              <a href="{{submissionUrl}}" class="button">View Submission</a>
            </div>
            <div class="footer">
              <p>This email was sent by ClassCast Platform. If you have any questions, please contact your instructor.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      textContent: `
        Your Submission Has Been Graded: {{assignmentTitle}}
        
        Hello {{studentName}},
        
        Your submission for "{{assignmentTitle}}" has been graded:
        
        Assignment: {{assignmentTitle}}
        Grade: {{grade}}% ({{pointsEarned}}/{{maxPoints}} points)
        {{#if feedback}}
        Instructor Feedback: {{feedback}}
        {{/if}}
        Graded on: {{gradedDate}}
        
        You can view detailed feedback and your grade in your ClassCast account.
        
        Submission URL: {{submissionUrl}}
        
        This email was sent by ClassCast Platform. If you have any questions, please contact your instructor.
      `
    },
    
    password_reset: {
      name: 'password_reset',
      subject: 'Reset Your ClassCast Password',
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Password Reset</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .reset-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .button { display: inline-block; background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello {{userName}},</p>
              <p>We received a request to reset your password for your ClassCast account.</p>
              
              <div class="reset-details">
                <p><strong>Reset Code:</strong> {{resetCode}}</p>
                <p><strong>Expires in:</strong> {{expirationTime}} minutes</p>
              </div>
              
              <div class="warning">
                <p><strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
              </div>
              
              <p>To reset your password, use the code above in the password reset form or click the button below:</p>
              
              <a href="{{resetUrl}}" class="button">Reset Password</a>
            </div>
            <div class="footer">
              <p>This email was sent by ClassCast Platform. If you have any questions, please contact support.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      textContent: `
        Reset Your ClassCast Password
        
        Hello {{userName}},
        
        We received a request to reset your password for your ClassCast account.
        
        Reset Code: {{resetCode}}
        Expires in: {{expirationTime}} minutes
        
        Security Notice: If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
        
        To reset your password, use the code above in the password reset form or visit: {{resetUrl}}
        
        This email was sent by ClassCast Platform. If you have any questions, please contact support.
      `
    }
  };

  private replaceTemplateVariables(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  public async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      const template = this.templates[emailData.templateName];
      if (!template) {
        throw new Error(`Template ${emailData.templateName} not found`);
      }

      const recipients = Array.isArray(emailData.to) ? emailData.to : [emailData.to];
      
      for (const recipient of recipients) {
        const command = new SendEmailCommand({
          Source: emailData.fromEmail || this.fromEmail,
          Destination: {
            ToAddresses: [recipient]
          },
          Message: {
            Subject: {
              Data: this.replaceTemplateVariables(template.subject, emailData.templateData),
              Charset: 'UTF-8'
            },
            Body: {
              Html: {
                Data: this.replaceTemplateVariables(template.htmlContent, emailData.templateData),
                Charset: 'UTF-8'
              },
              Text: {
                Data: this.replaceTemplateVariables(template.textContent, emailData.templateData),
                Charset: 'UTF-8'
              }
            }
          },
          ReplyToAddresses: [emailData.replyTo || this.replyToEmail]
        });

        await sesClient.send(command);
        console.log(`Email sent successfully to ${recipient}`);
      }

      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  // Convenience methods for common notifications
  public async notifyAssignmentCreated(assignment: any, students: string[]) {
    const emailData: EmailData = {
      to: students,
      templateName: 'assignment_created',
      templateData: {
        studentName: 'Student', // This would be personalized per student
        assignmentTitle: assignment.title,
        courseName: assignment.courseName,
        dueDate: new Date(assignment.dueDate).toLocaleDateString(),
        assignmentType: assignment.type,
        maxScore: assignment.maxScore,
        description: assignment.description,
        instructions: assignment.instructions,
        assignmentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/student/assignments/${assignment.assignmentId}`
      }
    };

    return this.sendEmail(emailData);
  }

  public async notifySubmissionGraded(submission: any, studentEmail: string) {
    const emailData: EmailData = {
      to: studentEmail,
      templateName: 'submission_graded',
      templateData: {
        studentName: submission.studentName,
        assignmentTitle: submission.assignmentTitle,
        grade: submission.grade,
        pointsEarned: submission.pointsEarned,
        maxPoints: submission.maxPoints,
        feedback: submission.feedback,
        gradedDate: new Date(submission.gradedAt).toLocaleDateString(),
        submissionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/student/submissions/${submission.submissionId}`
      }
    };

    return this.sendEmail(emailData);
  }

  public async sendPasswordReset(userEmail: string, resetCode: string, userName: string) {
    const emailData: EmailData = {
      to: userEmail,
      templateName: 'password_reset',
      templateData: {
        userName,
        resetCode,
        expirationTime: '30',
        resetUrl: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?code=${resetCode}`
      }
    };

    return this.sendEmail(emailData);
  }
}

export const emailService = EmailService.getInstance();
