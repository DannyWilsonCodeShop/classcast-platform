import { NextRequest, NextResponse } from 'next/server';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { dynamoDBService } from '../../../lib/dynamodb';

// Initialize SES client
const sesClient = new SESClient({
  region: process.env.REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

// Email templates
const emailTemplates = {
  grade_received: {
    subject: 'Grade Received - {{assignmentTitle}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #003366;">Grade Received</h2>
        <p>Hello {{firstName}},</p>
        <p>You have received a grade for your assignment: <strong>{{assignmentTitle}}</strong></p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #003366;">Grade Details</h3>
          <p><strong>Score:</strong> {{grade}}/{{maxScore}} ({{percentage}}%)</p>
          <p><strong>Letter Grade:</strong> {{letterGrade}}</p>
          {{#if feedback}}
          <p><strong>Feedback:</strong></p>
          <div style="background-color: white; padding: 15px; border-left: 4px solid #003366;">
            {{feedback}}
          </div>
          {{/if}}
        </div>
        <p>You can view more details in your <a href="{{dashboardUrl}}" style="color: #003366;">student dashboard</a>.</p>
        <p>Best regards,<br>ClassCast Team</p>
      </div>
    `,
  },
  assignment_created: {
    subject: 'New Assignment - {{assignmentTitle}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #003366;">New Assignment Available</h2>
        <p>Hello {{firstName}},</p>
        <p>A new assignment has been posted for {{courseName}}: <strong>{{assignmentTitle}}</strong></p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #003366;">Assignment Details</h3>
          <p><strong>Due Date:</strong> {{dueDate}}</p>
          <p><strong>Type:</strong> {{type}}</p>
          <p><strong>Max Score:</strong> {{maxScore}} points</p>
          {{#if instructions}}
          <p><strong>Instructions:</strong></p>
          <div style="background-color: white; padding: 15px; border-left: 4px solid #003366;">
            {{instructions}}
          </div>
          {{/if}}
        </div>
        <p>You can view and submit this assignment in your <a href="{{dashboardUrl}}" style="color: #003366;">student dashboard</a>.</p>
        <p>Best regards,<br>ClassCast Team</p>
      </div>
    `,
  },
  assignment_reminder: {
    subject: 'Assignment Reminder - {{assignmentTitle}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #D4AF37;">Assignment Reminder</h2>
        <p>Hello {{firstName}},</p>
        <p>This is a reminder that your assignment <strong>{{assignmentTitle}}</strong> is due soon.</p>
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #D4AF37;">
          <h3 style="margin-top: 0; color: #D4AF37;">Due Date</h3>
          <p><strong>{{dueDate}}</strong></p>
          <p>Time remaining: {{timeRemaining}}</p>
        </div>
        <p>Don't forget to submit your work before the deadline!</p>
        <p>You can access the assignment in your <a href="{{dashboardUrl}}" style="color: #003366;">student dashboard</a>.</p>
        <p>Best regards,<br>ClassCast Team</p>
      </div>
    `,
  },
  submission_received: {
    subject: 'Submission Received - {{assignmentTitle}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Submission Received</h2>
        <p>Hello {{firstName}},</p>
        <p>Your submission for <strong>{{assignmentTitle}}</strong> has been received and is being processed.</p>
        <div style="background-color: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
          <h3 style="margin-top: 0; color: #28a745;">Submission Details</h3>
          <p><strong>Submitted:</strong> {{submittedAt}}</p>
          <p><strong>Status:</strong> {{status}}</p>
          {{#if files}}
          <p><strong>Files:</strong></p>
          <ul>
            {{#each files}}
            <li>{{this}}</li>
            {{/each}}
          </ul>
          {{/if}}
        </div>
        <p>You will be notified once your submission has been graded.</p>
        <p>You can track your submission status in your <a href="{{dashboardUrl}}" style="color: #003366;">student dashboard</a>.</p>
        <p>Best regards,<br>ClassCast Team</p>
      </div>
    `,
  },
};

// Helper function to get user details
async function getUserDetails(userId: string) {
  try {
    const response = await dynamoDBService.get({
      TableName: 'classcast-users',
      Key: { userId },
    });
    return response.Item;
  } catch (error) {
    console.error('Error fetching user details:', error);
    return null;
  }
}

// Helper function to send email
async function sendEmail(to: string, subject: string, html: string) {
  try {
    const command = new SendEmailCommand({
      Source: process.env.FROM_EMAIL || 'noreply@classcast.com',
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: html,
            Charset: 'UTF-8',
          },
        },
      },
    });

    const result = await sesClient.send(command);
    console.log('Email sent successfully:', result.MessageId);
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// POST /api/notifications - Send notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, userId, data, email } = body;

    if (!type || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: type, userId',
        },
        { status: 400 }
      );
    }

    // Get user details
    const user = await getUserDetails(userId);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    // Get email template
    const template = emailTemplates[type as keyof typeof emailTemplates];
    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid notification type',
        },
        { status: 400 }
      );
    }

    // Prepare template data
    const templateData = {
      firstName: user.firstName || 'Student',
      lastName: user.lastName || '',
      email: user.email,
      dashboardUrl: process.env.DASHBOARD_URL || 'https://d166bugwfgjggz.amplifyapp.com',
      ...data,
    };

    // Replace template variables
    let subject = template.subject;
    let html = template.html;

    Object.keys(templateData).forEach(key => {
      const value = templateData[key];
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, value);
      html = html.replace(regex, value);
    });

    // Send email
    await sendEmail(user.email, subject, html);

    // Log notification
    console.log(`Notification sent to ${user.email}: ${type}`);

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send notification',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET /api/notifications - Get notification preferences
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'User ID is required',
        },
        { status: 400 }
      );
    }

    // Get user notification preferences
    const user = await getUserDetails(userId);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    const preferences = user.preferences?.notifications || {
      email: true,
      push: false,
      grade_received: true,
      assignment_created: true,
      assignment_reminder: true,
      submission_received: true,
    };

    return NextResponse.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch notification preferences',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/notifications - Update notification preferences
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, preferences } = body;

    if (!userId || !preferences) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: userId, preferences',
        },
        { status: 400 }
      );
    }

    // Update user notification preferences
    await dynamoDBService.update({
      TableName: 'classcast-users',
      Key: { userId },
      UpdateExpression: 'SET preferences.notifications = :preferences, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':preferences': preferences,
        ':updatedAt': new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated successfully',
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update notification preferences',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
