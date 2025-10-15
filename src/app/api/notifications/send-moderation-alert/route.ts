import { NextRequest, NextResponse } from 'next/server';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const sesClient = new SESClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USERS_TABLE = 'classcast-users';

/**
 * Send moderation alert email to instructors
 * POST /api/notifications/send-moderation-alert
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      flagId,
      severity,
      contentType,
      content,
      authorName,
      categories,
      courseId
    } = body;

    console.log('📧 Sending moderation alert email...', { flagId, severity });

    // Get all instructors (or filter by courseId if provided)
    let instructorEmails: string[] = [];
    
    try {
      const scanParams: any = {
        TableName: USERS_TABLE,
        FilterExpression: '#role = :instructorRole',
        ExpressionAttributeNames: {
          '#role': 'role'
        },
        ExpressionAttributeValues: {
          ':instructorRole': 'instructor'
        }
      };

      // If courseId is provided, you could filter by course enrollment here
      // For now, we'll send to all instructors

      const result = await docClient.send(new ScanCommand(scanParams));
      instructorEmails = (result.Items || [])
        .map((user: any) => user.email)
        .filter((email: string) => email); // Filter out any null/undefined emails

      console.log(`📧 Found ${instructorEmails.length} instructor emails`);
    } catch (dbError) {
      console.error('Error fetching instructors:', dbError);
      // Continue with fallback - use env variable if set
      const fallbackEmail = process.env.INSTRUCTOR_EMAIL;
      if (fallbackEmail) {
        instructorEmails = [fallbackEmail];
      }
    }

    if (instructorEmails.length === 0) {
      console.warn('⚠️ No instructor emails found, skipping email notification');
      return NextResponse.json({
        success: true,
        message: 'No instructor emails configured'
      });
    }

    // Prepare email content
    const severityEmoji = severity === 'high' ? '🚨' : severity === 'medium' ? '⚠️' : '📋';
    const subject = `${severityEmoji} Content Moderation Alert - ${severity.toUpperCase()} Severity`;
    
    const contentPreview = content.length > 200 
      ? content.substring(0, 200) + '...' 
      : content;

    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${severity === 'high' ? '#dc2626' : severity === 'medium' ? '#ea580c' : '#eab308'}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .footer { background: #f3f4f6; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 14px; color: #6b7280; }
    .info-row { margin: 10px 0; }
    .label { font-weight: bold; color: #4b5563; }
    .value { color: #1f2937; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; margin-right: 8px; }
    .badge-high { background: #fee2e2; color: #dc2626; }
    .badge-medium { background: #ffedd5; color: #ea580c; }
    .badge-low { background: #fef3c7; color: #eab308; }
    .content-box { background: white; border: 1px solid #e5e7eb; padding: 15px; border-radius: 4px; margin: 15px 0; white-space: pre-wrap; }
    .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
    .categories { margin: 10px 0; }
    .category-tag { display: inline-block; background: #ede9fe; color: #6d28d9; padding: 4px 10px; border-radius: 4px; margin: 2px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">${severityEmoji} Content Moderation Alert</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Action Required: Review Flagged Content</p>
    </div>
    
    <div class="content">
      <div class="info-row">
        <span class="label">Severity:</span>
        <span class="badge badge-${severity}">${severity.toUpperCase()}</span>
      </div>
      
      <div class="info-row">
        <span class="label">Content Type:</span>
        <span class="value">${contentType}</span>
      </div>
      
      <div class="info-row">
        <span class="label">Author:</span>
        <span class="value">${authorName}</span>
      </div>
      
      ${categories && categories.length > 0 ? `
      <div class="info-row">
        <span class="label">Flagged Categories:</span>
        <div class="categories">
          ${categories.map((cat: string) => `<span class="category-tag">${cat}</span>`).join('')}
        </div>
      </div>
      ` : ''}
      
      <div class="info-row" style="margin-top: 20px;">
        <span class="label">Content Preview:</span>
      </div>
      <div class="content-box">${contentPreview}</div>
      
      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://class-cast.com'}/instructor/moderation" class="button">
          Review in Moderation Dashboard →
        </a>
      </div>
    </div>
    
    <div class="footer">
      <p style="margin: 5px 0;">ClassCast Content Moderation System</p>
      <p style="margin: 5px 0; font-size: 12px;">
        This is an automated alert. Please review the flagged content as soon as possible.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();

    // Send email to all instructors
    const sendPromises = instructorEmails.map(async (email) => {
      try {
        const command = new SendEmailCommand({
          Source: process.env.SES_SENDER_EMAIL || 'noreply@class-cast.com',
          Destination: {
            ToAddresses: [email]
          },
          Message: {
            Subject: {
              Data: subject,
              Charset: 'UTF-8'
            },
            Body: {
              Html: {
                Data: emailBody,
                Charset: 'UTF-8'
              },
              Text: {
                Data: `
Content Moderation Alert - ${severity.toUpperCase()} Severity

A ${contentType} from ${authorName} has been flagged for review.

Severity: ${severity.toUpperCase()}
${categories && categories.length > 0 ? `Categories: ${categories.join(', ')}` : ''}

Content Preview:
${contentPreview}

Please review this content in the moderation dashboard:
${process.env.NEXT_PUBLIC_BASE_URL || 'https://class-cast.com'}/instructor/moderation

---
ClassCast Content Moderation System
                `.trim(),
                Charset: 'UTF-8'
              }
            }
          }
        });

        await sesClient.send(command);
        console.log(`✅ Email sent to ${email}`);
        return { email, success: true };
      } catch (error) {
        console.error(`❌ Failed to send email to ${email}:`, error);
        return { email, success: false, error };
      }
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    console.log(`📧 Email notification complete: ${successCount} sent, ${failCount} failed`);

    return NextResponse.json({
      success: true,
      message: `Email sent to ${successCount} instructor(s)`,
      details: {
        total: results.length,
        successful: successCount,
        failed: failCount
      }
    });

  } catch (error) {
    console.error('Error sending moderation alert email:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send email notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

