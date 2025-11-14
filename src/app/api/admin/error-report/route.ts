import { NextRequest, NextResponse } from 'next/server';

// Serverless-compatible email function
async function sendEmailNotification(to: string, subject: string, html: string) {
  // Only attempt to send email if SMTP is configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('⚠️ SMTP not configured, skipping email notification');
    return { success: false, reason: 'SMTP not configured' };
  }

  try {
    // Dynamic import to avoid serverless build issues
    const nodemailerModule = await import('nodemailer');
    const nodemailer = nodemailerModule.default;
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });

    console.log('✅ Error report email sent successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send error report email:', error);
    return { success: false, reason: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const errorData = await request.json();
    
    // Prepare email content
    const emailSubject = `🚨 ClassCast Error Report - ${errorData.page ? new URL(errorData.page).pathname : 'Unknown Page'}`;
    
    const emailBody = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .section { margin-bottom: 20px; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #3b82f6; }
        .error-section { border-left-color: #dc2626; }
        .user-section { border-left-color: #059669; }
        .tech-section { border-left-color: #7c3aed; }
        .label { font-weight: bold; color: #374151; }
        .value { margin-left: 10px; font-family: monospace; background: #f3f4f6; padding: 2px 6px; border-radius: 3px; }
        .stack-trace { background: #1f2937; color: #f9fafb; padding: 15px; border-radius: 6px; overflow-x: auto; font-family: monospace; font-size: 12px; }
        .timestamp { color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚨 ClassCast Error Report</h1>
        <p class="timestamp">Reported at: ${errorData.timestamp}</p>
    </div>
    
    <div class="content">
        <div class="section error-section">
            <h2>🐛 Error Details</h2>
            <p><span class="label">Message:</span><span class="value">${errorData.message}</span></p>
            <p><span class="label">Type:</span><span class="value">${errorData.additionalContext?.type || 'Unknown'}</span></p>
            ${errorData.additionalContext?.endpoint ? `<p><span class="label">API Endpoint:</span><span class="value">${errorData.additionalContext.endpoint}</span></p>` : ''}
            ${errorData.additionalContext?.statusCode ? `<p><span class="label">Status Code:</span><span class="value">${errorData.additionalContext.statusCode}</span></p>` : ''}
        </div>

        ${errorData.userId || errorData.userEmail || errorData.userName ? `
        <div class="section user-section">
            <h2>👤 User Information</h2>
            ${errorData.userId ? `<p><span class="label">User ID:</span><span class="value">${errorData.userId}</span></p>` : ''}
            ${errorData.userName ? `<p><span class="label">Name:</span><span class="value">${errorData.userName}</span></p>` : ''}
            ${errorData.userEmail ? `<p><span class="label">Email:</span><span class="value">${errorData.userEmail}</span></p>` : ''}
        </div>
        ` : ''}

        <div class="section tech-section">
            <h2>🔧 Technical Details</h2>
            ${errorData.page ? `<p><span class="label">Page:</span><span class="value">${errorData.page}</span></p>` : ''}
            ${errorData.userAgent ? `<p><span class="label">User Agent:</span><span class="value">${errorData.userAgent}</span></p>` : ''}
            ${errorData.additionalContext?.componentStack ? `<p><span class="label">Component Stack:</span><span class="value">${errorData.additionalContext.componentStack}</span></p>` : ''}
        </div>

        ${errorData.stack ? `
        <div class="section error-section">
            <h2>📋 Stack Trace</h2>
            <div class="stack-trace">${errorData.stack.replace(/\n/g, '<br>')}</div>
        </div>
        ` : ''}

        ${errorData.additionalContext?.description ? `
        <div class="section">
            <h2>📝 User Description</h2>
            <p>${errorData.additionalContext.description}</p>
            ${errorData.additionalContext.stepsToReproduce ? `
            <h3>Steps to Reproduce:</h3>
            <ol>
                ${errorData.additionalContext.stepsToReproduce.map((step: string) => `<li>${step}</li>`).join('')}
            </ol>
            ` : ''}
        </div>
        ` : ''}

        ${errorData.additionalContext ? `
        <div class="section">
            <h2>🔍 Additional Context</h2>
            <pre style="background: #f3f4f6; padding: 10px; border-radius: 6px; overflow-x: auto;">${JSON.stringify(errorData.additionalContext, null, 2)}</pre>
        </div>
        ` : ''}
    </div>
</body>
</html>
    `;

    // Send email notification
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@classcast.com';
    
    if (adminEmail) {
      const emailResult = await sendEmailNotification(adminEmail, emailSubject, emailBody);
      if (!emailResult.success) {
        console.log(`⚠️ Email notification failed: ${emailResult.reason}`);
        // Don't fail the entire request if email fails
      }
    } else {
      console.log('⚠️ No admin email configured, skipping email notification');
    }

    // Also store in database for tracking (optional)
    // You could add database storage here if needed

    return NextResponse.json({ 
      success: true, 
      message: 'Error report sent successfully' 
    });

  } catch (error) {
    console.error('Failed to send error report:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to send error report',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}